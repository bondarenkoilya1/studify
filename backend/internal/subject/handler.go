package subject

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	_ "image/jpeg"
	_ "image/png"
	"log/slog"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"studify/internal/httpx"
	"studify/internal/media"
	"studify/internal/user"
	"studify/internal/util"

	"github.com/go-chi/chi/v5"
)

const (
	thumbnailsDir       = "./data/thumbnails/"
	thumbnailsPublicDir = "/static/thumbnails/"
	filesDir            = "./data/files/"
	filesPublicDir      = "/static/files/"
)

// thumbnailFilePath превращает публичный URL thumbnail в путь на диске.
// Второе значение false означает, что URL не похож на наш аватар.
func thumbnailFilePath(thumbnailURL string) (string, bool) {
	filename, ok := strings.CutPrefix(thumbnailURL, thumbnailsPublicDir)
	if !ok || filename == "" || filepath.Base(filename) != filename {
		return "", false
	}
	return filepath.Join(thumbnailsDir, filename), true
}

func (h *Handler) GetSubject(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	id, err := httpx.GetID(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	subject, err := GetSubjectByID(h.DB, id, userID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			http.Error(w, "Subject was not found", http.StatusNotFound)
			return
		}

		slog.Error("failed to get subject", slog.String("error", err.Error()))
		http.Error(w, "Failed to get subject", http.StatusInternalServerError)
		return
	}

	util.WriteJSON(w, r, http.StatusOK, subject)
}

func (h *Handler) GetUserSubjects(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	subjects, err := GetSubjectsByUserID(h.DB, userID)
	if err != nil {
		slog.Error("failed to get subjects", slog.String("error", err.Error()))
		http.Error(w, "Failed to get subjects", http.StatusInternalServerError)
		return
	}

	util.WriteJSON(w, r, http.StatusOK, subjects)
}

func (h *Handler) AddSubject(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var req CreateSubjectRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}

	if err := validateCreateSubjectRequest(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	createdSubject, err := InsertSubject(
		h.DB,
		userID,
		req.Name,
		req.Note,
		req.Type,
		req.Scope,
		req.ExamType,
		req.ThumbnailURL,
		req.ExamDate,
		req.Course,
		req.Term,
		req.Lecturers,
	)
	if err != nil {
		if errors.Is(err, ErrSubjectAlreadyExists) {
			slog.Error("attempted to create duplicate subject",
				slog.Any("user_id", userID),
				slog.String("subject_name", req.Name),
				slog.String("error", err.Error()),
			)
			http.Error(w, "Предмет с таким названием уже существует", http.StatusConflict)
			return
		}

		slog.Error("failed to insert subject",
			slog.Any("user_id", userID),
			slog.String("error", err.Error()),
		)
		http.Error(w, "failed to insert subject", http.StatusInternalServerError)
		return
	}

	util.WriteJSON(w, r, http.StatusCreated, createdSubject)
}

func (h *Handler) ReplaceSubject(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	id, err := httpx.GetID(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	var req CreateSubjectRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}

	if err := validateCreateSubjectRequest(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := UpdateSubject(
		h.DB,
		userID,
		id,
		req.Name,
		req.Note,
		req.Type,
		req.Scope,
		req.ExamType,
		req.ThumbnailURL,
		req.ExamDate,
		req.Course,
		req.Term,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			http.Error(
				w,
				fmt.Sprintf("No such element with ID: %d", id),
				http.StatusNotFound,
			)
			return
		}
		if errors.Is(err, ErrSubjectAlreadyExists) {
			slog.Error("attempted to replace subject with duplicate name",
				slog.Any("user_id", userID),
				slog.Any("subject_id", id),
				slog.String("subject_name", req.Name),
				slog.String("error", err.Error()),
			)
			http.Error(w, "Предмет с таким названием уже существует", http.StatusConflict)
			return
		}

		slog.Error("failed to replace subject",
			slog.Any("user_id", userID),
			slog.String("error", err.Error()),
		)
		http.Error(w, "Failed to replace subject", http.StatusInternalServerError)
		return
	}

	subject, err := GetSubjectByID(h.DB, id, userID)
	if err != nil {
		slog.Error("failed to get replaced subject", slog.String("error", err.Error()))
		http.Error(w, "Failed to get replaced subject", http.StatusInternalServerError)
		return
	}

	util.WriteJSON(w, r, http.StatusOK, subject)
}

