package challenge

import (
	"errors"
	"time"
)

type Record struct {
	ID        int64
	UserID    int64
	TokenHash []byte
	ExpiresAt time.Time
	CreatedAt time.Time
}

var ErrNotFound = errors.New("auth challenge not found")
