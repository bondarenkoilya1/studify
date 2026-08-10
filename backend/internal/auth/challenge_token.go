package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/hex"
)

type ChallengeToken string
type ChallengeTokenHash string

func GenerateChallengeToken() (string, error) {
	bytes := make([]byte, 32)

	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}

	return base64.RawURLEncoding.EncodeToString(bytes), nil
}

func HashChallengeToken(token ChallengeToken) ChallengeTokenHash {
	sum := sha256.Sum256([]byte(token))
	return ChallengeTokenHash(hex.EncodeToString(sum[:]))
}

func CompareChallengeTokenHash(token ChallengeToken, expectedHash ChallengeTokenHash) bool {
	tokenHash := HashChallengeToken(token)
	return subtle.ConstantTimeCompare([]byte(tokenHash), []byte(expectedHash)) == 1
}
