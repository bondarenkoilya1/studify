package auth

import "errors"

var (
	ErrInvalidAccessToken  = errors.New("invalid access token")
	ErrInvalidRefreshToken = errors.New("invalid refresh token")
	ErrEmptyTokenSubject   = errors.New("empty token subject")
	ErrEmptyTokenID        = errors.New("empty token id")

	ErrEmptyEmail      = errors.New("email is empty")
	ErrEmptyPassword   = errors.New("password is empty")
	ErrInvalidEmail    = errors.New("invalid email")
	ErrPasswordTooLong = errors.New("password is too long")
	ErrEmailTooLong    = errors.New("email is too long")

	ErrConfirmationTokenExpired = errors.New("confirmation token has expired")
)
