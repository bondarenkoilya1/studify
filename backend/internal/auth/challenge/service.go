package challenge

import (
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/hex"
)

type Token string
type TokenHash string

func GenerateChallengeToken() (string, error) {
	bytes := make([]byte, 32)

	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}

	return base64.RawURLEncoding.EncodeToString(bytes), nil
}

func HashChallengeToken(token Token) TokenHash {
	sum := sha256.Sum256([]byte(token))
	return TokenHash(hex.EncodeToString(sum[:]))
}

func CompareChallengeTokenHash(token Token, expectedHash TokenHash) bool {
	tokenHash := HashChallengeToken(token)
	return subtle.ConstantTimeCompare([]byte(tokenHash), []byte(expectedHash)) == 1
}
