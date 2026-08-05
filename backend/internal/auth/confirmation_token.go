package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"database/sql"
	"encoding/base64"
	"encoding/hex"
	"studify/internal/database/tokens"
	"time"
)

// CreateConfirmationToken generates a confirmation token, stores its hash in the database,
// and returns the confirmation token.
func CreateConfirmationToken(db *sql.DB, userID UserID) (string, error) {
	tokenBytes := make([]byte, 32)
	_, err := rand.Read(tokenBytes)
	if err != nil {
		return "", err
	}

	token := base64.RawURLEncoding.EncodeToString(tokenBytes)

	tokenHash := sha256.Sum256([]byte(token))
	hashString := hex.EncodeToString(tokenHash[:])
	expiresAt := time.Now().Add(4 * time.Hour)

	if err := tokens.InsertConfirmationToken(db, int64(userID), hashString, expiresAt); err != nil {
		return "", err
	}

	return token, nil
}

// ValidateConfirmationToken does not return the token itself,
// but we can have UserID, TokenHash, ExpiresAt and CreatedAt —
// everything from the type ConfirmationTokenRecord
func ValidateConfirmationToken(
	db *sql.DB,
	token string,
) (*tokens.ConfirmationTokenRecord, error) {
	tokenHash := sha256.Sum256([]byte(token))

	confirmationToken, err := tokens.GetConfirmationTokenByHash(
		db,
		hex.EncodeToString(tokenHash[:]),
	)
	if err != nil {
		return nil, err
	}

	if time.Now().After(confirmationToken.ExpiresAt) {
		return nil, ErrConfirmationTokenExpired
	}

	return confirmationToken, nil
}
