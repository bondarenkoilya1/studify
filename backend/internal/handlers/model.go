package handlers

import (
	"database/sql"
	"studify/internal/auth"
	"studify/internal/config"
	"studify/internal/email"
)

type Handler struct {
	DB           *sql.DB
	Auth         *auth.Service
	Config       *config.Config
	EmailService *email.Service
}
