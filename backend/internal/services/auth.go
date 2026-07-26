package services

import (
	"crypto/rand"
	"crypto/sha256"
	"database/sql"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"studify/internal/database/tokens"
	"studify/internal/models"
	"time"
)

// createConfirmationToken generates a confirmation token, stores its hash in the database,
// and returns the confirmation token.
func createConfirmationToken(tx *sql.Tx, userID models.UserID) (string, error) {
	tokenBytes := make([]byte, 32)
	_, err := rand.Read(tokenBytes)
	if err != nil {
		return "", err
	}

	token := base64.RawURLEncoding.EncodeToString(tokenBytes)

	tokenHash := sha256.Sum256([]byte(token))
	hashString := hex.EncodeToString(tokenHash[:])
	expiresAt := time.Now().Add(4 * time.Hour)

	if err := tokens.InsertConfirmationTokenTx(tx, int64(userID), hashString, expiresAt); err != nil {
		return "", err
	}

	return token, nil
}

func validateConfirmationToken(
	tx *sql.Tx,
	token string,
) (*models.ConfirmationTokenRecord, error) {
	tokenHash := sha256.Sum256([]byte(token))

	confirmationToken, err := tokens.GetConfirmationTokenByHashTx(
		tx,
		hex.EncodeToString(tokenHash[:]),
	)
	if err != nil {
		return nil, err
	}

	if time.Now().After(confirmationToken.ExpiresAt) {
		return nil, errors.New("confirmation token has expired")
	}

	return confirmationToken, nil
}
