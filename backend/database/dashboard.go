package database

import "database/sql"

func GetSubjectsCount(db *sql.DB) (int64, error) {
	query := `SELECT COUNT (*) FROM subjects;`

	var count int64
	err := db.QueryRow(query).Scan(&count)
	if err != nil {
		return 0, err
	}

	return count, nil
}

func GetTasksCount(db *sql.DB) (int64, error) {
	query := `SELECT COUNT (*) FROM tasks;`

	var count int64
	err := db.QueryRow(query).Scan(&count)
	if err != nil {
		return 0, err
	}

	return count, nil
}
