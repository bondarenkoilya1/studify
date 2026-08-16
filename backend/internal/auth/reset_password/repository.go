package reset_password

import (
	"database/sql"
	"errors"
	"fmt"
	"time"
)

const tokenType = "password_reset"

func GetResetPasswordTokenByHash(
	db *sql.DB,
	tokenHash []byte,
) (*Record, error) {
	query := `
		SELECT
			user_id,
			token_hash,
			expires_at,
			created_at
		FROM auth_tokens
		WHERE token_hash = $1
		  AND type = $2;
	`

	token := &Record{}

	err := db.QueryRow(
		query,
		tokenHash,
		tokenType,
	).Scan(
		&token.UserID,
		&token.TokenHash,
		&token.ExpiresAt,
		&token.CreatedAt,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, NotFound
		}

		return nil, fmt.Errorf(
			"get password reset token by hash: %w",
			err,
		)
	}

	return token, nil
}

func InsertResetPasswordToken(
	db *sql.DB,
	userID int64,
	tokenHash []byte,
	expiresAt time.Time,
) error {
	query := `
		INSERT INTO auth_tokens (
			user_id,
			token_hash,
			type,
			expires_at
		)
		VALUES ($1, $2, $3, $4);
	`

	_, err := db.Exec(
		query,
		userID,
		tokenHash,
		tokenType,
		expiresAt,
	)

	if err != nil {
		return fmt.Errorf(
			"insert password reset token: %w",
			err,
		)
	}

	return nil
}

func DeleteResetPasswordToken(
	db *sql.DB,
	userID int64,
) error {
	query := `
		DELETE FROM auth_tokens
		WHERE user_id = $1
		  AND type = $2;
	`

	result, err := db.Exec(query, userID, tokenType)
	if err != nil {
		return fmt.Errorf(
			"delete password reset token: %w",
			err,
		)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf(
			"get deleted password reset token count: %w",
			err,
		)
	}

	if rowsAffected == 0 {
		return NotFound
	}

	return nil
}
