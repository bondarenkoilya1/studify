package database

import (
	"database/sql"
	"studify/internal/models"
)

func GetUserByID(db *sql.DB, id int64) (*models.User, error) {
	query := `
		SELECT
			id,
			username,
			password
		FROM users
		WHERE id = $1;
	`

	row := db.QueryRow(query, id)
	user := &models.User{}

	err := row.Scan(&user.ID, &user.Username, &user.Password)
	if err != nil {
		return nil, err
	}

	return user, nil
}

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
