package sharedproject

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"strconv"
	"studify/internal/httpx"
	"studify/internal/util"
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
		writeError(w, r, http.StatusUnauthorized, "unauthorized")
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)

	var req createSharedProjectRequest
	if err = json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, r, http.StatusBadRequest, "invalid json body")
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
		handleServiceError(w, r, err)
		return
	}

	util.WriteJSON(w, r, http.StatusCreated, project)
}

func (h *Handler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeError(w, r, http.StatusBadRequest, "invalid id")
		return
	}

	project, err := h.Service.getSharedProjectByID(id)
	if err != nil {
		handleServiceError(w, r, err)
		return
	}

	util.WriteJSON(w, r, http.StatusOK, project)
}

func handleServiceError(w http.ResponseWriter, r *http.Request, err error) {
	switch {
	case errors.Is(err, ErrInvalidInput):
		writeError(w, r, http.StatusBadRequest, err.Error())
	case errors.Is(err, ErrSharedProjectNotFound):
		writeError(w, r, http.StatusNotFound, "shared project not found")
	case errors.Is(err, ErrSharedProjectAlreadyExists):
		writeError(w, r, http.StatusConflict, "shared project already exists")
	default:
		slog.Error("shared project handler failed",
			slog.String("method", r.Method),
			slog.String("path", r.URL.Path),
			slog.Any("error", err),
		)
		writeError(w, r, http.StatusInternalServerError, "internal server error")
	}
}

func writeError(w http.ResponseWriter, r *http.Request, status int, message string) {
	util.WriteJSON(w, r, status, map[string]string{"error": message})
}
