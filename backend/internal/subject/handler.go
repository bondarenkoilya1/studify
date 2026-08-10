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

	w.Header().Set("Content-Type", "application/json")
	if err = json.NewEncoder(w).Encode(subject); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

func (h *Handler) GetSubjects(w http.ResponseWriter, r *http.Request) {
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

	w.Header().Set("Content-Type", "application/json")
	if err = json.NewEncoder(w).Encode(subjects); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

func (h *Handler) AddSubject(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var subject Subject

	err = json.NewDecoder(r.Body).Decode(&subject)
	if err != nil {
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}

	if subject.Name == "" || subject.Lecturer == "" || subject.ExamDate.IsZero() {
		http.Error(w, "invalid subject data", http.StatusBadRequest)
		return
	}

	createdSubject, err := InsertSubject(
		h.DB,
		userID,
		subject.Name,
		subject.Lecturer,
		subject.LecturerAvatarURL,
		subject.ExamDate,
	)
	if err != nil {
		log.Printf("failed to insert subject: %v", err)
		http.Error(w, "failed to insert subject", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)

	if err := json.NewEncoder(w).Encode(createdSubject); err != nil {
		log.Printf("failed to encode response: %v", err)
	}
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

	var newSubject Subject
	if err = json.NewDecoder(r.Body).Decode(&newSubject); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if newSubject.Name == "" {
		http.Error(w, "Subject name is required", http.StatusBadRequest)
		return
	}

	if err = UpdateSubject(h.DB, userID, id, newSubject.Name, newSubject.Lecturer, newSubject.ExamDate); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			http.Error(w, fmt.Sprintf("No such element with ID: %d", id), http.StatusNotFound)
			return
		}

		http.Error(w, "Failed to replace subject", http.StatusInternalServerError)
		return
	}

	newSubject.ID = id
	newSubject.UserID = userID
	w.Header().Set("Content-Type", "application/json")
	if err = json.NewEncoder(w).Encode(newSubject); err != nil {
		log.Printf("Element was changed but cannot be returned as JSON because of encoding error: %v", err)
		return
	}
}

func (h *Handler) UpdateSubject(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var req *UpdateSubjectRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if req.Name == nil && req.Lecturer == nil && req.ExamDate == nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
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
			http.Error(w, "Subject not found", http.StatusNotFound)
			return
		}

		log.Printf("failed to get subject: %v", err)
		http.Error(w, "Failed to get subject", http.StatusInternalServerError)
		return
	}

	if req.Name != nil {
		subject.Name = *req.Name
	}

	if req.Lecturer != nil {
		subject.Lecturer = *req.Lecturer
	}

	if req.ExamDate != nil {
		subject.ExamDate = req.ExamDate
	}

	if err = UpdateSubject(h.DB, userID, id, subject.Name, subject.Lecturer, subject.ExamDate); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			http.Error(w, "Subject not found", http.StatusNotFound)
			return
		}

		log.Printf("failed to update subject: %v", err)
		http.Error(w, "Failed to update subject", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err = json.NewEncoder(w).Encode(subject); err != nil {
		http.Error(w, "Failed to encode subject as JSON", http.StatusInternalServerError)
		return
	}
}

func (h *Handler) DeleteSubjects(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	err = DeleteSubjectsByUserID(h.DB, userID)
	if err != nil {
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

	if err = DeleteSubjectByID(h.DB, userID, id); err != nil {
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
		maxAvatarBytes = 2 << 20 // 2 MiB
		maxWidth       = 2560
		maxHeight
	)
	r.Body = http.MaxBytesReader(w, r.Body, maxAvatarBytes)
	// todo: 413 error

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
		// ok
	default:
		http.Error(w, "Invalid file format. Use PNG/JPEG/WEBP", http.StatusUnsupportedMediaType)
		return
	}

	bounds := img.Bounds()
	width := bounds.Dx()
	height := bounds.Dy()

	if width > maxWidth || height > maxHeight {
		http.Error(w, fmt.Sprintf("File resolution is too large. Maximum resolution is %dx%d", maxWidth, maxHeight), http.StatusRequestEntityTooLarge)
		return
	}

	dir := "./data/lecturer-avatars/"
	if err = ensureDir(dir); err != nil {
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

	if err = webp.Encode(dst, img, &webp.Options{
		Quality: 85,
	}); err != nil {
		http.Error(w, "Failed to save image", http.StatusInternalServerError)
		return
	}

	type URL struct {
		LecturerAvatarURL string `json:"lecturer_avatar_url"`
	}

	if err = json.NewEncoder(w).Encode(URL{LecturerAvatarURL: fullPath}); err != nil {
		log.Printf("encode avatar upload response: %v", err)
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

// Helpers

func ensureDir(path string) error {
	if err := os.MkdirAll(path, 0o755); err != nil {
		return fmt.Errorf("prepare storage directory %q: %w", path, err)
	}

	file, err := os.CreateTemp(path, ".check-*")
	if err != nil {
		return fmt.Errorf("storage directory %q is not writable: %w", path, err)
	}

	name := file.Name()

	if err = file.Close(); err != nil {
		return fmt.Errorf("close check file %q: %w", name, err)
	}

	if err = os.Remove(name); err != nil {
		return fmt.Errorf("remove check file %q: %w", name, err)
	}

	return nil
}
