package emailconfirm

import (
	"studify/internal/auth/token"
	"studify/internal/user"
)

type Handler struct {
	Token       *token.Service
	Service     *Service
	UserService *user.Service
}

type tokenResponse struct {
	Token string `json:"confirm_email_token"`
}
