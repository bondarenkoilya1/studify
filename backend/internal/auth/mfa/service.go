package mfa

import (
	"bytes"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"database/sql"
	"encoding/base64"
	"errors"
	"fmt"
	"image/png"
	"io"
	"studify/internal/auth"
	rc "studify/internal/auth/recovery_codes"

	"github.com/pquerna/otp"
	"github.com/pquerna/otp/totp"
)

var ErrInvalidCode = errors.New("read TOTP code")

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

func validateTOTP(db *sql.DB, userID auth.UserID, code string, encryptionKey []byte) error {
	encryptedSecret, err := GetUserTOTPKeyEncryptedByID(db, int64(userID))
	if err != nil {
		return fmt.Errorf("get user TOTP key: %w", err)
	}

	decryptedSecret, err := DecryptTOTPKey(encryptedSecret, encryptionKey)
	if err != nil {
		return fmt.Errorf("decrypt user TOTP key: %w", err)
	}

	valid := totp.Validate(code, decryptedSecret)
	if !valid {
		return ErrInvalidCode
	}

	return nil
}

func enableTOTP(db *sql.DB, userID auth.UserID) ([]string, error) {
	if err := UpdateUserTOTPStatus(db, int64(userID), true); err != nil {
		return nil, fmt.Errorf("enable user is_totp_enabled status: %w", err)
	}

	codes, err := rc.Generate()
	if err != nil {
		return nil, fmt.Errorf("generate recovery codes: %w", err)
	}

	if err = rc.SaveRecoveryCodes(db, int64(userID), codes); err != nil {
		return nil, fmt.Errorf("save recovery codes: %w", err)
	}

	return codes, nil
}
