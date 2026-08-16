package emailconfirm

import (
	"database/sql"
	"fmt"
	"studify/internal"
	"studify/internal/auth"
	"studify/internal/config"
	"time"
)

func CreateConfirmationToken(
	db *sql.DB,
	userID internal.UserID,
) (auth.Token, error) {
	token, err := auth.GenerateAuthToken()
	if err != nil {
		return "", fmt.Errorf("generate confirmation token: %w", err)
	}

	tokenHash := auth.HashAuthToken(token)

	expiresAt := time.Now().Add(config.ConfirmationTokenTTL)

	if err = InsertConfirmationToken(db, int64(userID), tokenHash, expiresAt); err != nil {
		return "", err
	}

	return token, nil
}

func ValidateConfirmationToken(
	db *sql.DB,
	token auth.Token,
) (*Record, error) {
	tokenHash := auth.HashAuthToken(token)

	confirmationToken, err := GetConfirmationTokenByHash(db, tokenHash)
	if err != nil {
		return nil, err
	}

	if time.Now().After(confirmationToken.ExpiresAt) {
		return nil, ErrConfirmationTokenExpired
	}

	return confirmationToken, nil
}
