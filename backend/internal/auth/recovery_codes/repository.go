package recovery_codes

import (
	"database/sql"
	"fmt"
	"time"
)

type RecoveryCodeRecord struct {
	ID        int64
	UserID    int64
	CodeHash  string
	ExpiresAt time.Time
	CreatedAt time.Time
}

func GetRecoveryCodesByUserID(
	db *sql.DB,
	userID int64,
) ([]RecoveryCodeRecord, error) {
	query := `
	SELECT
		id,
		user_id,
		code_hash,
		expires_at,
		created_at
	FROM recovery_codes
	WHERE user_id = $1
	ORDER BY id;
	`

	rows, err := db.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get recovery codes by user id: %w", err)
	}
	defer rows.Close()

	var codes []RecoveryCodeRecord

	for rows.Next() {
		var code RecoveryCodeRecord

		err := rows.Scan(
			&code.ID,
			&code.UserID,
			&code.CodeHash,
			&code.ExpiresAt,
			&code.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan recovery code: %w", err)
		}

		codes = append(codes, code)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("failed to iterate recovery codes: %w", err)
	}

	return codes, nil
}

func GetRecoveryCodeByHash(
	db *sql.DB,
	userID int64,
	codeHash string,
) (*RecoveryCodeRecord, error) {
	query := `
	SELECT
		id,
		user_id,
		code_hash,
		expires_at,
		created_at
	FROM recovery_codes
	WHERE user_id = $1
	  AND code_hash = $2
	  AND expires_at > now();
	`

	code := &RecoveryCodeRecord{}

	err := db.QueryRow(
		query,
		userID,
		codeHash,
	).Scan(
		&code.ID,
		&code.UserID,
		&code.CodeHash,
		&code.ExpiresAt,
		&code.CreatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get recovery code by hash: %w", err)
	}

	return code, nil
}

func InsertRecoveryCode(
	db *sql.DB,
	userID int64,
	codeHash string,
	expiresAt time.Time,
) error {
	query := `
	INSERT INTO recovery_codes (
		user_id,
		code_hash,
		expires_at
	)
	VALUES ($1, $2, $3);
	`

	_, err := db.Exec(
		query,
		userID,
		codeHash,
		expiresAt,
	)

	if err != nil {
		return fmt.Errorf("failed to insert recovery code: %w", err)
	}

	return nil
}

func DeleteRecoveryCodes(
	db *sql.DB,
	userID int64,
) error {
	query := `
	DELETE FROM recovery_codes
	WHERE user_id = $1;
	`

	_, err := db.Exec(query, userID)

	if err != nil {
		return fmt.Errorf("failed to delete recovery codes: %w", err)
	}

	return nil
}

func DeleteRecoveryCode(
	db *sql.DB,
	id int64,
) error {
	query := `
	DELETE FROM recovery_codes
	WHERE id = $1;
	`

	result, err := db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete recovery code: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get deleted recovery code count: %w", err)
	}

	if rowsAffected == 0 {
		return sql.ErrNoRows
	}

	return nil
}
