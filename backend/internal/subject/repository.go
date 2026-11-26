package subject

import (
	"context"
	"database/sql"
	"encoding/json"
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

func scanSubject(scanner interface{ Scan(dest ...any) error }, extra ...any) (*Subject, error) {
	s := &Subject{}
	var note, thumbnailURL sql.NullString
	var examDate sql.NullTime
	var course, term sql.NullInt64

	dest := []any{
		&s.ID, &s.UserID, &s.Name, &note, &s.Type, &s.Scope, &s.ExamType,
		&examDate, &course, &term, &thumbnailURL,
	}
	if err := scanner.Scan(append(dest, extra...)...); err != nil {
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

func getLecturersBySubjectID(ctx context.Context, db internal.DBTX, subjectID int64) ([]Lecturer, error) {
	rows, err := db.QueryContext(ctx,
		`SELECT name, position FROM lecturers WHERE subject_id = $1 ORDER BY id;`,
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

func getFilesBySubjectID(ctx context.Context, db internal.DBTX, subjectID int64) ([]File, error) {
	rows, err := db.QueryContext(ctx,
		`SELECT path, original_name, mime_type, size_bytes FROM subjects_files WHERE subject_id = $1 ORDER BY id;`,
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

func GetSubjectByID(ctx context.Context, db internal.DBTX, id, userID int64) (*Subject, error) {
	return getSubjectByID(ctx, db, id, userID, false)
}

func getSubjectByID(ctx context.Context, db internal.DBTX, id, userID int64, lock bool) (*Subject, error) {
	query := `
		SELECT id, user_id, name, note, type, scope, exam_type, exam_date,
		       course, term, thumbnail_url
		FROM subjects WHERE id = $1 AND user_id = $2`
	if lock {
		query += " FOR UPDATE"
	}

	s, err := scanSubject(db.QueryRowContext(ctx, query, id, userID))
	if err != nil {
		return nil, fmt.Errorf("get subject by id: %w", err)
	}

	s.Lecturers, err = getLecturersBySubjectID(ctx, db, id)
	if err != nil {
		return nil, err
	}
	s.Files, err = getFilesBySubjectID(ctx, db, id)
	if err != nil {
		return nil, err
	}

	return s, nil
}

func GetSubjectsByUserID(ctx context.Context, db internal.DBTX, userID int64) ([]Subject, error) {
	const query = `
		WITH user_subjects AS (
			SELECT * FROM subjects WHERE user_id = $1
		), subject_lecturers AS (
			SELECT l.subject_id, jsonb_agg(jsonb_build_object(
				'name', l.name, 'position', l.position
			) ORDER BY l.id) AS lecturers
			FROM lecturers l JOIN user_subjects s ON s.id = l.subject_id
			GROUP BY l.subject_id
		)
		SELECT s.id, s.user_id, s.name, s.note, s.type, s.scope, s.exam_type,
		       s.exam_date, s.course, s.term, s.thumbnail_url, l.lecturers
		FROM user_subjects s
		LEFT JOIN subject_lecturers l ON l.subject_id = s.id
		ORDER BY s.course DESC NULLS LAST, s.term DESC NULLS LAST, s.id;
	`

	rows, err := db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("get subjects: %w", err)
	}
	defer rows.Close()

	subjects := make([]Subject, 0)
	for rows.Next() {
		var lecturers []byte
		subject, err := scanSubject(rows, &lecturers)
		if err != nil {
			return nil, fmt.Errorf("scan subject: %w", err)
		}
		if len(lecturers) != 0 {
			if err := json.Unmarshal(lecturers, &subject.Lecturers); err != nil {
				return nil, fmt.Errorf("decode subject lecturers: %w", err)
			}
		}
		subjects = append(subjects, *subject)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("read subjects rows: %w", err)
	}
	return subjects, nil
}

func InsertSubject(
	ctx context.Context, db *sql.DB, userID int64, name string, note *string,
	subjectType, scope, examType string, thumbnailURL *string,
	examDate *time.Time, course, term *int, lecturers []Lecturer,
) (*Subject, error) {
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("begin transaction: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	s, err := insertSubjectTx(
		ctx, tx, userID, name, note, subjectType, scope, examType,
		thumbnailURL, examDate, course, term,
	)
	if err != nil {
		return nil, err
	}

	s.Lecturers, err = insertLecturersTx(ctx, tx, s.ID, lecturers)
	if err != nil {
		return nil, err
	}
	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("commit transaction: %w", err)
	}

	return s, nil
}

func insertSubjectTx(
	ctx context.Context, db internal.DBTX, userID int64, name string, note *string,
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

	s, err := scanSubject(db.QueryRowContext(ctx,
		query, userID, name, note, subjectType, scope, examType,
		examDate, toNullInt64(course), toNullInt64(term), thumbnailURL,
	))
	if err != nil {
		return nil, fmt.Errorf("insert subject: %w", normalizeUniqueSubjectError(err))
	}

	return s, nil
}

func insertLecturersTx(ctx context.Context, db internal.DBTX, subjectID int64, lecturers []Lecturer) ([]Lecturer, error) {
	result := make([]Lecturer, 0, len(lecturers))
	const query = `
		INSERT INTO lecturers (subject_id, name, position)
		VALUES ($1, $2, $3)
		RETURNING name, position;
	`

	for _, l := range lecturers {
		var created Lecturer
		if err := db.QueryRowContext(ctx, query, subjectID, l.Name, l.Position).
			Scan(&created.Name, &created.Position); err != nil {
			return nil, fmt.Errorf("insert lecturer: %w", err)
		}
		result = append(result, created)
	}

	return result, nil
}

func replaceLecturers(ctx context.Context, tx *sql.Tx, subjectID int64, lecturers []Lecturer) ([]Lecturer, error) {
	if _, err := tx.ExecContext(ctx, `DELETE FROM lecturers WHERE subject_id = $1`, subjectID); err != nil {
		return nil, fmt.Errorf("delete previous lecturers: %w", err)
	}
	return insertLecturersTx(ctx, tx, subjectID, lecturers)
}

func toNullInt64(value *int) *int64 {
	if value == nil {
		return nil
	}
	v := int64(*value)
	return &v
}

func UpdateSubject(
	ctx context.Context, db internal.DBTX, userID, id int64, name string, note *string,
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

	result, err := db.ExecContext(ctx,
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

func DeleteSubjectsByUserID(ctx context.Context, db internal.DBTX, userID int64) error {
	if _, err := db.ExecContext(ctx, `DELETE FROM subjects WHERE user_id = $1;`, userID); err != nil {
		return fmt.Errorf("delete subjects by user id: %w", err)
	}
	return nil
}

func DeleteSubjectByID(ctx context.Context, db internal.DBTX, userID, id int64) error {
	result, err := db.ExecContext(ctx, `DELETE FROM subjects WHERE id = $1 AND user_id = $2;`, id, userID)
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

func ReplaceSubjectThumbnail(ctx context.Context, db internal.DBTX, subjectID, userID int64, newURL string) (*string, error) {
	const query = `
		UPDATE subjects s
		SET thumbnail_url = $3
		FROM (SELECT id, thumbnail_url FROM subjects WHERE id = $1 FOR UPDATE) old
		WHERE s.id = old.id AND s.user_id = $2
		RETURNING old.thumbnail_url;
	`

	var oldURL sql.NullString
	if err := db.QueryRowContext(ctx, query, subjectID, userID, newURL).Scan(&oldURL); err != nil {
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
	ctx context.Context, db internal.DBTX, subjectID, userID int64, path, originalName, mimeType string,
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
	if err := db.QueryRowContext(ctx, query, subjectID, path, originalName, mimeType, sizeBytes, userID).
		Scan(&fileID); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return 0, sql.ErrNoRows
		}
		return 0, fmt.Errorf("insert subject file: %w", err)
	}

	return fileID, nil
}

func subjectFileBelongsToUser(ctx context.Context, db internal.DBTX, path string, userID int64) (bool, error) {
	const query = `
		SELECT EXISTS (
			SELECT 1
			FROM subjects_files f
			JOIN subjects s ON s.id = f.subject_id
			WHERE f.path = $1 AND s.user_id = $2
		);
	`
	var belongs bool
	err := db.QueryRowContext(ctx, query, path, userID).Scan(&belongs)
	return belongs, err
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
