package reset_password

import (
	"database/sql"
	"errors"
	"studify/internal/config"
	"studify/internal/mail"
	"time"
)

type Handler struct {
	DB     *sql.DB
	Mailer *mail.Mailer
	Config *config.Config
}

type Record struct {
	UserID    int64
	TokenHash []byte
	ExpiresAt time.Time
	CreatedAt time.Time
}

var (
	NotFound = errors.New("password reset token not found")

	ErrResetPasswordTokenExpired = errors.New(
		"reset password token expired",
	)
)
