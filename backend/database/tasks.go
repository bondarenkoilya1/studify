package database

import (
	"database/sql"
	"studify/models"
)

func GetTaskByID(db *sql.DB, id int64) (*models.Task, error) {
	query := `SELECT id, name, deadline, status, subject_id FROM tasks WHERE id = ?;`

	row := db.QueryRow(query, id)
	t := &models.Task{}

	err := row.Scan(&t.ID, &t.Name, &t.Deadline, &t.Status, &t.SubjectID)
	if err != nil {
		return nil, err
	}

	return t, nil
}

func GetTasks(db *sql.DB) ([]models.Task, error) {
	query := `SELECT id, name, deadline, status, subject_id FROM tasks;`

	tasks, err := scanTasks(db, query)
	if err != nil {
		return nil, err
	}

	return tasks, nil
}

func InsertTask(db *sql.DB, name, deadline, status string, subjectID int64) (*models.Task, error) {
	query := `INSERT INTO tasks (name, deadline, status, subject_id) VALUES (?, ?, ?, ?);`

	result, err := db.Exec(query, name, deadline, status, subjectID)
	if err != nil {
		return nil, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return nil, err
	}

	return &models.Task{
		ID:        id,
		Name:      name,
		Deadline:  deadline,
		Status:    status,
		SubjectID: subjectID,
	}, nil
}

func UpdateTask(db *sql.DB, id int64, name, deadline, status string, subjectID int64) (*models.Task, error) {
	query := `UPDATE tasks SET name = ?, deadline = ?, status = ?, subject_id = ? WHERE id = ?;`

	result, err := db.Exec(query, name, deadline, status, subjectID, id)
	if err != nil {
		return nil, err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return nil, err
	}

	if rowsAffected == 0 {
		return nil, sql.ErrNoRows
	}

	return &models.Task{
		ID:        id,
		Name:      name,
		Deadline:  deadline,
		Status:    status,
		SubjectID: subjectID,
	}, nil
}

func DeleteTasks(db *sql.DB) error {
	query := `DELETE FROM tasks;`

	_, err := db.Exec(query)
	return err
}

func DeleteTask(db *sql.DB, id int64) error {
	query := `DELETE FROM tasks WHERE id = ?`

	result, err := db.Exec(query, id)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return sql.ErrNoRows
	}

	return nil
}
