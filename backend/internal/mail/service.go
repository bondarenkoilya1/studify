package mail

import (
	"context"
	"crypto/aes"
	"crypto/cipher"
	"crypto/hmac"
	"crypto/sha256"
	"database/sql"
	"encoding/json"
	"fmt"
	"studify/internal"
	"studify/internal/auth/token"
	"studify/internal/config"
	"time"
)

type Service struct {
	db     *sql.DB
	mailer *Mailer
	box    cipher.AEAD
	appURL string
}

type message struct {
	Recipient string
	Subject   string
	Body      string
}

func NewService(db *sql.DB, mailer *Mailer, cfg *config.Config) (*Service, error) {
	// Use a separate, purpose-derived key so outbox and TOTP ciphertext are independent.
	key := hmac.New(sha256.New, cfg.TOTPEncryptionKey)
	_, _ = key.Write([]byte("studify/mail-outbox/v1"))
	block, err := aes.NewCipher(key.Sum(nil))
	if err != nil {
		return nil, fmt.Errorf("initialize mail outbox key: %w", err)
	}
	box, err := cipher.NewGCMWithRandomNonce(block)
	if err != nil {
		return nil, fmt.Errorf("initialize mail outbox encryption: %w", err)
	}
	return &Service{db: db, mailer: mailer, box: box, appURL: cfg.AppURL}, nil
}

func (s *Service) QueueConfirmation(ctx context.Context, tx *sql.Tx, userID int64, email string, t token.Token, hash []byte) error {
	link := fmt.Sprintf("%s/confirm?token=%s", s.appURL, t)
	return s.enqueue(ctx, tx, userID, hash, config.ConfirmationTokenTTL,
		message{Recipient: email, Subject: confirmationSubject, Body: fmt.Sprintf(confirmationBody, link)})
}

func (s *Service) QueuePasswordReset(ctx context.Context, tx *sql.Tx, userID int64, email string, t token.Token, hash []byte) error {
	link := fmt.Sprintf("%s/reset-password?token=%s", s.appURL, t)
	return s.enqueue(ctx, tx, userID, hash, config.ResetPasswordTokenTTL,
		message{Recipient: email, Subject: passwordResetSubject, Body: fmt.Sprintf(passwordResetBody, link)})
}

func (s *Service) QueuePasswordChanged(ctx context.Context, userID int64, email string) error {
	return s.enqueue(ctx, s.db, userID, nil, 24*time.Hour,
		message{Recipient: email, Subject: newPasswordSubject, Body: newPasswordBody})
}

func (s *Service) enqueue(ctx context.Context, db internal.DBTX, userID int64, hash []byte, ttl time.Duration, mail message) error {
	payload, err := s.sealMessage(mail)
	if err != nil {
		return err
	}
	_, err = db.ExecContext(ctx, `
		INSERT INTO mail_outbox (user_id, token_hash, payload, expires_at)
		VALUES ($1, $2, $3, clock_timestamp() + $4 * interval '1 second')
	`, userID, hash, payload, int64(ttl/time.Second))
	if err != nil {
		return fmt.Errorf("enqueue email: %w", err)
	}
	return nil
}

func (s *Service) sealMessage(mail message) ([]byte, error) {
	data, err := json.Marshal(mail)
	if err != nil {
		return nil, fmt.Errorf("encode queued email: %w", err)
	}
	return s.box.Seal(nil, nil, data, nil), nil
}
