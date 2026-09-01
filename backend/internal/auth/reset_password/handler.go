package reset_password

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"studify/internal"
	"studify/internal/auth"
	"studify/internal/user"

	"github.com/go-chi/chi/v5"
)

type incomingEmail struct {
	Email string `json:"email"`
}

type ChangePasswordRequest struct {
	Token                string `json:"password_reset_token"`
	NewPassword          string `json:"new_password"`
	NewPasswordConfirmed string `json:"new_password_confirmed"`
}

type TokenResponse struct {
	Token string `json:"password_reset_token"`
}

func (h *Handler) RequestPasswordReset(w http.ResponseWriter, r *http.Request) {
	body := incomingEmail{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		log.Printf("failed to decode request body: %v", err)
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if body.Email == "" {
		http.Error(w, "Email is required", http.StatusBadRequest)
		return
	}

	currentUser, err := user.GetUserByEmail(h.DB, body.Email)
	if err != nil {
		log.Printf("failed to get user by email: %v", err)
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	token, err := createResetPasswordToken(h.DB, internal.UserID(currentUser.ID))
	if err != nil {
		log.Printf("failed to create reset password token: %v", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	link := fmt.Sprintf(
		"%s/reset-password/%s",
		h.Config.AppURL,
		token,
	)

	if err = h.Mailer.SendPasswordResetEmail("noreply@studify.com", body.Email, link); err != nil {
		log.Printf("failed to send password reset email: %v", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) ValidateResetPasswordToken(w http.ResponseWriter, r *http.Request) {
	token := chi.URLParam(r, "token")
	if token == "" {
		http.Error(w, "missing token", http.StatusBadRequest)
		return
	}

	_, err := validateResetPasswordToken(h.DB, auth.Token(token))
	if err != nil {
		http.Error(w, "invalid or expired reset token", http.StatusUnprocessableEntity)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (h *Handler) ResetPassword(w http.ResponseWriter, r *http.Request) {
	var body ChangePasswordRequest

	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if body.Token == "" {
		http.Error(w, "missing reset token", http.StatusBadRequest)
		return
	}

	if body.NewPassword != body.NewPasswordConfirmed {
		http.Error(w, "passwords do not match", http.StatusBadRequest)
		return
	}

	if err := auth.ValidatePassword(body.NewPassword, auth.AuthActionRegister); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	tokenRecord, err := validateResetPasswordToken(h.DB, auth.Token(body.Token))
	if err != nil {
		log.Printf("invalid or expired token: %v", err)
		http.Error(w, "invalid or expired token", http.StatusBadRequest)
		return
	}

	hash, err := auth.HashPassword(body.NewPassword)
	if err != nil {
		log.Printf("failed to hash password: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if err = user.UpdateUserPassword(h.DB, tokenRecord.UserID, hash); err != nil {
		log.Printf("failed to update user password: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if err = DeleteResetPasswordToken(h.DB, tokenRecord.UserID); err != nil {
		log.Printf("failed to delete reset token: %v", err)
	}

	w.WriteHeader(http.StatusNoContent)
}
