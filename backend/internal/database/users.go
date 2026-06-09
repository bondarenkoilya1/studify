package database

import (
	"database/sql"
	"studify/internal/models"
)

func InsertUser(db *sql.DB, username, password string) (*models.User, error) {
	query := `
		INSERT INTO users (username, password)
		VALUES ($1, $2)
		RETURNING id, username, password
	`

	var user models.User
	err := db.QueryRow(query, username, password).Scan(&user.ID, &user.Username, &user.Password)
	if err != nil {
		return nil, err
	}

	return &user, nil
}
