package rc

import (
	"context"
	"crypto/rand"
	"fmt"
	"math/big"
	"strings"
	"studify/internal"
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

func Normalize(code string) (string, bool) {
	code = strings.ToUpper(strings.TrimSpace(code))
	if len(code) == codeLength+2 && code[4] == '-' && code[9] == '-' {
		code = code[:4] + code[5:9] + code[10:]
	}
	if len(code) != codeLength {
		return "", false
	}
	for _, char := range code {
		if !strings.ContainsRune(alphabet, char) {
			return "", false
		}
	}
	return code[:4] + "-" + code[4:8] + "-" + code[8:], true
}

func SaveRecoveryCodes(ctx context.Context, db internal.DBTX, userID int64, codes []string) error {
	for _, code := range codes {
		hash := util.HashSHA256(code)
		if err := InsertRecoveryCode(ctx, db, userID, hash); err != nil {
			return fmt.Errorf("insert recovery code: %w", err)
		}
	}

	return nil
}
