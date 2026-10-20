package mfa

import (
	"studify/internal/user"
)

type Handler struct {
	UserService *user.Service
	Service     *Service
}

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
