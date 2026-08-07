package config

import (
	"errors"
	"os"
	"strings"
)

type Config struct {
	AppName           string
	Issuer            string
	JWTAccessSecret   string
	JWTRefreshSecret  string
	TOTPEncryptionKey string
	DatabaseURL       string
	ServerAddr        string
	AppURL            string
	Env               string
	CORSOrigins       []string
}

func Load() (*Config, error) {
	cfg := &Config{
		AppName:           os.Getenv("APP_NAME"),
		AppURL:            os.Getenv("APP_URL"),
		DatabaseURL:       os.Getenv("DATABASE_URL"),
		Env:               os.Getenv("ENV"),
		Issuer:            os.Getenv("ISSUER"),
		JWTAccessSecret:   os.Getenv("JWT_ACCESS_SECRET"),
		JWTRefreshSecret:  os.Getenv("JWT_REFRESH_SECRET"),
		TOTPEncryptionKey: os.Getenv("TOTP_ENCRYPTION_KEY"),
		ServerAddr:        os.Getenv("SERVER_ADDR"),
		CORSOrigins:       splitEnvList(os.Getenv("CORS_ALLOWED_ORIGINS")),
	}

	if cfg.AppName == "" {
		return nil, errors.New("APP_NAME is empty")
	}

	if cfg.Issuer == "" {
		return nil, errors.New("ISSUER is empty")
	}

	if cfg.JWTAccessSecret == "" {
		return nil, errors.New("JWT_ACCESS_SECRET is empty")
	}

	if cfg.JWTRefreshSecret == "" {
		return nil, errors.New("JWT_REFRESH_SECRET is empty")
	}

	if cfg.TOTPEncryptionKey == "" {
		return nil, errors.New("TOTP_ENCRYPTION_KEY is empty")
	}

	if cfg.DatabaseURL == "" {
		return nil, errors.New("DATABASE_URL is empty")
	}

	if cfg.AppURL == "" {
		return nil, errors.New("APP_URL is empty")
	}

	if cfg.ServerAddr == "" {
		cfg.ServerAddr = ":8080"
	}

	if cfg.Env == "" {
		cfg.Env = "dev"
	}

	if len(cfg.CORSOrigins) == 0 {
		cfg.CORSOrigins = []string{
			"http://localhost:5173",
			"http://localhost:3000",
		}
	}

	return cfg, nil
}

func (c *Config) IsProduction() bool {
	env := strings.ToLower(c.Env)
	return env == "prod" || env == "production"
}

func splitEnvList(value string) []string {
	if value == "" {
		return nil
	}

	parts := strings.Split(value, ",")
	items := make([]string, 0, len(parts))

	for _, part := range parts {
		item := strings.TrimSpace(part)
		if item != "" {
			items = append(items, item)
		}
	}

	return items
}
