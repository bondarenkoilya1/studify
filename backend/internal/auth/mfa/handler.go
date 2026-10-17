package mfa

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"studify/internal"
)

// GenerateTOTP returns a QR code and a text key for setting up TOTP.
func (h *Handler) GenerateTOTP(w http.ResponseWriter, r *http.Request) {
	currentUser, err := h.UserService.CurrentUser(r)
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}
		slog.Error("failed to get current user", slog.Any("error", err))
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	setup, err := h.MfaService.generateTOTP(r.Context(), currentUser.Email, currentUser.ID)
	if err != nil {
		slog.Error("failed to generate totp",
			slog.Int64("user_id", currentUser.ID),
			slog.Any("error", err),
		)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err = json.NewEncoder(w).Encode(setup); err != nil {
		slog.Error("failed to encode totp setup",
			slog.Int64("user_id", currentUser.ID),
			slog.Any("error", err),
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
		slog.Error("failed to get current user", slog.String("error", err.Error()))
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	body := Passcode{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		slog.Error("failed to decode request body", slog.String("error", err.Error()))
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	recoveryCodes, err := h.MfaService.confirmTOTPSetup(r.Context(), internal.UserID(currentUser.ID), body.Passcode)
	if err != nil {
		if errors.Is(err, ErrInvalidCode) {
			http.Error(w, "invalid code", http.StatusBadRequest)
			return
		}
		slog.Error("failed to confirm totp setup",
			slog.Int64("user_id", int64(currentUser.ID)),
			slog.Any("error", err),
		)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err = json.NewEncoder(w).Encode(recoveryCodes); err != nil {
		slog.Error("failed to encode recovery codes",
			slog.Int64("user_id", int64(currentUser.ID)),
			slog.Any("error", err),
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
		slog.Error("failed to get current user", slog.String("error", err.Error()))
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	body := Passcode{}
	if err = json.NewDecoder(r.Body).Decode(&body); err != nil {
		slog.Error("failed to decode request body", slog.String("error", err.Error()))
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if err = h.MfaService.verifyTOTP(r.Context(), internal.UserID(currentUser.ID), body.Passcode); err != nil {
		if errors.Is(err, ErrInvalidCode) {
			http.Error(w, "invalid code", http.StatusBadRequest)
			return
		}
		slog.Error("failed to verify totp",
			slog.Int64("user_id", currentUser.ID),
			slog.Any("error", err),
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
		slog.Error("failed to get current user", slog.Any("error", err))
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if err = h.MfaService.disableTOTP(r.Context(), internal.UserID(currentUser.ID)); err != nil {
		slog.Error("failed to disable totp",
			slog.Int64("user_id", currentUser.ID),
			slog.Any("error", err),
		)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
