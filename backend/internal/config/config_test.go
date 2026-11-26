package config

import (
	"encoding/base64"
	"strings"
	"testing"
)

func TestLoadJWTSecretLength(t *testing.T) {
	t.Setenv("APP_NAME", "Studify")
	t.Setenv("APP_URL", "http://localhost:5173")
	t.Setenv("ISSUER", "studify")
	t.Setenv("DATABASE_URL", "postgresql://localhost/studify")
	t.Setenv("TOTP_ENCRYPTION_KEY", base64.StdEncoding.EncodeToString(make([]byte, 32)))
	t.Setenv("JWT_ACCESS_SECRET", strings.Repeat("a", 32))
	t.Setenv("JWT_REFRESH_SECRET", strings.Repeat("r", 32))

	for _, key := range []string{"JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"} {
		t.Run(key, func(t *testing.T) {
			t.Setenv(key, strings.Repeat("a", 31))
			if _, err := Load(); err == nil || !strings.Contains(err.Error(), key) {
				t.Fatalf("Load() error = %v, want a length error for %s", err, key)
			}
		})
	}
	t.Setenv("ENV", " Production ")
	t.Setenv("METRICS_ADDR", "")
	cfg, err := Load()
	if err != nil {
		t.Fatal(err)
	}
	if !cfg.IsProduction() {
		t.Fatal("expected production mode")
	}
	if cfg.MetricsAddr != "127.0.0.1:9091" {
		t.Fatalf("production metrics listener = %q, want loopback", cfg.MetricsAddr)
	}
}
