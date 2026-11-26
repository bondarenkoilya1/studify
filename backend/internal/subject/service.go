package subject

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"os"
	"path/filepath"
	"strings"

	"studify/internal/media"
	"studify/internal/util"
)

var ErrNoFieldsToUpdate = errors.New("no fields to update")

// ValidationError — ошибка валидации входных данных.
// Message предназначен для показа клиенту как есть.
type ValidationError struct {
	Message string
}

func (e *ValidationError) Error() string { return e.Message }

func invalid(msg string) error { return &ValidationError{Message: msg} }

var thumbnailConstraints = media.ImageConstraints{
	MaxWidth:  2560,
	MaxHeight: 2560,
	Quality:   85,
}

const maxFileSize = 50 << 20 // 50 MB

type Service struct {
	db *sql.DB
}

func NewService(db *sql.DB) *Service {
	return &Service{db: db}
}

func (s *Service) getSubject(ctx context.Context, id, userID int64) (*Subject, error) {
	subject, err := GetSubjectByID(ctx, s.db, id, userID)
	if err != nil {
		return nil, fmt.Errorf("get subject %d: %w", id, err)
	}

	return subject, nil
}

func (s *Service) getUserSubjects(ctx context.Context, userID int64) ([]Subject, error) {
	subjects, err := GetSubjectsByUserID(ctx, s.db, userID)
	if err != nil {
		return nil, fmt.Errorf("get subjects of user %d: %w", userID, err)
	}

	if subjects == nil {
		subjects = []Subject{}
	}

	return subjects, nil
}

func (s *Service) addSubject(ctx context.Context, userID int64, req *CreateSubjectRequest) (*Subject, error) {
	subject, err := InsertSubject(
		ctx, s.db, userID, req.Name,
		req.Note, req.Type, req.Scope,
		req.ExamType, req.ThumbnailURL, req.ExamDate,
		req.Course, req.Term, req.Lecturers,
	)
	if err != nil {
		return nil, fmt.Errorf("insert subject: %w", err)
	}

	return subject, nil
}

func (s *Service) replaceSubject(ctx context.Context, userID, id int64, req *CreateSubjectRequest) (*Subject, error) {
	if err := UpdateSubject(
		ctx, s.db, userID, id, req.Name,
		req.Note, req.Type, req.Scope,
		req.ExamType, req.ThumbnailURL, req.ExamDate,
		req.Course, req.Term,
	); err != nil {
		return nil, fmt.Errorf("replace subject %d: %w", id, err)
	}

	subject, err := GetSubjectByID(ctx, s.db, id, userID)
	if err != nil {
		return nil, fmt.Errorf("load replaced subject %d: %w", id, err)
	}

	return subject, nil
}

