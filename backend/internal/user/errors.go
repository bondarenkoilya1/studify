package user

import "errors"

var (
	ErrEmailRequired  = errors.New("email is required")
	ErrEmailInvalid   = errors.New("invalid email")
	ErrEmailUnchanged = errors.New("new email is the same as current")
	ErrEmailTaken     = errors.New("email already taken")

	ErrUserAlreadyExists = errors.New("user already exists")
	ErrUserNotFound      = errors.New("user not found")
)
