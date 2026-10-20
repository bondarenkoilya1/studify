package token

import (
	"context"
	"database/sql"
	"fmt"
	"studify/internal"
	"time"
)

type RefreshTokenRecord struct {
	ID                int64
	UserID            int64
	TokenID           string
	TokenHash         string
	ExpiresAt         time.Time
	CreatedAt         time.Time
	RevokedAt         *time.Time
	ReplacedByTokenID *string
}

const refreshTokenColumns = `
	id, user_id, token_id, token_hash,
	expires_at, created_at, revoked_at, replaced_by_token_id
`

func GetRefreshTokenByID(ctx context.Context, db internal.DBTX, id int64) (*RefreshTokenRecord, error) {
	var token RefreshTokenRecord
	err := db.QueryRowContext(ctx, `
		SELECT `+refreshTokenColumns+`
		FROM refresh_tokens WHERE id = $1
	`, id).Scan(
		&token.ID, &token.UserID, &token.TokenID, &token.TokenHash,
		&token.ExpiresAt, &token.CreatedAt, &token.RevokedAt, &token.ReplacedByTokenID,
	)
	if err != nil {
		return nil, fmt.Errorf("get refresh token by ID: %w", err)
	}
	return &token, nil
}

func GetRefreshTokenByTokenID(ctx context.Context, db internal.DBTX, tokenID string, forUpdate bool) (*RefreshTokenRecord, error) {
	query := `SELECT ` + refreshTokenColumns + ` FROM refresh_tokens WHERE token_id = $1`
	if forUpdate {
		query += ` FOR UPDATE`
	}

	var token RefreshTokenRecord
	err := db.QueryRowContext(ctx, query, tokenID).Scan(
		&token.ID, &token.UserID, &token.TokenID, &token.TokenHash,
		&token.ExpiresAt, &token.CreatedAt, &token.RevokedAt, &token.ReplacedByTokenID,
	)
	if err != nil {
		return nil, fmt.Errorf("get refresh token by token ID: %w", err)
	}
	return &token, nil
}

func GetRefreshTokenByTokenHash(ctx context.Context, db internal.DBTX, tokenHash string) (*RefreshTokenRecord, error) {
	var token RefreshTokenRecord
	err := db.QueryRowContext(ctx, `
		SELECT `+refreshTokenColumns+`
		FROM refresh_tokens WHERE token_hash = $1
	`, tokenHash).Scan(
		&token.ID, &token.UserID, &token.TokenID, &token.TokenHash,
		&token.ExpiresAt, &token.CreatedAt, &token.RevokedAt, &token.ReplacedByTokenID,
	)
	if err != nil {
		return nil, fmt.Errorf("get refresh token by hash: %w", err)
	}
	return &token, nil
}

func GetRefreshTokens(ctx context.Context, db internal.DBTX) ([]RefreshTokenRecord, error) {
	rows, err := db.QueryContext(ctx, `SELECT `+refreshTokenColumns+` FROM refresh_tokens`)
	if err != nil {
		return nil, fmt.Errorf("get refresh tokens: %w", err)
	}
	defer rows.Close()

	var tokens []RefreshTokenRecord
	for rows.Next() {
		var token RefreshTokenRecord
		if err := rows.Scan(
			&token.ID, &token.UserID, &token.TokenID, &token.TokenHash,
			&token.ExpiresAt, &token.CreatedAt, &token.RevokedAt, &token.ReplacedByTokenID,
		); err != nil {
			return nil, fmt.Errorf("scan refresh token: %w", err)
		}
		tokens = append(tokens, token)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate refresh tokens: %w", err)
	}
	return tokens, nil
}

func GetRefreshTokensByUserID(ctx context.Context, db internal.DBTX, userID int64) ([]RefreshTokenRecord, error) {
	rows, err := db.QueryContext(ctx, `
		SELECT `+refreshTokenColumns+`
		FROM refresh_tokens WHERE user_id = $1
	`, userID)
	if err != nil {
		return nil, fmt.Errorf("get refresh tokens by user ID: %w", err)
	}
	defer rows.Close()

	var tokens []RefreshTokenRecord
	for rows.Next() {
		var token RefreshTokenRecord
		if err := rows.Scan(
			&token.ID, &token.UserID, &token.TokenID, &token.TokenHash,
			&token.ExpiresAt, &token.CreatedAt, &token.RevokedAt, &token.ReplacedByTokenID,
		); err != nil {
			return nil, fmt.Errorf("scan refresh token: %w", err)
		}
		tokens = append(tokens, token)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate refresh tokens: %w", err)
	}
	return tokens, nil
}

func InsertRefreshToken(ctx context.Context, db internal.DBTX, userID int64, tokenID, tokenHash string, expiresAt time.Time) (*RefreshTokenRecord, error) {
	var token RefreshTokenRecord
	err := db.QueryRowContext(ctx, `
		INSERT INTO refresh_tokens (user_id, token_id, token_hash, expires_at)
		VALUES ($1, $2, $3, $4)
		RETURNING id, created_at
	`, userID, tokenID, tokenHash, expiresAt).Scan(&token.ID, &token.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("insert refresh token: %w", err)
	}

	token.UserID, token.TokenID, token.TokenHash, token.ExpiresAt = userID, tokenID, tokenHash, expiresAt
	return &token, nil
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

func ReplaceRefreshToken(ctx context.Context, db internal.DBTX, tokenID, replacedByTokenID string) error {
	result, err := db.ExecContext(ctx, `
		UPDATE refresh_tokens
		SET revoked_at = NOW(), replaced_by_token_id = $2
		WHERE token_id = $1 AND revoked_at IS NULL
	`, tokenID, replacedByTokenID)
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

func DeleteRefreshToken(ctx context.Context, db internal.DBTX, id int64) error {
	result, err := db.ExecContext(ctx, `DELETE FROM refresh_tokens WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("delete refresh token: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("get deleted refresh tokens count: %w", err)
	}
	if rows == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func DeleteRefreshTokens(ctx context.Context, db internal.DBTX, userID int64) error {
	query := `
		DELETE FROM refresh_tokens WHERE user_id = $1;
	`

	result, err := db.ExecContext(ctx, query, userID)
	if err != nil {
		return fmt.Errorf("delete user refresh tokens: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("get deleted refresh tokens count: %w", err)
	}
	if rows == 0 {
		return sql.ErrNoRows
	}

	return nil
}
