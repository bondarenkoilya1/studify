package rc

import "time"

type Record struct {
	ID        int64
	UserID    int64
	CodeHash  string
	ExpiresAt time.Time
	CreatedAt time.Time
}

const (
	codeLength = 12
	codeCount  = 10
	alphabet   = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
)
