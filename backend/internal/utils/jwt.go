package utils

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func GenerateAccessToken(userID int64) (string, error) {
	secret := os.Getenv("JWT_ACCESS_SECRET")
	if secret == "" {
		return "", fmt.Errorf("JWT_ACCESS_SECRET is empty")
	}

	issuer := os.Getenv("ISSUER")
	if issuer == "" {
		return "", fmt.Errorf("ISSUER is empty")
	}

	now := time.Now()

	claims := jwt.RegisteredClaims{
		Subject:   strconv.FormatInt(userID, 10),
		IssuedAt:  jwt.NewNumericDate(now),
		ExpiresAt: jwt.NewNumericDate(now.Add(15 * time.Minute)),
		Issuer:    issuer,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	ss, err := token.SignedString([]byte(secret))
	if err != nil {
		return "", fmt.Errorf("failed to generate signed string: %v", err)
	}

	return ss, nil
}

func ParseAccessToken(tokenString string) (int64, error) {
	secret := os.Getenv("JWT_ACCESS_SECRET")
	if secret == "" {
		return 0, fmt.Errorf("jwt secret is empty")
	}

	issuer := os.Getenv("ISSUER")
	if issuer == "" {
		return 0, fmt.Errorf("issuer is empty")
	}

	claims := &jwt.RegisteredClaims{}

	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (any, error) {
		if token.Method != jwt.SigningMethodHS256 {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}

		return []byte(secret), nil
	}, jwt.WithIssuer(issuer))
	if err != nil {
		return 0, fmt.Errorf("parse access token: %w", err)
	}

	if !token.Valid {
		return 0, fmt.Errorf("invalid access token")
	}

	if claims.Subject == "" {
		return 0, fmt.Errorf("access token subject is empty")
	}

	userID, err := strconv.ParseInt(claims.Subject, 10, 64)
	if err != nil {
		return 0, fmt.Errorf("invalid access token subject: %w", err)
	}

	return userID, nil
}

func SetAccessTokenCookies(userID int64, w http.ResponseWriter) error {
	accessToken, err := GenerateAccessToken(userID)
	if err != nil {
		return fmt.Errorf("generate access token: %w", err)
	}

	accessTokenTTL := 15 * time.Minute

	cookie := http.Cookie{
		Name:     "access_token",
		Value:    accessToken,
		Path:     "/",
		HttpOnly: true,
		Secure:   false, // todo! use production .env,
		SameSite: http.SameSiteLaxMode,
		Expires:  time.Now().Add(accessTokenTTL),
		MaxAge:   int(accessTokenTTL.Seconds())}

	http.SetCookie(w, &cookie)

	return nil
}

func GetUserIDFromContext(r *http.Request) (int64, bool) {
	userID, ok := r.Context().Value("userID").(int64)
	return userID, ok
}

func GenerateRefreshToken(userID int64) (string, error) {
	secret := os.Getenv("JWT_REFRESH_SECRET")
	if secret == "" {
		return "", fmt.Errorf("JWT_REFRESH_SECRET is empty")
	}

	issuer := os.Getenv("ISSUER")
	if issuer == "" {
		return "", fmt.Errorf("ISSUER is empty")
	}

	now := time.Now()

	tokenID, err := generateTokenID()
	if err != nil {
		return "", fmt.Errorf("failed to generate token id: %v", err)
	}

	claims := jwt.RegisteredClaims{
		ID:        tokenID,
		Subject:   strconv.FormatInt(userID, 10),
		IssuedAt:  jwt.NewNumericDate(now),
		ExpiresAt: jwt.NewNumericDate(now.Add(7 * 24 * time.Hour)),
		Issuer:    issuer,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	ss, err := token.SignedString([]byte(secret))
	if err != nil {
		return "", fmt.Errorf("failed to generate signed string: %v", err)
	}

	return ss, nil
}

func generateTokenID() (string, error) {
	bytes := make([]byte, 32)

	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}

	return base64.RawURLEncoding.EncodeToString(bytes), nil
}
