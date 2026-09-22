package token

import (
	"database/sql"
	"fmt"
	"time"
)

type refreshTokenExecutor interface {
	Exec(query string, args ...any) (sql.Result, error)
	QueryRow(query string, args ...any) *sql.Row
}

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
	id,
	user_id,
	token_id,
	token_hash,
	expires_at,
	created_at,
	revoked_at,
	replaced_by_token_id
`

func scanRefreshToken(scanner interface {
	Scan(dest ...any) error
}) (*RefreshTokenRecord, error) {
	token := &RefreshTokenRecord{}

	err := scanner.Scan(
		&token.ID,
		&token.UserID,
		&token.TokenID,
		&token.TokenHash,
		&token.ExpiresAt,
		&token.CreatedAt,
		&token.RevokedAt,
		&token.ReplacedByTokenID,
	)

	if err != nil {
		return nil, err
	}

	return token, nil
}

func GetRefreshTokenByID(db *sql.DB, id int64) (*RefreshTokenRecord, error) {
	query := `
	SELECT
	` + refreshTokenColumns + `
	FROM refresh_tokens
	WHERE id = $1;
`

	row := db.QueryRow(query, id)
	refreshToken, err := scanRefreshToken(row)
	if err != nil {

		return nil, fmt.Errorf("failed to get refresh token: %w", err)

	}

	return refreshToken, nil
}

func GetRefreshTokenByTokenID(db *sql.DB, tokenID string) (*RefreshTokenRecord, error) {
	return getRefreshTokenByTokenID(db, tokenID, false)
}

func GetRefreshTokenByTokenIDTx(tx *sql.Tx, tokenID string) (*RefreshTokenRecord, error) {
	return getRefreshTokenByTokenID(tx, tokenID, true)
}

func getRefreshTokenByTokenID(exec refreshTokenExecutor, tokenID string, forUpdate bool) (*RefreshTokenRecord, error) {
	query := `
	SELECT
	` + refreshTokenColumns + `
	FROM refresh_tokens
	WHERE token_id = $1
`
	if forUpdate {
		query += "FOR UPDATE"
	}

	row := exec.QueryRow(query, tokenID)
	refreshToken, err := scanRefreshToken(row)
	if err != nil {

		return nil, fmt.Errorf("failed to get refresh token: %w", err)

	}

	return refreshToken, nil
}

func GetRefreshTokenByTokenHash(db *sql.DB, tokenHash string) (*RefreshTokenRecord, error) {
	query := `
	SELECT
	` + refreshTokenColumns + `
	FROM refresh_tokens
	WHERE token_hash = $1;
`

	row := db.QueryRow(query, tokenHash)
	refreshToken, err := scanRefreshToken(row)
	if err != nil {

		return nil, fmt.Errorf("failed to get refresh token: %w", err)

	}

	return refreshToken, nil
}

func GetRefreshTokens(db *sql.DB) ([]RefreshTokenRecord, error) {
	query := `
	SELECT
	` + refreshTokenColumns + `
	FROM refresh_tokens;
`

	rows, err := db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to get refresh tokens: %w", err)
	}
	defer rows.Close()

	var refreshTokens []RefreshTokenRecord

	for rows.Next() {
		var refreshToken RefreshTokenRecord

		err = rows.Scan(
			&refreshToken.ID,
			&refreshToken.UserID,
			&refreshToken.TokenID,
			&refreshToken.TokenHash,
			&refreshToken.ExpiresAt,
			&refreshToken.CreatedAt,
			&refreshToken.RevokedAt,
			&refreshToken.ReplacedByTokenID,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan refresh token: %w", err)
		}

		refreshTokens = append(refreshTokens, refreshToken)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("failed to read refresh token rows: %w", err)
	}

	return refreshTokens, nil
}

func GetRefreshTokensByUserID(db *sql.DB, userID int64) ([]RefreshTokenRecord, error) {
	query := `
	SELECT
	` + refreshTokenColumns + `
	FROM refresh_tokens
	WHERE user_id = $1;
