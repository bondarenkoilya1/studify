package ct

import (
	"database/sql"
	"studify/internal/auth"
	"studify/internal/email"
	"time"
)

type Handler struct {
	DB           *sql.DB
	EmailService *email.Service
	Auth         *auth.Service
}

type record struct {
	UserID    int64
	TokenHash string
	ExpiresAt time.Time
	CreatedAt time.Time
}