func (s *Service) updateSubject(ctx context.Context, userID, id int64, req *UpdateSubjectRequest) (*Subject, error) {
	if req.isEmpty() {
		return nil, ErrNoFieldsToUpdate
	}

	if err := validateSubjectChanges(req); err != nil {
		return nil, invalid(err.Error())
	}

	if req.Lecturers != nil {
		if err := validateLecturers(*req.Lecturers); err != nil {
			return nil, invalid(err.Error())
		}
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("begin subject update: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	subject, err := getSubjectByID(ctx, tx, id, userID, true)
	if err != nil {
		return nil, fmt.Errorf("load subject %d for update: %w", id, err)
	}

	if req.Name != nil {
		subject.Name = *req.Name
	}
	if req.NoteSet || req.Note != nil {
		subject.Note = req.Note
	}
	if req.Type != nil {
		subject.Type = *req.Type
	}
	if req.Scope != nil {
		subject.Scope = *req.Scope
	}
	if req.ExamType != nil {
		subject.ExamType = *req.ExamType
	}
	if req.ThumbnailURL != nil {
		subject.ThumbnailURL = req.ThumbnailURL
	}
	if req.ExamDateSet {
		subject.ExamDate = req.ExamDate
	}
	if req.CourseSet || req.Course != nil {
		subject.Course = req.Course
	}
	if req.TermSet || req.Term != nil {
		subject.Term = req.Term
	}

	if err := UpdateSubject(
		ctx, tx, userID, id, subject.Name,
		subject.Note, subject.Type, subject.Scope,
		subject.ExamType, subject.ThumbnailURL, subject.ExamDate,
		subject.Course, subject.Term,
	); err != nil {
		return nil, fmt.Errorf("save updated subject %d: %w", id, err)
	}

	if req.LecturersSet || req.Lecturers != nil {
		var lecturers []Lecturer
		if req.Lecturers != nil {
			lecturers = *req.Lecturers
		}
		subject.Lecturers, err = replaceLecturers(ctx, tx, id, lecturers)
		if err != nil {
			return nil, err
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("commit subject update: %w", err)
	}

	return subject, nil
}

func (s *Service) deleteUserSubjects(ctx context.Context, userID int64) error {
	if err := DeleteSubjectsByUserID(ctx, s.db, userID); err != nil {
		return fmt.Errorf("delete subjects of user %d: %w", userID, err)
	}

	return nil
}

func (s *Service) deleteSubject(ctx context.Context, userID, id int64) error {
	if err := DeleteSubjectByID(ctx, s.db, userID, id); err != nil {
		return fmt.Errorf("delete subject %d: %w", id, err)
	}

	return nil
}

// uploadThumbnail сохраняет картинку на диск, привязывает её к предмету
// и удаляет предыдущую. Возвращает публичный URL новой картинки.
func (s *Service) uploadThumbnail(ctx context.Context, userID, subjectID int64, body io.Reader) (string, error) {
	filename, err := media.SaveImageAsWebp(body, thumbnailConstraints, thumbnailsDir)
	if err != nil {
		return "", fmt.Errorf("save thumbnail image: %w", err)
	}

	thumbnailURL := thumbnailsPublicDir + filename

	oldURL, err := ReplaceSubjectThumbnail(ctx, s.db, subjectID, userID, thumbnailURL)
	if err != nil {
		removeFile(filepath.Join(thumbnailsDir, filename))
		return "", fmt.Errorf("replace thumbnail of subject %d: %w", subjectID, err)
	}

	if oldURL != nil && *oldURL != "" {
		path, ok := thumbnailFilePath(*oldURL)
		if !ok {
			slog.ErrorContext(ctx, "unexpected thumbnail url",
				util.AttrURL(*oldURL),
				util.AttrSubjectID(subjectID),
			)
		} else {
			removeFile(path)
		}
	}

	return thumbnailURL, nil
}

// uploadFile сохраняет файл на диск и записывает его в БД.
// Возвращает публичный URL файла.
func (s *Service) uploadFile(ctx context.Context, userID, subjectID int64, file io.Reader, originalFilename string) (string, error) {
	filename, sizeBytes, contentType, err := media.SaveFile(file, maxFileSize, filesDir)
	if err != nil {
		return "", fmt.Errorf("save file: %w", err)
	}

	publicPath := filesPublicDir + filename

	if _, err := InsertSubjectFile(ctx, s.db, subjectID, userID, publicPath, originalFilename, contentType, sizeBytes); err != nil {
		removeFile(filepath.Join(filesDir, filename))
		return "", fmt.Errorf("insert file of subject %d: %w", subjectID, err)
	}

	return publicPath, nil
}

// thumbnailFilePath превращает публичный URL thumbnail в путь на диске.
// Второе значение false означает, что URL не похож на наш thumbnail.
func thumbnailFilePath(thumbnailURL string) (string, bool) {
	filename, ok := strings.CutPrefix(thumbnailURL, thumbnailsPublicDir)
	if !ok || filename == "" || filepath.Base(filename) != filename {
		return "", false
	}
	return filepath.Join(thumbnailsDir, filename), true
}

func removeFile(path string) {
	if err := os.Remove(path); err != nil && !errors.Is(err, os.ErrNotExist) {
		slog.Error("failed to delete file",
			util.AttrPath(path),
			util.AttrError(err),
		)
	}
}

func (r *UpdateSubjectRequest) isEmpty() bool {
	return r.Name == nil &&
		!r.NoteSet && r.Note == nil &&
		r.Type == nil &&
		r.Scope == nil &&
		r.ExamType == nil &&
		r.ThumbnailURL == nil &&
		!r.ExamDateSet &&
		!r.CourseSet && r.Course == nil &&
		r.Term == nil &&
		!r.LecturersSet && r.Lecturers == nil
}
