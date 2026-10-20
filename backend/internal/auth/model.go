package auth

import (
	"errors"
	"studify/internal/auth/token"
)

type Handler struct {
	Service *Service
	Cookies *token.Cookies
}

type ChallengeTokenResponse struct {
	ChallengeToken string `json:"challenge_token"`
}

type registerReq struct {
	Email           string `json:"email"`
	Password        string `json:"password"`
	IsEmailVerified bool   `json:"is_email_verified"`
}

type userReq struct {
	Email           string `json:"email"`
	Password        string `json:"password"`
	IsEmailVerified bool   `json:"is_email_verified"`
	TOTPCode        string `json:"totp_code"`
}

type totpReq struct {
	ChallengeToken string `json:"challenge_token"`
	Code           string `json:"code"`
}

var (
	ErrInvalidToken  = errors.New("invalid refresh token")
	ErrTokenNotFound = errors.New("refresh token not found")
)
