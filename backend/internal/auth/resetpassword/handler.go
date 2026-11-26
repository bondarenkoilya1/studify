package resetpassword

import (
	"errors"
	"log/slog"
	"net/http"
	"studify/internal/auth/token"
	"studify/internal/httpx"
	"studify/internal/user"
	"studify/internal/util"
)

func (h *Handler) RequestPasswordReset(w http.ResponseWriter, r *http.Request) {
	body := email{}
	if err := httpx.ReadJSON(r.Body, &body); err != nil {
		slog.ErrorContext(r.Context(), "failed to decode request body",
			util.AttrError(err),
		)
		httpx.WriteDecodeError(w, err)
		return
	}

	if err := h.ResetPasswordService.requestPasswordReset(r.Context(), body.Email); err != nil {
		switch {
		case errors.Is(err, ErrEmailRequired):
			httpx.WriteError(w, err.Error(), http.StatusBadRequest)
		case errors.Is(err, user.ErrUserNotFound):
			// Клиенту не раскрываем, что такого email нет
			slog.InfoContext(r.Context(), "password reset requested for unknown email")
			w.WriteHeader(http.StatusNoContent)
		default:
			slog.ErrorContext(r.Context(), "failed to request password reset",
				util.AttrError(err),
			)
			httpx.WriteError(w, "internal server error", http.StatusInternalServerError)
		}
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) VerifyResetPasswordToken(w http.ResponseWriter, r *http.Request) {
	body := tokenResponse{}
	if err := httpx.ReadJSON(r.Body, &body); err != nil {
		slog.ErrorContext(r.Context(), "failed to decode request body",
			util.AttrError(err),
		)
		httpx.WriteDecodeError(w, err)
		return
	}

	err := h.ResetPasswordService.verifyResetPasswordToken(r.Context(), token.Token(body.Token))
	if err != nil {
		switch {
		case errors.Is(err, ErrMissingToken):
			httpx.WriteError(w, "missing token", http.StatusBadRequest)
		case errors.Is(err, ErrInvalidResetToken):
			slog.WarnContext(r.Context(), "reset token validation failed",
				util.AttrError(err),
			)
			httpx.WriteCodedError(w, http.StatusUnprocessableEntity, "invalid_password_reset_token", "invalid or expired reset token")
		default:
			slog.ErrorContext(r.Context(), "failed to verify reset token",
				util.AttrError(err),
			)
			httpx.WriteError(w, "internal server error", http.StatusInternalServerError)
		}
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (h *Handler) ResetPassword(w http.ResponseWriter, r *http.Request) {
	var body changePasswordRequest

	if err := httpx.ReadJSON(r.Body, &body); err != nil {
		slog.ErrorContext(r.Context(), "failed to decode request body",
			util.AttrError(err),
		)
		httpx.WriteDecodeError(w, err)
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
			httpx.WriteError(w, err.Error(), http.StatusBadRequest)
		case errors.Is(err, ErrInvalidResetToken):
			slog.WarnContext(r.Context(), "reset token rejected",
				util.AttrError(err),
			)
			httpx.WriteCodedError(w, http.StatusUnprocessableEntity, "invalid_password_reset_token", "invalid or expired reset token")
		default:
			slog.ErrorContext(r.Context(), "failed to reset password",
				util.AttrError(err),
			)
			httpx.WriteError(w, "internal server error", http.StatusInternalServerError)
		}
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
