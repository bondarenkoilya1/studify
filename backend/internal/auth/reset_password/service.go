package reset_password

import (
	"crypto/sha256"
	"database/sql"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"studify/internal"
	"studify/internal/config"
	"studify/internal/user"
	"time"
)

import (
	"crypto/rand"
)

var ErrResetPasswordTokenExpired = errors.New(
	"reset password token expired",
)

// createResetPasswordToken generates a password reset token, stores its hash
// in the database, and returns the raw token.
func createResetPasswordToken(db *sql.DB, userID internal.UserID) (string, error) {
	tokenBytes := make([]byte, 32)

	_, err := rand.Read(tokenBytes)
	if err != nil {
		return "", err
	}

	token := base64.RawURLEncoding.EncodeToString(tokenBytes)

	tokenHash := sha256.Sum256([]byte(token))
	hashString := hex.EncodeToString(tokenHash[:])

	expiresAt := time.Now().Add(config.ResetPasswordTokenTTL)

	if err := InsertResetPasswordToken(
		db,
		int64(userID),
		hashString,
		expiresAt,
	); err != nil {
		return "", err
	}

	return token, nil
}

// validateResetPasswordToken validates a password reset token and returns
// the corresponding database record.
func validateResetPasswordToken(
	db *sql.DB,
	token string,
) (*Record, error) {
	tokenHash := sha256.Sum256([]byte(token))

	resetToken, err := GetResetPasswordTokenByHash(
		db,
		hex.EncodeToString(tokenHash[:]),
	)
	if err != nil {
		return nil, err
	}

	if time.Now().After(resetToken.ExpiresAt) {
		return nil, ErrResetPasswordTokenExpired
	}

	return resetToken, nil
}

func (h *Handler) sendConfirmationEmail(email string) error {
	currentUser, err := user.GetUserByEmail(h.DB, email)
	if err != nil {
		return fmt.Errorf("get user by email: %w", err)
	}

	token, err := createResetPasswordToken(h.DB, internal.UserID(currentUser.ID))
	if err != nil {
		return fmt.Errorf("create password reset link: %w", err)
	}

	link := fmt.Sprintf(
		"%s/reset-password/%s",
		h.Config.AppURL,
		token,
	)

	if err := h.Mailer.SendPasswordResetEmail("noreply@studify.com", email, link); err != nil {
		return fmt.Errorf("send password reset email: %w", err)
	}

	return nil
}
