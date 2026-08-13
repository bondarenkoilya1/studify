package reset_password

import (
	"database/sql"
	"studify/internal/config"
	"studify/internal/mail"
)

type Handler struct {
	DB     *sql.DB
	Mailer *mail.Mailer
	Config *config.Config
}
