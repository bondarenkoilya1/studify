package rc

import (
	"context"
	"database/sql"
	"fmt"
	"studify/internal"
)

func GetRecoveryCodesByUserID(ctx context.Context, db internal.DBTX, userID int64) ([]Record, error) {
	rows, err := db.QueryContext(ctx, `
		SELECT id, user_id, code_hash, created_at
		FROM recovery_codes
		WHERE user_id = $1
		ORDER BY id;
	`, userID)
	if err != nil {
		return nil, fmt.Errorf("get recovery codes by user id: %w", err)
	}
	defer rows.Close()

	var codes []Record
	for rows.Next() {
		var code Record
		if err := rows.Scan(&code.ID, &code.UserID, &code.CodeHash, &code.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan recovery code: %w", err)
		}
		codes = append(codes, code)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate recovery codes: %w", err)
	}
	return codes, nil
}

func GetRecoveryCodeByHash(ctx context.Context, db internal.DBTX, userID int64, codeHash string) (*Record, error) {
	code := &Record{}
	err := db.QueryRowContext(ctx, `
		SELECT id, user_id, code_hash, created_at
		FROM recovery_codes
		WHERE user_id = $1 AND code_hash = $2;
	`, userID, codeHash).Scan(&code.ID, &code.UserID, &code.CodeHash, &code.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("get recovery code by hash: %w", err)
	}
	return code, nil
}

func InsertRecoveryCode(ctx context.Context, db internal.DBTX, userID int64, codeHash string) error {
	_, err := db.ExecContext(ctx, `
		INSERT INTO recovery_codes (user_id, code_hash)
		VALUES ($1, $2);
	`, userID, codeHash)
	if err != nil {
		return fmt.Errorf("insert recovery code: %w", err)
	}
	return nil
}

func DeleteRecoveryCodes(ctx context.Context, db internal.DBTX, userID int64) error {
	_, err := db.ExecContext(ctx, `
		DELETE FROM recovery_codes
		WHERE user_id = $1;
	`, userID)
	if err != nil {
		return fmt.Errorf("delete recovery codes: %w", err)
	}
	return nil
}

func DeleteRecoveryCode(ctx context.Context, db internal.DBTX, id int64) error {
	result, err := db.ExecContext(ctx, `
		DELETE FROM recovery_codes
		WHERE id = $1;
	`, id)
	if err != nil {
		return fmt.Errorf("delete recovery code: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("get deleted recovery code count: %w", err)
	}
	if rowsAffected == 0 {
		return sql.ErrNoRows
	}
	return nil
}
