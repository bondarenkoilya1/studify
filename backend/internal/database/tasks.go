package database

import (
	"database/sql"
	"fmt"
	"studify/internal/models"
	"studify/internal/utils"
	"time"
)

func GetTaskByID(db *sql.DB, id int64) (*models.Task, error) {
	query := `
		SELECT
			id,
			name,
			description,
			deadline,
			status,
			subject_id
	FROM tasks
	WHERE id = $1;
`

	row := db.QueryRow(query, id)
	t := &models.Task{}
	var deadline sql.NullTime

	err := row.Scan(&t.ID, &t.Name, &t.Description, &deadline, &t.Status, &t.SubjectID)
	if err != nil {
		return nil, fmt.Errorf("failed to get task by id: %w", err)
	}
	t.Deadline = utils.NullTimePtr(deadline)

	return t, nil
}

func GetTasks(db *sql.DB) ([]models.Task, error) {
	query := `
		SELECT
			id,
			name,
			description,
			deadline,
			status,
			subject_id
	FROM tasks;
`

	tasks, err := utils.ScanTasks(db, query)
	if err != nil {
		return nil, fmt.Errorf("failed to get tasks: %w", err)
	}

	return tasks, nil
}

func InsertTask(db *sql.DB, name, description string, deadline *time.Time, status string, subjectID int64) (*models.Task, error) {
	query := `
	INSERT INTO tasks (
		name,
		description,
		deadline,
		status,
		subject_id
	)
	VALUES ($1, $2, $3, $4, $5)
	RETURNING id;
`

	var id int64
	if err := db.QueryRow(query, name, description, deadline, status, subjectID).Scan(&id); err != nil {
		return nil, fmt.Errorf("failed to insert task: %w", err)
	}

	return &models.Task{
		ID:          id,
		Name:        name,
		Description: description,
		Deadline:    deadline,
		Status:      status,
		SubjectID:   subjectID,
	}, nil
}

func UpdateTask(db *sql.DB, id int64, name, description string, deadline *time.Time, status string, subjectID int64) (*models.Task, error) {
	query := `
	UPDATE tasks
	SET
		name = $1,
		description = $2,
		deadline = $3,
		status = $4,
		subject_id = $5
	WHERE id = $6;
`

	result, err := db.Exec(query, name, description, deadline, status, subjectID, id)
	if err != nil {
		return nil, fmt.Errorf("failed to update task: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return nil, fmt.Errorf("failed to get updated tasks count: %w", err)
	}

	if rowsAffected == 0 {
		return nil, sql.ErrNoRows
	}

	return &models.Task{
		ID:          id,
		Name:        name,
		Description: description,
		Deadline:    deadline,
		Status:      status,
		SubjectID:   subjectID,
	}, nil
}

func DeleteTasks(db *sql.DB) error {
	query := `
	DELETE FROM tasks;
`

	_, err := db.Exec(query)
	if err != nil {
		return fmt.Errorf("failed to delete tasks: %w", err)
	}

	return nil
}

func DeleteTask(db *sql.DB, id int64) error {
	query := `
	DELETE FROM tasks
	WHERE id = $1;
`

	result, err := db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete task: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get deleted tasks count: %w", err)
	}

	if rowsAffected == 0 {
		return sql.ErrNoRows
	}

	return nil
}