func (h *Handler) UpdateSubject(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	id, err := httpx.GetID(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	var req UpdateSubjectRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}

	if req.Name == nil &&
		req.Note == nil &&
		req.Type == nil &&
		req.Scope == nil &&
		req.ExamType == nil &&
		req.ThumbnailURL == nil &&
		req.ExamDate == nil &&
		req.Course == nil &&
		req.Term == nil {
		http.Error(w, "no fields to update", http.StatusBadRequest)
		return
	}

	subject, err := GetSubjectByID(h.DB, id, userID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			http.Error(w, "Subject not found", http.StatusNotFound)
			return
		}

		slog.Error("failed to get subject", slog.String("error", err.Error()))
		http.Error(w, "Failed to get subject", http.StatusInternalServerError)
		return
	}

	if req.Name != nil {
		if *req.Name == "" {
			http.Error(w, "subject name cannot be empty", http.StatusBadRequest)
			return
		}

		subject.Name = *req.Name
	}

	if req.Note != nil {
		subject.Note = req.Note
	}

	if req.Type != nil {
		if *req.Type != "university" && *req.Type != "personal" {
			http.Error(w, "invalid subject type", http.StatusBadRequest)
			return
		}

		subject.Type = *req.Type
	}

	if req.Scope != nil {
		if !validScopes[*req.Scope] {
			http.Error(w, "invalid subject scope", http.StatusBadRequest)
			return
		}

		subject.Scope = *req.Scope
	}

	if req.ExamType != nil {
		if !validExamTypes[*req.ExamType] {
			http.Error(w, "invalid exam type", http.StatusBadRequest)
			return
		}

		subject.ExamType = *req.ExamType
	}

	if req.ThumbnailURL != nil {
		subject.ThumbnailURL = req.ThumbnailURL
	}

	if req.ExamDate != nil {
		subject.ExamDate = req.ExamDate
	}

	if req.Course != nil {
		if err := validateCourse(req.Course); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		subject.Course = req.Course
	}

	if req.Term != nil {
		if err := validateTerm(req.Term); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		subject.Term = req.Term
	}

	if err := UpdateSubject(
		h.DB,
		userID,
		id,
		subject.Name,
		subject.Note,
		subject.Type,
		subject.Scope,
		subject.ExamType,
		subject.ThumbnailURL,
		subject.ExamDate,
		subject.Course,
		subject.Term,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			http.Error(w, "Subject not found", http.StatusNotFound)
			return
		}
		if errors.Is(err, ErrSubjectAlreadyExists) {
			slog.Error("attempted to update subject with duplicate name",
				slog.Any("user_id", userID),
				slog.Any("subject_id", id),
				slog.String("subject_name", subject.Name),
				slog.String("error", err.Error()),
			)
			http.Error(w, "Предмет с таким названием уже существует", http.StatusConflict)
			return
		}

		slog.Error("failed to update subject",
			slog.Any("user_id", userID),
			slog.String("error", err.Error()),
		)
		http.Error(w, "Failed to update subject", http.StatusInternalServerError)
		return
	}

	util.WriteJSON(w, r, http.StatusOK, subject)
}

