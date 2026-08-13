package ct

import (
	"database/sql"
	"fmt"
	"time"
)

func getConfirmationTokenByUserID(
	db *sql.DB,
	userID int64,
) (*record, error) {
	query := `
	SELECT
		user_id,
		token_hash,
		expires_at,
		created_at
	FROM confirmation_tokens
	WHERE user_id = $1;
	`

	token := &record{}

	err := db.QueryRow(query, userID).Scan(
		&token.UserID,
		&token.TokenHash,
		&token.ExpiresAt,
		&token.CreatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get confirmation token by user id: %w", err)
	}

	return token, nil
}

func getConfirmationTokenByHash(
	db *sql.DB,
	tokenHash string,
) (*record, error) {
	query := `
	SELECT
		user_id,
		token_hash,
		expires_at,
		created_at
	FROM confirmation_tokens
	WHERE token_hash = $1;
	`

	token := &record{}

	err := db.QueryRow(query, tokenHash).Scan(
		&token.UserID,
		&token.TokenHash,
		&token.ExpiresAt,
		&token.CreatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get confirmation token by hash: %w", err)
	}

	return token, nil
}

func insertConfirmationToken(
	db *sql.DB,
	userID int64,
	tokenHash string,
	expiresAt time.Time,
) error {
	query := `
	INSERT INTO confirmation_tokens (
		user_id,
		token_hash,
		expires_at
	)
	VALUES ($1, $2, $3)
	ON CONFLICT (user_id)
	DO UPDATE SET
		token_hash = EXCLUDED.token_hash,
		expires_at = EXCLUDED.expires_at,
		created_at = now();
	`

	_, err := db.Exec(
		query,
		userID,
		tokenHash,
		expiresAt,
	)

	if err != nil {
		return fmt.Errorf("failed to insert confirmation token: %w", err)
	}

	return nil
}

func deleteConfirmationToken(
	db *sql.DB,
	userID int64,
) error {
	query := `
	DELETE FROM confirmation_tokens
	WHERE user_id = $1;
	`

	result, err := db.Exec(query, userID)
	if err != nil {
		return fmt.Errorf("failed to delete confirmation token: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get deleted confirmation token count: %w", err)
	}

	if rowsAffected == 0 {
		return sql.ErrNoRows
	}

	return nil
}
