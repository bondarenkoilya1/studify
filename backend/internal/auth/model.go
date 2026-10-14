package auth

import (
	"database/sql"
	"studify/internal/auth/token"
	"studify/internal/config"
	"studify/internal/mail"
)

type Handler struct {
	DB          *sql.DB
	Token       *token.Service
	Config      *config.Config
	MailService *mail.Service
	AuthService *Service
}

type ChallengeTokenResponse struct {
	ChallengeToken string `json:"challenge_token"`
}

type UserRequest struct {
	Email           string `json:"email"`
	Password        string `json:"password"`
	IsEmailVerified bool   `json:"is_email_verified"`
	TOTPCode        string `json:"totp_code"` // temp!
}

type TOTPRequest struct {
	ChallengeToken string `json:"challenge_token"`
	Code           string `json:"code"`
}
