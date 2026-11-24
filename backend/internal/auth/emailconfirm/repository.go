package emailconfirm

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"studify/internal"
)

const emailConfirmTokenType = "email_confirmation"

func saveConfirmationToken(ctx context.Context, db internal.DBTX, userID int64, tokenHash []byte, ttlSeconds int64) error {
	result, err := db.ExecContext(ctx, `
		INSERT INTO auth_tokens (user_id, token_hash, type, expires_at)
		VALUES ($1, $2, $3, (clock_timestamp() AT TIME ZONE 'UTC') + $4 * INTERVAL '1 second')
		ON CONFLICT (user_id) WHERE type = 'email_confirmation'
		DO UPDATE SET token_hash = EXCLUDED.token_hash,
		              expires_at = EXCLUDED.expires_at,
		              created_at = EXCLUDED.created_at
		WHERE auth_tokens.created_at <= LOCALTIMESTAMP - INTERVAL '1 minute';
	`, userID, tokenHash, emailConfirmTokenType, ttlSeconds)
	if err != nil {
		return fmt.Errorf("save confirmation token: %w", err)
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("get saved confirmation token count: %w", err)
	}
	if rows == 0 {
		return ErrResendTooSoon
	}
	return nil
}

func consumeConfirmationToken(ctx context.Context, tx *sql.Tx, tokenHash []byte) (int64, error) {
	var userID int64
	err := tx.QueryRowContext(ctx, `
		DELETE FROM auth_tokens
		WHERE token_hash = $1 AND type = $2 AND expires_at > (clock_timestamp() AT TIME ZONE 'UTC')
		RETURNING user_id;
	`, tokenHash, emailConfirmTokenType).Scan(&userID)
	if errors.Is(err, sql.ErrNoRows) {
		return 0, ErrInvalidConfirmationToken
	}
	if err != nil {
		return 0, fmt.Errorf("consume confirmation token: %w", err)
	}
	return userID, nil
}
