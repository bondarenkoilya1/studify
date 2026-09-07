package subject

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	_ "image/jpeg"
	_ "image/png"
	"log"
	"net/http"
	"strconv"
	"studify/internal/httpx"
	"studify/internal/media"

	"github.com/go-chi/chi/v5"
)

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

		log.Printf("failed to get subject: %v", err)
		http.Error(w, "Failed to get subject", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, subject)
}

func (h *Handler) GetUserSubjects(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	subjects, err := GetSubjectsByUserID(h.DB, userID)
	if err != nil {
		log.Printf("failed to get subjects: %v", err)
		http.Error(w, "Failed to get subjects", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, subjects)
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
		req.ThumbnailURL,
		req.ExamDate,
		req.Term,
		req.Lecturers,
	)
	if err != nil {
		log.Printf("failed to insert subject: %v", err)
		http.Error(w, "failed to insert subject", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusCreated, createdSubject)
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
		req.ThumbnailURL,
		req.ExamDate,
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

		log.Printf("failed to replace subject: %v", err)
		http.Error(w, "Failed to replace subject", http.StatusInternalServerError)
		return
	}

	subject, err := GetSubjectByID(h.DB, id, userID)
	if err != nil {
		log.Printf("failed to get replaced subject: %v", err)
		http.Error(w, "Failed to get replaced subject", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, subject)
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
		req.ThumbnailURL == nil &&
		req.ExamDate == nil &&
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

		log.Printf("failed to get subject: %v", err)
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

	if req.ThumbnailURL != nil {
		subject.ThumbnailURL = req.ThumbnailURL
	}

	if req.ExamDate != nil {
		subject.ExamDate = req.ExamDate
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
		subject.ThumbnailURL,
		subject.ExamDate,
		subject.Term,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			http.Error(w, "Subject not found", http.StatusNotFound)
			return
		}

		log.Printf("failed to update subject: %v", err)
		http.Error(w, "Failed to update subject", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, subject)
}

func (h *Handler) DeleteUserSubjects(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	if err := DeleteSubjectsByUserID(h.DB, userID); err != nil {
		log.Printf("failed to delete subjects: %v", err)
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

		log.Printf("failed to delete subject: %v", err)
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

	filename, err := media.SaveImageAsWebp(r.Body, constraints, "./data/thumbnails/")
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
			log.Printf("failed to save thumbnail: %v", err)
			http.Error(w, "failed to save thumbnail", http.StatusInternalServerError)
		}
		return
	}

	thumbnailURL := "/static/thumbnails/" + filename

	if err = InsertSubjectThumbnail(h.DB, subjectID, thumbnailURL, userID); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			http.Error(w, "subject not found", http.StatusNotFound)
			return
		}
		log.Printf("failed to update subject thumbnail: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, thumbnail{ThumbnailURL: thumbnailURL})
}