func (h *Handler) DeleteUserSubjects(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	if err := DeleteSubjectsByUserID(h.DB, userID); err != nil {
		slog.Error("failed to delete subjects", slog.String("error", err.Error()))
		http.Error(w, "Failed to delete subjects", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) DeleteSubject(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	id, err := httpx.GetID(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := DeleteSubjectByID(h.DB, userID, id); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			http.Error(w, "No such element with this ID", http.StatusNotFound)
			return
		}

		slog.Error("failed to delete subject", slog.String("error", err.Error()))
		http.Error(w, "Failed to delete subject", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) UploadThumbnail(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()

	userID, err := httpx.GetUserID(r)
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	subjectID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil || subjectID <= 0 {
		http.Error(w, "invalid subject id", http.StatusBadRequest)
		return
	}

	const maxThumbnailBytes = 2 << 20 // 2 MB
	r.Body = http.MaxBytesReader(w, r.Body, maxThumbnailBytes)

	constraints := media.ImageConstraints{
		MaxWidth:  2560,
		MaxHeight: 2560,
		Quality:   85,
	}

	filename, err := media.SaveImageAsWebp(r.Body, constraints, thumbnailsDir)
	if err != nil {
		if _, ok := errors.AsType[*http.MaxBytesError](err); ok {
			http.Error(w, "thumbnail is too large (max 2MB)", http.StatusRequestEntityTooLarge)
			return
		}

		switch {
		case errors.Is(err, media.ErrInvalidFormat):
			http.Error(w, err.Error(), http.StatusUnsupportedMediaType)
		case errors.Is(err, media.ErrDimensionsExceed), errors.Is(err, media.ErrDecodeFailed):
			http.Error(w, err.Error(), http.StatusBadRequest)
		default:
			slog.Error("failed to save thumbnail", slog.String("error", err.Error()))
			http.Error(w, "failed to save thumbnail", http.StatusInternalServerError)
		}
		return
	}

	thumbnailURL := thumbnailsPublicDir + filename

	oldURL, err := ReplaceSubjectThumbnail(h.DB, subjectID, userID, thumbnailURL)
	if err != nil {
		if rmErr := os.Remove(filepath.Join(thumbnailsDir, filename)); rmErr != nil && !errors.Is(rmErr, os.ErrNotExist) {
			slog.Error("failed to delete orphaned avatar file", "error", rmErr, "user_id", userID)
		}

		if errors.Is(err, user.ErrUserNotFound) {
			http.Error(w, "subject not found", http.StatusNotFound)
			return
		}
		slog.Error("failed to update subject thumbnail", slog.String("error", err.Error()))
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if oldURL != nil && *oldURL != "" {
		path, ok := thumbnailFilePath(*oldURL)
		if !ok {
			slog.Error("unexpected thumbnail url", slog.String("url", *oldURL), slog.Int64("user_id", userID))
		} else if rmErr := os.Remove(path); rmErr != nil && !errors.Is(rmErr, os.ErrNotExist) {
			slog.Error("failed to delete previous thumbnail file", slog.String("error", rmErr.Error()), slog.String("path", path), slog.Int64("user_id", userID))
		}
	}

	util.WriteJSON(w, r, http.StatusOK, thumbnail{ThumbnailURL: thumbnailURL})
}

func (h *Handler) UploadFile(w http.ResponseWriter, r *http.Request) {
	file, header, err := r.FormFile("file")
	if err != nil {
		slog.Error("failed to get file", slog.String("error", err.Error()))
		http.Error(w, "invalid data", http.StatusBadRequest)
		return
	}
	defer file.Close()

	const maxPDFSize = 50 << 20 // 50 MB

	filename, sizeBytes, contentType, err := media.SaveFile(file, maxPDFSize, filesDir)
	if err != nil {
		slog.Error("failed to save file", slog.String("error", err.Error()))
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	path := filesPublicDir + filename
	originalFilename := header.Filename

	userID, err := httpx.GetUserID(r)
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	subjectID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil || subjectID <= 0 {
		http.Error(w, "invalid subject id", http.StatusBadRequest)
		return
	}

	_, err = InsertSubjectFile(h.DB, subjectID, userID, path, originalFilename, contentType, sizeBytes)
	if err != nil {
		slog.Error("failed to insert file data", slog.String("error", err.Error()))
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	util.WriteJSON(w, r, http.StatusOK, fileResponse{FileURL: path})
}
