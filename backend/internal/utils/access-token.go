package utils

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func (s *AuthService) GenerateAccessToken(userID UserID) (string, error) {
	now := time.Now()

	claims := jwt.RegisteredClaims{
		Subject:   strconv.FormatInt(int64(userID), 10),
		IssuedAt:  jwt.NewNumericDate(now),
		ExpiresAt: jwt.NewNumericDate(now.Add(15 * time.Minute)),
		Issuer:    s.issuer,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	ss, err := token.SignedString([]byte(s.accessSecret))
	if err != nil {
		return "", fmt.Errorf("failed to generate signed string: %w", err)
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
		return 0, ErrInvalidAccessToken
	}

	if claims.Subject == "" {
		return 0, ErrEmptyTokenSubject
	}

	userID, err := strconv.ParseInt(claims.Subject, 10, 64)
	if err != nil {
		return 0, fmt.Errorf("invalid access token subject: %w", err)
	}

	return userID, nil
}

func (s *AuthService) SetAccessTokenCookies(userID int64, w http.ResponseWriter) error {
	accessToken, err := s.GenerateAccessToken(UserID(userID))
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
		MaxAge:   int(accessTokenTTL.Seconds()),
	}

	http.SetCookie(w, &cookie)

	return nil
}
