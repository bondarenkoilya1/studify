package utils

import (
	"fmt"
	"regexp"
	"strings"
	"studify/internal/models"
)

var (
	usernameRegexp = regexp.MustCompile(`^[A-Za-z0-9._]+$`)
)

func ValidateCredentials(body models.UserRequest, action models.AuthAction) error {
	if err := IsValidUsername(body.Username); err != nil {
		return err
	}

	if err := IsValidPassword(body.Password, action); err != nil {
		return err
	}

	return nil
}

func IsValidUsername(username string) error {
	if username == "" {
		return fmt.Errorf("username is empty")
	}

	if len(username) < 3 {
		return fmt.Errorf("username must be at least 3 characters")
	}

	if len(username) > 32 {
		return fmt.Errorf("username must be 32 characters or fewer")
	}

	if strings.HasPrefix(username, ".") || strings.HasSuffix(username, ".") {
		return fmt.Errorf("username cannot start or end with a dot")
	}

	if strings.Contains(username, "..") {
		return fmt.Errorf("username cannot contain consecutive dots")
	}

	if !usernameRegexp.MatchString(username) {
		return fmt.Errorf("username can contain only English letters, numbers, dots, and underscores")
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
