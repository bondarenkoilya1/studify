package handlers

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"studify/internal/auth"
	"studify/internal/auth/mfa"
	"studify/internal/config"
	"studify/internal/database/tokens"
	"studify/internal/user"
	"time"

	"github.com/pquerna/otp/totp"
	"golang.org/x/crypto/bcrypt"
)

type ChallengeTokenResponse struct {
	ChallengeToken string `json:"challenge_token"`
}

type UserRequest struct {
	Email           string `json:"email"`
	Password        string `json:"password"`
	IsEmailVerified bool   `json:"is_email_verified"`
	TOTPCode        string `json:"totp_code"` // temp!
}

type TOTPRequest struct {
	ChallengeToken string `json:"challenge_token"`
	Code           string `json:"code"`
}

func (h *Handler) RegisterUser(w http.ResponseWriter, r *http.Request) {
	body := UserRequest{}

	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, fmt.Sprintf("failed to read data: %v", err), http.StatusBadRequest)
		return
	}

	if err := auth.ValidateCredentials(body.Email, body.Password, auth.AuthActionRegister); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	passwordHash, err := auth.HashPassword(body.Password)
	if err != nil {
		log.Printf("failed to hash password: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	newUser, err := user.InsertUser(h.DB, body.Email, passwordHash)
	if err != nil {
		if errors.Is(err, user.ErrUserAlreadyExists) {
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

	if err := h.EmailService.SendConfirmationEmail(
		newUser.Email,
		auth.UserID(newUser.ID),
	); err != nil {
		log.Printf("failed to send confirmation email: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)

	if err := json.NewEncoder(w).Encode(newUser); err != nil {
		log.Printf("failed to encode user to JSON: %v", err)
	}
}

func (h *Handler) LoginUser(w http.ResponseWriter, r *http.Request) {
	body := UserRequest{}

	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, fmt.Sprintf("failed to read data: %v", err), http.StatusBadRequest)
		return
	}

	if err := auth.ValidateCredentials(body.Email, body.Password, auth.AuthActionLogin); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	currentUser, err := user.GetUserByEmail(h.DB, body.Email)
	if err != nil {
		if !errors.Is(err, user.ErrUserNotFound) {
			log.Printf("failed to get user for login: %v", err)
			http.Error(w, "internal server error", http.StatusInternalServerError)
			return
		}

		http.Error(w, "invalid email or password", http.StatusUnauthorized)
		return
	}

	if err := bcrypt.CompareHashAndPassword(
		[]byte(currentUser.Password),
		[]byte(body.Password),
	); err != nil {
		http.Error(w, "invalid email or password", http.StatusUnauthorized)
		return
	}

	if currentUser.IsTOTPEnabled {
		challengeToken, err := auth.GenerateChallengeToken()
		if err != nil {
			log.Printf("failed to generate challenge token: %v", err)
			http.Error(w, "internal server error", http.StatusInternalServerError)
			return
		}

		hash := auth.HashChallengeToken(auth.ChallengeToken(challengeToken))

		_, err = tokens.InsertAuthChallenge(
			h.DB,
			currentUser.ID,
			string(hash),
			time.Now().Add(config.ChallengeTokenTTL),
		)
		if err != nil {
			log.Printf("failed to insert auth challenge: %v", err)
			http.Error(w, "internal server error", http.StatusInternalServerError)
			return
		}

		response := ChallengeTokenResponse{
			ChallengeToken: challengeToken,
		}

		w.Header().Set("Content-Type", "application/json")

		if err := json.NewEncoder(w).Encode(response); err != nil {
			log.Printf("failed to encode response: %v", err)
		}

		return
	}

	if err := h.Auth.IssueTokens(auth.UserID(currentUser.ID), w); err != nil {
		log.Printf("failed to issue tokens: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(currentUser); err != nil {
		log.Printf("failed to encode user to JSON: %v", err)
	}
}

func (h *Handler) LoginTOTP(w http.ResponseWriter, r *http.Request) {
	body := TOTPRequest{}

	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, fmt.Sprintf("failed to read data: %v", err), http.StatusBadRequest)
		return
	}

	if body.ChallengeToken == "" {
		log.Printf("challenge token is required")
		http.Error(w, "challenge token is required", http.StatusBadRequest)
		return
	}

	if body.Code == "" {
		log.Printf("TOTP code is required")
		http.Error(w, "TOTP code is required", http.StatusBadRequest)
		return
	}

	hash := auth.HashChallengeToken(
		auth.ChallengeToken(body.ChallengeToken),
	)

	challenge, err := tokens.GetAuthChallengeByTokenHash(h.DB, string(hash))
	if err != nil {
		if errors.Is(err, tokens.ErrAuthChallengeNotFound) {
			http.Error(w, "invalid or expired challenge token", http.StatusUnauthorized)
			return
		}

		log.Printf("failed to get auth challenge: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if time.Now().After(challenge.ExpiresAt) {
		http.Error(w, "challenge token expired", http.StatusUnauthorized)
		return
	}

	currentUser, err := user.GetUserByID(h.DB, challenge.UserID)
	if err != nil {
		if errors.Is(err, user.ErrUserNotFound) {
			http.Error(w, "invalid or expired challenge token", http.StatusUnauthorized)
			return
		}

		log.Printf("failed to get user for TOTP login: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	encryptedSecret, err := mfa.GetUserTOTPKeyEncryptedByID(
		h.DB,
		challenge.UserID,
	)
	if err != nil {
		log.Printf("failed to get user TOTP key: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	decryptedSecret, err := mfa.DecryptTOTPKey(
		encryptedSecret,
		h.Config.TOTPEncryptionKey,
	)
	if err != nil {
		log.Printf("failed to decrypt user TOTP key: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if !totp.Validate(body.Code, decryptedSecret) {
		http.Error(w, "invalid TOTP passcode", http.StatusBadRequest)
		return
	}

	if err := tokens.DeleteAuthChallenge(h.DB, challenge.ID); err != nil {
		log.Printf("failed to delete auth challenge: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if err := h.Auth.IssueTokens(auth.UserID(challenge.UserID), w); err != nil {
		log.Printf("failed to issue tokens: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(currentUser); err != nil {
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

	refreshToken, err := tokens.GetRefreshTokenByTokenIDTx(
		tx,
		string(refreshTokenID),
	)
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

	if err = tokens.ReplaceRefreshTokenTx(
		tx,
		string(refreshTokenID),
		string(newRefreshTokenID),
	); err != nil {
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
