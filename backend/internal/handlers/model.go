package handlers

import (
	"database/sql"
	"studify/internal/utils"
)

type Handler struct {
	DB   *sql.DB
	Auth *utils.AuthService
}
