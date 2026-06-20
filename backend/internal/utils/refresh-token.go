package utils

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func (s *AuthService) generateRefreshToken(userID UserID) (RefreshToken, TokenID, error) {
	now := time.Now()

	tokenID, err := GenerateTokenID()
	if err != nil {
		return "", "", fmt.Errorf("failed to generate token id: %w", err)
	}

	claims := jwt.RegisteredClaims{
		ID:        tokenID,
		Subject:   strconv.FormatInt(int64(userID), 10),
		IssuedAt:  jwt.NewNumericDate(now),
		ExpiresAt: jwt.NewNumericDate(now.Add(7 * 24 * time.Hour)),
		Issuer:    s.issuer,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	ss, err := token.SignedString([]byte(s.refreshSecret))
	if err != nil {
		return "", "", fmt.Errorf("failed to generate signed string: %w", err)
	}

	return RefreshToken(ss), TokenID(tokenID), nil
}

// ParseRefreshToken reads data from the tokenString and make basic validation.
// It returns userID, tokenID and error
func (s *AuthService) ParseRefreshToken(tokenString string) (UserID, TokenID, error) {
	claims := &jwt.RegisteredClaims{}

	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (any, error) {
		if token.Method != jwt.SigningMethodHS256 {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}

		return []byte(s.refreshSecret), nil
	}, jwt.WithIssuer(s.issuer), jwt.WithExpirationRequired())
	if err != nil {
		return 0, "", fmt.Errorf("parse refresh token: %w", err)
	}

	if !token.Valid {
		return 0, "", ErrInvalidRefreshToken
	}

	if claims.Subject == "" {
		return 0, "", ErrEmptyTokenSubject
	}

	if claims.ID == "" {
		return 0, "", ErrEmptyTokenID
	}

	userID, err := strconv.ParseInt(claims.Subject, 10, 64)
	if err != nil {
		return 0, "", fmt.Errorf("invalid refresh token subject: %w", err)
	}

	return UserID(userID), TokenID(claims.ID), nil
}

func (s *AuthService) SetRefreshTokenCookies(userID UserID, w http.ResponseWriter) error {
	token, _, err := s.generateRefreshToken(userID)
	if err != nil {
		return fmt.Errorf("generate refresh token: %w", err)
	}

	refreshTokenTTL := (30 * 24 * time.Hour).Seconds() // 30 days

	cookie := http.Cookie{
		Name:     "refresh_token",
		Value:    string(token),
		Path:     "/refresh",
		HttpOnly: true,
		Secure:   s.secureCookies,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   int(refreshTokenTTL),
	}

	http.SetCookie(w, &cookie)

	return nil
}

func (s *AuthService) ClearRefreshToken(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    "",
		Path:     "/refresh",
		HttpOnly: true,
		Secure:   s.secureCookies,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   -1,
	})
}
