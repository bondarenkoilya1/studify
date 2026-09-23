package token

import (
	"database/sql"
	"fmt"
	"studify/internal"
	"studify/internal/config"
	"time"
)

func CreateConfirmationToken(
	db *sql.DB,
	userID internal.UserID,
) (Token, error) {
	authToken, err := GenerateAuthToken()
	if err != nil {
		return "", fmt.Errorf("generate confirmation token: %w", err)
	}

	tokenHash := HashToken(authToken)

	expiresAt := time.Now().Add(config.ConfirmationTokenTTL)

	if err = InsertConfirmationToken(db, int64(userID), tokenHash, expiresAt); err != nil {
		return "", err
	}

	return authToken, nil
}

func ValidateConfirmationToken(
	db *sql.DB,
	authToken Token,
) (*EmailConfirmationRecord, error) {
	tokenHash := HashToken(authToken)

	confirmationToken, err := GetConfirmationTokenByHash(db, tokenHash)
	if err != nil {
		return nil, err
	}

	if time.Now().After(confirmationToken.ExpiresAt) {
		return nil, ErrEmailConfirmationTokenExpired
	}

	return confirmationToken, nil
}
