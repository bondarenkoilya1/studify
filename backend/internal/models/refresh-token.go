package models

import "time"

type RefreshTokenRecord struct {
	ID                int64      `json:"id"`
	UserID            UserID     `json:"user_id"`
	TokenID           TokenID    `json:"token_id"`
	TokenHash         TokenHash  `json:"token_hash"`
	ExpiresAt         time.Time  `json:"expires_at"`
	CreatedAt         time.Time  `json:"created_at"`
	RevokedAt         *time.Time `json:"revoked_at"`
	ReplacedByTokenID *TokenID   `json:"replaced_by_token_id"`
}

type UpdateRefreshTokenRequest struct {
	UserID            *UserID    `json:"user_id"`
	TokenID           *TokenID   `json:"token_id"`
	TokenHash         *TokenHash `json:"token_hash"`
	ExpiresAt         *time.Time `json:"expires_at"`
	CreatedAt         *time.Time `json:"created_at"`
	RevokedAt         *time.Time `json:"revoked_at"`
	ReplacedByTokenID *TokenID   `json:"replaced_by_token_id"`
}
