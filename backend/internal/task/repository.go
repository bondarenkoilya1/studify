package task

import (
	"database/sql"
	"fmt"
	"studify/internal/util"
)

func ScanTasks(db *sql.DB, query string, args ...any) ([]Task, error) {
	rows, err := db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query tasks: %w", err)
	}
	defer rows.Close()

	tasks := make([]Task, 0)

	for rows.Next() {
		task, err := scanTask(rows)
		if err != nil {
			return nil, fmt.Errorf("failed to scan task: %w", err)
		}
		tasks = append(tasks, *task)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("failed to read tasks rows: %w", err)
	}

	return tasks, nil
}

func GetTaskByID(db *sql.DB, id, userID int64) (*Task, error) {
	query := `
		SELECT t.id, t.subject_id, t.name, t.type, t.description, t.estimated_time,
			t.scheduled_at, t.deadline, t.scheduled_date, t.deadline_date,
			t.status, t.difficulty, t.priority, t.created_at, t.updated_at
		FROM tasks t
		JOIN subjects s ON s.id = t.subject_id
		WHERE t.id = $1 AND s.user_id = $2;
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
		SELECT t.id, t.subject_id, t.name, t.type, t.description, t.estimated_time,
			t.scheduled_at, t.deadline, t.scheduled_date, t.deadline_date,
			t.status, t.difficulty, t.priority, t.created_at, t.updated_at
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

func GetTasksBySubjectID(db *sql.DB, userID, subjectID int64) ([]Task, error) {
	query := `
		SELECT t.id, t.subject_id, t.name, t.type, t.description, t.estimated_time,
			t.scheduled_at, t.deadline, t.scheduled_date, t.deadline_date,
			t.status, t.difficulty, t.priority, t.created_at, t.updated_at
		FROM tasks t
		JOIN subjects s ON s.id = t.subject_id
		WHERE t.subject_id = $1 AND s.user_id = $2
		ORDER BY t.created_at DESC;
	`

	tasks, err := ScanTasks(db, query, subjectID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get tasks by subject id: %w", err)
	}

	return tasks, nil
}

func scanTask(row interface{ Scan(...any) error }) (*Task, error) {
	task := &Task{}
	var scheduledDate, deadlineDate sql.NullTime
	if err := row.Scan(
		&task.ID, &task.SubjectID, &task.Name, &task.Type, &task.Description,
		&task.EstimatedTime, &task.ScheduledAt, &task.Deadline,
		&scheduledDate, &deadlineDate,
		&task.Status, &task.Difficulty, &task.Priority, &task.CreatedAt, &task.UpdatedAt,
	); err != nil {
		return nil, err
	}
	task.ScheduledDate = calendarDateFromTime(util.NullTimePtr(scheduledDate))
	task.DeadlineDate = calendarDateFromTime(util.NullTimePtr(deadlineDate))
	return task, nil
}

func InsertTask(db *sql.DB, userID int64, task *Task) (*Task, error) {
	query := `
		INSERT INTO tasks (
			subject_id, name, type, description, estimated_time,
			scheduled_at, deadline, scheduled_date, deadline_date,
			status, difficulty, priority
		)
		SELECT $1, $2, $3, $4, $5, $6, $7, $8::text::date, $9::text::date, $10, $11, $12
		WHERE EXISTS (SELECT 1 FROM subjects WHERE id = $1 AND user_id = $13)
		RETURNING id, subject_id, name, type, description, estimated_time,
			scheduled_at, deadline, scheduled_date, deadline_date,
			status, difficulty, priority, created_at, updated_at;
	`

	saved, err := scanTask(db.QueryRow(query,
		task.SubjectID, task.Name, task.Type, task.Description, task.EstimatedTime,
		task.ScheduledAt, task.Deadline, task.ScheduledDate, task.DeadlineDate,
		task.Status, task.Difficulty, task.Priority, userID,
	))
	if err != nil {
		return nil, fmt.Errorf("failed to insert task: %w", err)
	}
	return saved, nil
}

func UpdateTask(db *sql.DB, userID, id int64, task *Task) (*Task, error) {
	query := `
		UPDATE tasks t
		SET subject_id = $1, name = $2, type = $3, description = $4, estimated_time = $5,
			scheduled_at = $6, deadline = $7, scheduled_date = $8::text::date, deadline_date = $9::text::date,
			status = $10, difficulty = $11, priority = $12, updated_at = now()
		FROM subjects current_subject, subjects new_subject
		WHERE t.id = $13 AND t.subject_id = current_subject.id
			AND current_subject.user_id = $14 AND new_subject.id = $1
			AND new_subject.user_id = $14
		RETURNING t.id, t.subject_id, t.name, t.type, t.description, t.estimated_time,
			t.scheduled_at, t.deadline, t.scheduled_date, t.deadline_date,
			t.status, t.difficulty, t.priority, t.created_at, t.updated_at;
	`

	saved, err := scanTask(db.QueryRow(query,
		task.SubjectID, task.Name, task.Type, task.Description, task.EstimatedTime,
		task.ScheduledAt, task.Deadline, task.ScheduledDate, task.DeadlineDate,
		task.Status, task.Difficulty, task.Priority, id, userID,
	))
	if err != nil {
		return nil, fmt.Errorf("failed to update task: %w", err)
	}
	return saved, nil
}

func DeleteTasksByUserID(db *sql.DB, userID int64) error {
	query := `
		DELETE FROM tasks t
		USING subjects s
		WHERE t.subject_id = s.id AND s.user_id = $1;
	`

	if _, err := db.Exec(query, userID); err != nil {
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
