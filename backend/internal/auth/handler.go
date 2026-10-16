package auth

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"studify/internal"
	"studify/internal/auth/credentials"
	"studify/internal/auth/mfa"
	"studify/internal/auth/token"
	"studify/internal/config"
	"studify/internal/user"
	"studify/internal/util"
	"time"

	"github.com/pquerna/otp/totp"
	"golang.org/x/crypto/bcrypt"
)

type tokenResponse struct {
	Token string `json:"confirm_email_token"`
}

func (h *Handler) RegisterUser(w http.ResponseWriter, r *http.Request) {
	body := UserRequest{}

	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, fmt.Sprintf("failed to read data: %v", err), http.StatusBadRequest)
		return
	}

	if err := credentials.ValidateCredentials(body.Email, body.Password, credentials.ActionRegister); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	passwordHash, err := credentials.HashPassword(body.Password)
	if err != nil {
		slog.Error("failed to hash password", slog.String("error", err.Error()))
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	newUser, err := user.InsertUser(h.DB, body.Email, passwordHash)
	if err != nil {
		if errors.Is(err, user.ErrUserAlreadyExists) {
			http.Error(w, "user with such email already exists", http.StatusConflict)
			return
		}

		slog.Error("failed to register user", slog.String("error", err.Error()))
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if err := h.Token.IssueTokens(internal.UserID(newUser.ID), w); err != nil {
		slog.Error("failed to issue tokens", slog.String("error", err.Error()))
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if err := h.MailService.SendConfirmationEmail(
		newUser.Email,
		internal.UserID(newUser.ID),
	); err != nil {
		slog.Error("failed to send confirmation email", slog.String("error", err.Error()))
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)

	if err := json.NewEncoder(w).Encode(newUser); err != nil {
		slog.Error("failed to encode user to JSON", slog.String("error", err.Error()))
	}
}

func (h *Handler) LoginUser(w http.ResponseWriter, r *http.Request) {
	body := UserRequest{}

	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, fmt.Sprintf("failed to read data: %v", err), http.StatusBadRequest)
		return
	}

	if err := credentials.ValidateCredentials(body.Email, body.Password, credentials.ActionLogin); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	currentUser, err := user.GetUserByEmail(h.DB, body.Email)
	if err != nil {
		if !errors.Is(err, user.ErrUserNotFound) {
			slog.Error("failed to get user for login", slog.String("error", err.Error()))
			http.Error(w, "internal server error", http.StatusInternalServerError)
			return
		}

		http.Error(w, "invalid email or password", http.StatusUnauthorized)
		return
	}

	if err := bcrypt.CompareHashAndPassword(
		[]byte(currentUser.PasswordHash),
		[]byte(body.Password),
	); err != nil {
		http.Error(w, "invalid email or password", http.StatusUnauthorized)
		return
	}

	if currentUser.IsTOTPEnabled {
		challengeToken, err := token.GenerateAuthToken()
		if err != nil {
			slog.Error("failed to generate challenge token", slog.String("error", err.Error()))
			http.Error(w, "internal server error", http.StatusInternalServerError)
			return
		}

		hash := token.HashToken(challengeToken)

		_, err = token.InsertAuthChallenge(
			h.DB,
			currentUser.ID,
			hash,
			time.Now().Add(config.ChallengeTokenTTL),
		)
		if err != nil {
			slog.Error("failed to insert auth challenge", slog.String("error", err.Error()))
			http.Error(w, "internal server error", http.StatusInternalServerError)
			return
		}

		response := ChallengeTokenResponse{
			ChallengeToken: string(challengeToken),
		}

		w.Header().Set("Content-Type", "application/json")

		if err := json.NewEncoder(w).Encode(response); err != nil {
			slog.Error("failed to encode response", slog.String("error", err.Error()))
		}

		return
	}

	if err := h.Token.IssueTokens(internal.UserID(currentUser.ID), w); err != nil {
		slog.Error("failed to issue tokens", slog.String("error", err.Error()))
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(currentUser); err != nil {
		slog.Error("failed to encode user to JSON", slog.String("error", err.Error()))
	}
}

func (h *Handler) LoginTOTP(w http.ResponseWriter, r *http.Request) {
	body := TOTPRequest{}

	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, fmt.Sprintf("failed to read data: %v", err), http.StatusBadRequest)
		return
	}

	if body.ChallengeToken == "" {
		slog.Error("challenge token is required")
		http.Error(w, "challenge token is required", http.StatusBadRequest)
		return
	}

	if body.Code == "" {
		slog.Error("TOTP code is required")
		http.Error(w, "TOTP code is required", http.StatusBadRequest)
		return
	}

	hash := token.HashToken(token.Token(body.ChallengeToken))

	ch, err := token.GetAuthChallengeByTokenHash(h.DB, hash)
	if err != nil {
		if errors.Is(err, token.ErrChallengeTokenNotFound) {
			http.Error(w, "invalid or expired challenge token", http.StatusUnauthorized)
			return
		}

		slog.Error("failed to get auth challenge", slog.String("error", err.Error()))
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if time.Now().After(ch.ExpiresAt) {
		http.Error(w, "challenge token expired", http.StatusUnauthorized)
		return
	}

	currentUser, err := user.GetUserByID(h.DB, ch.UserID)
	if err != nil {
		if errors.Is(err, user.ErrUserNotFound) {
			http.Error(w, "invalid or expired challenge token", http.StatusUnauthorized)
			return
		}

		slog.Error("failed to get user for TOTP login", slog.String("error", err.Error()))
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	encryptedSecret, err := mfa.GetUserTOTPKeyEncryptedByID(
		h.DB,
		ch.UserID,
	)
	if err != nil {
		slog.Error("failed to get user TOTP key", slog.String("error", err.Error()))
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	decryptedSecret, err := mfa.DecryptTOTPKey(
		encryptedSecret,
		h.Config.TOTPEncryptionKey,
	)
	if err != nil {
		slog.Error("failed to decrypt user TOTP key", slog.String("error", err.Error()))
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if !totp.Validate(body.Code, decryptedSecret) {
		http.Error(w, "invalid TOTP passcode", http.StatusBadRequest)
		return
	}

	if err = token.DeleteAuthChallenge(h.DB, ch.ID); err != nil {
		slog.Error("failed to delete auth challenge", slog.String("error", err.Error()))
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if err = h.Token.IssueTokens(internal.UserID(ch.UserID), w); err != nil {
		slog.Error("failed to issue tokens", slog.String("error", err.Error()))
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err = json.NewEncoder(w).Encode(currentUser); err != nil {
		slog.Error("failed to encode user to JSON", slog.String("error", err.Error()))
	}
}

func (h *Handler) LogoutUser(w http.ResponseWriter, r *http.Request) {
	refreshTokenCookie, err := r.Cookie("refresh_token")
	if err != nil {
		if errors.Is(err, http.ErrNoCookie) {
			h.Token.ClearAuthCookies(w)
			w.WriteHeader(http.StatusNoContent)
			return
		}

		slog.Error("failed to get refresh token cookie", slog.String("error", err.Error()))
		h.Token.ClearAuthCookies(w)
		w.WriteHeader(http.StatusNoContent)
		return
	}

	_, refreshTokenID, err := h.Token.ParseRefreshToken(refreshTokenCookie.Value)
	if err != nil {
		slog.Error("failed to parse refresh token", slog.String("error", err.Error()))
		h.Token.ClearAuthCookies(w)
		w.WriteHeader(http.StatusNoContent)
		return
	}

	if err = token.RevokeRefreshToken(h.DB, string(refreshTokenID)); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			h.Token.ClearAuthCookies(w)
			w.WriteHeader(http.StatusNoContent)
			return
		}

		slog.Error("failed to revoke refresh token", slog.String("error", err.Error()))
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	h.Token.ClearAuthCookies(w)
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) RefreshTokens(w http.ResponseWriter, r *http.Request) {
	refreshTokenCookie, err := r.Cookie("refresh_token")
	if err != nil {
		if errors.Is(err, http.ErrNoCookie) {
			h.rejectRefresh(w)
			return
		}

		slog.Error("failed to get refresh token cookie", slog.String("error", err.Error()))
		h.rejectRefresh(w)
		return
	}

	userID, refreshTokenID, err := h.Token.ParseRefreshToken(refreshTokenCookie.Value)
	if err != nil {
		slog.Error("failed to parse refresh token", slog.String("error", err.Error()))
		h.rejectRefresh(w)
		return
	}

	tx, err := h.DB.BeginTx(r.Context(), nil)
	if err != nil {
		slog.Error("failed to begin refresh token transaction", slog.String("error", err.Error()))
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	refreshToken, err := token.GetRefreshTokenByTokenIDTx(
		tx,
		string(refreshTokenID),
	)
	if err != nil {
		slog.Error("failed to get refresh token by token ID", slog.String("error", err.Error()))
		h.rejectRefresh(w)
		return
	}

	isValid := util.CompareHashSHA256(refreshTokenCookie.Value, refreshToken.TokenHash)
	if !isValid {
		slog.Error("refresh token hash mismatch", slog.Any("token_id", refreshTokenID))
		h.rejectRefresh(w)
		return
	}

	if internal.UserID(refreshToken.UserID) != userID {
		slog.Error("refresh token user ID mismatch",
			slog.Any("db_user_id", refreshToken.UserID),
			slog.Any("jwt_user_id", userID),
		)
		h.rejectRefresh(w)
		return
	}

	if token.TokenID(refreshToken.TokenID) != refreshTokenID {
		slog.Error("refresh token ID mismatch",
			slog.String("db_token_id", refreshToken.TokenID),
			slog.Any("jwt_token_id", refreshTokenID),
		)
		h.rejectRefresh(w)
		return
	}

	if refreshToken.RevokedAt != nil {
		slog.Error("refresh token is revoked", slog.Any("token_id", refreshTokenID))
		h.rejectRefresh(w)
		return
	}

	if !refreshToken.ExpiresAt.After(time.Now()) {
		slog.Error("refresh token is expired", slog.Any("token_id", refreshTokenID))
		h.rejectRefresh(w)
		return
	}

	newRefreshToken, newRefreshTokenID, err := h.Token.GenerateRefreshToken(userID)
	if err != nil {
		slog.Error("failed to generate refresh token", slog.String("error", err.Error()))
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	newRefreshTokenHash := util.HashSHA256(string(newRefreshToken))

	_, err = token.InsertRefreshTokenTx(
		tx,
		int64(userID),
		string(newRefreshTokenID),
		string(newRefreshTokenHash),
		time.Now().Add(config.RefreshTokenTTL),
	)
	if err != nil {
		slog.Error("failed to insert refresh token", slog.String("error", err.Error()))
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if err = token.ReplaceRefreshTokenTx(
		tx,
		string(refreshTokenID),
		string(newRefreshTokenID),
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			slog.Error("refresh token was already revoked", slog.Any("token_id", refreshTokenID))
			h.rejectRefresh(w)
			return
		}

		slog.Error("failed to replace refresh token", slog.String("error", err.Error()))
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if err = tx.Commit(); err != nil {
		slog.Error("failed to commit refresh token transaction", slog.String("error", err.Error()))
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if err = h.Token.SetAccessTokenCookies(userID, w); err != nil {
		slog.Error("failed to set access token cookie", slog.String("error", err.Error()))
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if err = h.Token.SetRefreshTokenCookies(newRefreshToken, w); err != nil {
		slog.Error("failed to set refresh token cookie", slog.String("error", err.Error()))
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) rejectRefresh(w http.ResponseWriter) {
	h.Token.ClearAuthCookies(w)
	http.Error(w, "unauthorized", http.StatusUnauthorized)
}

func (h *Handler) ConfirmEmail(w http.ResponseWriter, r *http.Request) {
	body := tokenResponse{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		slog.Error("failed to decode request body", slog.String("error", err.Error()))
		http.Error(w, "invalid JSON", http.StatusBadRequest)
		return
	}

	if err := h.AuthService.ConfirmEmail(r.Context(), token.Token(body.Token)); err != nil {
		if errors.Is(err, ErrInvalidConfirmationToken) {
			http.Error(w, "invalid confirmation token", http.StatusBadRequest)
			return
		}

		slog.Error("failed to confirm email", slog.String("error", err.Error()))
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) ResendConfirmationMail(w http.ResponseWriter, r *http.Request) {
	currentUser, err := h.UserService.CurrentUser(r, h.DB)
	if err != nil {
		if errors.Is(err, user.ErrUserNotFound) {
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}

		slog.Error("failed to get current user", slog.String("error", err.Error()))
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if err = h.MailService.SendConfirmationEmail(
		currentUser.Email,
		internal.UserID(currentUser.ID),
	); err != nil {
		slog.Error("failed to send confirmation email", slog.String("error", err.Error()))
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
