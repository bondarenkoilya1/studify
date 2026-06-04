package database

import (
	"database/sql"
	"studify/models"
)

func scanTasks(db *sql.DB, query string) ([]models.Task, error) {
	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	tasks := []models.Task{}
	for rows.Next() {
		t := &models.Task{}
		err = rows.Scan(&t.ID, &t.Name, &t.Deadline, &t.Status, &t.SubjectID)
		if err != nil {
			return nil, err
		}
		tasks = append(tasks, *t)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return tasks, nil
}
