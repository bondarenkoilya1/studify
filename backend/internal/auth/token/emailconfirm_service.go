package token

import (
	"database/sql"
	"errors"
	"fmt"
	"studify/internal"
	"studify/internal/config"
	"studify/internal/util"
	"time"
)

var ErrResendTooSoon = errors.New("too soon to resend the confirmation email")

func CreateConfirmationToken(db *sql.DB, userID int64) (Token, error) {
	oldToken, err := GetConfirmationTokenByUserID(db, userID)
	switch {
	case err == nil:
		// Старый токен есть: проверяем лимит и удаляем его.
		if time.Since(oldToken.CreatedAt) < time.Minute {
			return "", ErrResendTooSoon
		}
		if err := DeleteConfirmationToken(db, userID); err != nil &&
			!errors.Is(err, ErrEmailConfirmationNotFound) {
			return "", fmt.Errorf("delete old confirmation token: %w", err)
		}
	case errors.Is(err, ErrEmailConfirmationNotFound):
		// Токена нет: это нормальный случай, просто создаём новый.
	default:
		return "", fmt.Errorf("get old confirmation token: %w", err)
	}

	authToken, err := GenerateAuthToken()
	if err != nil {
		return "", fmt.Errorf("generate confirmation token: %w", err)
	}

	tokenHash := util.HashSHA256(string(authToken))
	expiresAt := time.Now().Add(config.ConfirmationTokenTTL)

	if err := InsertConfirmationToken(db, userID, []byte(tokenHash), expiresAt); err != nil {
		return "", err
	}

	return authToken, nil
}

func ValidateConfirmationToken(
	db internal.DBTX,
	authToken Token,
) (*EmailConfirmationRecord, error) {
	tokenHash := util.HashSHA256(string(authToken))

	confirmationToken, err := GetConfirmationTokenByHash(db, []byte(tokenHash))
	if err != nil {
		return nil, err
	}

	if time.Now().After(confirmationToken.ExpiresAt) {
		return nil, ErrEmailConfirmationTokenExpired
	}

	return confirmationToken, nil
}
