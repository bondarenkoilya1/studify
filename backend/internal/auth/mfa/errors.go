package mfa

import "errors"

var (
	ErrFailedToGenerate   = errors.New("failed to generate TOTP key")
	ErrFailedToGenerateQR = errors.New("failed to generate qr code from key")
	ErrFailedToEncodeQR   = errors.New("failed to encode key to QR-code")
	ErrUserNotFound       = errors.New("user not found")
	ErrInvalidCode        = errors.New("read TOTP code")
)
