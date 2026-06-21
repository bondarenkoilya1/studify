package utils

import (
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
	"fmt"
	"studify/internal/models"

	"golang.org/x/crypto/bcrypt"
)

func HashPassword(password string) (string, error) {
	hashBytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", fmt.Errorf("failed to hash password: %w", err)
	}

	return string(hashBytes), nil
}

func HashRefreshToken(token models.RefreshToken) models.TokenHash {
	sum := sha256.Sum256([]byte(token))
	return models.TokenHash(hex.EncodeToString(sum[:]))
}

func CompareTokenHash(token models.RefreshToken, expectedHash models.TokenHash) bool {
	tokenHash := HashRefreshToken(token)

	return subtle.ConstantTimeCompare([]byte(tokenHash), []byte(expectedHash)) == 1
}
