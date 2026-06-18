package database

import (
	"database/sql"
	"fmt"
	"studify/internal/models"
)

func scanTasks(db *sql.DB, query string) ([]models.Task, error) {
	rows, err := db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query tasks: %w", err)
	}
	defer rows.Close()

	tasks := []models.Task{}
	for rows.Next() {
		t := &models.Task{}
		err = rows.Scan(&t.ID, &t.Name, &t.Deadline, &t.Status, &t.SubjectID)
		if err != nil {
			return nil, fmt.Errorf("failed to scan task: %w", err)
		}
		tasks = append(tasks, *t)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("failed to read tasks rows: %w", err)
	}

	return tasks, nil
}
