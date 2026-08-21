package task

import (
	"database/sql"
	"fmt"
	"studify/internal/util"
	"time"
)

func ScanTasks(db *sql.DB, query string, args ...any) ([]Task, error) {
	rows, err := db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query tasks: %w", err)
	}
	defer rows.Close()

	tasks := make([]Task, 0)

	for rows.Next() {
		t := &Task{}

		var (
			estimatedTime sql.NullInt64
			scheduledAt   sql.NullTime
			deadline      sql.NullTime
		)

		err := rows.Scan(
			&t.ID,
			&t.SubjectID,
			&t.Name,
			&t.Type,
			&t.Description,
			&estimatedTime,
			&scheduledAt,
			&deadline,
			&t.Status,
			&t.Difficulty,
			&t.Priority,
			&t.CreatedAt,
			&t.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan task: %w", err)
		}

		if estimatedTime.Valid {
			value := int(estimatedTime.Int64)
			t.EstimatedTime = &value
		}

		t.ScheduledAt = util.NullTimePtr(scheduledAt)
		t.Deadline = util.NullTimePtr(deadline)

		tasks = append(tasks, *t)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("failed to read tasks rows: %w", err)
	}

	return tasks, nil
}

func GetTaskByID(db *sql.DB, id, userID int64) (*Task, error) {
	query := `
		SELECT
			t.id,
			t.subject_id,
			t.name,
			t.type,
			t.description,
			t.estimated_time,
			t.scheduled_at,
			t.deadline,
			t.status,
			t.difficulty,
			t.priority,
			t.created_at,
			t.updated_at
		FROM tasks t
		JOIN subjects s ON s.id = t.subject_id
		WHERE t.id = $1
			AND s.user_id = $2;
	`

	tasks, err := ScanTasks(db, query, id, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get task by id: %w", err)
	}

	if len(tasks) == 0 {
		return nil, sql.ErrNoRows
	}

	return &tasks[0], nil
}

func GetTasksByUserID(db *sql.DB, userID int64) ([]Task, error) {
	query := `
		SELECT
			t.id,
			t.subject_id,
			t.name,
			t.type,
			t.description,
			t.estimated_time,
			t.scheduled_at,
			t.deadline,
			t.status,
			t.difficulty,
			t.priority,
			t.created_at,
			t.updated_at
		FROM tasks t
		JOIN subjects s ON s.id = t.subject_id
		WHERE s.user_id = $1
		ORDER BY t.created_at DESC;
	`

	tasks, err := ScanTasks(db, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get tasks: %w", err)
	}

	return tasks, nil
}

func InsertTask(
	db *sql.DB,
	userID int64,
	name string,
	taskType string,
	description string,
	estimatedTime *int,
	scheduledAt *time.Time,
	deadline *time.Time,
	status string,
	difficulty string,
	priority string,
	subjectID int64,
) (*Task, error) {
	query := `
		INSERT INTO tasks (
			subject_id,
			name,
			type,
			description,
			estimated_time,
			scheduled_at,
			deadline,
			status,
			difficulty,
			priority
		)
		SELECT
			$1, $2, $3, $4, $5,
			$6, $7, $8, $9, $10
		WHERE EXISTS (
			SELECT 1
			FROM subjects
			WHERE id = $1
				AND user_id = $11
		)
		RETURNING
			id,
			subject_id,
			name,
			type,
			description,
			estimated_time,
			scheduled_at,
			deadline,
			status,
			difficulty,
			priority,
			created_at,
			updated_at;
	`

	row := db.QueryRow(
		query,
		subjectID,
		name,
		taskType,
		description,
		estimatedTime,
		scheduledAt,
		deadline,
		status,
		difficulty,
		priority,
		userID,
	)

	task := &Task{}

	var estimated sql.NullInt64
	var scheduled sql.NullTime
	var deadlineValue sql.NullTime

	err := row.Scan(
		&task.ID,
		&task.SubjectID,
		&task.Name,
		&task.Type,
		&task.Description,
		&estimated,
		&scheduled,
		&deadlineValue,
		&task.Status,
		&task.Difficulty,
		&task.Priority,
		&task.CreatedAt,
		&task.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, sql.ErrNoRows
		}

		return nil, fmt.Errorf("failed to insert task: %w", err)
	}

	if estimated.Valid {
		value := int(estimated.Int64)
		task.EstimatedTime = &value
	}

	task.ScheduledAt = util.NullTimePtr(scheduled)
	task.Deadline = util.NullTimePtr(deadlineValue)

	return task, nil
}

func UpdateTask(
	db *sql.DB,
	userID, id int64,
	name string,
	taskType string,
	description string,
	estimatedTime *int,
	scheduledAt *time.Time,
	deadline *time.Time,
	status string,
	difficulty string,
	priority string,
	subjectID int64,
) (*Task, error) {
	query := `
		UPDATE tasks t
		SET
			subject_id = $1,
			name = $2,
			type = $3,
			description = $4,
			estimated_time = $5,
			scheduled_at = $6,
			deadline = $7,
			status = $8,
			difficulty = $9,
			priority = $10,
			updated_at = now()
		FROM subjects current_subject, subjects new_subject
		WHERE
			t.id = $11
			AND t.subject_id = current_subject.id
			AND current_subject.user_id = $12
			AND new_subject.id = $1
			AND new_subject.user_id = $12
		RETURNING
			t.id,
			t.subject_id,
			t.name,
			t.type,
			t.description,
			t.estimated_time,
			t.scheduled_at,
			t.deadline,
			t.status,
			t.difficulty,
			t.priority,
			t.created_at,
			t.updated_at;
	`

	task := &Task{}

	var estimated sql.NullInt64
	var scheduled sql.NullTime
	var deadlineValue sql.NullTime

	err := db.QueryRow(
		query,
		subjectID,
		name,
		taskType,
		description,
		estimatedTime,
		scheduledAt,
		deadline,
		status,
		difficulty,
		priority,
		id,
		userID,
	).Scan(
		&task.ID,
		&task.SubjectID,
		&task.Name,
		&task.Type,
		&task.Description,
		&estimated,
		&scheduled,
		&deadlineValue,
		&task.Status,
		&task.Difficulty,
		&task.Priority,
		&task.CreatedAt,
		&task.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, sql.ErrNoRows
		}

		return nil, fmt.Errorf("failed to update task: %w", err)
	}

	if estimated.Valid {
		value := int(estimated.Int64)
		task.EstimatedTime = &value
	}

	task.ScheduledAt = util.NullTimePtr(scheduled)
	task.Deadline = util.NullTimePtr(deadlineValue)

	return task, nil
}
func DeleteTasksByUserID(db *sql.DB, userID int64) error {
	query := `
	DELETE FROM tasks t
	USING subjects s
	WHERE t.subject_id = s.id AND s.user_id = $1;
`

	_, err := db.Exec(query, userID)
	if err != nil {
		return fmt.Errorf("failed to delete tasks: %w", err)
	}

	return nil
}

func DeleteTaskByID(db *sql.DB, userID, id int64) error {
	query := `
	DELETE FROM tasks t
	USING subjects s
	WHERE t.id = $1 AND t.subject_id = s.id AND s.user_id = $2;
`

	result, err := db.Exec(query, id, userID)
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
