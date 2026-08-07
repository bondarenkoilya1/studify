package database

import (
	"database/sql"
	"errors"
	"fmt"
	"studify/internal/models"

	"github.com/jackc/pgx/v5/pgconn"
)

// Todo: Different DTO, where I don't return totp secret for web-users
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
			is_email_verified,
			is_totp_enabled
		FROM users
		WHERE id = $1;
	`

	var user models.User
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

func GetUserTOTPKeyEncryptedByID(db *sql.DB, id int64) (string, error) {
	query := `
		SELECT totp_encrypted
		FROM users
		WHERE id = $1;
	`

	var totpKey string

	err := db.QueryRow(query, id).Scan(&totpKey)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return "", ErrUserNotFound
		}

		return "", fmt.Errorf("get user totp key by id: %w", err)
	}

	return totpKey, nil
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

func UpdateUserTOTPSecret(db *sql.DB, id int64, secret string) error {
	query := `
		UPDATE users
		SET
		    totp_encrypted = $1
		WHERE id = $2;
	`

	result, err := db.Exec(query, secret, id)
	if err != nil {
		return fmt.Errorf("update user totp secret: %w", err)
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

func UpdateUserTOTPStatus(db *sql.DB, id int64, enabld bool) error {
	query := `
		UPDATE users
		SET
		    is_totp_enabled = $1
		WHERE id = $2;
	`

	result, err := db.Exec(query, enabld, id)
	if err != nil {
		return fmt.Errorf("update user totp enabled status: %w", err)
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

/* Admin routes
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

*/
