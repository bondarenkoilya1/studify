package emailconfirm

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"studify/internal"
	"studify/internal/auth/token"
	"studify/internal/user"
)

func (h *Handler) ConfirmEmail(w http.ResponseWriter, r *http.Request) {
	body := tokenResponse{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		slog.Error("failed to decode request body", slog.String("error", err.Error()))
		http.Error(w, "invalid JSON", http.StatusBadRequest)
		return
	}

	if err := h.Service.ConfirmEmail(r.Context(), token.Token(body.Token)); err != nil {
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
	currentUser, err := h.UserService.CurrentUser(r)
	if err != nil {
		if errors.Is(err, user.ErrUserNotFound) {
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}

		slog.Error("failed to get current user", slog.String("error", err.Error()))
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if err := h.Service.SendConfirmationEmail(r.Context(), internal.UserID(currentUser.ID), currentUser.Email); err != nil {
		slog.ErrorContext(r.Context(), "failed to send confirmation email",
			slog.String("error", err.Error()),
		)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return

	}

	w.WriteHeader(http.StatusNoContent)
}
