package database

import (
	"database/sql"
	"fmt"
	"studify/internal/models"
	"time"
)

func scanTasks(db *sql.DB, query string, args ...any) ([]models.Task, error) {
	rows, err := db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query tasks: %w", err)
	}
	defer rows.Close()

	tasks := make([]models.Task, 0)
	for rows.Next() {
		t := &models.Task{}
		var deadline sql.NullTime
		err = rows.Scan(&t.ID, &t.Name, &t.Description, &deadline, &t.Status, &t.SubjectID)
		if err != nil {
			return nil, fmt.Errorf("failed to scan task: %w", err)
		}
		t.Deadline = nullTimePtr(deadline)
		tasks = append(tasks, *t)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("failed to read tasks rows: %w", err)
	}

	return tasks, nil
}

func nullTimePtr(value sql.NullTime) *time.Time {
	if !value.Valid {
		return nil
	}

	return &value.Time
}
