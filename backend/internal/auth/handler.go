package auth

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"studify/internal/auth/challenge"
	"studify/internal/auth/session"
	"studify/internal/httpx"
	"studify/internal/user"
	"studify/internal/util"
)

func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	body := credentialsRequest{}

	if err := httpx.ReadJSON(r.Body, &body); err != nil {
		httpx.WriteDecodeError(w, err)
		return
	}

	newUser, pair, err := h.Service.register(r.Context(), body.Email, body.Password, session.InputFromRequest(r))
	if err != nil {
		switch {
		case errors.Is(err, user.ErrUserAlreadyExists):
			httpx.WriteCodedError(w, http.StatusConflict, "email_taken", "user with such email already exists")
		case errors.Is(err, ErrInvalidRegistration):
			httpx.WriteError(w, "invalid registration details", http.StatusBadRequest)
		default:
			slog.ErrorContext(r.Context(), "failed to register user",
				util.AttrError(err),
			)
			httpx.WriteError(w, "internal server error", http.StatusInternalServerError)
		}
		return
	}

	h.Cookies.Set(w, pair)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)

	if err := json.NewEncoder(w).Encode(newUser); err != nil {
		slog.ErrorContext(r.Context(), "failed to encode user to JSON",
			util.AttrError(err),
		)
	}
}

func (h *Handler) LoginUser(w http.ResponseWriter, r *http.Request) {
	body := credentialsRequest{}

	if err := httpx.ReadJSON(r.Body, &body); err != nil {
		httpx.WriteDecodeError(w, err)
		return
	}

	loginResponse, err := h.Service.login(r.Context(), body.Email, body.Password, session.InputFromRequest(r))
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidCredentials), errors.Is(err, user.ErrUserNotFound):
			httpx.WriteCodedError(w, http.StatusUnauthorized, "invalid_credentials", "invalid email or password")
		default:
			slog.ErrorContext(r.Context(), "failed to login user",
				util.AttrError(err),
			)
			httpx.WriteError(w, "internal server error", http.StatusInternalServerError)
		}
		return
	}

	if loginResponse.IsTOTPRequired {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		if err := json.NewEncoder(w).Encode(challengeTokenResponse{
			ChallengeToken: string(loginResponse.ChallengeToken),
		}); err != nil {
			slog.ErrorContext(r.Context(), "failed to encode TOTP challenge response",
				util.AttrError(err),
			)
		}
		return
	}

	h.Cookies.Set(w, loginResponse.Pair)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(loginResponse.User); err != nil {
		slog.ErrorContext(r.Context(), "failed to encode user response",
			util.AttrError(err),
		)
	}
}

func (h *Handler) LoginTOTP(w http.ResponseWriter, r *http.Request) {
	var body totpReq

	if err := httpx.ReadJSON(r.Body, &body); err != nil {
		httpx.WriteDecodeError(w, err)
		return
	}

	currentUser, pair, err := h.Service.loginMFA(
		r.Context(),
		body.ChallengeToken,
		body.Code,
		session.InputFromRequest(r),
	)
	if err != nil {
		switch {
		case errors.Is(err, user.ErrUserNotFound),
			errors.Is(err, challenge.ErrChallengeTokenNotFound),
			errors.Is(err, ErrChallengeExpired):
			httpx.WriteCodedError(w, http.StatusUnauthorized, "invalid_mfa_challenge", "invalid or expired challenge")

		case errors.Is(err, ErrInvalidMFACode):
			httpx.WriteCodedError(w, http.StatusUnauthorized, "invalid_mfa_code", "invalid authentication code")

		case errors.Is(err, ErrRequiredChallengeToken),
			errors.Is(err, ErrRequiredMFACode):
			httpx.WriteError(w, err.Error(), http.StatusBadRequest)

		default:
			slog.ErrorContext(r.Context(), "failed to complete MFA login",
				util.AttrError(err),
			)
			httpx.WriteError(w, "internal server error", http.StatusInternalServerError)
		}
		return
	}

	h.Cookies.Set(w, pair)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(currentUser); err != nil {
		slog.ErrorContext(r.Context(), "failed to encode user response",
			util.AttrError(err),
		)
	}
}

func (h *Handler) LogoutUser(w http.ResponseWriter, r *http.Request) {
	refreshToken, err := h.Cookies.RefreshToken(r)
	if err != nil {
		h.Cookies.Clear(w)
		w.WriteHeader(http.StatusNoContent)
		return
	}

	err = h.Service.logout(r.Context(), refreshToken)
	if err != nil && !errors.Is(err, ErrInvalidToken) && !errors.Is(err, ErrTokenNotFound) {
		slog.ErrorContext(r.Context(), "logout failed",
			util.AttrError(err),
		)
		httpx.WriteError(w, "internal server error", http.StatusInternalServerError)
		return
	}

	h.Cookies.Clear(w)
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) RefreshTokens(w http.ResponseWriter, r *http.Request) {
	refreshToken, err := h.Cookies.RefreshToken(r)
	if err != nil {
		h.Cookies.Clear(w)
		httpx.WriteError(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	pair, err := h.Service.refreshTokens(r.Context(), refreshToken, session.InputFromRequest(r))
	if err != nil {
		switch {
		case errors.Is(err, errRefreshReplaced):
			// Another request may already have installed the replacement cookies.
			httpx.WriteError(w, "unauthorized", http.StatusUnauthorized)
		case errors.Is(err, ErrInvalidToken), errors.Is(err, ErrTokenNotFound):
			h.Cookies.Clear(w)
			httpx.WriteError(w, "unauthorized", http.StatusUnauthorized)
		default:
			slog.ErrorContext(r.Context(), "failed to refresh session", util.AttrError(err))
			httpx.WriteError(w, "internal server error", http.StatusInternalServerError)
		}
		return
	}

	h.Cookies.Set(w, pair)

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) LogoutAllSessions(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		httpx.WriteError(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	if err = h.Service.sessions.RevokeAllSessions(r.Context(), userID); err != nil {
		slog.ErrorContext(r.Context(), "failed to logout all sessions",
			util.AttrError(err),
		)
		httpx.WriteError(w, "internal server error", http.StatusInternalServerError)
		return
	}

	h.Cookies.Clear(w)
	w.WriteHeader(http.StatusNoContent)
}
