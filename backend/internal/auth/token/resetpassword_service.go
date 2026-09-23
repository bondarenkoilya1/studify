package token

import (
	"database/sql"
	"errors"
	"fmt"
	"studify/internal"
	"studify/internal/config"
	"time"
)

func CreateResetPasswordToken(
	db *sql.DB,
	userID internal.UserID,
) (Token, error) {
	authToken, err := GenerateAuthToken()
	if err != nil {
		return "", fmt.Errorf("generate reset password token: %w", err)
	}

	tokenHash := HashToken(authToken)
	expiresAt := time.Now().Add(config.ResetPasswordTokenTTL)

	if err = DeleteResetPasswordToken(db, int64(userID)); err != nil && !errors.Is(err, ErrResetPasswordTokenNotFound) {
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

func ValidateResetPasswordToken(
	db *sql.DB,
	authToken Token,
) (*ResetPasswordTokenRecord, error) {
	tokenHash := HashToken(authToken)

	resetToken, err := GetResetPasswordTokenByHash(db, tokenHash)
	if err != nil {
		return nil, err
	}

	if time.Now().After(resetToken.ExpiresAt) {
		return nil, ErrResetPasswordTokenExpired
	}

	return resetToken, nil
}
