package reset_password

import (
	"encoding/json"
	"errors"
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

func (h *Handler) SendResetPasswordEmail(w http.ResponseWriter, r *http.Request) {
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

func (h *Handler) ResetPassword(w http.ResponseWriter, r *http.Request) {
	token := chi.URLParam(r, "token")
	if token == "" {
		log.Printf("failed to get token from url params")
		http.Error(w, "missing token", http.StatusBadRequest)
		return
	}

	tokenRecord, err := validateResetPasswordToken(h.DB, auth.Token(token))
	if err != nil {
		log.Printf("failed to validate reset password token: %v", err)
		http.Error(w, "invalid reset password token", http.StatusBadRequest)
		return
	}

	newPass := "qwerty00"
	hash, err := auth.HashPassword(newPass)
	if err != nil {
		log.Printf("failed to hash new password: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if err = user.UpdateUserPassword(h.DB, tokenRecord.UserID, hash); err != nil {
		log.Printf("failed to update user password: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if err = DeleteResetPasswordToken(h.DB, tokenRecord.UserID); err != nil {
		log.Printf("failed to delete password reset token from db: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	currentUser, err := user.GetUserByID(h.DB, tokenRecord.UserID)
	if err != nil {
		if errors.Is(err, user.ErrUserNotFound) {
			log.Printf("user not found: %v", err)
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}

		log.Printf("get user by ID: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if err = h.Mailer.SendNewPasswordEmail("noreply@studify.com", currentUser.Email, newPass); err != nil {
		log.Printf("failed to send new password email: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
