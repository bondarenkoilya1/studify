package reset_password

import (
	"database/sql"
	"fmt"
	"time"
)

type Record struct {
	UserID    int64
	TokenHash string
	ExpiresAt time.Time
	CreatedAt time.Time
}

func GetResetPasswordTokenByHash(
	db *sql.DB,
	tokenHash string,
) (*Record, error) {
	query := `
	SELECT
		user_id,
		token_hash,
		expires_at,
		created_at
	FROM password_reset_tokens
	WHERE token_hash = $1;
	`

	token := &Record{}

	err := db.QueryRow(query, tokenHash).Scan(
		&token.UserID,
		&token.TokenHash,
		&token.ExpiresAt,
		&token.CreatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get password reset token by hash: %w", err)
	}

	return token, nil
}

func InsertResetPasswordToken(
	db *sql.DB,
	userID int64,
	tokenHash string,
	expiresAt time.Time,
) error {
	query := `
	INSERT INTO password_reset_tokens (
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
		return fmt.Errorf("failed to insert password reset token: %w", err)
	}

	return nil
}

func DeleteResetPasswordToken(
	db *sql.DB,
	userID int64,
) error {
	query := `
	DELETE FROM password_reset_tokens
	WHERE user_id = $1;
	`

	result, err := db.Exec(query, userID)
	if err != nil {
		return fmt.Errorf("failed to delete password reset token: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get deleted password reset token count: %w", err)
	}

	if rowsAffected == 0 {
		return sql.ErrNoRows
	}

	return nil
}
