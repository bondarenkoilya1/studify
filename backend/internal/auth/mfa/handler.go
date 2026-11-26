package mfa

import (
	"errors"
	"log/slog"
	"net/http"
	"studify/internal"
	"studify/internal/httpx"
	"studify/internal/user"
	"studify/internal/util"
)

// GenerateTOTP returns a QR code and a text key for setting up TOTP.
func (h *Handler) GenerateTOTP(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		httpx.WriteError(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	setup, err := h.Service.generateTOTP(r.Context(), userID)
	if err != nil {
		switch {
		case errors.Is(err, ErrAlreadyEnabled):
			httpx.WriteError(w, "TOTP already enabled", http.StatusConflict)
		case errors.Is(err, user.ErrVerifiedEmailRequired):
			httpx.WriteError(w, err.Error(), http.StatusForbidden)
		case errors.Is(err, user.ErrUserNotFound):
			httpx.WriteError(w, "user not found", http.StatusNotFound)
		default:
			slog.ErrorContext(r.Context(), "failed to generate totp",
				util.AttrUserID(userID),
				util.AttrError(err),
			)
			httpx.WriteError(w, "internal server error", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Cache-Control", "no-store")
	util.WriteJSON(w, r, http.StatusOK, setup)
}

// ConfirmTOTPSetup checks the TOTP code, enables MFA and returns recovery codes.
func (h *Handler) ConfirmTOTPSetup(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		httpx.WriteError(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	body := Passcode{}
	if err := httpx.ReadJSON(r.Body, &body); err != nil {
		slog.ErrorContext(r.Context(), "failed to decode request body",
			util.AttrError(err),
		)
		httpx.WriteDecodeError(w, err)
		return
	}

	recoveryCodes, err := h.Service.confirmTOTPSetup(r.Context(), internal.UserID(userID), body.Passcode)
	if err != nil {
		if errors.Is(err, ErrInvalidCode) {
			httpx.WriteError(w, "invalid code", http.StatusBadRequest)
			return
		}
		if errors.Is(err, ErrAlreadyEnabled) {
			httpx.WriteError(w, "TOTP already enabled", http.StatusConflict)
			return
		}
		if errors.Is(err, user.ErrVerifiedEmailRequired) {
			httpx.WriteError(w, err.Error(), http.StatusForbidden)
			return
		}
		if errors.Is(err, user.ErrUserNotFound) {
			httpx.WriteError(w, "user not found", http.StatusNotFound)
			return
		}
		slog.ErrorContext(r.Context(), "failed to confirm totp setup",
			util.AttrUserID(userID),
			util.AttrAnyError(err),
		)
		httpx.WriteError(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Cache-Control", "no-store")
	util.WriteJSON(w, r, http.StatusOK, recoveryCodes)
}

func (h *Handler) RegenerateRecoveryCodes(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		httpx.WriteError(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var body Passcode
	if err := httpx.ReadJSON(r.Body, &body); err != nil {
		httpx.WriteDecodeError(w, err)
		return
	}

	codes, err := h.Service.regenerateRecoveryCodes(r.Context(), userID, body.Passcode)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidCode):
			httpx.WriteError(w, "invalid code", http.StatusBadRequest)
		case errors.Is(err, ErrTOTPDisabled):
			httpx.WriteError(w, "TOTP is disabled", http.StatusConflict)
		case errors.Is(err, user.ErrUserNotFound):
			httpx.WriteError(w, "user not found", http.StatusNotFound)
		default:
			slog.ErrorContext(r.Context(), "failed to regenerate recovery codes",
				util.AttrUserID(userID),
				util.AttrError(err),
			)
			httpx.WriteError(w, "internal server error", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Cache-Control", "no-store")
	util.WriteJSON(w, r, http.StatusOK, codes)
}

// DisableTOTP turns off TOTP for the current user.
func (h *Handler) DisableTOTP(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		httpx.WriteError(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	var request struct {
		CurrentPassword string `json:"current_password"`
	}
	if err := httpx.ReadJSON(r.Body, &request); err != nil {
		httpx.WriteDecodeError(w, err)
		return
	}

	if err := h.Service.disableTOTP(r.Context(), userID, request.CurrentPassword); err != nil {
		switch {
		case errors.Is(err, user.ErrCurrentPasswordRequired):
			httpx.WriteError(w, err.Error(), http.StatusBadRequest)
		case errors.Is(err, user.ErrInvalidCurrentPassword):
			httpx.WriteError(w, err.Error(), http.StatusForbidden)
		case errors.Is(err, user.ErrUserNotFound):
			httpx.WriteError(w, "user not found", http.StatusNotFound)
		default:
			slog.ErrorContext(r.Context(), "failed to disable totp",
				util.AttrUserID(userID),
				util.AttrError(err),
			)
			httpx.WriteError(w, "internal server error", http.StatusInternalServerError)
		}
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
