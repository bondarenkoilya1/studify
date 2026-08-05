package handlers

import (
	"database/sql"
	"studify/internal/auth"
	"studify/internal/config"
	"studify/internal/services"
)

type Handler struct {
	DB           *sql.DB
	Auth         *auth.Service
	Config       *config.Config
	EmailService *services.EmailService
}
