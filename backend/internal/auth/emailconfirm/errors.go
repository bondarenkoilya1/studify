package emailconfirm

import "errors"

var (
	ErrResendTooSoon            = errors.New("too soon to resend the confirmation email")
	ErrInvalidConfirmationToken = errors.New("invalid confirmation token")
)
