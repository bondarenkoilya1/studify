package utils

import (
	"fmt"
	"os"
	"strconv"
	"studify/internal/models"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func GenerateAccessToken(user models.User) (string, error) {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		return "", fmt.Errorf("JWT_SECRET is empty")
	}

	now := time.Now()

	claims := jwt.RegisteredClaims{
		Subject:   strconv.FormatInt(user.ID, 10),
		IssuedAt:  jwt.NewNumericDate(now),
		ExpiresAt: jwt.NewNumericDate(now.Add(24 * time.Hour)),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	ss, err := token.SignedString([]byte(secret))
	if err != nil {
		return "", fmt.Errorf("failed to generate signed string: %v", err)
	}

	return ss, nil
}
