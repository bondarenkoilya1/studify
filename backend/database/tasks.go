package database

import (
	"database/sql"
	"studify/models"
)

func GetTaskByID(db *sql.DB, id int64) (*models.Task, error) {
	query := `SELECT id, name, due_date, status, subject_id FROM tasks WHERE id = ?;`

	row := db.QueryRow(query, id)
	t := &models.Task{}

	err := row.Scan(&t.ID, &t.Name, &t.SubjectID, &t.DueDate, &t.Status)
	if err != nil {
		return nil, err
	}

	return t, nil
}
