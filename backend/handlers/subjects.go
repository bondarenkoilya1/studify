package handlers

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
	"strings"
	"studify/database"
	"studify/models"

	"github.com/chai2010/webp"
	"github.com/google/uuid"
)

func (h *Handler) GetSubject(w http.ResponseWriter, r *http.Request) {
	id, err := GetID(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	subject, err := database.GetSubjectByID(h.DB, id)
	if err != nil {
		http.Error(w, "Subject was not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err = json.NewEncoder(w).Encode(subject); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

func (h *Handler) GetSubjects(w http.ResponseWriter, _ *http.Request) {
	subjects, err := database.GetSubjects(h.DB)
	if err != nil {
		http.Error(w, "Failed to get subjects", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err = json.NewEncoder(w).Encode(subjects); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

func (h *Handler) AddSubjects(w http.ResponseWriter, r *http.Request) {
	if !strings.Contains(r.Header.Get("Content-Type"), "application/json") {
		http.Error(w, "You need to use the following header -> Content-Type: application/json", http.StatusUnsupportedMediaType)
		return
	}

	var newSubjects []models.Subject

	err := json.NewDecoder(r.Body).Decode(&newSubjects)
	if err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if len(newSubjects) == 0 {
		http.Error(w, "Subjects list cannot be empty", http.StatusBadRequest)
		return
	}

	createdSubjects := make([]models.Subject, 0, len(newSubjects))

	for _, s := range newSubjects {
		// here, operate with s.LecturerAvatarURL
		subject, err := database.InsertSubject(h.DB, s.Name, s.Lecturer, s.LecturerAvatarURL, s.ExamDate)
		if err != nil {
			http.Error(w, "Failed to insert subjects", http.StatusInternalServerError)
			return
		}
		createdSubjects = append(createdSubjects, *subject)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)

	if err = json.NewEncoder(w).Encode(createdSubjects); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

func (h *Handler) ReplaceSubject(w http.ResponseWriter, r *http.Request) {
	if !strings.Contains(r.Header.Get("Content-Type"), "application/json") {
		http.Error(w, "You need to use the following header -> Content-Type: application/json", http.StatusUnsupportedMediaType)
		return
	}

	id, err := GetID(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	var newSubject models.Subject
	if err = json.NewDecoder(r.Body).Decode(&newSubject); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if newSubject.Name == "" {
		http.Error(w, "Subject name is required", http.StatusBadRequest)
		return
	}

	if err = database.UpdateSubject(h.DB, id, newSubject.Name, newSubject.Lecturer, newSubject.ExamDate); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			http.Error(w, fmt.Sprintf("No such element with ID: %d", id), http.StatusNotFound)
			return
		}

		http.Error(w, "Failed to replace subject", http.StatusInternalServerError)
		return
	}

	newSubject.ID = id
	w.Header().Set("Content-Type", "application/json")
	if err = json.NewEncoder(w).Encode(newSubject); err != nil {
		log.Printf("Element was changed but cannot be returned as JSON because of encoding error: %v", err)
		return
	}
}

func (h *Handler) UpdateSubject(w http.ResponseWriter, r *http.Request) {
	if !strings.Contains(r.Header.Get("Content-Type"), "application/json") {
		http.Error(w, "You need to use the following header -> Content-Type: application/json", http.StatusUnsupportedMediaType)
		return
	}

	var req *models.UpdateSubjectRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if req.Name == nil && req.Lecturer == nil && req.ExamDate == nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	id, err := GetID(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	subject, err := database.GetSubjectByID(h.DB, id)
	if err != nil {
		http.Error(w, "Subject not found", http.StatusNotFound)
		return
	}

	if req.Name != nil {
		subject.Name = *req.Name
	}

	if req.Lecturer != nil {
		subject.Lecturer = *req.Lecturer
	}

	if req.ExamDate != nil {
		subject.ExamDate = *req.ExamDate
	}

	if err = database.UpdateSubject(h.DB, id, subject.Name, subject.Lecturer, subject.ExamDate); err != nil {
		http.Error(w, "Failed to update subject", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err = json.NewEncoder(w).Encode(subject); err != nil {
		http.Error(w, "Failed to encode subject as JSON", http.StatusInternalServerError)
		return
	}
}

func (h *Handler) DeleteSubjects(w http.ResponseWriter, _ *http.Request) {
	err := database.DeleteSubjects(h.DB)
	if err != nil {
		http.Error(w, "Failed to delete subjects", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) DeleteSubject(w http.ResponseWriter, r *http.Request) {
	id, err := GetID(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err = database.DeleteSubject(h.DB, id); err != nil {
		http.Error(w, "No such element with this ID", http.StatusNotFound)
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
		var maxBytesErr *http.MaxBytesError
		if errors.As(err, &maxBytesErr) {
			http.Error(w, "Avatar is too large", http.StatusRequestEntityTooLarge)
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
	if err = EnsureDir(dir); err != nil {
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
