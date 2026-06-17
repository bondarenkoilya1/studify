package utils

import (
	"fmt"
	"net/http"
	"os"
	"strconv"
	"studify/internal/models"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func GenerateAccessToken(user models.SafeUser) (string, error) {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		return "", fmt.Errorf("JWT_SECRET is empty")
	}

	issuer := os.Getenv("ISSUER")
	if issuer == "" {
		return "", fmt.Errorf("ISSUER is empty")
	}

	now := time.Now()

	claims := jwt.RegisteredClaims{
		Subject:   strconv.FormatInt(user.ID, 10),
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
	secret := os.Getenv("JWT_SECRET")
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

func SetAccessTokenCookies(user models.SafeUser, w http.ResponseWriter) error {
	accessToken, err := GenerateAccessToken(user)
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
