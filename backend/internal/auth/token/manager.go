package token

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"strconv"
	"time"

	"studify/internal"

	"github.com/golang-jwt/jwt/v5"
)

type Manager struct {
	accessSecret  []byte
	refreshSecret []byte
	issuer        string
	accessTTL     time.Duration
	refreshTTL    time.Duration
	now           func() time.Time
}

func NewManager(accessSecret, refreshSecret []byte, issuer string, accessTTL, refreshTTL time.Duration) *Manager {
	return &Manager{
		accessSecret:  accessSecret,
		refreshSecret: refreshSecret,
		issuer:        issuer,
		accessTTL:     accessTTL,
		refreshTTL:    refreshTTL,
		now:           time.Now,
	}
}

// Public API

func (m *Manager) NewAccess(userID internal.UserID) (AccessToken, error) {
	claims := m.newClaims(userID, m.accessTTL, "")

	ss, err := m.sign(claims, m.accessSecret)
	if err != nil {
		return "", fmt.Errorf("sign access token: %w", err)
	}

	return AccessToken(ss), nil
}

func (m *Manager) NewRefresh(userID internal.UserID) (RefreshToken, TokenID, error) {
	id, err := generateTokenID()
	if err != nil {
		return "", "", fmt.Errorf("generate token id: %w", err)
	}

	claims := m.newClaims(userID, m.refreshTTL, id)

	ss, err := m.sign(claims, m.refreshSecret)
	if err != nil {
		return "", "", fmt.Errorf("sign refresh token: %w", err)
	}

	return RefreshToken(ss), TokenID(id), nil
}

func (m *Manager) ParseAccess(raw AccessToken) (internal.UserID, error) {
	claims, err := m.parse(string(raw), m.accessSecret)
	if err != nil {
		return 0, fmt.Errorf("parse access token: %w", err)
	}

	return userIDFromClaims(claims)
}

func (m *Manager) RefreshTTL() time.Duration { return m.refreshTTL }

// ParseRefresh returns userID, tokenID and error.
func (m *Manager) ParseRefresh(raw RefreshToken) (internal.UserID, TokenID, error) {
	claims, err := m.parse(string(raw), m.refreshSecret)
	if err != nil {
		return 0, "", fmt.Errorf("parse refresh token: %w", err)
	}

	if claims.ID == "" {
		return 0, "", ErrEmptyTokenID
	}

	userID, err := userIDFromClaims(claims)
	if err != nil {
		return 0, "", err
	}

	return userID, TokenID(claims.ID), nil
}

// Private API

func (m *Manager) newClaims(userID internal.UserID, ttl time.Duration, id string) jwt.RegisteredClaims {
	now := m.now()

	return jwt.RegisteredClaims{
		ID:        id, // для access пустая строка, в токен не попадёт
		Subject:   strconv.FormatInt(int64(userID), 10),
		Issuer:    m.issuer,
		IssuedAt:  jwt.NewNumericDate(now),
		ExpiresAt: jwt.NewNumericDate(now.Add(ttl)),
	}
}

func (m *Manager) sign(claims jwt.RegisteredClaims, secret []byte) (string, error) {
	t := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	ss, err := t.SignedString(secret)
	if err != nil {
		return "", fmt.Errorf("signed string: %w", err)
	}

	return ss, nil
}

func (m *Manager) parse(raw string, secret []byte) (*jwt.RegisteredClaims, error) {
	claims := &jwt.RegisteredClaims{}

	_, err := jwt.ParseWithClaims(raw, claims, func(*jwt.Token) (any, error) {
		return secret, nil
	},
		jwt.WithIssuer(m.issuer),
		jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}),
		jwt.WithExpirationRequired(),
		jwt.WithTimeFunc(m.now),
	)
	if err != nil {
		return nil, err
	}

	return claims, nil
}

func userIDFromClaims(claims *jwt.RegisteredClaims) (internal.UserID, error) {
	if claims.Subject == "" {
		return 0, ErrEmptyTokenSubject
	}

	id, err := strconv.ParseInt(claims.Subject, 10, 64)
	if err != nil {
		return 0, fmt.Errorf("invalid token subject: %w", err)
	}

	return internal.UserID(id), nil
}

func generateTokenID() (string, error) {
	bytes := make([]byte, 32)

	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}

	return base64.RawURLEncoding.EncodeToString(bytes), nil
}
