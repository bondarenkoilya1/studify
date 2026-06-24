package database

import (
	"database/sql"
	"fmt"
	"studify/internal/models"
	"studify/internal/utils"
	"time"
)

func GetSubjectByID(db *sql.DB, id int64) (*models.Subject, error) {
	query := `
	SELECT
			id,
			name,
			COALESCE(lecturer, ''),
			exam_date,
			COALESCE(lecturer_avatar_url, '')
		FROM subjects
	WHERE id = $1;
`

	row := db.QueryRow(query, id)
	s := &models.Subject{}
	var examDate sql.NullTime

	err := row.Scan(&s.ID, &s.Name, &s.Lecturer, &examDate, &s.LecturerAvatarURL)
	if err != nil {
		return nil, fmt.Errorf("failed to get subject by id: %w", err)
	}
	s.ExamDate = utils.NullTimePtr(examDate)

	return s, nil
}

func GetSubjects(db *sql.DB) ([]models.Subject, error) {
	query := `
	SELECT
			id,
			name,
			COALESCE(lecturer, ''),
			exam_date,
			COALESCE(lecturer_avatar_url, '')
		FROM subjects;
`

	rows, err := db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to get subjects: %w", err)
	}
	defer rows.Close()

	subjects := []models.Subject{}

	for rows.Next() {
		var s models.Subject
		var examDate sql.NullTime

		err = rows.Scan(&s.ID, &s.Name, &s.Lecturer, &examDate, &s.LecturerAvatarURL)
		if err != nil {
			return nil, fmt.Errorf("failed to scan subject: %w", err)
		}
		s.ExamDate = utils.NullTimePtr(examDate)

		subjects = append(subjects, s)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("failed to read subjects rows: %w", err)
	}

	return subjects, nil
}

func InsertSubject(db *sql.DB, name, lecturer, lecturerAvatarURL string, examDate *time.Time) (*models.Subject, error) {
	query := `
	INSERT INTO subjects (name, lecturer, lecturer_avatar_url, exam_date)
	VALUES ($1, $2, $3, $4)
	RETURNING id;
`

	var id int64
	if err := db.QueryRow(query, name, lecturer, lecturerAvatarURL, examDate).Scan(&id); err != nil {
		return nil, fmt.Errorf("failed to insert subject: %w", err)
	}

	return &models.Subject{
		ID:                id,
		Name:              name,
		Lecturer:          lecturer,
		LecturerAvatarURL: lecturerAvatarURL,
		ExamDate:          examDate,
	}, nil
}

func UpdateSubject(db *sql.DB, id int64, name, lecturer string, examDate *time.Time) error {
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
		return fmt.Errorf("failed to update subject: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get updated subjects count: %w", err)
	}

	if rowsAffected == 0 {
		return sql.ErrNoRows
	}

	return nil
}

func DeleteSubjects(db *sql.DB) error {
	tx, err := db.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin delete subjects transaction: %w", err)
	}
	defer tx.Rollback()

	if _, err = tx.Exec(`DELETE FROM tasks;`); err != nil {
		return fmt.Errorf("failed to delete subject tasks: %w", err)
	}

	if _, err = tx.Exec(`DELETE FROM subjects;`); err != nil {
		return fmt.Errorf("failed to delete subjects: %w", err)
	}

	if err = tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit delete subjects transaction: %w", err)
	}

	return nil
}

func DeleteSubject(db *sql.DB, id int64) error {
	tx, err := db.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin delete subject transaction: %w", err)
	}
	defer tx.Rollback()

	if _, err = tx.Exec(`DELETE FROM tasks WHERE subject_id = $1;`, id); err != nil {
		return fmt.Errorf("failed to delete subject tasks: %w", err)
	}

	query := `
	DELETE FROM subjects
	WHERE id = $1;
`

	result, err := tx.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete subject: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get deleted subjects count: %w", err)
	}

	if rowsAffected == 0 {
		return sql.ErrNoRows
	}

	if err = tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit delete subject transaction: %w", err)
	}

	return nil
}
