package emailconfirm

import (
	"studify/internal/user"
)

type Handler struct {
	Service     *Service
	UserService *user.Service
}

type tokenResponse struct {
	Token string `json:"confirm_email_token"`
}
