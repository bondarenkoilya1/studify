package reset_password

import "errors"

var (
	ErrEmailRequired     = errors.New("email is required")
	ErrMissingToken      = errors.New("missing reset token")
	ErrPasswordsMismatch = errors.New("passwords do not match")
	ErrInvalidPassword   = errors.New("invalid password")
	ErrInvalidResetToken = errors.New("invalid or expired reset token")
)
