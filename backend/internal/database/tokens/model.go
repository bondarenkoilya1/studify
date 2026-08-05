package tokens

import "time"

type RefreshTokenRecord struct {
	ID                int64
	UserID            int64
	TokenID           string
	TokenHash         string
	ExpiresAt         time.Time
	CreatedAt         time.Time
	RevokedAt         *time.Time
	ReplacedByTokenID *string
}

type ConfirmationTokenRecord struct {
	UserID    int64
	TokenHash string
	ExpiresAt time.Time
	CreatedAt time.Time
}
