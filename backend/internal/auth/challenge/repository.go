package challenge

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"studify/internal"
	"time"
)

type AuthChallengeRecord struct {
	ID        int64
	UserID    int64
	TokenHash []byte
	ExpiresAt time.Time
	CreatedAt time.Time
}

func InsertAuthChallenge(
	db *sql.DB,
	userID int64,
	tokenHash []byte,
	expiresAt time.Time,
) (*AuthChallengeRecord, error) {
	query := `
		INSERT INTO auth_tokens (user_id, token_hash, type, expires_at)
		VALUES ($1, $2, $3, $4)
		RETURNING id, user_id, token_hash, expires_at, created_at;
	`

	var ch AuthChallengeRecord

	err := db.QueryRow(
		query,
		userID,
		tokenHash,
		authChallengeTokenType,
		expiresAt,
	).Scan(
		&ch.ID,
		&ch.UserID,
		&ch.TokenHash,
		&ch.ExpiresAt,
		&ch.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("insert auth challenge: %w", err)
	}

	return &ch, nil
}

func GetAuthChallengeByTokenHash(
	ctx context.Context,
	db internal.DBTX,
	tokenHash []byte,
) (*AuthChallengeRecord, error) {
	query := `
		SELECT id, user_id, token_hash, expires_at, created_at
		FROM auth_tokens
		WHERE token_hash = $1
		  AND type = $2;
	`

	var ch AuthChallengeRecord

	err := db.QueryRowContext(
		ctx,
		query,
		tokenHash,
		authChallengeTokenType,
	).Scan(
		&ch.ID,
		&ch.UserID,
		&ch.TokenHash,
		&ch.ExpiresAt,
		&ch.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrChallengeTokenNotFound
		}

		return nil, fmt.Errorf("get auth challenge by token hash: %w", err)
	}

	return &ch, nil
}

func ConsumeAuthChallenge(ctx context.Context, db internal.DBTX, id int64) error {
	query := `
		DELETE FROM auth_tokens
		WHERE id = $1
		  AND type = $2
		  AND expires_at > (clock_timestamp() AT TIME ZONE 'UTC');
	`

	result, err := db.ExecContext(ctx, query, id, authChallengeTokenType)
	if err != nil {
		return fmt.Errorf("delete auth challenge: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("rows affected: %w", err)
	}

	if rows == 0 {
		return ErrChallengeTokenNotFound
	}

	return nil
}

func DeleteAuthChallengesByUserID(ctx context.Context, db internal.DBTX, userID int64) error {
	query := `
		DELETE FROM auth_tokens
		WHERE user_id = $1
		  AND type = $2;
	`

	if _, err := db.ExecContext(ctx, query, userID, authChallengeTokenType); err != nil {
		return fmt.Errorf("delete auth challenges by user id: %w", err)
	}

	return nil
}

func DeleteExpiredAuthChallenges(db *sql.DB) (int64, error) {
	query := `
		DELETE FROM auth_tokens
		WHERE type = $1
		  AND expires_at < now();
	`

	result, err := db.Exec(query, authChallengeTokenType)
	if err != nil {
		return 0, fmt.Errorf("delete expired auth challenges: %w", err)
	}

	return result.RowsAffected()
}
