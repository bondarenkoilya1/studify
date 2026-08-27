package subject

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"image"
	_ "image/jpeg"
	_ "image/png"
	"log"
	"net/http"
	"os"
	"studify/internal/httpx"

	"github.com/chai2010/webp"
	"github.com/google/uuid"
)

var validScopes = map[string]bool{
	"technology": true,
	"healthcare": true,
	"humanities": true,
	"business":   true,
	"social":     true,
	"science":    true,
	"other":      true,
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

	if req.Name == "" {
		http.Error(w, "subject name is required", http.StatusBadRequest)
		return
	}

	if req.Type == "" {
		req.Type = "university"
	}

	if req.Type != "university" && req.Type != "personal" {
		http.Error(w, "invalid subject type", http.StatusBadRequest)
		return
	}

	if req.Scope == "" {
		req.Scope = "other"
	}

	if !validScopes[req.Scope] {
		http.Error(w, "invalid subject scope", http.StatusBadRequest)
		return
	}

	createdSubject, err := InsertSubject(
		h.DB,
		userID,
		req.Name,
		req.Type,
		req.Scope,
		req.Lecturer,
		req.LecturerAvatarURL,
		req.ExamDate,
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

	if req.Name == "" {
		http.Error(w, "subject name is required", http.StatusBadRequest)
		return
	}

	if req.Type == "" {
		req.Type = "university"
	}

	if req.Type != "university" && req.Type != "personal" {
		http.Error(w, "invalid subject type", http.StatusBadRequest)
		return
	}

	if req.Scope == "" {
		req.Scope = "other"
	}

	if !validScopes[req.Scope] {
		http.Error(w, "invalid subject scope", http.StatusBadRequest)
		return
	}

	if err := UpdateSubject(
		h.DB,
		userID,
		id,
		req.Name,
		req.Type,
		req.Scope,
		req.Lecturer,
		req.LecturerAvatarURL,
		req.ExamDate,
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
		req.Type == nil &&
		req.Scope == nil &&
		req.Lecturer == nil &&
		req.LecturerAvatarURL == nil &&
		req.ExamDate == nil {
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

	if req.Lecturer != nil {
		subject.Lecturer = req.Lecturer
	}

	if req.LecturerAvatarURL != nil {
		subject.LecturerAvatarURL = req.LecturerAvatarURL
	}

	if req.ExamDate != nil {
		subject.ExamDate = req.ExamDate
	}

	if err := UpdateSubject(
		h.DB,
		userID,
		id,
		subject.Name,
		subject.Type,
		subject.Scope,
		subject.Lecturer,
		subject.LecturerAvatarURL,
		subject.ExamDate,
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

func (h *Handler) UploadLecturerAvatar(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()

	const (
		maxAvatarBytes = 2 << 20
		maxWidth       = 2560
		maxHeight      = 2560
	)

	r.Body = http.MaxBytesReader(w, r.Body, maxAvatarBytes)

	img, format, err := image.Decode(r.Body)
	if err != nil {
		if _, ok := errors.AsType[*http.MaxBytesError](err); ok {
			http.Error(w, "Avatar is too large", http.StatusRequestEntityTooLarge)
			return
		}

		http.Error(w, "Invalid image", http.StatusBadRequest)
		return
	}

	switch format {
	case "png", "jpeg", "webp":
	default:
		http.Error(
			w,
			"Invalid file format. Use PNG/JPEG/WEBP",
			http.StatusUnsupportedMediaType,
		)
		return
	}

	bounds := img.Bounds()
	width := bounds.Dx()
	height := bounds.Dy()

	if width > maxWidth || height > maxHeight {
		http.Error(
			w,
			fmt.Sprintf(
				"File resolution is too large. Maximum resolution is %dx%d",
				maxWidth,
				maxHeight,
			),
			http.StatusRequestEntityTooLarge,
		)
		return
	}

	dir := "./data/lecturer-avatars/"

	if err := ensureDir(dir); err != nil {
		http.Error(w, "Wrong directory on the server", http.StatusInternalServerError)
		return
	}

	filename := uuid.New().String() + ".webp"
	fullPath := dir + filename

	dst, err := os.Create(fullPath)
	if err != nil {
		http.Error(w, "Failed to create file", http.StatusInternalServerError)
		return
	}
	defer dst.Close()

	if err := webp.Encode(dst, img, &webp.Options{
		Quality: 85,
	}); err != nil {
		http.Error(w, "Failed to save image", http.StatusInternalServerError)
		return
	}

	type avatarResponse struct {
		LecturerAvatarURL string `json:"lecturer_avatar_url"`
	}

	writeJSON(w, http.StatusOK, avatarResponse{
		LecturerAvatarURL: fullPath,
	})
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)

	if err := json.NewEncoder(w).Encode(value); err != nil {
		log.Printf("failed to encode JSON response: %v", err)
	}
}

func ensureDir(path string) error {
	if err := os.MkdirAll(path, 0o755); err != nil {
		return fmt.Errorf("prepare storage directory %q: %w", path, err)
	}

	file, err := os.CreateTemp(path, ".check-*")
	if err != nil {
		return fmt.Errorf("storage directory %q is not writable: %w", path, err)
	}

	name := file.Name()

	if err := file.Close(); err != nil {
		return fmt.Errorf("close check file %q: %w", name, err)
	}

	if err := os.Remove(name); err != nil {
		return fmt.Errorf("remove check file %q: %w", name, err)
	}

	return nil
}
