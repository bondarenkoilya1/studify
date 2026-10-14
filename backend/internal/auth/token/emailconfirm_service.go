package token

import (
	"database/sql"
	"fmt"
	"log/slog"
	"studify/internal"
	"studify/internal/config"
	"time"
)

func CreateConfirmationToken(
	db *sql.DB,
	userID int64,
) (Token, error) {
	authToken, err := GenerateAuthToken()
	if err != nil {
		return "", fmt.Errorf("generate confirmation token: %w", err)
	}

	tokenHash := HashToken(authToken)

	expiresAt := time.Now().Add(config.ConfirmationTokenTTL)

	/* todo: check if exists
	1. Check if some token already exists
	2. Make delete operation only if the old token was found
	3. If couldn't delete the old token

	*/
	oldToken, err := GetConfirmationTokenByUserID(db, userID)
	if err != nil {
		slog.Error("token was not found", slog.Int64("user_id", userID))
	}

	if time.Since(oldToken.CreatedAt) < time.Minute {
		slog.Error("token resend limit didn't pass yes", slog.Int64("user_id", userID))
		return "", fmt.Errorf("too soon to resend the confirmation email")
	}

	if err := DeleteConfirmationToken(db, userID); err != nil {
		slog.Error("failed to delete old confirmation token", slog.String("error", err.Error()), slog.Int64("user_id", userID))
	}

	if err = InsertConfirmationToken(db, userID, tokenHash, expiresAt); err != nil {
		return "", err
	}

	return authToken, nil
}

func ValidateConfirmationToken(
	db internal.DBTX,
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
