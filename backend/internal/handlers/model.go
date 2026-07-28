package handlers

import (
	"database/sql"
	"studify/internal/config"
	"studify/internal/services"
	"studify/internal/utils"
)

type Handler struct {
	DB           *sql.DB
	Auth         *utils.AuthService
	Config       *config.Config
	EmailService *services.EmailService
}
