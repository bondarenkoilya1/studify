package handlers

import (
	"database/sql"
	"studify/internal/config"
	"studify/internal/mail"
	"studify/internal/utils"
)

type Handler struct {
	DB     *sql.DB
	Mailer *mail.Mailer
	Auth   *utils.AuthService
	Config *config.Config
}
