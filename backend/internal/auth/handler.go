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
		if err := json.NewEncoder(w).Encode(loginResponse); err != nil {
			slog.ErrorContext(r.Context(), "failed to encode TOTP challenge response",
				slog.String("error", err.Error()),
			)
		}
		return
	}

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

//func (h *Handler) RefreshTokens(w http.ResponseWriter, r *http.Request) {
//	refreshTokenCookie, err := r.Cookie("refresh_token")
//	if err != nil {
//		if errors.Is(err, http.ErrNoCookie) {
//			h.Service.rejectRefresh(w)
//			return
//		}
//
//		slog.Error("failed to get refresh token cookie", slog.String("error", err.Error()))
//		h.Service.rejectRefresh(w)
//		return
//	}
//
//	userID, refreshTokenID, err := h.Token.ParseRefreshToken(refreshTokenCookie.Value)
//	if err != nil {
//		slog.Error("failed to parse refresh token", slog.String("error", err.Error()))
//		h.Service.rejectRefresh(w)
//		return
//	}
//
//	tx, err := h.DB.BeginTx(r.Context(), nil)
//	if err != nil {
//		slog.Error("failed to begin refresh token transaction", slog.String("error", err.Error()))
//		http.Error(w, "internal server error", http.StatusInternalServerError)
//		return
//	}
//	defer tx.Rollback()
//
//	refreshToken, err := token.GetRefreshTokenByTokenID(
//		r.Context(),
//		tx,
//		string(refreshTokenID),
//		true,
//	)
//	if err != nil {
//		slog.Error("failed to get refresh token by token ID", slog.String("error", err.Error()))
//		h.Service.rejectRefresh(w)
//		return
//	}
//
//	isValid := util.CompareHashSHA256(refreshTokenCookie.Value, refreshToken.TokenHash)
//	if !isValid {
//		slog.Error("refresh token hash mismatch", slog.Any("token_id", refreshTokenID))
//		h.Service.rejectRefresh(w)
//		return
//	}
//
//	if internal.UserID(refreshToken.UserID) != userID {
//		slog.Error("refresh token user ID mismatch",
//			slog.Any("db_user_id", refreshToken.UserID),
//			slog.Any("jwt_user_id", userID),
//		)
//		h.Service.rejectRefresh(w)
//		return
//	}
//
//	if token.TokenID(refreshToken.TokenID) != refreshTokenID {
//		slog.Error("refresh token ID mismatch",
//			slog.String("db_token_id", refreshToken.TokenID),
//			slog.Any("jwt_token_id", refreshTokenID),
//		)
//		h.Service.rejectRefresh(w)
//		return
//	}
//
//	if refreshToken.RevokedAt != nil {
//		slog.Error("refresh token is revoked", slog.Any("token_id", refreshTokenID))
//		h.Service.rejectRefresh(w)
//		return
//	}
//
//	if !refreshToken.ExpiresAt.After(time.Now()) {
//		slog.Error("refresh token is expired", slog.Any("token_id", refreshTokenID))
//		h.Service.rejectRefresh(w)
//		return
//	}
//
//	newRefreshToken, newRefreshTokenID, err := h.Token.GenerateRefreshToken(userID)
//	if err != nil {
//		slog.Error("failed to generate refresh token", slog.String("error", err.Error()))
//		http.Error(w, "internal server error", http.StatusInternalServerError)
//		return
//	}
//
//	newRefreshTokenHash := util.HashSHA256(string(newRefreshToken))
//
//	_, err = token.InsertRefreshToken(
//		r.Context(),
//		tx,
//		int64(userID),
//		string(newRefreshTokenID),
//		newRefreshTokenHash,
//		time.Now().Add(config.RefreshTokenTTL),
//	)
//	if err != nil {
//		slog.Error("failed to insert refresh token", slog.String("error", err.Error()))
//		http.Error(w, "internal server error", http.StatusInternalServerError)
//		return
//	}
//
//	if err = token.ReplaceRefreshToken(
//		r.Context(),
//		tx,
//		string(refreshTokenID),
//		string(newRefreshTokenID),
//	); err != nil {
//		if errors.Is(err, sql.ErrNoRows) {
//			slog.Error("refresh token was already revoked", slog.Any("token_id", refreshTokenID))
//			h.Service.rejectRefresh(w)
//			return
//		}
//
//		slog.Error("failed to replace refresh token", slog.String("error", err.Error()))
//		http.Error(w, "internal server error", http.StatusInternalServerError)
//		return
//	}
//
//	if err = tx.Commit(); err != nil {
//		slog.Error("failed to commit refresh token transaction", slog.String("error", err.Error()))
//		http.Error(w, "internal server error", http.StatusInternalServerError)
//		return
//	}
//
//	if err = h.Token.SetAccessTokenCookies(userID, w); err != nil {
//		slog.Error("failed to set access token cookie", slog.String("error", err.Error()))
//		http.Error(w, "internal server error", http.StatusInternalServerError)
//		return
//	}
//
//	if err = h.Token.SetRefreshTokenCookies(newRefreshToken, w); err != nil {
//		slog.Error("failed to set refresh token cookie", slog.String("error", err.Error()))
//		http.Error(w, "internal server error", http.StatusInternalServerError)
//		return
//	}
//
//	w.WriteHeader(http.StatusNoContent)
//}

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
