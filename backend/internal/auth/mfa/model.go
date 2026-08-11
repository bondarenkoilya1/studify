package mfa

import (
	"database/sql"
	"errors"
	"studify/internal/auth"
	"studify/internal/config"
)

type Handler struct {
	DB     *sql.DB
	Config *config.Config
	Auth   *auth.Service
}

var (
	ErrFailedToGenerate   = errors.New("failed to generate TOTP key")
	ErrFailedToGenerateQR = errors.New("failed to generate qr code from key")
	ErrFailedToEncodeQR   = errors.New("failed to encode key to QR-code")
	ErrUserNotFound       = errors.New("user not found")
)

type Passcode struct {
	Passcode string `json:"passcode"`
}

type TOTPResponse struct {
	QRCode  string `json:"qr_code"`
	TextKey string `json:"text_key"`
}

type RecoveryCodesResponse struct {
	Codes []string `json:"codes"`
}
