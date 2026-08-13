package config

import "time"

type Config struct {
	AppName           string
	Issuer            string
	JWTAccessSecret   string
	JWTRefreshSecret  string
	TOTPEncryptionKey []byte
	DatabaseURL       string
	ServerAddr        string
	AppURL            string
	Env               string
	CORSOrigins       []string
}

const (
	AccessTokenTTL        = 15 * time.Minute
	RefreshTokenTTL       = 30 * 24 * time.Hour
	ConfirmationTokenTTL  = 4 * time.Hour
	ChallengeTokenTTL     = 2 * time.Minute
	ResetPasswordTokenTTL = 30 * time.Minute
)
