package subject

import (
	"database/sql"
	"fmt"
	"studify/internal/util"
	"time"
)

// todo: optimize with joins

type DBTX interface {
	Exec(query string, args ...any) (sql.Result, error)
	Query(query string, args ...any) (*sql.Rows, error)
	QueryRow(query string, args ...any) *sql.Row
}

const subjectSelectQuery = `
	SELECT
	   id,
	   user_id,
	   name,
	   note,
	   type,
	   scope,
	   exam_date,
	   lecturer_avatar_url
	FROM subjects
`

func scanSubject(scanner interface {
	Scan(dest ...any) error
}) (*Subject, error) {
	subject := &Subject{}

	var (
		note              sql.NullString
		examDate          sql.NullTime
		lecturerAvatarURL sql.NullString
	)

	if err := scanner.Scan(
		&subject.ID,
		&subject.UserID,
		&subject.Name,
		&note,
		&subject.Type,
		&subject.Scope,
		&examDate,
		&lecturerAvatarURL,
	); err != nil {
		return nil, err
	}

	if note.Valid {
		subject.Note = &note.String
	}

	if lecturerAvatarURL.Valid {
		subject.LecturerAvatarURL = &lecturerAvatarURL.String
	}

	subject.ExamDate = util.NullTimePtr(examDate)

	return subject, nil
}

func getLecturersBySubjectID(db *sql.DB, subjectID int64) ([]Lecturer, error) {
	rows, err := db.Query(`
		SELECT name, position
		FROM lecturers
		WHERE subject_id = $1;
	`, subjectID)
	if err != nil {
		return nil, fmt.Errorf("receive lecturers: %w", err)
	}
	defer rows.Close()

	var lecturers []Lecturer
	for rows.Next() {
		var l Lecturer
		if err := rows.Scan(&l.Name, &l.Position); err != nil {
			return nil, fmt.Errorf("scan lecturer: %w", err)
		}
		lecturers = append(lecturers, l)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("read lecturers rows: %w", err)
	}

	return lecturers, nil
}

func GetSubjectByID(db *sql.DB, id, userID int64) (*Subject, error) {
	query := subjectSelectQuery + `
	   WHERE id = $1 AND user_id = $2;
	`
	subject, err := scanSubject(db.QueryRow(query, id, userID))
	if err != nil {
		return nil, fmt.Errorf("failed to get subject by id: %w", err)
	}

	lecturers, err := getLecturersBySubjectID(db, id)
	if err != nil {
		return nil, err
	}

	subject.Lecturers = lecturers

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

		lecturers, err := getLecturersBySubjectID(db, subject.ID)
		if err != nil {
			return nil, err
		}
		subject.Lecturers = lecturers

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
	note *string,
	subjectType string,
	scope string,
	lecturerAvatarURL *string,
	examDate *time.Time,
	lecturers []Lecturer,
) (*Subject, error) {
	tx, err := db.Begin()
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	newSubject, err := insertSubjectTx(
		tx,
		userID,
		name,
		note,
		subjectType,
		scope,
		lecturerAvatarURL,
		examDate,
	)
	if err != nil {
		return nil, err
	}

	newLecturers, err := insertLecturersTx(
		tx,
		newSubject.ID,
		lecturers,
	)
	if err != nil {
		return nil, err
	}

	newSubject.Lecturers = newLecturers

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return newSubject, nil
}

func insertSubjectTx(db DBTX,
	userID int64,
	name string,
	note *string,
	subjectType string,
	scope string,
	lecturerAvatarURL *string,
	examDate *time.Time,
) (*Subject, error) {
	query := `
	   INSERT INTO subjects (
	      user_id,
	      name,
	      note,
	      type,
	      scope,
	      lecturer_avatar_url,
	      exam_date
	   )
	   VALUES ($1, $2, $3, $4, $5, $6, $7)
	   RETURNING
	      id,
	      user_id,
	      name,
	      note,
	      type,
	      scope,
	      exam_date,
	      lecturer_avatar_url;
	`

	subject, err := scanSubject(
		db.QueryRow(
			query,
			userID,
			name,
			note,
			subjectType,
			scope,
			lecturerAvatarURL,
			examDate,
		),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to insert subject: %w", err)
	}

	return subject, nil
}

func insertLecturersTx(db DBTX, subjectID int64, lecturers []Lecturer) ([]Lecturer, error) {
	result := make([]Lecturer, 0, len(lecturers))

	const query = `
		INSERT INTO lecturers (
			subject_id,
			name,
			position
		)
		VALUES ($1, $2, $3)
		RETURNING name, position;
	`

	for _, lecturer := range lecturers {
		var created Lecturer

		if err := db.QueryRow(
			query,
			subjectID,
			lecturer.Name,
			lecturer.Position,
		).Scan(
			&created.Name,
			&created.Position,
		); err != nil {
			return nil, fmt.Errorf("failed to insert lecturer: %w", err)
		}

		result = append(result, created)
	}

	return result, nil
}

func UpdateSubject(
	db *sql.DB,
	userID, id int64,
	name string,
	note *string,
	subjectType string,
	scope string,
	lecturerAvatarURL *string,
	examDate *time.Time,
) error {
	query := `
	   UPDATE subjects
	   SET
	      name = $1,
	      note = $2,
	      type = $3,
	      scope = $4,
	      lecturer_avatar_url = $5,
	      exam_date = $6
	   WHERE id = $7 AND user_id = $8;
	`

	result, err := db.Exec(
		query,
		name,
		note,
		subjectType,
		scope,
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
