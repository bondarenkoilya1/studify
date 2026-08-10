package subject

import (
	"database/sql"
	"fmt"
	"studify/internal/util"
	"time"
)

func GetSubjectByID(db *sql.DB, id, userID int64) (*Subject, error) {
	query := `
	SELECT
			id,
			user_id,
			name,
			lecturer,
			exam_date,
			COALESCE(lecturer_avatar_url, '')
		FROM subjects
	WHERE id = $1 AND user_id = $2;
`

	row := db.QueryRow(query, id, userID)
	s := &Subject{}
	var examDate sql.NullTime

	err := row.Scan(&s.ID, &s.UserID, &s.Name, &s.Lecturer, &examDate, &s.LecturerAvatarURL)
	if err != nil {
		return nil, fmt.Errorf("failed to get subject by id: %w", err)
	}
	s.ExamDate = util.NullTimePtr(examDate)

	return s, nil
}

func GetSubjectsByUserID(db *sql.DB, userID int64) ([]Subject, error) {
	query := `
	SELECT
			id,
			user_id,
			name,
			lecturer,
			exam_date,
			COALESCE(lecturer_avatar_url, '')
		FROM subjects
	WHERE user_id = $1;
`

	rows, err := db.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get subjects: %w", err)
	}
	defer rows.Close()

	subjects := make([]Subject, 0)

	for rows.Next() {
		var s Subject
		var examDate sql.NullTime

		err = rows.Scan(&s.ID, &s.UserID, &s.Name, &s.Lecturer, &examDate, &s.LecturerAvatarURL)
		if err != nil {
			return nil, fmt.Errorf("failed to scan subject: %w", err)
		}
		s.ExamDate = util.NullTimePtr(examDate)

		subjects = append(subjects, s)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("failed to read subjects rows: %w", err)
	}

	return subjects, nil
}

func InsertSubject(db *sql.DB, userID int64, name, lecturer, lecturerAvatarURL string, examDate *time.Time) (*Subject, error) {
	query := `
	INSERT INTO subjects (user_id, name, lecturer, lecturer_avatar_url, exam_date) 
	VALUES ($1, $2, $3, $4, $5)
	RETURNING id;
	`

	var id int64
	if err := db.QueryRow(query, userID, name, lecturer, lecturerAvatarURL, examDate).Scan(&id); err != nil {
		return nil, fmt.Errorf("failed to insert subject: %w", err)
	}

	return &Subject{
		ID:                id,
		UserID:            userID,
		Name:              name,
		Lecturer:          lecturer,
		LecturerAvatarURL: lecturerAvatarURL,
		ExamDate:          examDate,
	}, nil
}

func UpdateSubject(db *sql.DB, userID, id int64, name, lecturer string, examDate *time.Time) error {
	query := `
	UPDATE subjects
	SET
		name = $1,
		lecturer = $2,
		exam_date = $3
	WHERE id = $4 AND user_id = $5;
`

	result, err := db.Exec(query, name, lecturer, examDate, id, userID)
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

func DeleteSubjectsByUserID(db *sql.DB, userID int64) error {
	query := `DELETE FROM subjects WHERE user_id = $1;`

	if _, err := db.Exec(query, userID); err != nil {
		return fmt.Errorf("failed to delete subjects by user id: %w", err)
	}

	return nil
}

func DeleteSubjectByID(db *sql.DB, userID, id int64) error {
	query := `DELETE FROM subjects WHERE id = $1 AND user_id = $2;`

	result, err := db.Exec(query, id, userID)
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

	return nil
}
