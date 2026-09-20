package reset_password

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"studify/internal"
	"studify/internal/auth"
	"studify/internal/user"
)

type email struct {
	Email string `json:"email"`
}

type changePasswordRequest struct {
	Token                string `json:"password_reset_token"`
	NewPassword          string `json:"new_password"`
	NewPasswordConfirmed string `json:"new_password_confirmed"`
}

type token struct {
	Token string `json:"password_reset_token"`
}

// RequestPasswordReset get user email and send generated link with token so user can
// visit it and start procedure
func (h *Handler) RequestPasswordReset(w http.ResponseWriter, r *http.Request) {
	body := email{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		slog.Error("failed to decode request body", slog.String("error", err.Error()))
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if body.Email == "" {
		http.Error(w, "Email is required", http.StatusBadRequest)
		return
	}

	currentUser, err := user.GetUserByEmail(h.DB, body.Email)
	if err != nil {
		slog.Error("failed to get user by email", slog.String("error", err.Error()))
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	token, err := createResetPasswordToken(h.DB, internal.UserID(currentUser.ID))
	if err != nil {
		slog.Error("failed to create reset password token", slog.String("error", err.Error()))
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	link := fmt.Sprintf("%s/reset-password?token=%s", h.Config.AppURL, token)

	if err = h.Mailer.SendPasswordResetEmail("noreply@studify.com", body.Email, link); err != nil {
		slog.Error("failed to send password reset email", slog.String("error", err.Error()))
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// VerifyResetPasswordToken gets token via JSON and validates it relevancy
func (h *Handler) VerifyResetPasswordToken(w http.ResponseWriter, r *http.Request) {
	body := token{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		slog.Error("failed to decode request body", slog.String("error", err.Error()))
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if body.Token == "" {
		http.Error(w, "missing token", http.StatusBadRequest)
		return
	}

	_, err := validateResetPasswordToken(h.DB, auth.Token(body.Token))
	if err != nil {
		http.Error(w, "invalid or expired reset token", http.StatusUnprocessableEntity)
		return
	}

	w.WriteHeader(http.StatusOK)
}

// ResetPassword accepts token and new password via JSON, hashes it and updates the user's password
func (h *Handler) ResetPassword(w http.ResponseWriter, r *http.Request) {
	var body changePasswordRequest

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

	if err := auth.ValidatePassword(body.NewPassword, auth.ActionRegister); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	tokenRecord, err := validateResetPasswordToken(h.DB, auth.Token(body.Token))
	if err != nil {
		slog.Error("invalid or expired token", slog.String("error", err.Error()))
		http.Error(w, "invalid or expired token", http.StatusBadRequest)
		return
	}

	hash, err := auth.HashPassword(body.NewPassword)
	if err != nil {
		slog.Error("failed to hash password", slog.String("error", err.Error()))
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if err = user.UpdateUserPassword(h.DB, tokenRecord.UserID, hash); err != nil {
		slog.Error("failed to update user password", slog.String("error", err.Error()))
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if err = DeleteResetPasswordToken(h.DB, tokenRecord.UserID); err != nil {
		slog.Error("failed to delete reset token", slog.String("error", err.Error()))
	}

	w.WriteHeader(http.StatusNoContent)
}
