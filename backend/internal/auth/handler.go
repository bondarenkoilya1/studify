package auth

import (
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"studify/internal"
	"studify/internal/auth/challenge"
	"studify/internal/auth/credentials"
	"studify/internal/httpx"
	"studify/internal/user"
)

func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	body := registerReq{}

	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, fmt.Sprintf("failed to read data: %v", err), http.StatusBadRequest)
		return
	}

	newUser, pair, err := h.Service.register(r.Context(), body.Email, body.Password)
	if err != nil {
		switch {
		case errors.Is(err, user.ErrUserAlreadyExists):
			http.Error(w, "user with such email already exists", http.StatusConflict)
		default:
			slog.ErrorContext(r.Context(), "failed to register user",
				slog.String("error", err.Error()),
			)
			http.Error(w, "internal server error", http.StatusInternalServerError)
		}
		return
	}

	h.Cookies.Set(w, pair)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)

	if err := json.NewEncoder(w).Encode(newUser); err != nil {
		slog.Error("failed to encode user to JSON", slog.String("error", err.Error()))
	}
}

func (h *Handler) LoginUser(w http.ResponseWriter, r *http.Request) {
	body := userReq{}

	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, fmt.Sprintf("failed to read data: %v", err), http.StatusBadRequest)
		return
	}

	loginResponse, err := h.Service.login(r.Context(), body.Email, body.Password)
	if err != nil {
		switch {
		case errors.Is(err, credentials.ErrInvalidEmail),
			errors.Is(err, credentials.ErrInvalidPassword):
			http.Error(w, "invalid email or password", http.StatusUnauthorized)
		case errors.Is(err, user.ErrUserNotFound):
			http.Error(w, "invalid email or password", http.StatusUnauthorized)
		default:
			slog.ErrorContext(r.Context(), "failed to login user",
				slog.String("error", err.Error()),
			)
			http.Error(w, "internal server error", http.StatusInternalServerError)
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
				slog.String("error", err.Error()),
			)
		}
		return
	}
	//
	//ua := useragent.Parse(r.UserAgent())
	//userOS := ua.OS
	//userBrowser := ua.Name
	//userDevice := ua.Device

	h.Cookies.Set(w, loginResponse.Pair)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(loginResponse.User); err != nil {
		slog.ErrorContext(r.Context(), "failed to encode user response",
			slog.String("error", err.Error()),
		)
	}
}

func (h *Handler) LoginTOTP(w http.ResponseWriter, r *http.Request) {
	var body totpReq

	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	currentUser, pair, err := h.Service.loginTOTP(
		r.Context(),
		body.ChallengeToken,
		body.Code,
	)
	if err != nil {
		switch {
		case errors.Is(err, user.ErrUserNotFound):
			http.Error(w, "user not found", http.StatusUnauthorized)

		case errors.Is(err, challenge.ErrChallengeTokenNotFound):
			http.Error(w, "invalid or expired challenge", http.StatusUnauthorized)

		case errors.Is(err, ErrInvalidTOTPCode):
			http.Error(w, "invalid TOTP code", http.StatusUnauthorized)

		case errors.Is(err, ErrChallengeExpired):
			http.Error(w, "challenge expired", http.StatusUnauthorized)

		case errors.Is(err, ErrRequiredChallengeToken),
			errors.Is(err, ErrRequiredTOTPCode):
			http.Error(w, err.Error(), http.StatusBadRequest)

		default:
			slog.ErrorContext(r.Context(), "failed to complete TOTP login",
				slog.String("error", err.Error()),
			)
			http.Error(w, "internal server error", http.StatusInternalServerError)
		}
		return
	}

	h.Cookies.Set(w, pair)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(currentUser); err != nil {
		slog.ErrorContext(r.Context(), "failed to encode user response",
			slog.String("error", err.Error()),
		)
	}
}

func (h *Handler) LogoutUser(w http.ResponseWriter, r *http.Request) {
	h.Cookies.Clear(w)

	refreshToken, err := h.Cookies.RefreshToken(r)
	if err != nil {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	err = h.Service.logout(r.Context(), refreshToken)
	if err != nil && !errors.Is(err, ErrInvalidToken) && !errors.Is(err, ErrTokenNotFound) {
		slog.ErrorContext(r.Context(), "logout failed", slog.String("error", err.Error()))
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) RefreshTokens(w http.ResponseWriter, r *http.Request) {
	refreshToken, err := h.Cookies.RefreshToken(r)
	if err != nil {
		h.Service.rejectRefresh(w)
		w.WriteHeader(http.StatusNoContent)
		return
	}

	pair, err := h.Service.refreshTokens(r.Context(), refreshToken)
	if err != nil {
		h.Service.rejectRefresh(w)
		return
	}

	h.Cookies.Set(w, pair)

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) LogoutAllSessions(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	h.Cookies.Clear(w)

	if err = h.Service.logoutAllSessions(r.Context(), internal.UserID(userID)); err != nil {
		slog.ErrorContext(r.Context(), "failed to logout all sessions",
			slog.String("error", err.Error()),
		)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
