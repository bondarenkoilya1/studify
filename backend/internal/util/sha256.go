package util

import (
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
)

func HashSHA256(value string) string {
	sum := sha256.Sum256([]byte(value))
	return hex.EncodeToString(sum[:])
}

func CompareHashSHA256(value string, expectedHash string) bool {
	hash := HashSHA256(value)

	return subtle.ConstantTimeCompare([]byte(hash), []byte(expectedHash)) == 1
}
