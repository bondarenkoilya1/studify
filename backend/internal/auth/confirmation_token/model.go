package ct

import (
	"errors"
	"time"
)

type Record struct {
	UserID    int64
	TokenHash string
	ExpiresAt time.Time
	CreatedAt time.Time
}

var errConfirmationTokenExpired = errors.New("confirmation token has expired")
