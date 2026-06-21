package utils

import (
	"crypto/rand"
	"encoding/base64"
)

type AuthService struct {
	accessSecret  string
	refreshSecret string
	issuer        string
	secureCookies bool
}

func NewAuthService(accessSecret, refreshSecret, issuer string, secureCookies bool) *AuthService {
	return &AuthService{
		accessSecret:  accessSecret,
		refreshSecret: refreshSecret,
		issuer:        issuer,
		secureCookies: secureCookies,
	}
}

func GenerateTokenID() (string, error) {
	bytes := make([]byte, 32)

	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}

	return base64.RawURLEncoding.EncodeToString(bytes), nil
}
