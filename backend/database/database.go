package database

import (
	"database/sql"
	"studify/models"

	_ "github.com/glebarez/go-sqlite"
)

func OpenDB() (*sql.DB, error) {
	db, err := sql.Open("sqlite", "./data/studify.db")
	if err != nil {
		return nil, err
	}

	if err = db.Ping(); err != nil {
		db.Close()
		return nil, err
	}

	return db, nil
}

func CreateSubjectsTable(db *sql.DB) error {
	query := `
CREATE TABLE IF NOT EXISTS subjects (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
   	name TEXT NOT NULL,
   	lecturer TEXT DEFAULT '',
   	exam_date TEXT DEFAULT ''
);`

	_, err := db.Exec(query)
	return err
}

func GetSubjectByID(db *sql.DB, id int64) (*models.Subject, error) {
	query := `
SELECT id, name, COALESCE(lecturer, ''), COALESCE(exam_date, '') 
FROM subjects 
WHERE id = ?;
	`
	row := db.QueryRow(query, id)

	s := &models.Subject{}

	err := row.Scan(&s.ID, &s.Name, &s.Lecturer, &s.ExamDate)
	if err != nil {
		return nil, err
	}

	return s, nil
}

func GetSubjects(db *sql.DB) ([]models.Subject, error) {
	query := `
SELECT id, name, COALESCE(lecturer, ''), COALESCE(exam_date, '')
FROM subjects;
`

	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	subjects := []models.Subject{}

	for rows.Next() {
		var s models.Subject

		err = rows.Scan(&s.ID, &s.Name, &s.Lecturer, &s.ExamDate)
		if err != nil {
			return nil, err
		}

		subjects = append(subjects, s)
	}

	return subjects, nil
}

func InsertSubject(db *sql.DB, name, lecturer, examDate string) (*models.Subject, error) {
	query := `
INSERT INTO subjects(name, lecturer, exam_date)
VALUES (?, ?, ?);
	`

	result, err := db.Exec(query, name, lecturer, examDate)
	if err != nil {
		return nil, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return nil, err
	}

	return &models.Subject{
		ID:       id,
		Name:     name,
		Lecturer: lecturer,
		ExamDate: examDate,
	}, nil
}

func UpdateSubject(db *sql.DB, id int64, name, lecturer, examDate string) error {
	query := `
UPDATE subjects
SET name = ?, lecturer = ?, exam_date = ?
WHERE id = ?;
	`

	result, err := db.Exec(query, name, lecturer, examDate, id)
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

func DeleteSubjects(db *sql.DB) error {
	query := `
DELETE FROM subjects;
`

	_, err := db.Exec(query)
	return err
}

func DeleteSubject(db *sql.DB, id int64) error {
	query := `
DELETE FROM subjects
WHERE id = ?;
	`

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
