package token

import (
	"context"
	"database/sql"
	"fmt"
	"log/slog"
	"time"

	"studify/internal/util"
)

// RunCleanup removes unusable tokens at startup and then every hour.
func RunCleanup(ctx context.Context, db *sql.DB) {
	ticker := time.NewTicker(time.Hour)
	defer ticker.Stop()
	for ctx.Err() == nil {
		sweepCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
		err := cleanTokens(sweepCtx, db)
		cancel()
		if err != nil && ctx.Err() == nil {
			slog.ErrorContext(ctx, "failed to clean expired tokens", util.AttrError(err))
		}

		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		}
	}
}

func cleanTokens(ctx context.Context, db *sql.DB) error {
	const batchSize = 500
	queries := []struct {
		name string
		sql  string
	}{
		{"expired auth tokens", `DELETE FROM auth_tokens WHERE id IN (
			SELECT id FROM auth_tokens WHERE expires_at <= now()
			ORDER BY expires_at LIMIT $1 FOR UPDATE SKIP LOCKED)`},
		{"expired refresh tokens", `DELETE FROM refresh_tokens WHERE id IN (
			SELECT id FROM refresh_tokens WHERE expires_at <= now()
			ORDER BY expires_at LIMIT $1 FOR UPDATE SKIP LOCKED)`},
		{"old revoked refresh tokens", `DELETE FROM refresh_tokens WHERE id IN (
			SELECT id FROM refresh_tokens WHERE revoked_at <= now() - interval '7 days'
			ORDER BY revoked_at LIMIT $1 FOR UPDATE SKIP LOCKED)`},
	}

	for _, query := range queries {
		for {
			result, err := db.ExecContext(ctx, query.sql, batchSize)
			if err != nil {
				return fmt.Errorf("delete %s: %w", query.name, err)
			}
			count, err := result.RowsAffected()
			if err != nil {
				return fmt.Errorf("count deleted %s: %w", query.name, err)
			}
			if count < batchSize {
				break
			}
		}
	}
	return nil
}