`

	rows, err := db.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get refresh tokens by user id: %w", err)
	}
	defer rows.Close()

	var refreshTokens []RefreshTokenRecord

	for rows.Next() {
		var refreshToken RefreshTokenRecord

		err = rows.Scan(
			&refreshToken.ID,
			&refreshToken.UserID,
			&refreshToken.TokenID,
			&refreshToken.TokenHash,
			&refreshToken.ExpiresAt,
			&refreshToken.CreatedAt,
			&refreshToken.RevokedAt,
			&refreshToken.ReplacedByTokenID,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan refresh token: %w", err)
		}

		refreshTokens = append(refreshTokens, refreshToken)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("failed to read refresh token rows: %w", err)
	}

	return refreshTokens, nil
}

func InsertRefreshToken(db *sql.DB, userID int64, tokenID, tokenHash string, expiresAt time.Time) (*RefreshTokenRecord, error) {
	return insertRefreshToken(db, userID, tokenID, tokenHash, expiresAt)
}

func InsertRefreshTokenTx(tx *sql.Tx, userID int64, tokenID, tokenHash string, expiresAt time.Time) (*RefreshTokenRecord, error) {
	return insertRefreshToken(tx, userID, tokenID, tokenHash, expiresAt)
}

func insertRefreshToken(exec refreshTokenExecutor, userID int64, tokenID, tokenHash string, expiresAt time.Time) (*RefreshTokenRecord, error) {
	query := `
	INSERT INTO refresh_tokens (
		user_id,
		token_id,
		token_hash,
		expires_at
	)
	VALUES ($1, $2, $3, $4)
	RETURNING id, created_at;
`

	var token RefreshTokenRecord
	if err := exec.QueryRow(query, userID, tokenID, tokenHash, expiresAt).Scan(&token.ID, &token.CreatedAt); err != nil {
		return nil, fmt.Errorf("failed to insert refresh token: %w", err)
	}

	token.UserID = userID
	token.TokenID = tokenID
	token.TokenHash = tokenHash
	token.ExpiresAt = expiresAt
	token.RevokedAt = nil
	token.ReplacedByTokenID = nil

	return &token, nil
}

func RevokeRefreshToken(db *sql.DB, tokenID string) error {
	return revokeRefreshToken(db, tokenID)
}

func RevokeRefreshTokenTx(tx *sql.Tx, tokenID string) error {
	return revokeRefreshToken(tx, tokenID)
}

func ReplaceRefreshTokenTx(tx *sql.Tx, tokenID, replacedByTokenID string) error {
	query := `
	UPDATE refresh_tokens
	SET
		revoked_at = NOW(),
		replaced_by_token_id = $2
	WHERE token_id = $1 AND revoked_at IS NULL;
`

	result, err := tx.Exec(query, tokenID, replacedByTokenID)
	if err != nil {
		return fmt.Errorf("failed to replace refresh token: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get replaced refresh tokens count: %w", err)
	}

	if rowsAffected == 0 {
		return sql.ErrNoRows
	}

	return nil
}

func revokeRefreshToken(exec refreshTokenExecutor, tokenID string) error {
	query := `
	UPDATE refresh_tokens
	SET revoked_at = NOW()
	WHERE token_id = $1 AND revoked_at IS NULL;
`

	result, err := exec.Exec(query, tokenID)
	if err != nil {
		return fmt.Errorf("failed to revoke refresh token: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get revoked refresh tokens count: %w", err)
	}

	if rowsAffected == 0 {
		return sql.ErrNoRows
	}

	return nil
}

func DeleteRefreshToken(db *sql.DB, id int64) error {
	query := `
	DELETE FROM refresh_tokens
	WHERE id = $1;
`

	result, err := db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete refresh token: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get deleted refresh tokens count: %w", err)
	}

	if rowsAffected == 0 {
		return sql.ErrNoRows
	}

	return nil
}
