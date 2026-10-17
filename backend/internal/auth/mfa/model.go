package mfa

import (
	"errors"
	"studify/internal/auth/token"
	"studify/internal/user"
)

type Handler struct {
	Token       *token.Service
	UserService *user.Service
	MfaService  *Service
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
