package mfa

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"studify/internal/auth"
	"studify/internal/httpx"
	"studify/internal/user"
)

func (h *Handler) GenerateTOTP(w http.ResponseWriter, r *http.Request) {
	currentUser, err := h.currentUser(r)
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}
		log.Printf("failed to get current user: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	key, err := GenerateTOTPKey(currentUser.Email, h.Config.AppName)
	if err != nil {
		log.Printf("failed to generate TOTP key: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	qr, err := GenerateTOTPQRCode(key)
	if err != nil {
		log.Printf("failed to generate TOTP QR-code: %v", err)
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
		log.Printf("failed to encrypt TOTP key: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if err = UpdateUserTOTPSecret(h.DB, currentUser.ID, encryptedSecret); err != nil {
		log.Printf("failed to set totp secret at users table: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err = json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("failed to encode response")
		return
	}
}

func (h *Handler) ConfirmTOTPSetup(w http.ResponseWriter, r *http.Request) {
	currentUser, err := h.currentUser(r)
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}
		log.Printf("failed to get current user: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	body := Passcode{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		log.Printf("failed to decode request body: %v", err)
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if err = validateTOTP(h.DB, auth.UserID(currentUser.ID), body.Passcode, h.Config.TOTPEncryptionKey); err != nil {
		if errors.Is(err, ErrInvalidCode) {
			log.Printf("failed to validate TOTP: %v", err)
			http.Error(w, "Invalid TOTP Passcode", http.StatusBadRequest)
			return
		}

		log.Printf("failed to validate TOTP: %v", err)
		http.Error(w, "Invalid TOTP Passcode", http.StatusBadRequest)
		return
	}

	codes, err := enableTOTP(h.DB, auth.UserID(currentUser.ID))
	if err != nil {
		log.Printf("failed to enable TOTP: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	response := RecoveryCodesResponse{Codes: codes}

	w.Header().Set("Content-Type", "application/json")
	if err = json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("failed to encode response")
		return
	}
}

func (h *Handler) VerifyTOTP(w http.ResponseWriter, r *http.Request) {
	currentUser, err := h.currentUser(r)
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}
		log.Printf("failed to get current user: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	body := Passcode{}
	if err = json.NewDecoder(r.Body).Decode(&body); err != nil {
		log.Printf("failed to decode request body: %v", err)
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if err = validateTOTP(h.DB, auth.UserID(currentUser.ID), body.Passcode, h.Config.TOTPEncryptionKey); err != nil {
		if errors.Is(err, ErrInvalidCode) {
			log.Printf("failed to validate TOTP: %v", err)
			http.Error(w, "Invalid TOTP Passcode", http.StatusBadRequest)
			return
		}

		log.Printf("failed to validate TOTP: %v", err)
		http.Error(w, "Invalid TOTP Passcode", http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) DisableTOTP(w http.ResponseWriter, r *http.Request) {
	currentUser, err := h.currentUser(r)
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}
		log.Printf("failed to get current user: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if err = DisableUserTOTP(h.DB, currentUser.ID); err != nil {
		log.Printf("failed to disable user TOTP: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// Todo: i place it here to avoid current conflict, but later it will have a single place
func (h *Handler) currentUser(r *http.Request) (*user.User, error) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		return nil, err
	}

	currentUser, err := user.GetUserByID(h.DB, userID)
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("get current user: %w", err)
	}

	return currentUser, nil
}
