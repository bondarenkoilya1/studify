package emailconfirm

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"studify/internal"
	"time"
)

type EmailConfirmationRecord struct {
	UserID    int64
	TokenHash []byte
	ExpiresAt time.Time
	CreatedAt time.Time
}

const emailConfirmTokenType = "email_confirmation"

func GetConfirmationTokenByUserID(ctx context.Context, db internal.DBTX, userID int64) (*EmailConfirmationRecord, error) {
	record := &EmailConfirmationRecord{}
	err := db.QueryRowContext(ctx, `
		SELECT user_id, token_hash, expires_at, created_at
		FROM auth_tokens
		WHERE user_id = $1 AND type = $2;
	`, userID, emailConfirmTokenType).Scan(
		&record.UserID, &record.TokenHash, &record.ExpiresAt, &record.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrEmailConfirmationNotFound
		}
		return nil, fmt.Errorf("get confirmation token by user id: %w", err)
	}
	return record, nil
}

func GetConfirmationTokenByHash(ctx context.Context, db internal.DBTX, tokenHash []byte) (*EmailConfirmationRecord, error) {
	record := &EmailConfirmationRecord{}
	err := db.QueryRowContext(ctx, `
		SELECT user_id, token_hash, expires_at, created_at
		FROM auth_tokens
		WHERE token_hash = $1 AND type = $2;
	`, tokenHash, emailConfirmTokenType).Scan(
		&record.UserID, &record.TokenHash, &record.ExpiresAt, &record.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrEmailConfirmationNotFound
		}
		return nil, fmt.Errorf("get confirmation token by hash: %w", err)
	}
	return record, nil
}

func InsertConfirmationToken(ctx context.Context, db internal.DBTX, userID int64, tokenHash []byte, expiresAt time.Time) error {
	_, err := db.ExecContext(ctx, `
		INSERT INTO auth_tokens (user_id, token_hash, type, expires_at)
		VALUES ($1, $2, $3, $4);
	`, userID, tokenHash, emailConfirmTokenType, expiresAt)
	if err != nil {
		return fmt.Errorf("insert confirmation token: %w", err)
	}
	return nil
}

func DeleteConfirmationToken(ctx context.Context, db internal.DBTX, userID int64) error {
	result, err := db.ExecContext(ctx, `
		DELETE FROM auth_tokens
		WHERE user_id = $1 AND type = $2;
	`, userID, emailConfirmTokenType)
	if err != nil {
		return fmt.Errorf("delete confirmation token: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("get deleted confirmation token count: %w", err)
	}
	if rowsAffected == 0 {
		return ErrEmailConfirmationNotFound
	}
	return nil
}
