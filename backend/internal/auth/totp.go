package auth

import (
	"bytes"
	"errors"
	"image/png"

	"github.com/pquerna/otp"
	"github.com/pquerna/otp/totp"
)

var (
	ErrFailedToGenerate   = errors.New("failed to generate TOTP key")
	ErrFailedToGenerateQR = errors.New("failed to generate qr code from key")
	ErrFailedToEncodeQR   = errors.New("failed to encode key to QR-code")
)

func GenerateTOTPKey(email, issuer string) (*otp.Key, error) {
	key, err := totp.Generate(totp.GenerateOpts{
		Issuer:      issuer,
		AccountName: email,
	})
	if err != nil {
		return nil, ErrFailedToGenerate
	}

	return key, nil
}

func GenerateTOTPQRCode(key *otp.Key) ([]byte, error) {
	var buf bytes.Buffer
	img, err := key.Image(200, 200)
	if err != nil {
		return nil, ErrFailedToGenerateQR
	}

	if err := png.Encode(&buf, img); err != nil {
		return nil, ErrFailedToEncodeQR
	}

	return buf.Bytes(), nil
}
