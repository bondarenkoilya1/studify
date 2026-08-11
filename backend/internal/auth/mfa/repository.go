package mfa

import (
	"database/sql"
	"errors"
	"fmt"
)

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

func DisableUserTOTP(db *sql.DB, id int64) error {
	query := `
		UPDATE users
		SET
		    totp_encrypted = '',
		    is_totp_enabled = FALSE
		WHERE id = $1;
	`

	result, err := db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("disable user TOTP: %w", err)
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
