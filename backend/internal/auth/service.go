package auth

import (
	"database/sql"
	"fmt"
	"net/http"
	"studify/internal/config"
	"studify/internal/database/tokens"
	"time"
)

type Service struct {
	accessSecret  string
	refreshSecret string
	issuer        string
	secureCookies bool
	DB            *sql.DB
}

func NewService(accessSecret, refreshSecret, issuer string, secureCookies bool, DB *sql.DB) *Service {
	return &Service{
		accessSecret:  accessSecret,
		refreshSecret: refreshSecret,
		issuer:        issuer,
		secureCookies: secureCookies,
		DB:            DB,
	}
}

func (s *Service) IssueTokens(userID UserID, w http.ResponseWriter) error {
	refreshToken, refreshTokenID, err := s.GenerateRefreshToken(userID)
	if err != nil {
		return fmt.Errorf("generate refresh token: %w", err)
	}

	refreshTokenHash := HashRefreshToken(refreshToken)

	_, err = tokens.InsertRefreshToken(
		s.DB,
		int64(userID),
		string(refreshTokenID),
		string(refreshTokenHash),
		time.Now().Add(config.RefreshTokenTTL),
	)
	if err != nil {
		return fmt.Errorf("insert refresh token: %w", err)
	}

	if err := s.SetAccessTokenCookies(userID, w); err != nil {
		return fmt.Errorf("set access token cookie: %w", err)
	}

	if err := s.SetRefreshTokenCookies(refreshToken, w); err != nil {
		return fmt.Errorf("set refresh token cookie: %w", err)
	}

	return nil
}

func (s *Service) ClearAuthCookies(w http.ResponseWriter) {
	s.ClearAccessToken(w)
	s.ClearRefreshToken(w)
}
