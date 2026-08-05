package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"net/http"
	"strconv"
	"studify/internal/config"
	"studify/internal/models"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func GenerateTokenID() (string, error) {
	bytes := make([]byte, 32)

	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}

	return base64.RawURLEncoding.EncodeToString(bytes), nil
}

func HashRefreshToken(token models.RefreshToken) models.TokenHash {
	sum := sha256.Sum256([]byte(token))
	return models.TokenHash(hex.EncodeToString(sum[:]))
}

func CompareTokenHash(token models.RefreshToken, expectedHash models.TokenHash) bool {
	tokenHash := HashRefreshToken(token)

	return subtle.ConstantTimeCompare([]byte(tokenHash), []byte(expectedHash)) == 1
}

func (s *Service) GenerateRefreshToken(userID models.UserID) (models.RefreshToken, models.TokenID, error) {
	now := time.Now()

	tokenID, err := GenerateTokenID()
	if err != nil {
		return "", "", fmt.Errorf("failed to generate token id: %w", err)
	}

	claims := jwt.RegisteredClaims{
		ID:        tokenID,
		Subject:   strconv.FormatInt(int64(userID), 10),
		IssuedAt:  jwt.NewNumericDate(now),
		ExpiresAt: jwt.NewNumericDate(now.Add(config.RefreshTokenTTL)),
		Issuer:    s.issuer,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	ss, err := token.SignedString([]byte(s.refreshSecret))
	if err != nil {
		return "", "", fmt.Errorf("failed to generate signed string: %w", err)
	}

	return models.RefreshToken(ss), models.TokenID(tokenID), nil
}

// ParseRefreshToken reads data from the tokenString and make basic validation.
// It returns userID, tokenID and error
func (s *Service) ParseRefreshToken(tokenString string) (models.UserID, models.TokenID, error) {
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

	return models.UserID(userID), models.TokenID(claims.ID), nil
}

func (s *Service) SetRefreshTokenCookies(token models.RefreshToken, w http.ResponseWriter) error {
	cookie := http.Cookie{
		Name:     "refresh_token",
		Value:    string(token),
		Path:     "/",
		HttpOnly: true,
		Secure:   s.secureCookies,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   int(config.RefreshTokenTTL.Seconds()),
	}

	http.SetCookie(w, &cookie)

	return nil
}

func (s *Service) ClearRefreshToken(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   s.secureCookies,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   -1,
	})
}
