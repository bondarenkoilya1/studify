package token

import (
	"database/sql"
	"errors"
	"fmt"
	"time"
)

const tokenType = "auth_challenge"

type Record struct {
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
) (*Record, error) {
	query := `
		INSERT INTO auth_tokens (user_id, token_hash, type, expires_at)
		VALUES ($1, $2, $3, $4)
		RETURNING id, user_id, token_hash, expires_at, created_at;
	`

	var ch Record

	err := db.QueryRow(
		query,
		userID,
		tokenHash,
		tokenType,
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
	db *sql.DB,
	tokenHash []byte,
) (*Record, error) {
	query := `
		SELECT id, user_id, token_hash, expires_at, created_at
		FROM auth_tokens
		WHERE token_hash = $1
		  AND type = $2;
	`

	var ch Record

	err := db.QueryRow(
		query,
		tokenHash,
		tokenType,
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

func DeleteAuthChallenge(db *sql.DB, id int64) error {
	query := `
		DELETE FROM auth_tokens
		WHERE id = $1
		  AND type = $2;
	`

	result, err := db.Exec(query, id, tokenType)
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

func DeleteAuthChallengesByUserID(db *sql.DB, userID int64) error {
	query := `
		DELETE FROM auth_tokens
		WHERE user_id = $1
		  AND type = $2;
	`

	if _, err := db.Exec(query, userID, tokenType); err != nil {
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

	result, err := db.Exec(query, tokenType)
	if err != nil {
		return 0, fmt.Errorf("delete expired auth challenges: %w", err)
	}

	return result.RowsAffected()
}
