package handlers

import (
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"studify/internal/auth"
	"studify/internal/config"
	"studify/internal/database"
	"studify/internal/database/tokens"
	"studify/internal/models"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/pquerna/otp/totp"
	"golang.org/x/crypto/bcrypt"
)

type Passcode struct {
	Passcode string `json:"passcode"`
}

type TOTPResponse struct {
	QRCode  string `json:"qr_code"`
	TextKey string `json:"text_key"`
}

type ChallengeTokenResponse struct {
	ChallengeToken string `json:"challenge_token"`
}

func (h *Handler) RegisterUser(w http.ResponseWriter, r *http.Request) {
	// Get and validate data, hash password
	body := models.UserRequest{}

	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, fmt.Sprintf("Failed to read data: %v", err), http.StatusBadRequest)
		return
	}

	if err := auth.ValidateCredentials(body.Email, body.Password, models.AuthActionRegister); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	passwordHash, err := auth.HashPassword(body.Password)
	if err != nil {
		log.Printf("failed to hash password: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	newUser, err := database.InsertUser(h.DB, body.Email, passwordHash)
	if err != nil {
		if errors.Is(err, database.ErrUserAlreadyExists) {
			http.Error(w, "user with such email already exists", http.StatusConflict)
			return
		}

		log.Printf("failed to register user: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if err := h.Auth.IssueTokens(auth.UserID(newUser.ID), w); err != nil {
		log.Printf("failed to issue tokens: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if err := h.EmailService.SendConfirmationEmail(newUser.Email, auth.UserID(newUser.ID)); err != nil {
		log.Printf("failed to send confirmation email: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	if err = json.NewEncoder(w).Encode(newUser); err != nil {
		log.Printf("failed to encode user to JSON: %v", err)
	}
}

func (h *Handler) LoginUser(w http.ResponseWriter, r *http.Request) {
	body := models.UserRequest{}

	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, fmt.Sprintf("failed to read data: %v", err), http.StatusBadRequest)
		return
	}

	if err := auth.ValidateCredentials(body.Email, body.Password, models.AuthActionLogin); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	user, err := database.GetUserByEmail(h.DB, body.Email)
	if err != nil {
		if !errors.Is(err, database.ErrUserNotFound) {
			log.Printf("failed to get user for login: %v", err)
			http.Error(w, "internal server error", http.StatusInternalServerError)
			return
		}

		http.Error(w, "invalid email or password", http.StatusUnauthorized)
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(body.Password))
	if err != nil {
		http.Error(w, "invalid email or password", http.StatusUnauthorized)
		return
	}

	if user.IsTOTPEnabled {
		ch, err := auth.GenerateChallengeToken()
		if err != nil {
			log.Printf("failed to generate challenge token: %v", err)
			http.Error(w, "internal server error", http.StatusInternalServerError)
			return
		}

		hash := auth.HashChallengeToken(auth.ChallengeToken(ch))

		_, err = tokens.InsertAuthChallenge(h.DB, user.ID, string(hash), time.Now().Add(config.ChallengeTokenTTL))
		if err != nil {
			log.Printf("failed to insert auth challenge: %v", err)
			http.Error(w, "internal server error", http.StatusInternalServerError)
			return
		}

		response := ChallengeTokenResponse{ChallengeToken: ch}

		w.Header().Set("Content-Type", "application/json")
		if err = json.NewEncoder(w).Encode(response); err != nil {
			log.Printf("failed to encode response")
			return
		}

		return
	}

	if err := h.Auth.IssueTokens(auth.UserID(user.ID), w); err != nil {
		log.Printf("failed to issue tokens: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	if err = json.NewEncoder(w).Encode(user); err != nil {
		log.Printf("failed to encode user to JSON: %v", err)
	}
}

func (h *Handler) LoginTOTP(w http.ResponseWriter, r *http.Request) {
	body := models.TOTPRequest{}

	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, fmt.Sprintf("failed to read data: %v", err), http.StatusBadRequest)
		return
	}

	if body.ChallengeToken == "" {
		log.Printf("Challenge token is required")
		http.Error(w, "Challenge token is required", http.StatusBadRequest)
		return
	}

	if body.Code == "" {
		log.Printf("TOTP code is required")
		http.Error(w, "TOTP code is required", http.StatusBadRequest)
		return
	}

	hash := auth.HashChallengeToken(auth.ChallengeToken(body.ChallengeToken))
	ch, err := tokens.GetAuthChallengeByTokenHash(h.DB, string(hash))
	if err != nil {
		if errors.Is(err, tokens.ErrAuthChallengeNotFound) {
			http.Error(w, "invalid or expired challenge token", http.StatusUnauthorized)
			return
		}
		log.Printf("failed to get auth challenge: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if time.Now().After(ch.ExpiresAt) {
		http.Error(w, "challenge token expired", http.StatusUnauthorized)
		return
	}

	user, err := database.GetUserByID(h.DB, ch.UserID)
	if err != nil {
		if errors.Is(err, database.ErrUserNotFound) {
			http.Error(w, "invalid or expired challenge token", http.StatusUnauthorized)
			return
		}
		log.Printf("failed to get user for totp login: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	encryptedSecret, err := database.GetUserTOTPKeyEncryptedByID(h.DB, ch.UserID)
	if err != nil {
		log.Printf("failed to get user TOTP key: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	decryptedSecret, err := auth.DecryptTOTPKey(encryptedSecret, h.Config.TOTPEncryptionKey)
	if err != nil {
		log.Printf("failed to decrypt user TOTP key: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if !totp.Validate(body.Code, decryptedSecret) {
		http.Error(w, "invalid TOTP passcode", http.StatusBadRequest)
		return
	}

	if err := tokens.DeleteAuthChallenge(h.DB, ch.ID); err != nil {
		log.Printf("failed to delete auth challenge: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if err := h.Auth.IssueTokens(auth.UserID(ch.UserID), w); err != nil {
		log.Printf("failed to issue tokens: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err = json.NewEncoder(w).Encode(user); err != nil {
		log.Printf("failed to encode user to JSON: %v", err)
	}
}

func (h *Handler) LogoutUser(w http.ResponseWriter, r *http.Request) {
	refreshTokenCookie, err := r.Cookie("refresh_token")
	if err != nil {
		if errors.Is(err, http.ErrNoCookie) {
			h.Auth.ClearAuthCookies(w)
			w.WriteHeader(http.StatusNoContent)
			return
		}

		log.Printf("failed to get refresh token cookie: %v", err)
		h.Auth.ClearAuthCookies(w)
		w.WriteHeader(http.StatusNoContent)
		return
	}

	_, refreshTokenID, err := h.Auth.ParseRefreshToken(refreshTokenCookie.Value)
	if err != nil {
		log.Printf("failed to parse refresh token: %v", err)

		h.Auth.ClearAuthCookies(w)
		w.WriteHeader(http.StatusNoContent)
		return
	}

	if err = tokens.RevokeRefreshToken(h.DB, string(refreshTokenID)); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			h.Auth.ClearAuthCookies(w)
			w.WriteHeader(http.StatusNoContent)
			return
		}

		log.Printf("failed to revoke refresh token: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	h.Auth.ClearAuthCookies(w)
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) RefreshTokens(w http.ResponseWriter, r *http.Request) {
	refreshTokenCookie, err := r.Cookie("refresh_token")
	if err != nil {
		if errors.Is(err, http.ErrNoCookie) {
			h.rejectRefresh(w)
			return
		}

		log.Printf("failed to get refresh token cookie: %v", err)
		h.rejectRefresh(w)
		return
	}

	userID, refreshTokenID, err := h.Auth.ParseRefreshToken(refreshTokenCookie.Value)
	if err != nil {
		log.Printf("failed to parse refresh token: %v", err)
		h.rejectRefresh(w)
		return
	}

	tx, err := h.DB.BeginTx(r.Context(), nil)
	if err != nil {
		log.Printf("failed to begin refresh token transaction: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	refreshToken, err := tokens.GetRefreshTokenByTokenIDTx(tx, string(refreshTokenID))
	if err != nil {
		log.Printf("failed to get refresh token by token ID: %v", err)
		h.rejectRefresh(w)
		return
	}

	isValid := auth.CompareTokenHash(
		auth.RefreshToken(refreshTokenCookie.Value),
		auth.TokenHash(refreshToken.TokenHash),
	)
	if !isValid {
		log.Printf("refresh token hash mismatch for token ID %q", refreshTokenID)
		h.rejectRefresh(w)
		return
	}

	if auth.UserID(refreshToken.UserID) != userID {
		log.Printf(
			"refresh token user ID mismatch: db user ID %d, jwt user ID %d",
			refreshToken.UserID,
			userID,
		)

		h.rejectRefresh(w)
		return
	}

	if auth.TokenID(refreshToken.TokenID) != refreshTokenID {
		log.Printf(
			"refresh token ID mismatch: db token ID %q, jwt token ID %q",
			refreshToken.TokenID,
			refreshTokenID,
		)

		h.rejectRefresh(w)
		return
	}

	if refreshToken.RevokedAt != nil {
		log.Printf("refresh token is revoked: token ID %q", refreshTokenID)

		h.rejectRefresh(w)
		return
	}

	if !refreshToken.ExpiresAt.After(time.Now()) {
		log.Printf("refresh token is expired: token ID %q", refreshTokenID)

		h.rejectRefresh(w)
		return
	}

	newRefreshToken, newRefreshTokenID, err := h.Auth.GenerateRefreshToken(userID)
	if err != nil {
		log.Printf("failed to generate refresh token: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	newRefreshTokenHash := auth.HashRefreshToken(newRefreshToken)

	_, err = tokens.InsertRefreshTokenTx(
		tx,
		int64(userID),
		string(newRefreshTokenID),
		string(newRefreshTokenHash),
		time.Now().Add(config.RefreshTokenTTL),
	)
	if err != nil {
		log.Printf("failed to insert refresh token: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if err = tokens.ReplaceRefreshTokenTx(tx, string(refreshTokenID), string(newRefreshTokenID)); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			log.Printf("refresh token was already revoked: token ID %q", refreshTokenID)
			h.rejectRefresh(w)
			return
		}

		log.Printf("failed to replace refresh token: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if err = tx.Commit(); err != nil {
		log.Printf("failed to commit refresh token transaction: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if err = h.Auth.SetAccessTokenCookies(userID, w); err != nil {
		log.Printf("failed to set access token cookie: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if err = h.Auth.SetRefreshTokenCookies(newRefreshToken, w); err != nil {
		log.Printf("failed to set refresh token cookie: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) rejectRefresh(w http.ResponseWriter) {
	h.Auth.ClearAuthCookies(w)
	http.Error(w, "unauthorized", http.StatusUnauthorized)
}

// email

func (h *Handler) ConfirmEmail(w http.ResponseWriter, r *http.Request) {
	log.Printf(
		"confirm request: method=%s ua=%q",
		r.Method,
		r.UserAgent(),
	)

	token := chi.URLParam(r, "token")
	if token == "" {
		log.Printf("failed to get token from url params")
		http.Error(w, "missing token", http.StatusBadRequest)
		return
	}

	tokenRecord, err := auth.ValidateConfirmationToken(h.DB, token)
	if err != nil {
		log.Printf("failed to validate confirmation token: %v", err)
		http.Error(w, "invalid confirmation token", http.StatusBadRequest)
		return
	}

	if err := database.VerifyUserEmail(h.DB, tokenRecord.UserID); err != nil {
		log.Printf("failed to verify user email: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if err := tokens.DeleteConfirmationToken(h.DB, tokenRecord.UserID); err != nil {
		log.Printf("failed to delete confirmation token from db: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) ResendConfirmationMail(w http.ResponseWriter, r *http.Request) {
	user, err := h.currentUser(r)
	if err != nil {
		if errors.Is(err, database.ErrUserNotFound) {
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}
		log.Printf("failed to get current user: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if err := h.EmailService.SendConfirmationEmail(user.Email, auth.UserID(user.ID)); err != nil {
		log.Printf("failed to send confirmation email: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// totp

func (h *Handler) GenerateTOTP(w http.ResponseWriter, r *http.Request) {
	user, err := h.currentUser(r)
	if err != nil {
		if errors.Is(err, database.ErrUserNotFound) {
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}
		log.Printf("failed to get current user: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	key, err := auth.GenerateTOTPKey(user.Email, h.Config.AppName)
	if err != nil {
		log.Printf("failed to generate TOTP key: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	qr, err := auth.GenerateTOTPQRCode(key)
	if err != nil {
		log.Printf("failed to generate TOTP QR-code: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	secret := key.Secret() // For sending to the user so he can manually input this to auth app
	response := TOTPResponse{
		QRCode:  base64.StdEncoding.EncodeToString(qr),
		TextKey: secret,
	}

	encryptedSecret, err := auth.EncryptTOTPKey(secret, h.Config.TOTPEncryptionKey) // For sending to the DB to be more secure
	if err != nil {
		log.Printf("failed to encrypt TOTP key: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if err = database.UpdateUserTOTPSecret(h.DB, user.ID, encryptedSecret); err != nil {
		log.Printf("failed to set totp secret at users table: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err = json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("failed to encode response")
		return
	}
}

func (h *Handler) ValidateTOTP(w http.ResponseWriter, r *http.Request) {
	user, err := h.currentUser(r)
	if err != nil {
		if errors.Is(err, database.ErrUserNotFound) {
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}
		log.Printf("failed to get current user: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	body := Passcode{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		log.Printf("failed to decode request body: %v", err)
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	encryptedSecret, err := database.GetUserTOTPKeyEncryptedByID(h.DB, user.ID)
	if err != nil {
		log.Printf("failed to get user TOTP key: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	decryptedSecret, err := auth.DecryptTOTPKey(encryptedSecret, h.Config.TOTPEncryptionKey)
	if err != nil {
		log.Printf("failed to decrypt user TOTP key: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	valid := totp.Validate(body.Passcode, decryptedSecret)
	if !valid {
		log.Printf("failed to validate totp")
		http.Error(w, "Invalid TOTP Passcode", http.StatusBadRequest)
		return
	}

	if err := database.UpdateUserTOTPStatus(h.DB, user.ID, true); err != nil {
		log.Printf("failed to update user totp enabled status: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) DisableTOTP(w http.ResponseWriter, r *http.Request) {
	user, err := h.currentUser(r)
	if err != nil {
		if errors.Is(err, database.ErrUserNotFound) {
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}
		log.Printf("failed to get current user: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if err := database.DisableUserTOTP(h.DB, user.ID); err != nil {
		log.Printf("failed to disable user TOTP: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// TODO:
// - Extract writeJSON(status, data)
// - Extract getRefreshTokenFromRequest()
// - Extract internalError(loggerMsg, err)
// - Add rate limiting for ResendConfirmationMail()
// - Prevent resending confirmation for verified users
