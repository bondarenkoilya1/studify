package database

import (
	"database/sql"
	"errors"
	"studify/models"
)

// GetSubjectsCount returns the number of subjects.
// If there is no tasks, it returns 0, nil
func GetSubjectsCount(db *sql.DB) (int64, error) {
	query := `SELECT COUNT (*) FROM subjects;`

	var count int64
	err := db.QueryRow(query).Scan(&count)
	if err != nil {
		return 0, err
	}

	return count, nil
}

// GetTasksCount returns the number of tasks.
// If there is no tasks, it returns 0, nil
func GetTasksCount(db *sql.DB) (int64, error) {
	query := `SELECT COUNT (*) FROM tasks;`

	var count int64
	err := db.QueryRow(query).Scan(&count)
	if err != nil {
		return 0, err
	}

	return count, nil
}

// GetCompletedTasksCount returns the number of completed tasks.
// If there is no completed tasks, it returns 0, nil
func GetCompletedTasksCount(db *sql.DB) (int64, error) {
	query := `SELECT COUNT (*) FROM tasks WHERE status = 'completed';`

	var count int64
	err := db.QueryRow(query).Scan(&count)
	if err != nil {
		return 0, err
	}

	return count, nil
}

// GetOngoingTasksCount returns the number of ongoing tasks.
// If there is no ongoing tasks, it returns 0, nil
func GetOngoingTasksCount(db *sql.DB) (int64, error) {
	query := `SELECT COUNT (*) FROM tasks WHERE status = 'ongoing';`

	var count int64
	err := db.QueryRow(query).Scan(&count)
	if err != nil {
		return 0, err
	}

	return count, nil
}

// GetTodoTasksCount returns the number of todo tasks.
// If there is no todo tasks, it returns 0, nil
func GetTodoTasksCount(db *sql.DB) (int64, error) {
	query := `SELECT COUNT (*) FROM tasks WHERE status = 'todo';`

	var count int64
	err := db.QueryRow(query).Scan(&count)
	if err != nil {
		return 0, err
	}

	return count, nil
}

// GetOverdueTasks returns overdue tasks.
// If there is no task, it returns an empty slice and nil
func GetOverdueTasks(db *sql.DB) ([]models.Task, error) {
	query := `
SELECT id, name, deadline, status, subject_id 
FROM tasks 
WHERE status <> 'completed' 
	AND deadline < CURRENT_TIMESTAMP
ORDER BY deadline DESC;
`

	tasks, err := scanTasks(db, query)
	if err != nil {
		return nil, err
	}

	return tasks, nil
}

// GetNearestDeadlineTask returns closest unfinished task.
// If there is no task, it returns nil, nil
func GetNearestDeadlineTask(db *sql.DB) (*models.Task, error) {
	query := `
SELECT id, name, deadline, status, subject_id 
FROM tasks 
WHERE status <> 'completed' 
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
