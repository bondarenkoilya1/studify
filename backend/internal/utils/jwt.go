package utils

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type AuthService struct {
	accessSecret  string
	refreshSecret string
	issuer        string
}

func NewAuthService(accessSecret, refreshSecret, issuer string) *AuthService {
	return &AuthService{
		accessSecret:  accessSecret,
		refreshSecret: refreshSecret,
		issuer:        issuer,
	}
}

func (s *AuthService) GenerateAccessToken(userID int64) (string, error) {
	now := time.Now()

	claims := jwt.RegisteredClaims{
		Subject:   strconv.FormatInt(userID, 10),
		IssuedAt:  jwt.NewNumericDate(now),
		ExpiresAt: jwt.NewNumericDate(now.Add(15 * time.Minute)),
		Issuer:    s.issuer,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	ss, err := token.SignedString([]byte(s.accessSecret))
	if err != nil {
		return "", fmt.Errorf("failed to generate signed string: %v", err)
	}

	return ss, nil
}

func (s *AuthService) ParseAccessToken(tokenString string) (int64, error) {
	claims := &jwt.RegisteredClaims{}

	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (any, error) {
		if token.Method != jwt.SigningMethodHS256 {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}

		return []byte(s.accessSecret), nil
	}, jwt.WithIssuer(s.issuer))
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

func (s *AuthService) SetAccessTokenCookies(userID int64, w http.ResponseWriter) error {
	accessToken, err := s.GenerateAccessToken(userID)
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

func (s *AuthService) GenerateRefreshToken(userID int64) (string, error) {
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
		Issuer:    s.issuer,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	ss, err := token.SignedString([]byte(s.refreshSecret))
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
