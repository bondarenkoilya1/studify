package services

import (
	"crypto/rand"
	"crypto/sha256"
	"database/sql"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"studify/internal/config"
	"studify/internal/database/tokens"
	"studify/internal/mail"
	"studify/internal/models"
	"time"
)

type EmailService struct {
	DB     *sql.DB
	Mailer *mail.Mailer
	Config *config.Config
}

var ErrTokenExpired = errors.New("confirmation token has expired")

// CreateConfirmationToken generates a confirmation token, stores its hash in the database,
// and returns the confirmation token.
func CreateConfirmationToken(db *sql.DB, userID models.UserID) (string, error) {
	tokenBytes := make([]byte, 32)
	_, err := rand.Read(tokenBytes)
	if err != nil {
		return "", err
	}

	token := base64.RawURLEncoding.EncodeToString(tokenBytes)

	tokenHash := sha256.Sum256([]byte(token))
	hashString := hex.EncodeToString(tokenHash[:])
	expiresAt := time.Now().Add(4 * time.Hour)

	if err := tokens.InsertConfirmationToken(db, int64(userID), hashString, expiresAt); err != nil {
		return "", err
	}

	return token, nil
}

func ValidateConfirmationToken(
	db *sql.DB,
	token string,
) error {
	tokenHash := sha256.Sum256([]byte(token))

	confirmationToken, err := tokens.GetConfirmationTokenByHash(
		db,
		hex.EncodeToString(tokenHash[:]),
	)
	if err != nil {
		return err
	}

	if time.Now().After(confirmationToken.ExpiresAt) {
		return ErrTokenExpired
	}

	return nil
}

func (e *EmailService) SendConfirmationEmail(email string, userID models.UserID) error {
	token, err := CreateConfirmationToken(e.DB, userID)
	if err != nil {
		return fmt.Errorf("create confirmation link: %w", err)
	}

	link := fmt.Sprintf(
		"%s/confirm/%s",
		e.Config.AppURL,
		token,
	)

	if err := e.Mailer.SendConfirmationEmail("noreply@studify.com", email, link); err != nil {
		return fmt.Errorf("send confirmation email: %w", err)
	}

	return nil
}
