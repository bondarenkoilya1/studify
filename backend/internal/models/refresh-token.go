package models

import "time"

type RefreshToken struct {
	ID                int64     `json:"id"`
	UserID            int64     `json:"user_id"`
	TokenID           string    `json:"token_id"`
	TokenHash         string    `json:"token_hash"`
	ExpiresAt         time.Time `json:"expires_at"`
	CreatedAt         time.Time `json:"created_at"`
	RevokedAt         time.Time `json:"revoked_at"`
	ReplacedByTokenID string    `json:"replaced_by_token_id"`
}

type UpdateRefreshTokenRequest struct {
	UserID            *int64     `json:"user_id"`
	TokenID           *string    `json:"token_id"`
	TokenHash         *string    `json:"token_hash"`
	ExpiresAt         *time.Time `json:"expires_at"`
	CreatedAt         *time.Time `json:"created_at"`
	RevokedAt         *time.Time `json:"revoked_at"`
	ReplacedByTokenID *string    `json:"replaced_by_token_id"`
}
