package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
)

type Token string

func GenerateAuthToken() (Token, error) {
	bytes := make([]byte, 32)

	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}

	return Token(base64.RawURLEncoding.EncodeToString(bytes)), nil
}

func HashAuthToken(token Token) []byte {
	sum := sha256.Sum256([]byte(token))
	return sum[:]
}
