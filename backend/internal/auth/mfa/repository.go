package mfa

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"studify/internal"
)

func GetUserTOTPKeyEncryptedByID(ctx context.Context, db internal.DBTX, id int64) (string, error) {
	var secret string
	err := db.QueryRowContext(ctx, `SELECT totp_encrypted FROM users WHERE id = $1`, id).Scan(&secret)
	if errors.Is(err, sql.ErrNoRows) {
		return "", ErrUserNotFound
	}
	if err != nil {
		return "", fmt.Errorf("get user TOTP key by ID: %w", err)
	}
	return secret, nil
}

func UpdateUserTOTPSecret(ctx context.Context, db internal.DBTX, id int64, secret string) error {
	result, err := db.ExecContext(ctx, `UPDATE users SET totp_encrypted = $1 WHERE id = $2`, secret, id)
	if err != nil {
		return fmt.Errorf("update user TOTP secret: %w", err)
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

func UpdateUserTOTPStatus(ctx context.Context, db internal.DBTX, id int64, enabled bool) error {
	result, err := db.ExecContext(ctx, `UPDATE users SET is_totp_enabled = $1 WHERE id = $2`, enabled, id)
	if err != nil {
		return fmt.Errorf("update user TOTP status: %w", err)
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

func DisableUserTOTP(ctx context.Context, db internal.DBTX, id int64) error {
	result, err := db.ExecContext(ctx, `UPDATE users SET totp_encrypted = '', is_totp_enabled = FALSE WHERE id = $1`, id)
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
