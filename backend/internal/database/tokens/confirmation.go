package tokens

import (
	"database/sql"
	"fmt"
	"time"

	"studify/internal/models"
)

type confirmationTokenExecutor interface {
	Exec(query string, args ...any) (sql.Result, error)
	QueryRow(query string, args ...any) *sql.Row
}

func GetConfirmationTokenByUserID(
	db *sql.DB,
	userID int64,
) (*models.ConfirmationTokenRecord, error) {
	return getConfirmationTokenByUserID(db, userID)
}

func GetConfirmationTokenByUserIDTx(
	tx *sql.Tx,
	userID int64,
) (*models.ConfirmationTokenRecord, error) {
	return getConfirmationTokenByUserID(tx, userID)
}

func getConfirmationTokenByUserID(
	exec confirmationTokenExecutor,
	userID int64,
) (*models.ConfirmationTokenRecord, error) {
	query := `
	SELECT
		user_id,
		token_hash,
		expires_at,
		created_at
	FROM confirmation_tokens
	WHERE user_id = $1;
	`

	token := &models.ConfirmationTokenRecord{}

	err := exec.QueryRow(query, userID).Scan(
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

func GetConfirmationTokenByHash(
	db *sql.DB,
	tokenHash string,
) (*models.ConfirmationTokenRecord, error) {
	return getConfirmationTokenByHash(db, tokenHash)
}

func GetConfirmationTokenByHashTx(
	tx *sql.Tx,
	tokenHash string,
) (*models.ConfirmationTokenRecord, error) {
	return getConfirmationTokenByHash(tx, tokenHash)
}

func getConfirmationTokenByHash(
	exec confirmationTokenExecutor,
	tokenHash string,
) (*models.ConfirmationTokenRecord, error) {
	query := `
	SELECT
		user_id,
		token_hash,
		expires_at,
		created_at
	FROM confirmation_tokens
	WHERE token_hash = $1;
	`

	token := &models.ConfirmationTokenRecord{}

	err := exec.QueryRow(query, tokenHash).Scan(
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

func InsertConfirmationToken(
	db *sql.DB,
	userID int64,
	tokenHash string,
	expiresAt time.Time,
) error {
	return insertConfirmationToken(
		db,
		userID,
		tokenHash,
		expiresAt,
	)
}

func InsertConfirmationTokenTx(
	tx *sql.Tx,
	userID int64,
	tokenHash string,
	expiresAt time.Time,
) error {
	return insertConfirmationToken(
		tx,
		userID,
		tokenHash,
		expiresAt,
	)
}

func insertConfirmationToken(
	exec confirmationTokenExecutor,
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

	_, err := exec.Exec(
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

func DeleteConfirmationToken(
	db *sql.DB,
	userID int64,
) error {
	return deleteConfirmationToken(db, userID)
}

func DeleteConfirmationTokenTx(
	tx *sql.Tx,
	userID int64,
) error {
	return deleteConfirmationToken(tx, userID)
}

func deleteConfirmationToken(
	exec confirmationTokenExecutor,
	userID int64,
) error {
	query := `
	DELETE FROM confirmation_tokens
	WHERE user_id = $1;
	`

	result, err := exec.Exec(query, userID)

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
