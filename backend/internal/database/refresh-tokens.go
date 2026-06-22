package database

import (
	"database/sql"
	"fmt"
	"studify/internal/models"
	"time"
)

func GetRefreshTokenByID(db *sql.DB, id int64) (*models.RefreshTokenRecord, error) {
	query := `
	SELECT
		id,
		user_id,
		token_id,
		token_hash,
		expires_at,
		created_at,
		revoked_at,
		replaced_by_token_id
	FROM refresh_tokens
	WHERE id = $1;
`

	row := db.QueryRow(query, id)
	refreshToken := &models.RefreshTokenRecord{}

	err := row.Scan(
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
		return nil, fmt.Errorf("failed to get refresh token by id: %w", err)
	}

	return refreshToken, nil
}

func GetRefreshTokenByTokenID(db *sql.DB, tokenID string) (*models.RefreshTokenRecord, error) {
	query := `
	SELECT
		id,
		user_id,
		token_id,
		token_hash,
		expires_at,
		created_at,
		revoked_at,
		replaced_by_token_id
	FROM refresh_tokens
	WHERE token_id = $1;
`

	row := db.QueryRow(query, tokenID)
	refreshToken := &models.RefreshTokenRecord{}

	err := row.Scan(
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
		return nil, fmt.Errorf("failed to get refresh token by token id: %w", err)
	}

	return refreshToken, nil
}

func GetRefreshTokenByTokenHash(db *sql.DB, tokenHash string) (*models.RefreshTokenRecord, error) {
	query := `
	SELECT
		id,
		user_id,
		token_id,
		token_hash,
		expires_at,
		created_at,
		revoked_at,
		replaced_by_token_id
	FROM refresh_tokens
	WHERE token_hash = $1;
`

	row := db.QueryRow(query, tokenHash)
	refreshToken := &models.RefreshTokenRecord{}

	err := row.Scan(
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
		return nil, fmt.Errorf("failed to get refresh token by token hash: %w", err)
	}

	return refreshToken, nil
}

func GetRefreshTokens(db *sql.DB) ([]models.RefreshTokenRecord, error) {
	query := `
	SELECT
		id,
		user_id,
		token_id,
		token_hash,
		expires_at,
		created_at,
		revoked_at,
		replaced_by_token_id
	FROM refresh_tokens;
`

	rows, err := db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to get refresh tokens: %w", err)
	}
	defer rows.Close()

	refreshTokens := []models.RefreshTokenRecord{}

	for rows.Next() {
		var refreshToken models.RefreshTokenRecord

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

func GetRefreshTokensByUserID(db *sql.DB, userID int64) ([]models.RefreshTokenRecord, error) {
	query := `
	SELECT
		id,
		user_id,
		token_id,
		token_hash,
		expires_at,
		created_at,
		revoked_at,
		replaced_by_token_id
	FROM refresh_tokens
	WHERE user_id = $1;
`

	rows, err := db.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get refresh tokens by user id: %w", err)
	}
	defer rows.Close()

	refreshTokens := []models.RefreshTokenRecord{}

	for rows.Next() {
		var refreshToken models.RefreshTokenRecord

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

func InsertRefreshToken(db *sql.DB, userID int64, tokenID, tokenHash string, expiresAt time.Time) (*models.RefreshTokenRecord, error) {
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

	var token models.RefreshTokenRecord
	if err := db.QueryRow(query, userID, tokenID, tokenHash, expiresAt).Scan(&token.ID, &token.CreatedAt); err != nil {
		return nil, fmt.Errorf("failed to insert refresh token: %w", err)
	}

	token.UserID = models.UserID(userID)
	token.TokenID = models.TokenID(tokenID)
	token.TokenHash = models.TokenHash(tokenHash)
	token.ExpiresAt = expiresAt
	token.RevokedAt = nil
	token.ReplacedByTokenID = nil

	return &token, nil
}

func UpdateRefreshToken(db *sql.DB, id, userID int64, tokenID, tokenHash string, expiresAt, createdAt time.Time, revokedAt *time.Time, replacedByTokenID *string) (*models.RefreshTokenRecord, error) {
	query := `
	UPDATE refresh_tokens
	SET
		user_id = $1,
		token_id = $2,
		token_hash = $3,
		expires_at = $4,
		created_at = $5,
		revoked_at = $6,
		replaced_by_token_id = $7
	WHERE id = $8;
`

	result, err := db.Exec(query, userID, tokenID, tokenHash, expiresAt, createdAt, revokedAt, replacedByTokenID, id)
	if err != nil {
		return nil, fmt.Errorf("failed to update refresh token: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return nil, fmt.Errorf("failed to get updated refresh tokens count: %w", err)
	}

	if rowsAffected == 0 {
		return nil, sql.ErrNoRows
	}

	var replacedByToken *models.TokenID
	if replacedByTokenID != nil {
		tokenID := models.TokenID(*replacedByTokenID)
		replacedByToken = &tokenID
	}

	return &models.RefreshTokenRecord{
		ID:                id,
		UserID:            models.UserID(userID),
		TokenID:           models.TokenID(tokenID),
		TokenHash:         models.TokenHash(tokenHash),
		ExpiresAt:         expiresAt,
		CreatedAt:         createdAt,
		RevokedAt:         revokedAt,
		ReplacedByTokenID: replacedByToken,
	}, nil
}

func RevokeRefreshToken(db *sql.DB, tokenID string) error {
	query := `
	UPDATE refresh_tokens
	SET revoked_at = NOW()
	WHERE token_id = $1;
`

	result, err := db.Exec(query, tokenID)
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

func DeleteRefreshTokens(db *sql.DB) error {
	query := `
	DELETE FROM refresh_tokens;
`

	_, err := db.Exec(query)
	if err != nil {
		return fmt.Errorf("failed to delete refresh tokens: %w", err)
	}

	return nil
}
