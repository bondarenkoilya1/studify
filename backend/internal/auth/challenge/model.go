package challenge

import (
	"errors"
	"time"
)

type record struct {
	ID        int64
	UserID    int64
	TokenHash string
	ExpiresAt time.Time
	CreatedAt time.Time
}

var NotFound = errors.New("auth challenge not found")
