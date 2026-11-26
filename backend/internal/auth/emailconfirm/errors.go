package emailconfirm

import "errors"

var (
	ErrResendTooSoon            = errors.New("too soon to resend the confirmation email")
	ErrAlreadyVerified          = errors.New("email already verified")
	ErrInvalidConfirmationToken = errors.New("invalid confirmation token")
)
