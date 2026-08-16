package reset_password

import (
	"database/sql"
	"fmt"
	"studify/internal"
	"studify/internal/auth"
	"studify/internal/config"
	"time"
)

func createResetPasswordToken(
	db *sql.DB,
	userID internal.UserID,
) (auth.Token, error) {
	token, err := auth.GenerateAuthToken()
	if err != nil {
		return "", fmt.Errorf("generate reset password token: %w", err)
	}

	tokenHash := auth.HashAuthToken(token)

	expiresAt := time.Now().Add(
		config.ResetPasswordTokenTTL,
	)

	if err = InsertResetPasswordToken(
		db,
		int64(userID),
		tokenHash,
		expiresAt,
	); err != nil {
		return "", err
	}

	return token, nil
}

func validateResetPasswordToken(
	db *sql.DB,
	token auth.Token,
) (*Record, error) {
	tokenHash := auth.HashAuthToken(token)

	resetToken, err := GetResetPasswordTokenByHash(db, tokenHash)
	if err != nil {
		return nil, err
	}

	if time.Now().After(resetToken.ExpiresAt) {
		return nil, ErrResetPasswordTokenExpired
	}

	return resetToken, nil
}
