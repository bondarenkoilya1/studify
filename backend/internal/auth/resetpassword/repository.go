package resetpassword

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"studify/internal"
	"time"
)

type TokenRecord struct {
	UserID    int64
	TokenHash []byte
	ExpiresAt time.Time
	CreatedAt time.Time
}

const resetPasswordTokenType = "password_reset"

func GetResetPasswordTokenByHash(ctx context.Context, db internal.DBTX, tokenHash []byte) (*TokenRecord, error) {
	query := `
		SELECT user_id, token_hash, expires_at, created_at
		FROM auth_tokens
		WHERE token_hash = $1 AND type = $2;
	`

	token := &TokenRecord{}
	err := db.QueryRowContext(ctx, query, tokenHash, resetPasswordTokenType).Scan(
		&token.UserID, &token.TokenHash, &token.ExpiresAt, &token.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFoundResetToken
		}
		return nil, fmt.Errorf("get password reset token by hash: %w", err)
	}

	return token, nil
}

func InsertResetPasswordToken(ctx context.Context, db internal.DBTX, userID int64, tokenHash []byte, expiresAt time.Time) error {
	query := `
		INSERT INTO auth_tokens (user_id, token_hash, type, expires_at)
		VALUES ($1, $2, $3, $4);
	`

	_, err := db.ExecContext(ctx, query, userID, tokenHash, resetPasswordTokenType, expiresAt)
	if err != nil {
		return fmt.Errorf("insert password reset token: %w", err)
	}

	return nil
}

func DeleteResetPasswordToken(ctx context.Context, db internal.DBTX, userID int64) error {
	query := `
		DELETE FROM auth_tokens
		WHERE user_id = $1 AND type = $2;
	`

	result, err := db.ExecContext(ctx, query, userID, resetPasswordTokenType)
	if err != nil {
		return fmt.Errorf("delete password reset token: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("get deleted password reset token count: %w", err)
	}
	if rowsAffected == 0 {
		return ErrNotFoundResetToken
	}

	return nil
}
