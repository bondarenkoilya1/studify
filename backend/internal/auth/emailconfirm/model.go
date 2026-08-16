package emailconfirm

import (
	"errors"
	"time"
)

type Record struct {
	UserID    int64
	TokenHash []byte
	ExpiresAt time.Time
	CreatedAt time.Time
}

var (
	NotFound = errors.New("email confirmation token not found")

	ErrConfirmationTokenExpired = errors.New(
		"confirmation token has expired",
	)
)
