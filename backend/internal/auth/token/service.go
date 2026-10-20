package token

import (
	"crypto/rand"
	"encoding/base64"
)

func GenerateAuthToken() (Token, error) {
	bytes := make([]byte, 32)

	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}

	return Token(base64.RawURLEncoding.EncodeToString(bytes)), nil
}
