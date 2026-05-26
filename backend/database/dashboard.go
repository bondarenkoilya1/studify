package database

import (
	"database/sql"
	"errors"
	"studify/models"
)

func GetSubjectsCount(db *sql.DB) (int64, error) {
	query := `SELECT COUNT (*) FROM subjects;`

	var count int64
	err := db.QueryRow(query).Scan(&count)
	if err != nil {
		return 0, err
	}

	return count, nil
}

func GetTasksCount(db *sql.DB) (int64, error) {
	query := `SELECT COUNT (*) FROM tasks;`

	var count int64
	err := db.QueryRow(query).Scan(&count)
	if err != nil {
		return 0, err
	}

	return count, nil
}

// GetNearestDeadlineTask returns closest unfinished task.
// If there is no task, it returns nil, nil
func GetNearestDeadlineTask(db *sql.DB) (*models.Task, error) {
	query := `
SELECT id, name, deadline, status, subject_id 
FROM tasks 
WHERE status <> 'done' 
	AND deadline >= CURRENT_TIMESTAMP
ORDER BY deadline 
LIMIT 1;
`

	var task models.Task

	err := db.QueryRow(query).Scan(&task.ID, &task.Name, &task.Deadline, &task.Status, &task.SubjectID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}

		return nil, err
	}

	return &task, nil
}
