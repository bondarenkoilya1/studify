package database

import (
	"database/sql"
	"studify/internal/models"
)

func GetSubjectByID(db *sql.DB, id int64) (*models.Subject, error) {
	query := `
	SELECT
		id,
		name,
		COALESCE(lecturer, ''), 
		COALESCE(exam_date, ''),
		COALESCE(lecturer_avatar_url, '')
	FROM subjects
	WHERE id = $1;
`

	row := db.QueryRow(query, id)
	s := &models.Subject{}

	err := row.Scan(&s.ID, &s.Name, &s.Lecturer, &s.ExamDate, &s.LecturerAvatarURL)
	if err != nil {
		return nil, err
	}

	return s, nil
}

func GetSubjects(db *sql.DB) ([]models.Subject, error) {
	query := `
	SELECT
		id,
		name,
		COALESCE(lecturer, ''),
		COALESCE(exam_date, ''),
		COALESCE(lecturer_avatar_url, '')
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

		err = rows.Scan(&s.ID, &s.Name, &s.Lecturer, &s.ExamDate, &s.LecturerAvatarURL)
		if err != nil {
			return nil, err
		}

		subjects = append(subjects, s)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return subjects, nil
}

func InsertSubject(db *sql.DB, name, lecturer, lecturerAvatarURL, examDate string) (*models.Subject, error) {
	query := `
	INSERT INTO subjects (name, lecturer, lecturer_avatar_url, exam_date)
	VALUES ($1, $2, $3, $4)
	RETURNING id;
`

	var id int64
	if err := db.QueryRow(query, name, lecturer, lecturerAvatarURL, examDate).Scan(&id); err != nil {
		return nil, err
	}

	return &models.Subject{
		ID:                id,
		Name:              name,
		Lecturer:          lecturer,
		LecturerAvatarURL: lecturerAvatarURL,
		ExamDate:          examDate,
	}, nil
}

func UpdateSubject(db *sql.DB, id int64, name, lecturer, examDate string) error {
	query := `
	UPDATE subjects
	SET
		name = $1,
		lecturer = $2,
		exam_date = $3
	WHERE id = $4;
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
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err = tx.Exec(`DELETE FROM tasks;`); err != nil {
		return err
	}

	if _, err = tx.Exec(`DELETE FROM subjects;`); err != nil {
		return err
	}

	return tx.Commit()
}

func DeleteSubject(db *sql.DB, id int64) error {
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err = tx.Exec(`DELETE FROM tasks WHERE subject_id = $1;`, id); err != nil {
		return err
	}

	query := `
	DELETE FROM subjects
	WHERE id = $1;
`

	result, err := tx.Exec(query, id)
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

	return tx.Commit()
}
