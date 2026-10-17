package mfa

import (
	"bytes"
	"context"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"database/sql"
	"encoding/base64"
	"errors"
	"fmt"
	"image/png"
	"io"
	"studify/internal"
	rc "studify/internal/auth/recovery_codes"
	"studify/internal/config"

	"github.com/pquerna/otp"
	"github.com/pquerna/otp/totp"
)

var ErrInvalidCode = errors.New("read TOTP code")

type Service struct {
	db  *sql.DB
	cfg *config.Config
}

func NewService(db *sql.DB, cfg *config.Config) *Service {
	return &Service{db: db, cfg: cfg}
}

// generateTOTP creates a new TOTP secret for the user, stores it encrypted
// and returns a QR code and a text key for the authenticator app.
// MFA is not enabled until the code is confirmed in confirmTOTPSetup.
func (s *Service) generateTOTP(ctx context.Context, email string, userID int64) (*TOTPResponse, error) {
	key, err := s.generateTOTPKey(email, s.cfg.AppName)
	if err != nil {
		return nil, fmt.Errorf("generate totp key: %w", err)
	}

	qr, err := s.generateTOTPQRCode(key)
	if err != nil {
		return nil, fmt.Errorf("generate totp qr code: %w", err)
	}

	secret := key.Secret() // отдаём пользователю, чтобы он мог ввести его вручную

	encryptedSecret, err := s.encryptTOTPKey(secret, s.cfg.TOTPEncryptionKey)
	if err != nil {
		return nil, fmt.Errorf("encrypt totp key: %w", err)
	}

	if err = UpdateUserTOTPSecret(ctx, s.db, userID, encryptedSecret); err != nil {
		return nil, fmt.Errorf("save totp secret for user %d: %w", userID, err)
	}

	return &TOTPResponse{
		QRCode:  base64.StdEncoding.EncodeToString(qr),
		TextKey: secret,
	}, nil
}

// confirmTOTPSetup checks the code from the authenticator app, enables MFA
// and returns recovery codes. Returns ErrInvalidCode if the code is wrong.
func (s *Service) confirmTOTPSetup(ctx context.Context, userID internal.UserID, code string) (*RecoveryCodesResponse, error) {
	if err := s.validateTOTP(ctx, userID, code, s.cfg.TOTPEncryptionKey); err != nil {
		return nil, fmt.Errorf("validate totp code: %w", err)
	}

	codes, err := s.enableTOTP(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("enable totp: %w", err)
	}

	return &RecoveryCodesResponse{Codes: codes}, nil
}

// verifyTOTP checks the TOTP code of the user.
// Returns ErrInvalidCode if the code is wrong.
func (s *Service) verifyTOTP(ctx context.Context, userID internal.UserID, code string) error {
	if err := s.validateTOTP(ctx, userID, code, s.cfg.TOTPEncryptionKey); err != nil {
		return fmt.Errorf("validate totp code: %w", err)
	}

	return nil
}

// disableTOTP turns off TOTP for the user.
func (s *Service) disableTOTP(ctx context.Context, userID internal.UserID) error {
	if err := DisableUserTOTP(ctx, s.db, int64(userID)); err != nil {
		return fmt.Errorf("disable totp for user %d: %w", userID, err)
	}

	return nil
}

func (s *Service) validateTOTP(ctx context.Context, userID internal.UserID, code string, encryptionKey []byte) error {
	encryptedSecret, err := GetUserTOTPKeyEncryptedByID(ctx, s.db, int64(userID))
	if err != nil {
		return fmt.Errorf("get user TOTP key: %w", err)
	}

	secret, err := DecryptTOTPKey(encryptedSecret, encryptionKey)
	if err != nil {
		return fmt.Errorf("decrypt user TOTP key: %w", err)
	}
	if !totp.Validate(code, secret) {
		return ErrInvalidCode
	}

	return nil
}

func (s *Service) enableTOTP(ctx context.Context, userID internal.UserID) ([]string, error) {
	if err := UpdateUserTOTPStatus(ctx, s.db, int64(userID), true); err != nil {
		return nil, fmt.Errorf("enable user TOTP status: %w", err)
	}

	codes, err := rc.Generate()
	if err != nil {
		return nil, fmt.Errorf("generate recovery codes: %w", err)
	}
	if err := rc.SaveRecoveryCodes(s.db, int64(userID), codes); err != nil {
		return nil, fmt.Errorf("save recovery codes: %w", err)
	}

	return codes, nil
}

func (s *Service) generateTOTPKey(email, issuer string) (*otp.Key, error) {
	key, err := totp.Generate(totp.GenerateOpts{Issuer: issuer, AccountName: email})
	if err != nil {
		return nil, ErrFailedToGenerate
	}
	return key, nil
}

func (s *Service) generateTOTPQRCode(key *otp.Key) ([]byte, error) {
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

func (s *Service) encryptTOTPKey(secret string, key []byte) (string, error) {
	block, err := aes.NewCipher(key)
	if err != nil {
		return "", fmt.Errorf("create AES cipher: %w", err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("create GCM: %w", err)
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", fmt.Errorf("generate nonce: %w", err)
	}

	ciphertext := gcm.Seal(nil, nonce, []byte(secret), nil)
	return base64.StdEncoding.EncodeToString(append(nonce, ciphertext...)), nil
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

	if len(data) < gcm.NonceSize() {
		return "", errors.New("encrypted secret is too short")
	}

	secret, err := gcm.Open(nil, data[:gcm.NonceSize()], data[gcm.NonceSize():], nil)
	if err != nil {
		return "", fmt.Errorf("decrypt TOTP secret: %w", err)
	}

	return string(secret), nil
}
