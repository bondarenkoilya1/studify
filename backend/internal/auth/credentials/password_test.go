package credentials

import (
	"testing"

	"golang.org/x/crypto/bcrypt"
)

func TestHashPassword(t *testing.T) {
	tests := []struct {
		name     string
		password string
	}{
		{
			name:     "valid password",
			password: "password123",
		},
		{
			name:     "empty password",
			password: "",
		},
		{
			name:     "unicode password",
			password: "пароль123",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := HashPassword(tt.password)
			if err != nil {
				t.Fatalf("HashPassword() error = %v", err)
			}

			if err := bcrypt.CompareHashAndPassword([]byte(got), []byte(tt.password)); err != nil {
				t.Fatalf("HashPassword() produced invalid hash: %v", err)
			}
		})
	}
}
