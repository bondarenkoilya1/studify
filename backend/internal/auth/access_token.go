package auth

import (
	"fmt"
	"net/http"
	"strconv"
	"studify/internal/config"
	"studify/internal/models"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func (s *Service) generateAccessToken(userID models.UserID) (string, error) {
	now := time.Now()

	claims := jwt.RegisteredClaims{
		Subject:   strconv.FormatInt(int64(userID), 10),
		IssuedAt:  jwt.NewNumericDate(now),
		ExpiresAt: jwt.NewNumericDate(now.Add(config.AccessTokenTTL)),
		Issuer:    s.issuer,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	ss, err := token.SignedString([]byte(s.accessSecret))
	if err != nil {
		return "", fmt.Errorf("failed to generate signed string: %w", err)
	}

	return ss, nil
}

func (s *Service) ParseAccessToken(tokenString string) (models.UserID, error) {
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
		return 0, ErrInvalidAccessToken
	}

	if claims.Subject == "" {
		return 0, ErrEmptyTokenSubject
	}

	userID, err := strconv.ParseInt(claims.Subject, 10, 64)
	if err != nil {
		return 0, fmt.Errorf("invalid access token subject: %w", err)
	}

	return models.UserID(userID), nil
}

func (s *Service) SetAccessTokenCookies(userID models.UserID, w http.ResponseWriter) error {
	accessToken, err := s.generateAccessToken(userID)
	if err != nil {
		return fmt.Errorf("generate access token: %w", err)
	}

	cookie := http.Cookie{
		Name:     "access_token",
		Value:    accessToken,
		Path:     "/",
		HttpOnly: true,
		Secure:   s.secureCookies,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   int(config.AccessTokenTTL.Seconds()),
	}

	http.SetCookie(w, &cookie)

	return nil
}

func (s *Service) ClearAccessToken(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     "access_token",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   s.secureCookies,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   -1,
	})
}
