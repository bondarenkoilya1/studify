package rc

import (
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"database/sql"
	"encoding/hex"
	"fmt"
	"math/big"
)

const (
	codeLength = 12
	codeCount  = 10
	alphabet   = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
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

func SaveRecoveryCodes(db *sql.DB, userID int64, codes []string) (err error) {
	tx, err := db.Begin()
	if err != nil {
		return fmt.Errorf("begin transaction: %w", err)
	}
	defer tx.Rollback()

	for _, code := range codes {
		hash := HashRecoveryCode(code)
		if err = InsertRecoveryCode(tx, userID, hash); err != nil {
			return fmt.Errorf("insert recovery code: %w", err)
		}
	}

	if err = tx.Commit(); err != nil {
		return fmt.Errorf("commit transaction: %w", err)
	}

	return nil
}

// TODO: similar, can be as util

func HashRecoveryCode(code string) string {
	sum := sha256.Sum256([]byte(code))
	return hex.EncodeToString(sum[:])
}

func CompareRecoveryCodeHash(code string, expectedHash string) bool {
	codeHash := HashRecoveryCode(code)
	return subtle.ConstantTimeCompare([]byte(codeHash), []byte(expectedHash)) == 1
}
