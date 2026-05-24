package database

import (
	"database/sql"
	"studify/models"
)

func GetTaskByID(db *sql.DB, id int64) (*models.Task, error) {
	query := `SELECT id, name, due_date, status, subject_id FROM tasks WHERE id = ?;`

	row := db.QueryRow(query, id)
	t := &models.Task{}

	err := row.Scan(&t.ID, &t.Name, &t.DueDate, &t.Status, &t.SubjectID)
	if err != nil {
		return nil, err
	}

	return t, nil
}

func GetTasks(db *sql.DB) ([]models.Task, error) {
	query := `SELECT id, name, due_date, status, subject_id FROM tasks;`

	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}

	tasks := []models.Task{}
	for rows.Next() {
		t := &models.Task{}
		err = rows.Scan(&t.ID, &t.Name, &t.DueDate, &t.Status, &t.SubjectID)
		if err != nil {
			return nil, err
		}
		tasks = append(tasks, *t)
	}

	return tasks, nil
}

func InsertTask(db *sql.DB, name, dueDate, status string, subjectID int64) (*models.Task, error) {
	query := `INSERT INTO tasks (name, due_date, status, subject_id) VALUES (?, ?, ?, ?);`

	result, err := db.Exec(query, name, dueDate, status, subjectID)
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
		DueDate:   dueDate,
		Status:    status,
		SubjectID: subjectID,
	}, nil
}

func UpdateTask(db *sql.DB, id int64, name, dueDate, status string, subjectID int64) (*models.Task, error) {
	query := `UPDATE tasks SET name = ?, due_date = ?, status = ?, subject_id = ? WHERE id = ?;`

	result, err := db.Exec(query, name, dueDate, status, subjectID, id)
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
		DueDate:   dueDate,
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
