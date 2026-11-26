package auth

import (
	"studify/internal/auth/token"
	"studify/internal/user"
)

type Handler struct {
	Service *Service
	Cookies *token.Cookies
}

type credentialsRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
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

type challengeTokenResponse struct {
	ChallengeToken string `json:"challenge_token"`
}
