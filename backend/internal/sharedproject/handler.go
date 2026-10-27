package sharedproject

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strconv"
	"studify/internal/httpx"
)

type Handler struct {
	Service *Service
}

type createSharedProjectRequest struct {
	Name            string `json:"name"`
	URL             string `json:"url"`
	Author          string `json:"author"`
	AuthorAvatarURL string `json:"author_avatar_url"`
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)

	var req createSharedProjectRequest
	if err = json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json body")
		return
	}

	project, err := h.Service.createSharedProject(createSharedProjectInput{
		UserID:          userID,
		Name:            req.Name,
		URL:             req.URL,
		Author:          req.Author,
		AuthorAvatarURL: req.AuthorAvatarURL,
	})
	if err != nil {
		handleServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusCreated, project)
}

func (h *Handler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}

	project, err := h.Service.getSharedProjectByID(id)
	if err != nil {
		handleServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, project)
}

func handleServiceError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, ErrInvalidInput):
		writeError(w, http.StatusBadRequest, err.Error())
	case errors.Is(err, ErrSharedProjectNotFound):
		writeError(w, http.StatusNotFound, "shared project not found")
	case errors.Is(err, ErrSharedProjectAlreadyExists):
		writeError(w, http.StatusConflict, "shared project already exists")
	default:
		log.Printf("shared project handler: %v", err)
		writeError(w, http.StatusInternalServerError, "internal server error")
	}
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		log.Printf("write json: %v", err)
	}
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}
