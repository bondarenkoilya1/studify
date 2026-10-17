package rc

import (
	"context"
	"crypto/rand"
	"database/sql"
	"fmt"
	"math/big"
	"studify/internal/util"
)

func Generate() ([]string, error) {
	codes := make([]string, 0, codeCount)

	for range codeCount {
		code, err := generateCode()
		if err != nil {
			return nil, fmt.Errorf("failed to generate recovery code: %w", err)
		}

		codes = append(codes, code)
	}

	return codes, nil
}

func generateCode() (string, error) {
	code := make([]byte, codeLength)

	for i := range code {
		n, err := rand.Int(rand.Reader, big.NewInt(int64(len(alphabet))))
		if err != nil {
			return "", fmt.Errorf("failed to generate random character: %w", err)
		}

		code[i] = alphabet[n.Int64()]
	}

	return fmt.Sprintf(
		"%s-%s-%s",
		code[:4],
		code[4:8],
		code[8:],
	), nil
}

func SaveRecoveryCodes(ctx context.Context, db *sql.DB, userID int64, codes []string) (err error) {
	tx, err := db.Begin()
	if err != nil {
		return fmt.Errorf("begin transaction: %w", err)
	}
	defer tx.Rollback()

	for _, code := range codes {
		hash := util.HashSHA256(code)
		if err = InsertRecoveryCode(ctx, tx, userID, hash); err != nil {
			return fmt.Errorf("insert recovery code: %w", err)
		}
	}

	if err = tx.Commit(); err != nil {
		return fmt.Errorf("commit transaction: %w", err)
	}

	return nil
}
