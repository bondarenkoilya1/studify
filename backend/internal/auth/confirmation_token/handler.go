package ct

import (
	"errors"
	"log"
	"net/http"
	"studify/internal/auth"
	"studify/internal/user"

	"github.com/go-chi/chi/v5"
)

func (h *Handler) ConfirmEmail(w http.ResponseWriter, r *http.Request) {
	token := chi.URLParam(r, "token")
	if token == "" {
		log.Printf("failed to get token from url params")
		http.Error(w, "missing token", http.StatusBadRequest)
		return
	}

	tokenRecord, err := validateConfirmationToken(h.DB, token)
	if err != nil {
		log.Printf("failed to validate confirmation token: %v", err)
		http.Error(w, "invalid confirmation token", http.StatusBadRequest)
		return
	}

	if err = user.VerifyUserEmail(h.DB, tokenRecord.UserID); err != nil {
		log.Printf("failed to verify user email: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if err = deleteConfirmationToken(h.DB, tokenRecord.UserID); err != nil {
		log.Printf("failed to delete confirmation token from db: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) ResendConfirmationMail(w http.ResponseWriter, r *http.Request) {
	currentUser, err := user.CurrentUser(r, h.DB)
	if err != nil {
		if errors.Is(err, user.ErrUserNotFound) {
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}

		log.Printf("failed to get current user: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if err = h.EmailService.SendConfirmationEmail(
		currentUser.Email,
		auth.UserID(currentUser.ID),
	); err != nil {
		log.Printf("failed to send confirmation email: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
