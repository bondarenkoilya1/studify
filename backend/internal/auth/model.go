package auth

import (
	"studify/internal/auth/token"
	"studify/internal/user"
)

type Handler struct {
	Service *Service
	Cookies *token.Cookies
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

type loginResponse struct {
	User           *user.User
	Pair           token.Pair
	IsTOTPRequired bool
	ChallengeToken token.Token
}
