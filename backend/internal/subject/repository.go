package subject

import (
	"database/sql"
	"errors"
	"fmt"
	"studify/internal"
	"studify/internal/user"
	"studify/internal/util"
	"time"

	"github.com/jackc/pgx/v5/pgconn"
)

// todo: optimize with joins

var ErrSubjectAlreadyExists = errors.New("subject already exists")

func scanSubject(scanner interface{ Scan(dest ...any) error }) (*Subject, error) {
	s := &Subject{}
	var note, thumbnailURL sql.NullString
	var examDate sql.NullTime
	var course, term sql.NullInt64

	if err := scanner.Scan(
		&s.ID, &s.UserID, &s.Name, &note, &s.Type, &s.Scope, &s.ExamType,
		&examDate, &course, &term, &thumbnailURL,
	); err != nil {
		return nil, err
	}

	if note.Valid {
		s.Note = &note.String
	}
	if course.Valid {
		s.Course = new(int(int(course.Int64)))
	}
	if term.Valid {
		s.Term = new(int(int(term.Int64)))
	}
	if thumbnailURL.Valid {
		s.ThumbnailURL = &thumbnailURL.String
	}

	s.ExamDate = util.NullTimePtr(examDate)
	return s, nil
}

func getLecturersBySubjectID(db internal.DBTX, subjectID int64) ([]Lecturer, error) {
	rows, err := db.Query(
		`SELECT name, position FROM lecturers WHERE subject_id = $1;`,
		subjectID,
	)
	if err != nil {
		return nil, fmt.Errorf("get lecturers: %w", err)
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

func getFilesBySubjectID(db internal.DBTX, subjectID int64) ([]File, error) {
	rows, err := db.Query(
		`SELECT path, original_name, mime_type, size_bytes FROM subjects_files WHERE subject_id = $1;`,
		subjectID,
	)
	if err != nil {
		return nil, fmt.Errorf("get files: %w", err)
	}
	defer rows.Close()

	var files []File
	for rows.Next() {
		var f File
		if err := rows.Scan(&f.Url, &f.OriginalName, &f.ContentType, &f.SizeBytes); err != nil {
			return nil, fmt.Errorf("scan file: %w", err)
		}
		files = append(files, f)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("read files rows: %w", err)
	}

	return files, nil
}

func GetSubjectByID(db internal.DBTX, id, userID int64) (*Subject, error) {
	const query = `
		SELECT id, user_id, name, note, type, scope, exam_type, exam_date,
		       course, term, thumbnail_url
		FROM subjects WHERE id = $1 AND user_id = $2;
	`

	s, err := scanSubject(db.QueryRow(query, id, userID))
	if err != nil {
		return nil, fmt.Errorf("get subject by id: %w", err)
	}

	s.Lecturers, err = getLecturersBySubjectID(db, id)
	if err != nil {
		return nil, err
	}
	s.Files, err = getFilesBySubjectID(db, id)
	if err != nil {
		return nil, err
	}

	return s, nil
}

func GetSubjectsByUserID(db internal.DBTX, userID int64) ([]Subject, error) {
	const query = `
		SELECT id, user_id, name, note, type, scope, exam_type, exam_date,
		       course, term, thumbnail_url
		FROM subjects
		WHERE user_id = $1
		ORDER BY course DESC NULLS LAST, term DESC NULLS LAST;
	`

	rows, err := db.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("get subjects: %w", err)
	}
	defer rows.Close()

	subjects := make([]Subject, 0)
	for rows.Next() {
		s, err := scanSubject(rows)
		if err != nil {
			return nil, fmt.Errorf("scan subject: %w", err)
		}

		s.Lecturers, err = getLecturersBySubjectID(db, s.ID)
		if err != nil {
			return nil, err
		}
		subjects = append(subjects, *s)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("read subjects rows: %w", err)
	}

	return subjects, nil
}

func InsertSubject(
	db *sql.DB, userID int64, name string, note *string,
	subjectType, scope, examType string, thumbnailURL *string,
	examDate *time.Time, course, term *int, lecturers []Lecturer,
) (*Subject, error) {
	tx, err := db.Begin()
	if err != nil {
		return nil, fmt.Errorf("begin transaction: %w", err)
	}
	defer tx.Rollback()

	s, err := insertSubjectTx(
		tx, userID, name, note, subjectType, scope, examType,
		thumbnailURL, examDate, course, term,
	)
	if err != nil {
		return nil, err
	}

	s.Lecturers, err = insertLecturersTx(tx, s.ID, lecturers)
	if err != nil {
		return nil, err
	}
	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("commit transaction: %w", err)
	}

	return s, nil
}

