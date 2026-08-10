package handlers

import (
	"errors"
	"log"
	"net/http"
	"studify/internal/auth"
	"studify/internal/database"
	"studify/internal/database/tokens"

	"github.com/go-chi/chi/v5"
)

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
