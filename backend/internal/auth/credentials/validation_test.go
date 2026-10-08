package credentials

import (
	"errors"
	"strings"
	"testing"
)

func TestValidateEmail(t *testing.T) {
	tests := []struct {
		name    string
		email   string
		wantErr bool
	}{
		{
			name:    "valid email",
			email:   "user@example.com",
			wantErr: false,
		},
		{
			name:    "empty email",
			email:   "",
			wantErr: true,
		},
		{
			name:    "email without at sign",
			email:   "user.example.com",
			wantErr: true,
		},
		{
			name:    "email with exactly maximum length",
			email:   strings.Repeat("a", maxEmailLength-12) + "@example.com",
			wantErr: false,
		},
		{
			name:    "email longer than maximum length",
			email:   strings.Repeat("a", maxEmailLength) + "@example.com",
			wantErr: true,
		},
		{
			name:    "email with display name",
			email:   "John Doe <john@example.com>",
			wantErr: true,
		},
		{
			name:    "email with leading space",
			email:   " user@example.com",
			wantErr: true,
		},
		{
			name:    "email with trailing space",
			email:   "user@example.com ",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateEmail(tt.email)

			if (err != nil) != tt.wantErr {
				t.Fatalf(
					"ValidateEmail() error = %v, wantErr %v",
					err,
					tt.wantErr,
				)
			}
		})
	}
}

func TestValidatePassword(t *testing.T) {
	tests := []struct {
		name     string
		password string
		action   Action
		wantErr  bool
	}{
		{
			name:     "valid register password",
			password: "Kkmazz.k$!@@S",
			action:   ActionRegister,
			wantErr:  false,
		},
		{
			name:     "valid login password",
			password: "DAkmmmz__)#$!",
			action:   ActionLogin,
			wantErr:  false,
		},
		{
			name:     "empty password",
			password: "",
			action:   ActionRegister,
			wantErr:  true,
		},
		{
			name:     "password shorter than minimum",
			password: "1234567",
			action:   ActionRegister,
			wantErr:  true,
		},
		{
			name:     "password with exactly minimum length",
			password: "12345678",
			action:   ActionRegister,
			wantErr:  false,
		},
		{
			name:     "password with exactly maximum length",
			password: strings.Repeat("a", maxPasswordLength),
			action:   ActionRegister,
			wantErr:  false,
		},
		{
			name:     "password longer than maximum",
			password: strings.Repeat("a", maxPasswordLength+1),
			action:   ActionRegister,
			wantErr:  true,
		},
		{
			name:     "short password is allowed during login",
			password: "123",
			action:   ActionLogin,
			wantErr:  false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidatePassword(tt.password, tt.action)

			if (err != nil) != tt.wantErr {
				t.Fatalf(
					"ValidatePassword() error = %v, wantErr %v",
					err,
					tt.wantErr,
				)
			}
		})
	}
}

func TestValidateCredentials(t *testing.T) {

	tests := []struct {
		name     string
		email    string
		password string
		action   Action
		wantErr  error
	}{
		{
			name:     "valid register credentials",
			email:    "user@example.com",
			password: "password123",
			action:   ActionRegister,
			wantErr:  nil,
		},
		{
			name:     "valid login credentials",
			email:    "user@example.com",
			password: "password123",
			action:   ActionLogin,
			wantErr:  nil,
		},
		{
			name:     "empty email",
			email:    "",
			password: "password123",
			action:   ActionRegister,
			wantErr:  ErrEmptyEmail,
		},
		{
			name:     "invalid email",
			email:    "invalid-email",
			password: "password123",
			action:   ActionRegister,
			wantErr:  ErrInvalidEmail,
		},
		{
			name:     "empty password",
			email:    "user@example.com",
			password: "",
			action:   ActionRegister,
			wantErr:  ErrEmptyPassword,
		},
		{
			name:     "password too short",
			email:    "user@example.com",
			password: "1234567",
			action:   ActionRegister,
			wantErr:  errors.New("password must be at least 8 characters"),
		},
		{
			name:     "email error has priority",
			email:    "",
			password: "",
			action:   ActionRegister,
			wantErr:  ErrEmptyEmail,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateCredentials(
				tt.email,
				tt.password,
				tt.action,
			)
			if tt.wantErr == nil {
				if err != nil {
					t.Fatalf("ValidateCredentials() error = %v, want nil", err)
				}
				return
			}
			if tt.wantErr.Error() != err.Error() {
				t.Fatalf(
					"ValidateCredentials() error = %v, wantErr %v",
					err,
					tt.wantErr,
				)
			}
		})
	}

}
