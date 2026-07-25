package models

import "time"

type ConfirmationTokenRecord struct {
	UserID    UserID
	TokenHash TokenHash
	ExpiresAt time.Time
	CreatedAt time.Time
}
