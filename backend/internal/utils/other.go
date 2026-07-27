package utils

import (
	"database/sql"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"studify/internal/models"
	"time"

	"github.com/go-chi/chi/v5"
)

func GetID(r *http.Request) (int64, error) {
	idStr := chi.URLParam(r, "id")
	if idStr == "" {
		return 0, fmt.Errorf("missing ID")
	}

	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		return 0, fmt.Errorf("ID must be an integer")
	}

	return id, nil
}

func GetUserID(r *http.Request) (int64, error) {
	userID := r.Context().Value(models.UserIDKey)
	switch id := userID.(type) {
	case models.UserID:
		return int64(id), nil
	case int64:
		return id, nil
	default:
		return 0, fmt.Errorf("missing user ID")
	}
}

func EnsureDir(path string) error {
	if err := os.MkdirAll(path, 0o755); err != nil {
		return fmt.Errorf("prepare storage directory %q: %w", path, err)
	}

	file, err := os.CreateTemp(path, ".check-*")
	if err != nil {
		return fmt.Errorf("storage directory %q is not writable: %w", path, err)
	}

	name := file.Name()

	if err = file.Close(); err != nil {
		return fmt.Errorf("close check file %q: %w", name, err)
	}

	if err = os.Remove(name); err != nil {
		return fmt.Errorf("remove check file %q: %w", name, err)
	}

	return nil
}

func ScanTasks(db *sql.DB, query string, args ...any) ([]models.Task, error) {
	rows, err := db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query tasks: %w", err)
	}
	defer rows.Close()

	tasks := []models.Task{}
	for rows.Next() {
		t := &models.Task{}
		var deadline sql.NullTime
		err = rows.Scan(&t.ID, &t.Name, &t.Description, &deadline, &t.Status, &t.SubjectID)
		if err != nil {
			return nil, fmt.Errorf("failed to scan task: %w", err)
		}
		t.Deadline = NullTimePtr(deadline)
		tasks = append(tasks, *t)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("failed to read tasks rows: %w", err)
	}

	return tasks, nil
}

func NullTimePtr(value sql.NullTime) *time.Time {
	if !value.Valid {
		return nil
	}

	return &value.Time
}
