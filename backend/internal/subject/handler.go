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
	"strconv"
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

	subject, err := h.Service.getSubject(id, userID)
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

	subjects, err := h.Service.getUserSubjects(userID)
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

	createdSubject, err := h.Service.addSubject(userID, &req)
	if err != nil {
		if errors.Is(err, ErrSubjectAlreadyExists) {
			http.Error(w, "Предмет с таким названием уже существует", http.StatusConflict)
			return
		}

		slog.Error("failed to insert subject",
			slog.Int64("user_id", userID),
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

	subject, err := h.Service.replaceSubject(userID, id, &req)
	if err != nil {
		switch {
		case errors.Is(err, sql.ErrNoRows):
			http.Error(w, fmt.Sprintf("No such element with ID: %d", id), http.StatusNotFound)
		case errors.Is(err, ErrSubjectAlreadyExists):
			http.Error(w, "Предмет с таким названием уже существует", http.StatusConflict)
		default:
			slog.Error("failed to replace subject",
				slog.Int64("user_id", userID),
				slog.Int64("subject_id", id),
				slog.String("error", err.Error()),
			)
			http.Error(w, "Failed to replace subject", http.StatusInternalServerError)
		}
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

	subject, err := h.Service.updateSubject(userID, id, &req)
	if err != nil {
		if vErr, ok := errors.AsType[*ValidationError](err); ok {
			http.Error(w, vErr.Error(), http.StatusBadRequest)
			return
		}

		switch {
		case errors.Is(err, ErrNoFieldsToUpdate):
			http.Error(w, err.Error(), http.StatusBadRequest)
		case errors.Is(err, sql.ErrNoRows):
			http.Error(w, "Subject not found", http.StatusNotFound)
		case errors.Is(err, ErrSubjectAlreadyExists):
			http.Error(w, "Предмет с таким названием уже существует", http.StatusConflict)
		default:
			slog.Error("failed to update subject",
				slog.Int64("user_id", userID),
				slog.Int64("subject_id", id),
				slog.String("error", err.Error()),
			)
			http.Error(w, "Failed to update subject", http.StatusInternalServerError)
		}
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

	if err := h.Service.deleteUserSubjects(userID); err != nil {
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

	if err := h.Service.deleteSubject(userID, id); err != nil {
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

	thumbnailURL, err := h.Service.uploadThumbnail(userID, subjectID, r.Body)
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
		case errors.Is(err, user.ErrUserNotFound):
			http.Error(w, "subject not found", http.StatusNotFound)
		default:
			slog.Error("failed to upload thumbnail",
				slog.Int64("user_id", userID),
				slog.Int64("subject_id", subjectID),
				slog.String("error", err.Error()),
			)
			http.Error(w, "failed to save thumbnail", http.StatusInternalServerError)
		}
		return
	}

	util.WriteJSON(w, r, http.StatusOK, thumbnail{ThumbnailURL: thumbnailURL})
}

func (h *Handler) UploadFile(w http.ResponseWriter, r *http.Request) {
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

	file, header, err := r.FormFile("file")
	if err != nil {
		slog.Error("failed to get file", slog.String("error", err.Error()))
		http.Error(w, "invalid data", http.StatusBadRequest)
		return
	}
	defer file.Close()

	path, err := h.Service.uploadFile(userID, subjectID, file, header.Filename)
	if err != nil {
		slog.Error("failed to upload file",
			slog.Int64("user_id", userID),
			slog.Int64("subject_id", subjectID),
			slog.String("error", err.Error()),
		)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	util.WriteJSON(w, r, http.StatusOK, fileResponse{FileURL: path})
}
