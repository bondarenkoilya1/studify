package mfa

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"studify/internal"
	"studify/internal/util"
)

// GenerateTOTP returns a QR code and a text key for setting up TOTP.
func (h *Handler) GenerateTOTP(w http.ResponseWriter, r *http.Request) {
	currentUser, err := h.UserService.CurrentUser(r)
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}
		slog.ErrorContext(r.Context(), "failed to get current user",
			util.AttrAnyError(err),
		)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	setup, err := h.Service.generateTOTP(r.Context(), currentUser.Email, currentUser.ID)
	if err != nil {
		slog.ErrorContext(r.Context(), "failed to generate totp",
			util.AttrUserID(currentUser.ID),
			util.AttrAnyError(err),
		)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err = json.NewEncoder(w).Encode(setup); err != nil {
		slog.ErrorContext(r.Context(), "failed to encode totp setup",
			util.AttrUserID(currentUser.ID),
			util.AttrAnyError(err),
		)
	}
}

// ConfirmTOTPSetup checks the TOTP code, enables MFA and returns recovery codes.
func (h *Handler) ConfirmTOTPSetup(w http.ResponseWriter, r *http.Request) {
	currentUser, err := h.UserService.CurrentUser(r)
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}
		slog.ErrorContext(r.Context(), "failed to get current user",
			util.AttrError(err),
		)
		http.Error(w, "internal server error", http.StatusInternalServerError)
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

	recoveryCodes, err := h.Service.confirmTOTPSetup(r.Context(), internal.UserID(currentUser.ID), body.Passcode)
	if err != nil {
		if errors.Is(err, ErrInvalidCode) {
			http.Error(w, "invalid code", http.StatusBadRequest)
			return
		}
		slog.ErrorContext(r.Context(), "failed to confirm totp setup",
			util.AttrUserID(int64(currentUser.ID)),
			util.AttrAnyError(err),
		)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err = json.NewEncoder(w).Encode(recoveryCodes); err != nil {
		slog.ErrorContext(r.Context(), "failed to encode recovery codes",
			util.AttrUserID(int64(currentUser.ID)),
			util.AttrAnyError(err),
		)
	}
}

func (h *Handler) VerifyTOTP(w http.ResponseWriter, r *http.Request) {
	currentUser, err := h.UserService.CurrentUser(r)
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}
		slog.ErrorContext(r.Context(), "failed to get current user",
			util.AttrError(err),
		)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	body := Passcode{}
	if err = json.NewDecoder(r.Body).Decode(&body); err != nil {
		slog.ErrorContext(r.Context(), "failed to decode request body",
			util.AttrError(err),
		)
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if err = h.Service.verifyTOTP(r.Context(), internal.UserID(currentUser.ID), body.Passcode); err != nil {
		if errors.Is(err, ErrInvalidCode) {
			http.Error(w, "invalid code", http.StatusBadRequest)
			return
		}
		slog.ErrorContext(r.Context(), "failed to verify totp",
			util.AttrUserID(currentUser.ID),
			util.AttrAnyError(err),
		)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// DisableTOTP turns off TOTP for the current user.
func (h *Handler) DisableTOTP(w http.ResponseWriter, r *http.Request) {
	currentUser, err := h.UserService.CurrentUser(r)
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}
		slog.ErrorContext(r.Context(), "failed to get current user",
			util.AttrAnyError(err),
		)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if err = h.Service.disableTOTP(r.Context(), internal.UserID(currentUser.ID)); err != nil {
		slog.ErrorContext(r.Context(), "failed to disable totp",
			util.AttrUserID(currentUser.ID),
			util.AttrAnyError(err),
		)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
