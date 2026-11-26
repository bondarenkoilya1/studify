package subject

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"strings"
	"time"

	"studify/internal/util"

	"github.com/google/uuid"
)

// RunFileCleanup removes files queued by committed deletions, including cascades.
func (s *Service) RunFileCleanup(ctx context.Context) {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()
	for ctx.Err() == nil {
		for range 100 {
			found, err := s.cleanNextFile(ctx)
			if err != nil && ctx.Err() == nil {
				slog.ErrorContext(ctx, "failed to process subject file cleanup", util.AttrError(err))
			}
			if err != nil || !found {
				break
			}
		}
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		}
	}
}

func (s *Service) cleanNextFile(ctx context.Context) (bool, error) {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return false, err
	}
	defer func() { _ = tx.Rollback() }()

	var url string
	err = tx.QueryRowContext(ctx, `SELECT path FROM subject_file_cleanup
		WHERE retry_after <= now() ORDER BY retry_after, path
		LIMIT 1 FOR UPDATE SKIP LOCKED`).Scan(&url)
	if errors.Is(err, sql.ErrNoRows) {
		return false, nil
	}
	if err != nil {
		return false, err
	}

	path, isThumbnail := cleanupAssetPath(url)
	if isThumbnail {
		var inUse bool
		err = tx.QueryRowContext(ctx, `SELECT EXISTS (
			SELECT 1 FROM subjects WHERE thumbnail_url = $1
		)`, url).Scan(&inUse)
		if err != nil {
			return false, err
		}
		if inUse {
			path = ""
		}
	}

	query := `DELETE FROM subject_file_cleanup WHERE path = $1`
	if path != "" {
		if err := os.Remove(path); err != nil && !errors.Is(err, os.ErrNotExist) {
			slog.ErrorContext(ctx, "failed to remove deleted subject asset",
				util.AttrPath(path),
				util.AttrError(err),
			)
			query = `UPDATE subject_file_cleanup SET retry_after = now() + interval '1 minute' WHERE path = $1`
		}
	}
	if _, err := tx.ExecContext(ctx, query, url); err != nil {
		return false, fmt.Errorf("update subject file cleanup queue: %w", err)
	}

	return true, tx.Commit()
}

func cleanupAssetPath(url string) (path string, isThumbnail bool) {
	dir := filesDir
	filename, found := strings.CutPrefix(url, filesPublicDir)
	if !found {
		filename, found = strings.CutPrefix(url, thumbnailsPublicDir)
		if !found {
			return "", false
		}
		dir, isThumbnail = thumbnailsDir, true
	}
	ext := filepath.Ext(filename)
	if isThumbnail && ext != ".webp" || !isThumbnail && ext != ".pdf" && ext != ".txt" {
		return "", false
	}
	id, err := uuid.Parse(strings.TrimSuffix(filename, ext))
	if err != nil || filename != id.String()+ext {
		return "", false
	}
	return filepath.Join(dir, filename), isThumbnail
}
