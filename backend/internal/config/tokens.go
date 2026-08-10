package config

import "time"

const (
	AccessTokenTTL    = 15 * time.Minute
	RefreshTokenTTL   = 30 * 24 * time.Hour
	ChallengeTokenTTL = 2 * time.Minute
)
