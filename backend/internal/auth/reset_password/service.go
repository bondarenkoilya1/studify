package reset_password

import (
	"database/sql"
	"errors"
	"fmt"
	"studify/internal"
	"studify/internal/auth/token"
	"studify/internal/config"
	"time"
)

func createResetPasswordToken(
	db *sql.DB,
	userID internal.UserID,
) (token.Token, error) {
	authToken, err := token.GenerateAuthToken()
	if err != nil {
		return "", fmt.Errorf("generate reset password token: %w", err)
	}

	tokenHash := token.HashAuthToken(authToken)
	expiresAt := time.Now().Add(config.ResetPasswordTokenTTL)

	if err = DeleteResetPasswordToken(db, int64(userID)); err != nil && !errors.Is(err, ErrNotFound) {
		return "", fmt.Errorf("delete previous reset password token: %w", err)
	}

	if err = InsertResetPasswordToken(
		db,
		int64(userID),
		tokenHash,
		expiresAt,
	); err != nil {
		return "", err
	}

	return authToken, nil
}

func validateResetPasswordToken(
	db *sql.DB,
	authToken token.Token,
) (*Record, error) {
	tokenHash := token.HashAuthToken(authToken)

	resetToken, err := GetResetPasswordTokenByHash(db, tokenHash)
	if err != nil {
		return nil, err
	}

	if time.Now().After(resetToken.ExpiresAt) {
		return nil, ErrResetPasswordTokenExpired
	}

	return resetToken, nil
}
