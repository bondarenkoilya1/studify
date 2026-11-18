package resetpassword

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"studify/internal/auth/token"
	"studify/internal/user"
	"studify/internal/util"
)

func (h *Handler) RequestPasswordReset(w http.ResponseWriter, r *http.Request) {
	body := email{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		slog.ErrorContext(r.Context(), "failed to decode request body",
			util.AttrError(err),
		)
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if err := h.ResetPasswordService.requestPasswordReset(body.Email); err != nil {
		switch {
		case errors.Is(err, ErrEmailRequired):
			http.Error(w, err.Error(), http.StatusBadRequest)
		case errors.Is(err, user.ErrUserNotFound):
			// Клиенту не раскрываем, что такого email нет
			slog.InfoContext(r.Context(), "password reset requested for unknown email")
			w.WriteHeader(http.StatusNoContent)
		default:
			slog.ErrorContext(r.Context(), "failed to request password reset",
				util.AttrError(err),
			)
			http.Error(w, "internal server error", http.StatusInternalServerError)
		}
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) VerifyResetPasswordToken(w http.ResponseWriter, r *http.Request) {
	body := tokenResponse{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		slog.ErrorContext(r.Context(), "failed to decode request body",
			util.AttrError(err),
		)
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	err := h.ResetPasswordService.verifyResetPasswordToken(context.TODO(), token.Token(body.Token))
	if err != nil {
		switch {
		case errors.Is(err, ErrMissingToken):
			http.Error(w, "missing token", http.StatusBadRequest)
		case errors.Is(err, ErrInvalidResetToken):
			slog.WarnContext(r.Context(), "reset token validation failed",
				util.AttrError(err),
			)
			http.Error(w, "invalid or expired reset token", http.StatusUnprocessableEntity)
		default:
			slog.ErrorContext(r.Context(), "failed to verify reset token",
				util.AttrError(err),
			)
			http.Error(w, "internal server error", http.StatusInternalServerError)
		}
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (h *Handler) ResetPassword(w http.ResponseWriter, r *http.Request) {
	var body changePasswordRequest

	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		slog.ErrorContext(r.Context(), "failed to decode request body",
			util.AttrError(err),
		)
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	err := h.ResetPasswordService.resetPassword(
		r.Context(),
		token.Token(body.Token),
		body.NewPassword,
		body.NewPasswordConfirmed,
	)
	if err != nil {
		switch {
		case errors.Is(err, ErrMissingToken),
			errors.Is(err, ErrPasswordsMismatch),
			errors.Is(err, ErrInvalidPassword):
			http.Error(w, err.Error(), http.StatusBadRequest)
		case errors.Is(err, ErrInvalidResetToken):
			slog.WarnContext(r.Context(), "reset token rejected",
				util.AttrError(err),
			)
			http.Error(w, "invalid or expired reset token", http.StatusUnprocessableEntity)
		default:
			slog.ErrorContext(r.Context(), "failed to reset password",
				util.AttrError(err),
			)
			http.Error(w, "internal server error", http.StatusInternalServerError)
		}
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
