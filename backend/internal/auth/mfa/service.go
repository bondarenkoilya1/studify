package mfa

import (
	"bytes"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"image/png"
	"io"

	"github.com/pquerna/otp"
	"github.com/pquerna/otp/totp"
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

func EncryptTOTPKey(secret string, key []byte) (string, error) {
	block, err := aes.NewCipher(key)
	if err != nil {
		return "", fmt.Errorf("generate aes cipher: %w", err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("generate gcm: %w", err)
	}

	nonce := make([]byte, gcm.NonceSize())

	if _, err = io.ReadFull(rand.Reader, nonce); err != nil {
		return "", fmt.Errorf("generate nonce: %w", err)
	}

	cipherText := gcm.Seal(
		nil,
		nonce,
		[]byte(secret),
		nil,
	)

	result := append(nonce, cipherText...)
	return base64.StdEncoding.EncodeToString(result), nil
}

func DecryptTOTPKey(encrypted string, key []byte) (string, error) {
	data, err := base64.StdEncoding.DecodeString(encrypted)
	if err != nil {
		return "", fmt.Errorf("decode encrypted secret: %w", err)
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return "", fmt.Errorf("create AES cipher: %w", err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("create GCM: %w", err)
	}

	nonceSize := gcm.NonceSize()
	if len(data) < nonceSize {
		return "", fmt.Errorf("encrypted secret is too short")
	}

	nonce := data[:nonceSize]
	ciphertext := data[nonceSize:]

	secret, err := gcm.Open(
		nil,
		nonce,
		ciphertext,
		nil,
	)

	if err != nil {
		return "", fmt.Errorf("decrypt TOTP secret: %w", err)
	}

	return string(secret), nil
}
