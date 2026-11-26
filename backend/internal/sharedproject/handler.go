package sharedproject

import (
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

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		httpx.WriteError(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var req sharedProjectRequest
	if err = httpx.ReadJSON(r.Body, &req); err != nil {
		httpx.WriteDecodeError(w, err)
		return
	}

	project, err := h.Service.createSharedProject(createSharedProjectInput{
		UserID:          userID,
		Name:            req.Name,
		URL:             req.URL,
		Author:          req.Author,
		AuthorAvatarURL: req.AuthorAvatarURL,
		IsPublic:        req.IsPublic,
	})
	if err != nil {
		handleServiceError(w, r, err)
		return
	}

	util.WriteJSON(w, r, http.StatusCreated, project)
}

func (h *Handler) GetByID(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		httpx.WriteError(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		httpx.WriteError(w, "invalid id", http.StatusBadRequest)
		return
	}

	project, err := h.Service.getSharedProjectByID(userID, id)
	if err != nil {
		handleServiceError(w, r, err)
		return
	}

	util.WriteJSON(w, r, http.StatusOK, project)
}

func (h *Handler) GetUserProjects(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		httpx.WriteError(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	projects, err := h.Service.getSharedProjectsByUserID(userID)
	if err != nil {
		handleServiceError(w, r, err)
		return
	}

	util.WriteJSON(w, r, http.StatusOK, projects)
}

func (h *Handler) GetCatalog(w http.ResponseWriter, r *http.Request) {
	var before int64
	if raw := r.URL.Query().Get("before"); raw != "" {
		var err error
		before, err = strconv.ParseInt(raw, 10, 64)
		if err != nil || before <= 0 {
			httpx.WriteError(w, "invalid before", http.StatusBadRequest)
			return
		}
	}

	page, err := h.Service.getCatalog(r.Context(), before)
	if err != nil {
		handleServiceError(w, r, err)
		return
	}
	util.WriteJSON(w, r, http.StatusOK, page)
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		httpx.WriteError(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		httpx.WriteError(w, "invalid id", http.StatusBadRequest)
		return
	}

	if err := h.Service.deleteSharedProject(userID, id); err != nil {
		handleServiceError(w, r, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		httpx.WriteError(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		httpx.WriteError(w, "invalid id", http.StatusBadRequest)
		return
	}

	var req sharedProjectRequest
	if err = httpx.ReadJSON(r.Body, &req); err != nil {
		httpx.WriteDecodeError(w, err)
		return
	}

	project, err := h.Service.updateSharedProject(updateSharedProjectInput{
		UserID:          userID,
		ID:              id,
		Name:            req.Name,
		URL:             req.URL,
		Author:          req.Author,
		AuthorAvatarURL: req.AuthorAvatarURL,
		IsPublic:        req.IsPublic,
	})
	if err != nil {
		handleServiceError(w, r, err)
		return
	}

	util.WriteJSON(w, r, http.StatusOK, project)
}

func handleServiceError(w http.ResponseWriter, r *http.Request, err error) {
	switch {
	case errors.Is(err, ErrInvalidInput):
		httpx.WriteError(w, err.Error(), http.StatusBadRequest)
	case errors.Is(err, ErrSharedProjectNotFound):
		httpx.WriteError(w, "shared project not found", http.StatusNotFound)
	case errors.Is(err, ErrSharedProjectAlreadyExists):
		httpx.WriteError(w, "shared project already exists", http.StatusConflict)
	default:
		slog.ErrorContext(r.Context(), "shared project handler failed",
			util.AttrMethod(r.Method),
			util.AttrPath(r.URL.Path),
			util.AttrAnyError(err),
		)
		httpx.WriteError(w, "internal server error", http.StatusInternalServerError)
	}
}
