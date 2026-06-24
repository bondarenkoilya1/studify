package database

import (
	"database/sql"
	"errors"
	"fmt"
	"studify/internal/models"
	"studify/internal/utils"
)

// GetSubjectsCount returns the number of subjects.
// If there is no tasks, it returns 0, nil
func GetSubjectsCount(db *sql.DB, userID int64) (int64, error) {
	query := `
	SELECT COUNT(*)
	FROM subjects
	WHERE user_id = $1;
`

	var count int64
	err := db.QueryRow(query, userID).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to get subjects count: %w", err)
	}

	return count, nil
}

// GetTasksCount returns the number of tasks.
// If there is no tasks, it returns 0, nil
func GetTasksCount(db *sql.DB, userID int64) (int64, error) {
	query := `
	SELECT COUNT(*)
	FROM tasks t
	JOIN subjects s ON s.id = t.subject_id
	WHERE s.user_id = $1;
`

	var count int64
	err := db.QueryRow(query, userID).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to get tasks count: %w", err)
	}

	return count, nil
}

// GetCompletedTasksCount returns the number of completed tasks.
// If there is no completed tasks, it returns 0, nil
func GetCompletedTasksCount(db *sql.DB, userID int64) (int64, error) {
	query := `
	SELECT COUNT(*)
	FROM tasks t
	JOIN subjects s ON s.id = t.subject_id
	WHERE t.status = 'completed' AND s.user_id = $1;
`

	var count int64
	err := db.QueryRow(query, userID).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to get completed tasks count: %w", err)
	}

	return count, nil
}

// GetOngoingTasksCount returns the number of ongoing tasks.
// If there is no ongoing tasks, it returns 0, nil
func GetOngoingTasksCount(db *sql.DB, userID int64) (int64, error) {
	query := `
	SELECT COUNT(*)
	FROM tasks t
	JOIN subjects s ON s.id = t.subject_id
	WHERE t.status = 'ongoing' AND s.user_id = $1;
`

	var count int64
	err := db.QueryRow(query, userID).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to get ongoing tasks count: %w", err)
	}

	return count, nil
}

// GetNotCompletedTasksCount returns the number of not completed tasks.
// If there are no not completed tasks, it returns 0, nil.
func GetNotCompletedTasksCount(db *sql.DB, userID int64) (int64, error) {
	query := `
	SELECT COUNT(*)
	FROM tasks t
	JOIN subjects s ON s.id = t.subject_id
	WHERE t.status = 'not_completed' AND s.user_id = $1;
`

	var count int64
	err := db.QueryRow(query, userID).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to get not completed tasks count: %w", err)
	}

	return count, nil
}

// GetOverdueTasks returns overdue tasks.
// If there is no task, it returns an empty slice and nil
func GetOverdueTasks(db *sql.DB, userID int64) ([]models.Task, error) {
	query := `
		SELECT
			t.id,
			t.name,
			t.description,
			t.deadline,
			t.status,
			t.subject_id
	FROM tasks t
	JOIN subjects s ON s.id = t.subject_id
	WHERE
		t.status <> 'completed'
		AND t.deadline IS NOT NULL
		AND t.deadline < CURRENT_TIMESTAMP
		AND s.user_id = $1
	ORDER BY t.deadline DESC;
`

	tasks, err := utils.ScanTasks(db, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get overdue tasks: %w", err)
	}

	return tasks, nil
}

// GetNearestDeadlineTask returns closest unfinished task.
// If there is no task, it returns nil, nil
func GetNearestDeadlineTask(db *sql.DB, userID int64) (*models.Task, error) {
	query := `
		SELECT
			t.id,
			t.name,
			t.description,
			t.deadline,
			t.status,
			t.subject_id
	FROM tasks t
	JOIN subjects s ON s.id = t.subject_id
	WHERE
		t.status <> 'completed'
		AND t.deadline IS NOT NULL
		AND t.deadline >= CURRENT_TIMESTAMP
		AND s.user_id = $1
	ORDER BY t.deadline
	LIMIT 1;
`

	var task models.Task
	var deadline sql.NullTime

	err := db.QueryRow(query, userID).Scan(&task.ID, &task.Name, &task.Description, &deadline, &task.Status, &task.SubjectID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}

		return nil, fmt.Errorf("failed to get nearest deadline task: %w", err)
	}
	task.Deadline = utils.NullTimePtr(deadline)

	return &task, nil
}
