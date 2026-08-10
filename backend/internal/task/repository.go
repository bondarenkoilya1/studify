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
		var deadline sql.NullTime
		err = rows.Scan(&t.ID, &t.Name, &t.Description, &deadline, &t.Status, &t.SubjectID)
		if err != nil {
			return nil, fmt.Errorf("failed to scan task: %w", err)
		}
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
			t.name,
			t.description,
			t.deadline,
			t.status,
			t.subject_id
	FROM tasks t
	JOIN subjects s ON s.id = t.subject_id
	WHERE t.id = $1 AND s.user_id = $2;
`

	row := db.QueryRow(query, id, userID)
	t := &Task{}
	var deadline sql.NullTime

	err := row.Scan(&t.ID, &t.Name, &t.Description, &deadline, &t.Status, &t.SubjectID)
	if err != nil {
		return nil, fmt.Errorf("failed to get task by id: %w", err)
	}
	t.Deadline = util.NullTimePtr(deadline)

	return t, nil
}

func GetTasksByUserID(db *sql.DB, userID int64) ([]Task, error) {
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
	WHERE s.user_id = $1;
`

	tasks, err := ScanTasks(db, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get tasks: %w", err)
	}

	return tasks, nil
}

func InsertTask(db *sql.DB, userID int64, name, description string, deadline *time.Time, status string, subjectID int64) (*Task, error) {
	query := `
	INSERT INTO tasks (
		name,
		description,
		deadline,
		status,
		subject_id
	)
	SELECT $1, $2, $3, $4, $5
	WHERE EXISTS (
		SELECT 1
		FROM subjects
		WHERE id = $5 AND user_id = $6
	)
	RETURNING id;
`

	var id int64
	if err := db.QueryRow(query, name, description, deadline, status, subjectID, userID).Scan(&id); err != nil {
		return nil, fmt.Errorf("failed to insert task: %w", err)
	}

	return &Task{
		ID:          id,
		Name:        name,
		Description: description,
		Deadline:    deadline,
		Status:      status,
		SubjectID:   subjectID,
	}, nil
}

func UpdateTask(db *sql.DB, userID, id int64, name, description string, deadline *time.Time, status string, subjectID int64) (*Task, error) {
	query := `
	UPDATE tasks t
	SET
		name = $1,
		description = $2,
		deadline = $3,
		status = $4,
		subject_id = $5
	FROM subjects current_subject, subjects new_subject
	WHERE
		t.id = $6
		AND t.subject_id = current_subject.id
		AND current_subject.user_id = $7
		AND new_subject.id = $5
		AND new_subject.user_id = $7;
`

	result, err := db.Exec(query, name, description, deadline, status, subjectID, id, userID)
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

	return &Task{
		ID:          id,
		Name:        name,
		Description: description,
		Deadline:    deadline,
		Status:      status,
		SubjectID:   subjectID,
	}, nil
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
