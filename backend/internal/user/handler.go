package user

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strings"
	"studify/internal"
	"studify/internal/auth"
	"studify/internal/httpx"

	"golang.org/x/crypto/bcrypt"
)

func (h *Handler) GetUser(w http.ResponseWriter, r *http.Request) {
	user, err := CurrentUser(r, h.DB)
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}
		log.Printf("failed to get current user: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err = json.NewEncoder(w).Encode(user); err != nil {
		log.Printf("failed to encode current user to JSON: %v", err)
	}
}

func (h *Handler) UpdateUserEmail(w http.ResponseWriter, r *http.Request) {
	body := EmailRequest{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	body.NewEmail = strings.TrimSpace(body.NewEmail)
	if body.NewEmail == "" {
		http.Error(w, "email is required", http.StatusBadRequest)
		return
	}

	user, err := CurrentUser(r, h.DB)
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}
		log.Printf("failed to get current user: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if strings.TrimSpace(body.NewEmail) == strings.TrimSpace(user.Email) {
		http.Error(w, "invalid data", http.StatusBadRequest)
		return
	}

	newUser, err := UpdateUserEmail(h.DB, user.ID, body.NewEmail)
	if err != nil {
		log.Printf("failed to update user email: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if err = h.EmailService.SendConfirmationEmail(newUser.Email, internal.UserID(newUser.ID)); err != nil {
		log.Printf("failed to send confirmation email: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err = json.NewEncoder(w).Encode(newUser); err != nil {
		log.Printf("failed to encode current user to JSON: %v", err)
	}
}

func (h *Handler) UpdateUserPassword(w http.ResponseWriter, r *http.Request) {
	request := PasswordRequest{}
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		log.Printf("failed to decode password update request: %v", err)
		http.Error(w, "invalid JSON", http.StatusBadRequest)
		return
	}

	if request.CurrentPassword == "" {
		http.Error(w, "current password is required", http.StatusBadRequest)
		return
	}

	if request.CurrentPassword == request.NewPassword {
		http.Error(w, "invalid data", http.StatusBadRequest)
		return
	}

	if err := auth.ValidatePassword(request.NewPassword, auth.AuthActionRegister); err != nil {
		log.Printf("failed to validate new password: %v", err)
		http.Error(w, "invalid data", http.StatusBadRequest)
		return
	}

	userID, err := httpx.GetUserID(r)
	if err != nil {
		log.Printf("failed to get user id: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	passwordHash, err := GetUserPasswordHashByID(h.DB, userID)
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}

		log.Printf("failed to get user password hash: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if err := bcrypt.CompareHashAndPassword(
		[]byte(passwordHash),
		[]byte(request.CurrentPassword),
	); err != nil {
		if errors.Is(err, bcrypt.ErrMismatchedHashAndPassword) {
			http.Error(w, "invalid current password", http.StatusUnauthorized)
			return
		}

		log.Printf("failed to compare password hash: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	newPasswordHash, err := auth.HashPassword(request.NewPassword)
	if err != nil {
		log.Printf("failed to hash new password: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if err := UpdateUserPassword(h.DB, userID, newPasswordHash); err != nil {
		if errors.Is(err, ErrUserNotFound) {
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}

		log.Printf("failed to update user password: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
	// TODO: Reset refresh tokens.
}

// Helpers

func CurrentUser(r *http.Request, db *sql.DB) (*User, error) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		return nil, err
	}

	currentUser, err := GetUserByID(db, userID)
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			return nil, ErrUserNotFound
		}

		return nil, fmt.Errorf("get current user: %w", err)
	}

	return currentUser, nil
}
