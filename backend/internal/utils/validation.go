package utils

import (
	"fmt"
	"net/mail"
	"studify/internal/models"
)

func ValidateCredentials(body models.UserRequest, action models.AuthAction) error {
	if err := IsValidEmail(body.Email); err != nil {
		return err
	}

	if err := IsValidPassword(body.Password, action); err != nil {
		return err
	}

	return nil
}

func IsValidEmail(email string) error {
	if email == "" {
		return fmt.Errorf("email is empty")
	}

	if len(email) > 254 {
		return fmt.Errorf("email is too long")
	}

	parsed, err := mail.ParseAddress(email)
	if err != nil || parsed.Address != email {
		return fmt.Errorf("invalid email format")
	}

	return nil
}

/*
	Personal

Password validation intentionally avoids composition rules such as requiring
uppercase letters, digits, symbols, or banning spaces. Those rules often lead
to predictable passwords.
*/
func IsValidPassword(password string, action models.AuthAction) error {
	if password == "" {
		return fmt.Errorf("password is empty")
	}

	if len(password) > 72 {
		return fmt.Errorf("password is too long")
	}

	if action != models.AuthActionRegister {
		return nil
	}

	if len(password) < 8 {
		return fmt.Errorf("password must be at least 8 characters")
	}

	return nil
}
