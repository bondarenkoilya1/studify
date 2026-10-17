package emailconfirm

import "errors"

var (
	ErrEmailConfirmationNotFound     = errors.New("email confirmation token not found")
	ErrEmailConfirmationTokenExpired = errors.New("confirmation token has expired")
	ErrResendTooSoon                 = errors.New("too soon to resend the confirmation email")
	ErrInvalidConfirmationToken      = errors.New("invalid confirmation token")
)
