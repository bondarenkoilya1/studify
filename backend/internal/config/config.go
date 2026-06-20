package config

import (
	"errors"
	"os"
	"strings"
)

type Config struct {
	JWTAccessSecret  string
	JWTRefreshSecret string
	Issuer           string
	DatabaseURL      string
	ServerAddr       string
	Env              string
}

func Load() (*Config, error) {
	cfg := &Config{
		JWTAccessSecret:  os.Getenv("JWT_ACCESS_SECRET"),
		JWTRefreshSecret: os.Getenv("JWT_REFRESH_SECRET"),
		Issuer:           os.Getenv("ISSUER"),
		DatabaseURL:      os.Getenv("DATABASE_URL"),
		ServerAddr:       os.Getenv("SERVER_ADDR"),
		Env:              os.Getenv("ENV"),
	}

	if cfg.JWTAccessSecret == "" {
		return nil, errors.New("JWT_ACCESS_SECRET is empty")
	}

	if cfg.JWTRefreshSecret == "" {
		return nil, errors.New("JWT_REFRESH_SECRET is empty")
	}

	if cfg.Issuer == "" {
		return nil, errors.New("ISSUER is empty")
	}

	if cfg.DatabaseURL == "" {
		return nil, errors.New("DATABASE_URL is empty")
	}

	if cfg.ServerAddr == "" {
		cfg.ServerAddr = ":8080"
	}

	if cfg.Env == "" {
		cfg.Env = "dev"
	}

	return cfg, nil
}

func (c *Config) IsProduction() bool {
	env := strings.ToLower(c.Env)
	return env == "prod" || env == "production"
}
