package user

import (
	"database/sql"
	"studify/internal/mail"
)

type Handler struct {
	DB          *sql.DB
	MailService *mail.Service
}

type User struct {
	ID              int64   `json:"id"`
	Email           string  `json:"email"`
	Password        string  `json:"-"`
	IsEmailVerified bool    `json:"is_email_verified"`
	IsTOTPEnabled   bool    `json:"is_totp_enabled"`
	AvatarURL       *string `json:"avatar_url"`
}

type emailRequest struct {
	NewEmail string `json:"new_email"`
}

type passwordRequest struct {
	CurrentPassword string `json:"current_password"`
	NewPassword     string `json:"new_password"`
}

type avatarResponse struct {
	AvatarURL string `json:"avatar_url"`
}
