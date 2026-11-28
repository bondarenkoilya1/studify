package emailconfirm

import (
	"errors"
	"log/slog"
	"net/http"
	"studify/internal"
	"studify/internal/auth/token"
	"studify/internal/httpx"
	"studify/internal/user"
	"studify/internal/util"
)

func (h *Handler) ConfirmEmail(w http.ResponseWriter, r *http.Request) {
	body := tokenResponse{}
	if err := httpx.ReadJSON(r.Body, &body); err != nil {
		slog.ErrorContext(r.Context(), "failed to decode request body",
			util.AttrError(err),
		)
		httpx.WriteDecodeError(w, err)
		return
	}

	if err := h.Service.ConfirmEmail(r.Context(), token.Token(body.Token)); err != nil {
		if errors.Is(err, ErrInvalidConfirmationToken) {
			httpx.WriteCodedError(w, http.StatusBadRequest, "invalid_confirmation_token", "invalid confirmation token")
			return
		}

		slog.ErrorContext(r.Context(), "failed to confirm email",
			util.AttrError(err),
		)
		httpx.WriteError(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) ResendConfirmationMail(w http.ResponseWriter, r *http.Request) {
	currentUser, err := h.UserService.CurrentUser(r)
	if err != nil {
		if errors.Is(err, user.ErrUserNotFound) {
			httpx.WriteError(w, "user not found", http.StatusNotFound)
			return
		}

		slog.ErrorContext(r.Context(), "failed to get current user",
			util.AttrError(err),
		)
		httpx.WriteError(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if err := h.Service.SendConfirmationEmail(r.Context(), internal.UserID(currentUser.ID), currentUser.Email); err != nil {
		if errors.Is(err, ErrAlreadyVerified) {
			httpx.WriteCodedError(w, http.StatusConflict, "email_already_verified", "email already verified")
			return
		}
		if errors.Is(err, ErrResendTooSoon) {
			w.Header().Set("Retry-After", "60")
			httpx.WriteError(w, "confirmation email requested too soon", http.StatusTooManyRequests)
			return
		}
		slog.ErrorContext(r.Context(), "failed to queue confirmation email",
			util.AttrError(err),
		)
		httpx.WriteError(w, "internal server error", http.StatusInternalServerError)
		return

	}

	w.WriteHeader(http.StatusNoContent)
}
