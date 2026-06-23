package handlers

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"studify/internal/config"
	"studify/internal/database"
	"studify/internal/models"
	"studify/internal/utils"
	"time"

	"golang.org/x/crypto/bcrypt"
)

func (h *Handler) RegisterUser(w http.ResponseWriter, r *http.Request) {
	body := models.UserRequest{}

	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, fmt.Sprintf("Failed to read data: %v", err), http.StatusBadRequest)
		return
	}

	if err := utils.ValidateCredentials(body, models.AuthActionRegister); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	passwordHash, err := utils.HashPassword(body.Password)
	if err != nil {
		log.Printf("failed to hash password: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	newUser, err := database.InsertUser(h.DB, body.Username, passwordHash)
	if err != nil {
		if errors.Is(err, database.ErrUserAlreadyExists) {
			http.Error(w, "user with such username already exists", http.StatusConflict)
			return
		}

		log.Printf("failed to register user: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if err = h.Auth.SetAccessTokenCookies(models.UserID(newUser.ID), w); err != nil {
		log.Printf("failed to set access token cookie: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	// Refresh Token Service
	refreshToken, refreshTokenID, err := h.Auth.GenerateRefreshToken(models.UserID(newUser.ID))
	if err != nil {
		log.Printf("failed to generate refresh token: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	refreshTokenHash := utils.HashRefreshToken(refreshToken)

	_, err = database.InsertRefreshToken(h.DB, newUser.ID, string(refreshTokenID), string(refreshTokenHash), time.Now().Add(config.RefreshTokenTTL))
	if err != nil {
		log.Printf("failed to set insert refresh token: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if err = h.Auth.SetRefreshTokenCookies(refreshToken, w); err != nil {
		log.Printf("failed to set refresh token cookie: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}
	//

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

	if err := utils.ValidateCredentials(body, models.AuthActionLogin); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	user, err := database.GetUserByUsername(h.DB, body.Username)
	if err != nil {
		if !errors.Is(err, database.ErrUserNotFound) {
			log.Printf("failed to get user for login: %v", err)
			http.Error(w, "internal server error", http.StatusInternalServerError)
			return
		}

		http.Error(w, "invalid username or password", http.StatusUnauthorized)
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(body.Password))
	if err != nil {
		http.Error(w, "invalid username or password", http.StatusUnauthorized)
		return
	}

	if err = h.Auth.SetAccessTokenCookies(models.UserID(user.ID), w); err != nil {
		log.Printf("failed to set access token cookie: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	// Refresh Token Service
	refreshToken, refreshTokenID, err := h.Auth.GenerateRefreshToken(models.UserID(user.ID))
	if err != nil {
		log.Printf("failed to generate refresh token: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	refreshTokenHash := utils.HashRefreshToken(refreshToken)

	_, err = database.InsertRefreshToken(h.DB, user.ID, string(refreshTokenID), string(refreshTokenHash), time.Now().Add(config.RefreshTokenTTL))
	if err != nil {
		log.Printf("failed to set insert refresh token: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if err = h.Auth.SetRefreshTokenCookies(refreshToken, w); err != nil {
		log.Printf("failed to set refresh token cookie: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}
	//

	w.WriteHeader(http.StatusOK)
}

func (h *Handler) LogoutUser(w http.ResponseWriter, r *http.Request) {
	refreshTokenCookie, err := r.Cookie("refresh_token")
	if err != nil {
		if errors.Is(err, http.ErrNoCookie) {
			h.Auth.ClearAccessToken(w)
			h.Auth.ClearRefreshToken(w)
			w.WriteHeader(http.StatusNoContent)
			return
		}

		log.Printf("failed to get refresh token cookie: %v", err)
		h.Auth.ClearAccessToken(w)
		h.Auth.ClearRefreshToken(w)
		w.WriteHeader(http.StatusNoContent)
		return
	}

	_, refreshTokenID, err := h.Auth.ParseRefreshToken(refreshTokenCookie.Value)
	if err != nil {
		log.Printf("failed to parse refresh token: %v", err)

		h.Auth.ClearAccessToken(w)
		h.Auth.ClearRefreshToken(w)
		w.WriteHeader(http.StatusNoContent)
		return
	}

	if err = database.RevokeRefreshToken(h.DB, string(refreshTokenID)); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			h.Auth.ClearAccessToken(w)
			h.Auth.ClearRefreshToken(w)
			w.WriteHeader(http.StatusNoContent)
			return
		}

		log.Printf("failed to revoke refresh token: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	h.Auth.ClearAccessToken(w)
	h.Auth.ClearRefreshToken(w)
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) RefreshTokens(w http.ResponseWriter, r *http.Request) {
	refreshTokenCookie, err := r.Cookie("refresh_token")
	if err != nil {
		if errors.Is(err, http.ErrNoCookie) {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}

		log.Printf("failed to get refresh token cookie: %v", err)
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	userID, refreshTokenID, err := h.Auth.ParseRefreshToken(refreshTokenCookie.Value)
	if err != nil {
		log.Printf("failed to parse refresh token: %v", err)
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	refreshToken, err := database.GetRefreshTokenByTokenID(h.DB, string(refreshTokenID))
	if err != nil {
		log.Printf("failed to get refresh token by token ID: %v", err)
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	isValid := utils.CompareTokenHash(models.RefreshToken(refreshTokenCookie.Value), refreshToken.TokenHash)
	if !isValid {
		log.Printf("refresh token hash mismatch for token ID %q", refreshTokenID)
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	if refreshToken.UserID != userID {
		log.Printf(
			"refresh token user ID mismatch: db user ID %d, jwt user ID %d",
			refreshToken.UserID,
			userID,
		)

		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	if refreshToken.TokenID != refreshTokenID {
		log.Printf(
			"refresh token ID mismatch: db token ID %q, jwt token ID %q",
			refreshToken.TokenID,
			refreshTokenID,
		)

		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	if refreshToken.RevokedAt != nil {
		log.Printf("refresh token is revoked: token ID %q", refreshTokenID)

		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	if !refreshToken.ExpiresAt.After(time.Now()) {
		log.Printf("refresh token is expired: token ID %q", refreshTokenID)

		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	newRefreshToken, newRefreshTokenID, err := h.Auth.GenerateRefreshToken(userID)
	if err != nil {
		log.Printf("failed to generate refresh token: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	newRefreshTokenHash := utils.HashRefreshToken(newRefreshToken)

	tx, err := h.DB.BeginTx(r.Context(), nil)
	if err != nil {
		log.Printf("failed to begin refresh token transaction: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	_, err = database.InsertRefreshTokenTx(
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

	if err = database.RevokeRefreshTokenTx(tx, string(refreshTokenID)); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			log.Printf("refresh token was already revoked: token ID %q", refreshTokenID)
			w.WriteHeader(http.StatusUnauthorized)
			return
		}

		log.Printf("failed to revoke refresh token: %v", err)
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
