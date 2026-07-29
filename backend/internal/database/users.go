package database

import (
	"database/sql"
	"errors"
	"fmt"
	"studify/internal/models"

	"github.com/jackc/pgx/v5/pgconn"
)

func GetUserByEmail(db *sql.DB, email string) (*models.User, error) {
	query := `
		SELECT
			id,
			email,
			password,
			is_email_verified
		FROM users
		WHERE email = $1;
	`

	var user models.User
	err := db.QueryRow(query, email).Scan(
		&user.ID,
		&user.Email,
		&user.Password,
		&user.IsEmailVerified,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrUserNotFound
		}

		return nil, fmt.Errorf("get user by email: %w", err)
	}

	return &user, nil
}

func GetUserByID(db *sql.DB, id int64) (*models.User, error) {
	query := `
		SELECT
			id,
			email,
			is_email_verified
		FROM users
		WHERE id = $1;
	`

	var user models.User
	err := db.QueryRow(query, id).Scan(
		&user.ID,
		&user.Email,
		&user.IsEmailVerified,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrUserNotFound
		}

		return nil, fmt.Errorf("get user by id: %w", err)
	}

	return &user, nil
}

func GetUsers(db *sql.DB) ([]models.User, error) {
	query := `
		SELECT
			id,
			email,
			is_email_verified
		FROM users;
	`

	rows, err := db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("get users: %w", err)
	}
	defer rows.Close()

	var users []models.User

	for rows.Next() {
		var user models.User

		if err := rows.Scan(
			&user.ID,
			&user.Email,
			&user.IsEmailVerified,
		); err != nil {
			return nil, fmt.Errorf("scan user: %w", err)
		}

		users = append(users, user)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("read users rows: %w", err)
	}

	return users, nil
}

func InsertUser(db *sql.DB, email, password string) (*models.User, error) {
	query := `
		INSERT INTO users (email, password)
		VALUES ($1, $2)
		RETURNING id, email, is_email_verified;
	`

	var user models.User
	err := db.QueryRow(query, email, password).Scan(
		&user.ID,
		&user.Email,
		&user.IsEmailVerified,
	)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return nil, ErrUserAlreadyExists
		}

		return nil, fmt.Errorf("insert user: %w", err)
	}

	return &user, nil
}

func UpdateUser(db *sql.DB, id int64, email, password string) (*models.User, error) {
	query := `
		UPDATE users
		SET
			email = $1,
			password = $2
		WHERE id = $3
		RETURNING id, email, is_email_verified;
	`

	var user models.User
	err := db.QueryRow(query, email, password, id).Scan(
		&user.ID,
		&user.Email,
		&user.IsEmailVerified,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrUserNotFound
		}

		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return nil, ErrUserAlreadyExists
		}

		return nil, fmt.Errorf("update user: %w", err)
	}

	return &user, nil
}

func DeleteUser(db *sql.DB, email string) error {
	query := `
		DELETE FROM users
		WHERE email = $1;
	`

	result, err := db.Exec(query, email)
	if err != nil {
		return fmt.Errorf("delete user: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("get deleted users count: %w", err)
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

	if _, err := db.Exec(query); err != nil {
		return fmt.Errorf("delete users: %w", err)
	}

	return nil
}

func VerifyUserEmail(db *sql.DB, id int64) error {
	query := `
		UPDATE users
		SET is_email_verified = TRUE
		WHERE id = $1;
	`

	result, err := db.Exec(query, id)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return sql.ErrNoRows
	}

	return nil
}

func UpdateUserEmail(db *sql.DB, id int64, newEmail string) (*models.User, error) {
	query := `
		UPDATE users
		SET
		    email = $1
		WHERE id = $2
		RETURNING id, email, is_email_verified;
	`

	var user models.User
	if err := db.QueryRow(query, newEmail, id).Scan(&user.ID, &user.Email, &user.IsEmailVerified); err != nil {
		return nil, fmt.Errorf("update user email: %w", err)
	}

	return &user, nil
}
