package user

import (
	"database/sql"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5/pgconn"
)

var (
	ErrUserAlreadyExists = errors.New("user already exists")
	ErrUserNotFound      = errors.New("user not found")
)

func GetUserByEmail(db *sql.DB, email string) (*User, error) {
	query := `
		SELECT
			id,
			email,
			password,
			is_email_verified,
			is_totp_enabled
		FROM users
		WHERE email = $1;
	`

	var user User
	err := db.QueryRow(query, email).Scan(
		&user.ID,
		&user.Email,
		&user.Password,
		&user.IsEmailVerified,
		&user.IsTOTPEnabled,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrUserNotFound
		}

		return nil, fmt.Errorf("get user by email: %w", err)
	}

	return &user, nil
}

func GetUserByID(db *sql.DB, id int64) (*User, error) {
	query := `
		SELECT
			id,
			email,
			is_email_verified,
			is_totp_enabled
		FROM users
		WHERE id = $1;
	`

	var user User
	err := db.QueryRow(query, id).Scan(
		&user.ID,
		&user.Email,
		&user.IsEmailVerified,
		&user.IsTOTPEnabled,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrUserNotFound
		}

		return nil, fmt.Errorf("get user by id: %w", err)
	}

	return &user, nil
}

func GetUserPasswordHashByID(db *sql.DB, id int64) (string, error) {
	query := `
		SELECT password
		FROM users
		WHERE id = $1;
	`

	var passwordHash string

	err := db.QueryRow(query, id).Scan(&passwordHash)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return "", ErrUserNotFound
		}

		return "", fmt.Errorf("get user password hash by id: %w", err)
	}

	return passwordHash, nil
}

func InsertUser(db *sql.DB, email, password string) (*User, error) {
	query := `
		INSERT INTO users (email, password)
		VALUES ($1, $2)
		RETURNING id, email, is_email_verified;
	`

	var user User
	err := db.QueryRow(query, email, password).Scan(
		&user.ID,
		&user.Email,
		&user.IsEmailVerified,
	)
	if err != nil {
		if pgErr, ok := errors.AsType[*pgconn.PgError](err); ok && pgErr.Code == "23505" {
			return nil, ErrUserAlreadyExists
		}

		return nil, fmt.Errorf("insert user: %w", err)
	}

	return &user, nil
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

func UpdateUserEmail(db *sql.DB, id int64, newEmail string) (*User, error) {
	query := `
		UPDATE users
		SET
		    email = $1
		WHERE id = $2
		RETURNING id, email, is_email_verified;
	`

	var user User
	if err := db.QueryRow(query, newEmail, id).Scan(&user.ID, &user.Email, &user.IsEmailVerified); err != nil {
		return nil, fmt.Errorf("update user email: %w", err)
	}

	return &user, nil
}

func UpdateUserPassword(db *sql.DB, id int64, newPassword string) error {
	query := `
		UPDATE users
		SET
		    password = $1
		WHERE id = $2;
	`

	result, err := db.Exec(query, newPassword, id)
	if err != nil {
		return fmt.Errorf("update user password: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("rows affected: %w", err)
	}

	if rows == 0 {
		return sql.ErrNoRows
	}

	return nil
}
