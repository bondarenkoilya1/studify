package config

import (
	"errors"
	"os"
)

type Config struct {
	JWTAccessSecret  string
	JWTRefreshSecret string
	Issuer           string
	DatabaseURL      string
	ServerAddr       string
}

func Load() (*Config, error) {
	cfg := &Config{
		JWTAccessSecret:  os.Getenv("JWT_ACCESS_SECRET"),
		JWTRefreshSecret: os.Getenv("JWT_REFRESH_SECRET"),
		Issuer:           os.Getenv("ISSUER"),
		DatabaseURL:      os.Getenv("DATABASE_URL"),
		ServerAddr:       os.Getenv("SERVER_ADDR"),
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

	return cfg, nil
}
