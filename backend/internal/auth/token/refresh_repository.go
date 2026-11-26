package token

import (
	"context"
	"database/sql"
	"fmt"
	"studify/internal"
	"time"
)

type RefreshTokenRecord struct {
	UserID            int64
	SessionID         sql.NullInt64
	TokenHash         string
	ExpiresAt         time.Time
	RevokedAt         *time.Time
	ReplacedByTokenID *string
}

func GetRefreshTokenByTokenIDForUpdate(ctx context.Context, db internal.DBTX, tokenID string) (*RefreshTokenRecord, error) {
	var token RefreshTokenRecord
	err := db.QueryRowContext(ctx, `
		SELECT user_id, session_id, token_hash, expires_at, revoked_at, replaced_by_token_id
		FROM refresh_tokens WHERE token_id = $1 FOR UPDATE
	`, tokenID).Scan(
		&token.UserID, &token.SessionID, &token.TokenHash,
		&token.ExpiresAt, &token.RevokedAt, &token.ReplacedByTokenID,
	)
	if err != nil {
		return nil, fmt.Errorf("get refresh token by token ID: %w", err)
	}
	return &token, nil
}

func InsertRefreshToken(ctx context.Context, db internal.DBTX, userID, sessionID int64, tokenID, tokenHash string, expiresAt time.Time) error {
	_, err := db.ExecContext(ctx, `
		INSERT INTO refresh_tokens (user_id, session_id, token_id, token_hash, expires_at)
		VALUES ($1, $2, $3, $4, $5)
	`, userID, sessionID, tokenID, tokenHash, expiresAt)
	if err != nil {
		return fmt.Errorf("insert refresh token: %w", err)
	}
	return nil
}

func RevokeRefreshToken(ctx context.Context, db internal.DBTX, tokenID string) error {
	result, err := db.ExecContext(ctx, `
		UPDATE refresh_tokens SET revoked_at = NOW()
		WHERE token_id = $1 AND revoked_at IS NULL
	`, tokenID)
	if err != nil {
		return fmt.Errorf("revoke refresh token: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("get revoked refresh tokens count: %w", err)
	}
	if rows == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func ReplaceRefreshToken(ctx context.Context, db internal.DBTX, tokenID, replacedByTokenID string, sessionID int64) error {
	result, err := db.ExecContext(ctx, `
		UPDATE refresh_tokens
		SET revoked_at = NOW(), replaced_by_token_id = $2, session_id = $3
		WHERE token_id = $1 AND revoked_at IS NULL
	`, tokenID, replacedByTokenID, sessionID)
	if err != nil {
		return fmt.Errorf("replace refresh token: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("get replaced refresh tokens count: %w", err)
	}
	if rows == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func RevokeAllRefreshTokens(ctx context.Context, q internal.DBTX, userID int64) error {
	const query = `
		UPDATE refresh_tokens
		SET revoked_at = NOW()
		WHERE user_id = $1
			AND revoked_at IS NULL
	`

	if _, err := q.ExecContext(ctx, query, userID); err != nil {
		return fmt.Errorf("revoke refresh tokens: %w", err)
	}

	return nil
}
