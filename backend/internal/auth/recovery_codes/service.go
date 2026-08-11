package rc

import (
	"crypto/rand"
	"fmt"
	"math/big"
)

const (
	codeLength = 10
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
