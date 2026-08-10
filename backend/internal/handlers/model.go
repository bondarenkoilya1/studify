package handlers

import (
	"database/sql"
	"studify/internal/auth"
	"studify/internal/config"
	"studify/internal/dashboard"
	"studify/internal/email"
	"studify/internal/subject"
	"studify/internal/task"
)

type Handler struct {
	DB           *sql.DB
	Auth         *auth.Service
	Config       *config.Config
	EmailService *email.Service
	Subject      *subject.Handler // It's the start on new Handler. Later this struct will have own handlers
	Task         *task.Handler
	Dashboard    *dashboard.Handler
}
