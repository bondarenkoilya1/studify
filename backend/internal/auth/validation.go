package auth

import (
	"fmt"
	"net/mail"
	"unicode/utf8"
)

const (
	maxEmailLength    = 254
	maxPasswordLength = 72
	minPasswordLength = 8
)

type AuthAction string

const (
	AuthActionRegister AuthAction = "register"
	AuthActionLogin    AuthAction = "login"
)

func ValidateCredentials(email, password string, action AuthAction) error {
	if err := ValidateEmail(email); err != nil {
		return err
	}

	return ValidatePassword(password, action)
}

func ValidateEmail(email string) error {
	if email == "" {
		return ErrEmptyEmail
	}

	if len(email) > maxEmailLength {
		return ErrEmailTooLong
	}

	parsed, err := mail.ParseAddress(email)
	if err != nil || parsed.Address != email {
		return ErrInvalidEmail
	}

	return nil
}

/*
	Personal opinion

Password validation intentionally avoids composition rules such as requiring
uppercase letters, digits, symbols, or banning spaces. Those rules often lead
to predictable passwords.
*/
func ValidatePassword(password string, action AuthAction) error {
	if password == "" {
		return ErrEmptyPassword
	}
	length := utf8.RuneCountInString(password)

	if length > maxPasswordLength {
		return ErrPasswordTooLong
	}

	if action != AuthActionRegister {
		return nil
	}

	if length < minPasswordLength {
		return fmt.Errorf("password must be at least 8 characters")
	}

	return nil
}
