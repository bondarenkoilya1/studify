package mfa

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"studify/internal"
)

func (h *Handler) GenerateTOTP(w http.ResponseWriter, r *http.Request) {
	currentUser, err := h.UserService.CurrentUser(r, h.DB)
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}
		slog.Error("failed to get current user", slog.String("error", err.Error()))
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	key, err := GenerateTOTPKey(currentUser.Email, h.Config.AppName)
	if err != nil {
		slog.Error("failed to generate TOTP key", slog.String("error", err.Error()))
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	qr, err := GenerateTOTPQRCode(key)
	if err != nil {
		slog.Error("failed to generate TOTP QR-code", slog.String("error", err.Error()))
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	secret := key.Secret() // For sending to the user so he can manually input this to auth app
	response := TOTPResponse{
		QRCode:  base64.StdEncoding.EncodeToString(qr),
		TextKey: secret,
	}

	encryptedSecret, err := EncryptTOTPKey(secret, h.Config.TOTPEncryptionKey) // For sending to the DB to be more secure
	if err != nil {
		slog.Error("failed to encrypt TOTP key", slog.String("error", err.Error()))
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if err = UpdateUserTOTPSecret(h.DB, currentUser.ID, encryptedSecret); err != nil {
		slog.Error("failed to set totp secret at users table", slog.String("error", err.Error()))
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err = json.NewEncoder(w).Encode(response); err != nil {
		slog.Error("failed to encode response", slog.String("error", err.Error()))
		return
	}
}

func (h *Handler) ConfirmTOTPSetup(w http.ResponseWriter, r *http.Request) {
	currentUser, err := h.UserService.CurrentUser(r, h.DB)
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

	if err = validateTOTP(h.DB, internal.UserID(currentUser.ID), body.Passcode, h.Config.TOTPEncryptionKey); err != nil {
		if errors.Is(err, ErrInvalidCode) {
			slog.Error("failed to validate TOTP", slog.String("error", err.Error()))
			http.Error(w, "Invalid TOTP Passcode", http.StatusBadRequest)
			return
		}

		slog.Error("failed to validate TOTP", slog.String("error", err.Error()))
		http.Error(w, "Invalid TOTP Passcode", http.StatusBadRequest)
		return
	}

	codes, err := enableTOTP(h.DB, internal.UserID(currentUser.ID))
	if err != nil {
		slog.Error("failed to enable TOTP", slog.String("error", err.Error()))
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	response := RecoveryCodesResponse{Codes: codes}

	w.Header().Set("Content-Type", "application/json")
	if err = json.NewEncoder(w).Encode(response); err != nil {
		slog.Error("failed to encode response", slog.String("error", err.Error()))
		return
	}
}

func (h *Handler) VerifyTOTP(w http.ResponseWriter, r *http.Request) {
	currentUser, err := h.UserService.CurrentUser(r, h.DB)
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

	if err = validateTOTP(h.DB, internal.UserID(currentUser.ID), body.Passcode, h.Config.TOTPEncryptionKey); err != nil {
		if errors.Is(err, ErrInvalidCode) {
			slog.Error("failed to validate TOTP", slog.String("error", err.Error()))
			http.Error(w, "Invalid TOTP Passcode", http.StatusBadRequest)
			return
		}

		slog.Error("failed to validate TOTP", slog.String("error", err.Error()))
		http.Error(w, "Invalid TOTP Passcode", http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) DisableTOTP(w http.ResponseWriter, r *http.Request) {
	currentUser, err := h.UserService.CurrentUser(r, h.DB)
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}
		slog.Error("failed to get current user", slog.String("error", err.Error()))
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if err = DisableUserTOTP(h.DB, currentUser.ID); err != nil {
		slog.Error("failed to disable user TOTP", slog.String("error", err.Error()))
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
