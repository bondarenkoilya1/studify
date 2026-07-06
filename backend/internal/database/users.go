package database

import (
	"database/sql"
	"errors"
	"fmt"
	"studify/internal/models"

	"github.com/jackc/pgx/v5/pgconn"
)

func GetUserByUsername(db *sql.DB, username string) (*models.User, error) {
	query := `
		SELECT
			id,
			username,
			password
		FROM users
		WHERE username = $1;
	`

	row := db.QueryRow(query, username)
	user := &models.User{}

	err := row.Scan(&user.ID, &user.Username, &user.Password)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrUserNotFound
		}

		return nil, fmt.Errorf("failed to get user by username: %w", err)
	}

	return user, nil
}

func GetUserByID(db *sql.DB, id int64) (*models.User, error) {
	query := `
		SELECT
			id,
			username
		FROM users
		WHERE id = $1;
	`

	user := &models.User{}
	if err := db.QueryRow(query, id).Scan(&user.ID, &user.Username); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrUserNotFound
		}

		return nil, fmt.Errorf("failed to get user by id: %w", err)
	}

	return user, nil
}

func GetUsers(db *sql.DB) ([]models.User, error) {
	query := `
		SELECT
			id,
			username
		FROM users;
	`

	rows, err := db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to get users: %w", err)
	}
	defer rows.Close()

	users := []models.User{}

	for rows.Next() {
		var user models.User

		err = rows.Scan(&user.ID, &user.Username)
		if err != nil {
			return nil, fmt.Errorf("failed to scan user: %w", err)
		}

		users = append(users, user)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("failed to read users rows: %w", err)
	}

	return users, nil
}

func InsertUser(db *sql.DB, username, password string) (*models.User, error) {
	query := `
		INSERT INTO users (username, password)
		VALUES ($1, $2)
		RETURNING id, username
	`

	var user models.User
	err := db.QueryRow(query, username, password).Scan(&user.ID, &user.Username)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return nil, ErrUserAlreadyExists
		}

		return nil, fmt.Errorf("failed to insert user: %w", err)
	}

	return &user, nil
}

func UpdateUser(db *sql.DB, currentUsername, username, password string) (*models.User, error) {
	query := `
		UPDATE users
		SET
			username = $1,
			password = $2
		WHERE username = $3
		RETURNING id, username;
	`

	var user models.User
	err := db.QueryRow(query, username, password, currentUsername).Scan(&user.ID, &user.Username)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrUserNotFound
		}

		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return nil, ErrUserAlreadyExists
		}

		return nil, fmt.Errorf("failed to update user: %w", err)
	}

	return &user, nil
}

func DeleteUser(db *sql.DB, username string) error {
	query := `
		DELETE FROM users
		WHERE username = $1;
	`

	result, err := db.Exec(query, username)
	if err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get deleted users count: %w", err)
	}

	if rowsAffected == 0 {
		return ErrUserNotFound
	}

	return nil
}

func DeleteUsers(db *sql.DB) error {
	query := `
		DELETE FROM users;
	`

	_, err := db.Exec(query)
	if err != nil {
		return fmt.Errorf("failed to delete users: %w", err)
	}

	return nil
}
