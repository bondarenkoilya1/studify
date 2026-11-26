package mfa

import (
	"encoding/json"
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
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	setup, err := h.Service.generateTOTP(r.Context(), userID)
	if err != nil {
		switch {
		case errors.Is(err, ErrAlreadyEnabled):
			http.Error(w, "TOTP already enabled", http.StatusConflict)
		case errors.Is(err, user.ErrVerifiedEmailRequired):
			http.Error(w, err.Error(), http.StatusForbidden)
		case errors.Is(err, user.ErrUserNotFound):
			http.Error(w, "user not found", http.StatusNotFound)
		default:
			slog.ErrorContext(r.Context(), "failed to generate totp",
				util.AttrUserID(userID),
				util.AttrError(err),
			)
			http.Error(w, "internal server error", http.StatusInternalServerError)
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
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	body := Passcode{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		slog.ErrorContext(r.Context(), "failed to decode request body",
			util.AttrError(err),
		)
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	recoveryCodes, err := h.Service.confirmTOTPSetup(r.Context(), internal.UserID(userID), body.Passcode)
	if err != nil {
		if errors.Is(err, ErrInvalidCode) {
			http.Error(w, "invalid code", http.StatusBadRequest)
			return
		}
		if errors.Is(err, ErrAlreadyEnabled) {
			http.Error(w, "TOTP already enabled", http.StatusConflict)
			return
		}
		if errors.Is(err, user.ErrVerifiedEmailRequired) {
			http.Error(w, err.Error(), http.StatusForbidden)
			return
		}
		if errors.Is(err, user.ErrUserNotFound) {
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}
		slog.ErrorContext(r.Context(), "failed to confirm totp setup",
			util.AttrUserID(userID),
			util.AttrAnyError(err),
		)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Cache-Control", "no-store")
	util.WriteJSON(w, r, http.StatusOK, recoveryCodes)
}

func (h *Handler) RegenerateRecoveryCodes(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var body Passcode
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "invalid JSON", http.StatusBadRequest)
		return
	}

	codes, err := h.Service.regenerateRecoveryCodes(r.Context(), userID, body.Passcode)
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidCode):
			http.Error(w, "invalid code", http.StatusBadRequest)
		case errors.Is(err, ErrTOTPDisabled):
			http.Error(w, "TOTP is disabled", http.StatusConflict)
		case errors.Is(err, user.ErrUserNotFound):
			http.Error(w, "user not found", http.StatusNotFound)
		default:
			slog.ErrorContext(r.Context(), "failed to regenerate recovery codes",
				util.AttrUserID(userID),
				util.AttrError(err),
			)
			http.Error(w, "internal server error", http.StatusInternalServerError)
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
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	var request struct {
		CurrentPassword string `json:"current_password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "invalid JSON", http.StatusBadRequest)
		return
	}

	if err := h.Service.disableTOTP(r.Context(), userID, request.CurrentPassword); err != nil {
		switch {
		case errors.Is(err, user.ErrCurrentPasswordRequired):
			http.Error(w, err.Error(), http.StatusBadRequest)
		case errors.Is(err, user.ErrInvalidCurrentPassword):
			http.Error(w, err.Error(), http.StatusForbidden)
		case errors.Is(err, user.ErrUserNotFound):
			http.Error(w, "user not found", http.StatusNotFound)
		default:
			slog.ErrorContext(r.Context(), "failed to disable totp",
				util.AttrUserID(userID),
				util.AttrError(err),
			)
			http.Error(w, "internal server error", http.StatusInternalServerError)
		}
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
