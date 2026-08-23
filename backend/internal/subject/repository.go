package subject

import (
	"database/sql"
	"fmt"
	"studify/internal/util"
	"time"
)

const subjectSelectQuery = `
	SELECT
		id,
		user_id,
		name,
		type,
		lecturer,
		exam_date,
		lecturer_avatar_url
	FROM subjects
`

func scanSubject(scanner interface {
	Scan(dest ...any) error
}) (*Subject, error) {
	subject := &Subject{}

	var (
		examDate          sql.NullTime
		lecturer          sql.NullString
		lecturerAvatarURL sql.NullString
	)

	if err := scanner.Scan(
		&subject.ID,
		&subject.UserID,
		&subject.Name,
		&subject.Type,
		&lecturer,
		&examDate,
		&lecturerAvatarURL,
	); err != nil {
		return nil, err
	}

	if lecturer.Valid {
		subject.Lecturer = &lecturer.String
	}

	if lecturerAvatarURL.Valid {
		subject.LecturerAvatarURL = &lecturerAvatarURL.String
	}

	subject.ExamDate = util.NullTimePtr(examDate)

	return subject, nil
}

func GetSubjectByID(db *sql.DB, id, userID int64) (*Subject, error) {
	query := subjectSelectQuery + `
		WHERE id = $1 AND user_id = $2;
	`

	subject, err := scanSubject(db.QueryRow(query, id, userID))
	if err != nil {
		return nil, fmt.Errorf("failed to get subject by id: %w", err)
	}

	return subject, nil
}

func GetSubjectsByUserID(db *sql.DB, userID int64) ([]Subject, error) {
	query := subjectSelectQuery + `
		WHERE user_id = $1
		ORDER BY id;
	`

	rows, err := db.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get subjects: %w", err)
	}
	defer rows.Close()

	subjects := make([]Subject, 0)

	for rows.Next() {
		subject, err := scanSubject(rows)
		if err != nil {
			return nil, fmt.Errorf("failed to scan subject: %w", err)
		}

		subjects = append(subjects, *subject)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("failed to read subjects rows: %w", err)
	}

	return subjects, nil
}

func InsertSubject(
	db *sql.DB,
	userID int64,
	name string,
	subjectType string,
	lecturer *string,
	lecturerAvatarURL *string,
	examDate *time.Time,
) (*Subject, error) {
	query := `
		INSERT INTO subjects (
			user_id,
			name,
			type,
			lecturer,
			lecturer_avatar_url,
			exam_date
		)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING
			id,
			user_id,
			name,
			type,
			lecturer,
			exam_date,
			lecturer_avatar_url;
	`

	subject, err := scanSubject(
		db.QueryRow(
			query,
			userID,
			name,
			subjectType,
			lecturer,
			lecturerAvatarURL,
			examDate,
		),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to insert subject: %w", err)
	}

	return subject, nil
}

func UpdateSubject(
	db *sql.DB,
	userID, id int64,
	name string,
	subjectType string,
	lecturer *string,
	lecturerAvatarURL *string,
	examDate *time.Time,
) error {
	query := `
		UPDATE subjects
		SET
			name = $1,
			type = $2,
			lecturer = $3,
			lecturer_avatar_url = $4,
			exam_date = $5
		WHERE id = $6 AND user_id = $7;
	`

	result, err := db.Exec(
		query,
		name,
		subjectType,
		lecturer,
		lecturerAvatarURL,
		examDate,
		id,
		userID,
	)
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
	const query = `
		DELETE FROM subjects
		WHERE user_id = $1;
	`

	if _, err := db.Exec(query, userID); err != nil {
		return fmt.Errorf("failed to delete subjects by user id: %w", err)
	}

	return nil
}

func DeleteSubjectByID(db *sql.DB, userID, id int64) error {
	const query = `
		DELETE FROM subjects
		WHERE id = $1 AND user_id = $2;
	`

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
