package emailconfirm

import (
	"database/sql"
	"fmt"
	"studify/internal"
	"studify/internal/auth/token"
	"studify/internal/config"
	"time"
)

func CreateConfirmationToken(
	db *sql.DB,
	userID internal.UserID,
) (token.Token, error) {
	authToken, err := token.GenerateAuthToken()
	if err != nil {
		return "", fmt.Errorf("generate confirmation token: %w", err)
	}

	tokenHash := token.HashAuthToken(authToken)

	expiresAt := time.Now().Add(config.ConfirmationTokenTTL)

	if err = InsertConfirmationToken(db, int64(userID), tokenHash, expiresAt); err != nil {
		return "", err
	}

	return authToken, nil
}

func ValidateConfirmationToken(
	db *sql.DB,
	authToken token.Token,
) (*Record, error) {
	tokenHash := token.HashAuthToken(authToken)

	confirmationToken, err := GetConfirmationTokenByHash(db, tokenHash)
	if err != nil {
		return nil, err
	}

	if time.Now().After(confirmationToken.ExpiresAt) {
		return nil, ErrConfirmationTokenExpired
	}

	return confirmationToken, nil
}
