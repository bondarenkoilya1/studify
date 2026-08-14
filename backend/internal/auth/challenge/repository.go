package challenge

import (
	"database/sql"
	"errors"
	"fmt"
	"time"
)

func InsertAuthChallenge(db *sql.DB, userID int64, tokenHash string, expiresAt time.Time) (*record, error) {
	query := `
		INSERT INTO auth_challenges (user_id, token_hash, expires_at)
		VALUES ($1, $2, $3)
		RETURNING id, user_id, token_hash, expires_at, created_at;
	`
	var ch record
	err := db.QueryRow(query, userID, tokenHash, expiresAt).Scan(
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

func GetAuthChallengeByTokenHash(db *sql.DB, tokenHash string) (*record, error) {
	query := `
		SELECT id, user_id, token_hash, expires_at, created_at
		FROM auth_challenges
		WHERE token_hash = $1;
	`
	var ch record
	err := db.QueryRow(query, tokenHash).Scan(
		&ch.ID,
		&ch.UserID,
		&ch.TokenHash,
		&ch.ExpiresAt,
		&ch.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, NotFound
		}
		return nil, fmt.Errorf("get auth challenge by token hash: %w", err)
	}
	return &ch, nil
}

func DeleteAuthChallenge(db *sql.DB, id int64) error {
	query := `DELETE FROM auth_challenges WHERE id = $1;`
	result, err := db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("delete auth challenge: %w", err)
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("rows affected: %w", err)
	}
	if rows == 0 {
		return NotFound
	}
	return nil
}

func DeleteAuthChallengesByUserID(db *sql.DB, userID int64) error {
	query := `DELETE FROM auth_challenges WHERE user_id = $1;`
	if _, err := db.Exec(query, userID); err != nil {
		return fmt.Errorf("delete auth challenges by user id: %w", err)
	}
	return nil
}

func DeleteExpiredAuthChallenges(db *sql.DB) (int64, error) {
	query := `DELETE FROM auth_challenges WHERE expires_at < now();`
	result, err := db.Exec(query)
	if err != nil {
		return 0, fmt.Errorf("delete expired auth challenges: %w", err)
	}
	return result.RowsAffected()
}
