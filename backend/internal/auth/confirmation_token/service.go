package ct

import (
	"crypto/rand"
	"crypto/sha256"
	"database/sql"
	"encoding/base64"
	"encoding/hex"
	"studify/internal/auth"
	"studify/internal/config"
	"time"
)

// createConfirmationToken generates a confirmation token, stores its hash in the database,
// and returns the confirmation token.
func createConfirmationToken(db *sql.DB, userID auth.UserID) (string, error) {
	tokenBytes := make([]byte, 32)
	_, err := rand.Read(tokenBytes)
	if err != nil {
		return "", err
	}

	token := base64.RawURLEncoding.EncodeToString(tokenBytes)

	tokenHash := sha256.Sum256([]byte(token))
	hashString := hex.EncodeToString(tokenHash[:])
	expiresAt := time.Now().Add(config.ConfirmationTokenTTL)

	if err = insertConfirmationToken(db, int64(userID), hashString, expiresAt); err != nil {
		return "", err
	}

	return token, nil
}

// ValidateConfirmationToken does not return the token itself,
// but we can have UserID, TokenHash, ExpiresAt and CreatedAt —
// everything from the type ConfirmationTokenRecord
func validateConfirmationToken(
	db *sql.DB,
	token string,
) (*record, error) {
	tokenHash := sha256.Sum256([]byte(token))

	confirmationToken, err := getConfirmationTokenByHash(
		db,
		hex.EncodeToString(tokenHash[:]),
	)
	if err != nil {
		return nil, err
	}

	if time.Now().After(confirmationToken.ExpiresAt) {
		return nil, auth.ErrConfirmationTokenExpired
	}

	return confirmationToken, nil
}