func insertSubjectTx(
	db internal.DBTX, userID int64, name string, note *string,
	subjectType, scope, examType string, thumbnailURL *string,
	examDate *time.Time, course, term *int,
) (*Subject, error) {
	const query = `
		INSERT INTO subjects (
			user_id, name, note, type, scope, exam_type,
			exam_date, course, term, thumbnail_url
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id, user_id, name, note, type, scope, exam_type,
		          exam_date, course, term, thumbnail_url;
	`

	s, err := scanSubject(db.QueryRow(
		query, userID, name, note, subjectType, scope, examType,
		examDate, toNullInt64(course), toNullInt64(term), thumbnailURL,
	))
	if err != nil {
		return nil, fmt.Errorf("insert subject: %w", normalizeUniqueSubjectError(err))
	}

	return s, nil
}

func insertLecturersTx(db internal.DBTX, subjectID int64, lecturers []Lecturer) ([]Lecturer, error) {
	result := make([]Lecturer, 0, len(lecturers))
	const query = `
		INSERT INTO lecturers (subject_id, name, position)
		VALUES ($1, $2, $3)
		RETURNING name, position;
	`

	for _, l := range lecturers {
		var created Lecturer
		if err := db.QueryRow(query, subjectID, l.Name, l.Position).
			Scan(&created.Name, &created.Position); err != nil {
			return nil, fmt.Errorf("insert lecturer: %w", err)
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
	db internal.DBTX, userID, id int64, name string, note *string,
	subjectType, scope, examType string, thumbnailURL *string,
	examDate *time.Time, course, term *int,
) error {
	const query = `
		UPDATE subjects
		SET name = $1, note = $2, type = $3, scope = $4,
		    exam_type = $5, exam_date = $6, course = $7,
		    term = $8, thumbnail_url = $9
		WHERE id = $10 AND user_id = $11;
	`

	result, err := db.Exec(
		query, name, note, subjectType, scope, examType, examDate,
		toNullInt64(course), toNullInt64(term), thumbnailURL, id, userID,
	)
	if err != nil {
		return fmt.Errorf("update subject: %w", normalizeUniqueSubjectError(err))
	}

	n, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("get updated subject count: %w", err)
	}
	if n == 0 {
		return sql.ErrNoRows
	}

	return nil
}

func DeleteSubjectsByUserID(db internal.DBTX, userID int64) error {
	if _, err := db.Exec(`DELETE FROM subjects WHERE user_id = $1;`, userID); err != nil {
		return fmt.Errorf("delete subjects by user id: %w", err)
	}
	return nil
}

func DeleteSubjectByID(db internal.DBTX, userID, id int64) error {
	result, err := db.Exec(`DELETE FROM subjects WHERE id = $1 AND user_id = $2;`, id, userID)
	if err != nil {
		return fmt.Errorf("delete subject: %w", err)
	}

	n, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("get deleted subject count: %w", err)
	}
	if n == 0 {
		return sql.ErrNoRows
	}

	return nil
}

func ReplaceSubjectThumbnail(db internal.DBTX, subjectID, userID int64, newURL string) (*string, error) {
	const query = `
		UPDATE subjects s
		SET thumbnail_url = $3
		FROM (SELECT id, thumbnail_url FROM subjects WHERE id = $1 FOR UPDATE) old
		WHERE s.id = old.id AND s.user_id = $2
		RETURNING old.thumbnail_url;
	`

	var oldURL sql.NullString
	if err := db.QueryRow(query, subjectID, userID, newURL).Scan(&oldURL); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, user.ErrUserNotFound
		}
		return nil, fmt.Errorf("replace subject thumbnail: %w", err)
	}

	if !oldURL.Valid {
		return nil, nil
	}
	return &oldURL.String, nil
}

func InsertSubjectFile(
	db internal.DBTX, subjectID, userID int64, path, originalName, mimeType string,
	sizeBytes int64,
) (int64, error) {
	const query = `
		INSERT INTO subjects_files (subject_id, path, original_name, mime_type, size_bytes)
		SELECT s.id, $2, $3, $4, $5
		FROM subjects s
		WHERE s.id = $1 AND s.user_id = $6
		RETURNING id;
	`

	var fileID int64
	if err := db.QueryRow(query, subjectID, path, originalName, mimeType, sizeBytes, userID).
		Scan(&fileID); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return 0, sql.ErrNoRows
		}
		return 0, fmt.Errorf("insert subject file: %w", err)
	}

	return fileID, nil
}

func normalizeUniqueSubjectError(err error) error {
	if err == nil {
		return nil
	}
	if pgErr, ok := errors.AsType[*pgconn.PgError](err); ok && pgErr.Code == "23505" {
		return ErrSubjectAlreadyExists
	}
	return err
}
