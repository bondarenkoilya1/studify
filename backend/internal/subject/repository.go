package subject

import (
	"database/sql"
	"errors"
	"fmt"
	"studify/internal/util"
	"time"
)

// todo: optimize with joins

var ErrSubjectAlreadyExists = errors.New("subject already exists")

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
	   exam_type,
	   exam_date,
	   term,
	   thumbnail_url
	FROM subjects
`

func scanSubject(scanner interface {
	Scan(dest ...any) error
}) (*Subject, error) {
	subject := &Subject{}

	var (
		note         sql.NullString
		examDate     sql.NullTime
		term         sql.NullInt64
		thumbnailURL sql.NullString
	)

	if err := scanner.Scan(
		&subject.ID,
		&subject.UserID,
		&subject.Name,
		&note,
		&subject.Type,
		&subject.Scope,
		&subject.ExamType,
		&examDate,
		&term,
		&thumbnailURL,
	); err != nil {
		return nil, err
	}

	if note.Valid {
		subject.Note = &note.String
	}

	if term.Valid {
		value := int(term.Int64)
		subject.Term = &value
	}

	if thumbnailURL.Valid {
		subject.ThumbnailURL = &thumbnailURL.String
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

func getFilesBySubjectID(db *sql.DB, subjectID int64) ([]File, error) {
	rows, err := db.Query(`
		SELECT path, original_name, mime_type, size_bytes
		FROM subjects_files
		WHERE subject_id = $1;
	`, subjectID)
	if err != nil {
		return nil, fmt.Errorf("recieve files: %w", err)
	}
	defer rows.Close()

	var files []File
	for rows.Next() {
		var f File
		if err = rows.Scan(&f.Url, &f.OriginalName, &f.ContentType, &f.SizeBytes); err != nil {
			return nil, fmt.Errorf("scan files: %w", err)
		}
		files = append(files, f)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("read files rows: %w", err)
	}

	return files, nil
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

	files, err := getFilesBySubjectID(db, id)
	if err != nil {
		return nil, err
	}
	subject.Files = files

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

	if err = rows.Err(); err != nil {
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
	examType string,
	thumbnailURL *string,
	examDate *time.Time,
	term *int,
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
		examType,
		thumbnailURL,
		examDate,
		term,
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
	examType string,
	thumbnailURL *string,
	examDate *time.Time,
	term *int,
) (*Subject, error) {
	query := `
	   INSERT INTO subjects (
	      user_id,
	      name,
	      note,
	      type,
	      scope,
	      exam_type,
	      exam_date,
	      term,
	      thumbnail_url
	   )
	   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	   RETURNING
	      id,
	      user_id,
	      name,
	      note,
	      type,
	      scope,
	      exam_type,
	      exam_date,
	      term,
	      thumbnail_url;
	`

	subject, err := scanSubject(
		db.QueryRow(
			query,
			userID,
			name,
			note,
			subjectType,
			scope,
			examType,
			examDate,
			toNullInt64(term),
			thumbnailURL,
		),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to insert subject: %w", normalizeUniqueSubjectError(err))
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

func toNullInt64(value *int) *int64 {
	if value == nil {
		return nil
	}

	v := int64(*value)
	return &v
}

func UpdateSubject(
	db *sql.DB,
	userID, id int64,
	name string,
	note *string,
	subjectType string,
	scope string,
	examType string,
	thumbnailURL *string,
	examDate *time.Time,
	term *int,
) error {
	query := `
	   UPDATE subjects
	   SET
	      name = $1,
	      note = $2,
	      type = $3,
	      scope = $4,
	      exam_type = $5,
	      exam_date = $6,
	      term = $7,
	      thumbnail_url = $8
	   WHERE id = $9 AND user_id = $10;
	`

	result, err := db.Exec(
		query,
		name,
		note,
		subjectType,
		scope,
		examType,
		examDate,
		toNullInt64(term),
		thumbnailURL,
		id,
		userID,
	)
	if err != nil {
		return fmt.Errorf("failed to update subject: %w", normalizeUniqueSubjectError(err))
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

func InsertSubjectThumbnail(db *sql.DB, subjectID int64, thumbnailURL string, userID int64) error {
	query := `
		UPDATE subjects
		SET
		    thumbnail_url = $1
		WHERE id = $2 and user_id = $3;
	`

	result, err := db.Exec(query, thumbnailURL, subjectID, userID)
	if err != nil {
		return fmt.Errorf("failed to update subject thumbnail: %w", err)
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

func InsertSubjectFile(db *sql.DB, subjectID, userID int64, path, originalName, mimeType string, sizeBytes int64) (int64, error) {
	query := `
		INSERT INTO subjects_files (subject_id, path, original_name, mime_type, size_bytes)
		SELECT s.id, $2, $3, $4, $5
		FROM subjects s
		WHERE s.id = $1 AND s.user_id = $6
		RETURNING id;
	`

	var fileID int64

	err := db.QueryRow(query, subjectID, path, originalName, mimeType, sizeBytes, userID).Scan(&fileID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return 0, sql.ErrNoRows
		}
	}

	return fileID, nil
}
