package handlers

import (
	"database/sql"
	"studify/internal/auth"
	ct "studify/internal/auth/confirmation_token"
	"studify/internal/auth/mfa"
	"studify/internal/auth/reset_password"
	"studify/internal/config"
	"studify/internal/dashboard"
	"studify/internal/email"
	"studify/internal/subject"
	"studify/internal/task"
	"studify/internal/user"
)

type Handler struct {
	DB            *sql.DB
	Auth          *auth.Service
	Config        *config.Config
	EmailService  *email.Service
	Subject       *subject.Handler // It's the start on new Handler. Later this struct will have own handlers
	Task          *task.Handler
	Dashboard     *dashboard.Handler
	Mfa           *mfa.Handler
	User          *user.Handler
	ResetPassword *reset_password.Handler
	Confirmation  *ct.Handler
}
