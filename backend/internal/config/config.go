package config

import (
	"encoding/base64"
	"errors"
	"fmt"
	"net"
	"net/mail"
	"net/netip"
	"os"
	"strconv"
	"strings"
)

func Load() (*Config, error) {
	cfg := &Config{
		AppName:           os.Getenv("APP_NAME"),
		AppURL:            os.Getenv("APP_URL"),
		DatabaseURL:       os.Getenv("DATABASE_URL"),
		Env:               os.Getenv("ENV"),
		Issuer:            os.Getenv("ISSUER"),
		JWTAccessSecret:   os.Getenv("JWT_ACCESS_SECRET"),
		JWTRefreshSecret:  os.Getenv("JWT_REFRESH_SECRET"),
		ServerAddr:        os.Getenv("SERVER_ADDR"),
		MetricsAddr:       os.Getenv("METRICS_ADDR"),
		CORSOrigins:       splitEnvList(os.Getenv("CORS_ALLOWED_ORIGINS")),
		TrustedProxyCIDRs: splitEnvList(os.Getenv("TRUSTED_PROXY_CIDRS")),
	}

	if cfg.AppName == "" {
		return nil, errors.New("APP_NAME is empty")
	}

	if cfg.Issuer == "" {
		return nil, errors.New("ISSUER is empty")
	}

	const minJWTSecretBytes = 32
	if len(cfg.JWTAccessSecret) < minJWTSecretBytes {
		return nil, fmt.Errorf("JWT_ACCESS_SECRET must be at least %d bytes", minJWTSecretBytes)
	}

	if len(cfg.JWTRefreshSecret) < minJWTSecretBytes {
		return nil, fmt.Errorf("JWT_REFRESH_SECRET must be at least %d bytes", minJWTSecretBytes)
	}

	totpEncryptionKey := os.Getenv("TOTP_ENCRYPTION_KEY")
	if totpEncryptionKey == "" {
		return nil, errors.New("TOTP_ENCRYPTION_KEY is empty")
	}

	decodedKey, err := base64.StdEncoding.DecodeString(totpEncryptionKey)
	if err != nil {
		return nil, fmt.Errorf("decode TOTP_ENCRYPTION_KEY: %w", err)
	}

	if len(decodedKey) != 32 {
		return nil, fmt.Errorf(
			"TOTP_ENCRYPTION_KEY must decode to 32 bytes, got %d",
			len(decodedKey),
		)
	}

	cfg.TOTPEncryptionKey = decodedKey

	if cfg.DatabaseURL == "" {
		return nil, errors.New("DATABASE_URL is empty")
	}

	cfg.DBMaxOpenConns, err = readDBPoolSize("DB_MAX_OPEN_CONNS", 20, 1)
	if err != nil {
		return nil, err
	}
	cfg.DBMaxIdleConns, err = readDBPoolSize("DB_MAX_IDLE_CONNS", min(5, cfg.DBMaxOpenConns), 0)
	if err != nil {
		return nil, err
	}
	if cfg.DBMaxIdleConns > cfg.DBMaxOpenConns {
		return nil, errors.New("DB_MAX_IDLE_CONNS cannot exceed DB_MAX_OPEN_CONNS")
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
	if cfg.IsProduction() && cfg.MetricsAddr == "" {
		cfg.MetricsAddr = "127.0.0.1:9091"
	}

	smtpHost := os.Getenv("SMTP_HOST")
	if smtpHost == "" {
		smtpHost = "localhost"
	}

	smtpPort := os.Getenv("SMTP_PORT")
	if smtpPort == "" {
		smtpPort = "1025"
	}

	cfg.SMTPAddr = net.JoinHostPort(smtpHost, smtpPort)
	cfg.MailFrom = os.Getenv("MAIL_FROM")
	if cfg.MailFrom == "" {
		cfg.MailFrom = "noreply@studify.com"
	}
	sender, err := mail.ParseAddress(cfg.MailFrom)
	if err != nil {
		return nil, fmt.Errorf("invalid MAIL_FROM: %w", err)
	}
	cfg.MailFrom = sender.Address
	cfg.SMTPUsername = os.Getenv("SMTP_USERNAME")
	cfg.SMTPPassword = os.Getenv("SMTP_PASSWORD")
	if (cfg.SMTPUsername == "") != (cfg.SMTPPassword == "") {
		return nil, errors.New("SMTP_USERNAME and SMTP_PASSWORD must be set together")
	}

	if len(cfg.CORSOrigins) == 0 {
		cfg.CORSOrigins = []string{
			"http://localhost:5173",
			"http://localhost:3000",
		}
	}

	for _, cidr := range cfg.TrustedProxyCIDRs {
		if _, err := netip.ParsePrefix(cidr); err != nil {
			return nil, fmt.Errorf("invalid TRUSTED_PROXY_CIDRS entry %q: %w", cidr, err)
		}
	}

	return cfg, nil
}

func (c *Config) IsProduction() bool {
	env := strings.ToLower(strings.TrimSpace(c.Env))

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

func readDBPoolSize(name string, fallback, minimum int) (int, error) {
	raw := os.Getenv(name)
	if raw == "" {
		return fallback, nil
	}
	value, err := strconv.Atoi(raw)
	if err != nil || value < minimum {
		return 0, fmt.Errorf("%s must be an integer greater than or equal to %d", name, minimum)
	}
	return value, nil
}
