package subject

import (
	"database/sql"
	"errors"
	"fmt"
	"log/slog"
	"mime/multipart"
	"net/http"
	"strconv"
	"studify/internal"
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
		httpx.WriteError(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	id, err := httpx.GetID(r)
	if err != nil {
		httpx.WriteError(w, err.Error(), http.StatusBadRequest)
		return
	}

	subject, err := h.Service.getSubject(r.Context(), id, userID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			httpx.WriteError(w, "Subject was not found", http.StatusNotFound)
			return
		}

		slog.ErrorContext(r.Context(), "failed to get subject",
			util.AttrError(err),
		)
		httpx.WriteError(w, "Failed to get subject", http.StatusInternalServerError)
		return
	}

	util.WriteJSON(w, r, http.StatusOK, subject)
}

func (h *Handler) GetUserSubjects(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		httpx.WriteError(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	subjects, err := h.Service.getUserSubjects(r.Context(), userID)
	if err != nil {
		slog.ErrorContext(r.Context(), "failed to get subjects",
			util.AttrError(err),
		)
		httpx.WriteError(w, "Failed to get subjects", http.StatusInternalServerError)
		return
	}

	util.WriteJSON(w, r, http.StatusOK, subjects)
}

func (h *Handler) AddSubject(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		httpx.WriteError(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var req CreateSubjectRequest

	if err := httpx.ReadJSON(r.Body, &req); err != nil {
		httpx.WriteDecodeError(w, err)
		return
	}

	if err := validateCreateSubjectRequest(&req); err != nil {
		httpx.WriteError(w, err.Error(), http.StatusBadRequest)
		return
	}
	if err := validateLecturers(req.Lecturers); err != nil {
		httpx.WriteError(w, err.Error(), http.StatusBadRequest)
		return
	}

	createdSubject, err := h.Service.addSubject(r.Context(), userID, &req)
	if err != nil {
		if errors.Is(err, ErrSubjectAlreadyExists) {
			httpx.WriteError(w, "Предмет с таким названием уже существует", http.StatusConflict)
			return
		}
		if errors.Is(err, ErrLocalThumbnailReference) {
			httpx.WriteError(w, err.Error(), http.StatusBadRequest)
			return
		}
		if internal.IsInvalidData(err) {
			httpx.WriteError(w, "invalid subject values", http.StatusBadRequest)
			return
		}

		slog.ErrorContext(r.Context(), "failed to insert subject",
			util.AttrUserID(userID),
			util.AttrError(err),
		)
		httpx.WriteError(w, "failed to insert subject", http.StatusInternalServerError)
		return
	}

	util.WriteJSON(w, r, http.StatusCreated, createdSubject)
}

func (h *Handler) ReplaceSubject(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		httpx.WriteError(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	id, err := httpx.GetID(r)
	if err != nil {
		httpx.WriteError(w, err.Error(), http.StatusBadRequest)
		return
	}

	var req CreateSubjectRequest

	if err := httpx.ReadJSON(r.Body, &req); err != nil {
		httpx.WriteDecodeError(w, err)
		return
	}

	if err := validateCreateSubjectRequest(&req); err != nil {
		httpx.WriteError(w, err.Error(), http.StatusBadRequest)
		return
	}

	subject, err := h.Service.replaceSubject(r.Context(), userID, id, &req)
	if err != nil {
		switch {
		case errors.Is(err, sql.ErrNoRows):
			httpx.WriteError(w, fmt.Sprintf("No such element with ID: %d", id), http.StatusNotFound)
		case errors.Is(err, ErrSubjectAlreadyExists):
			httpx.WriteError(w, "Предмет с таким названием уже существует", http.StatusConflict)
		case errors.Is(err, ErrLocalThumbnailReference):
			httpx.WriteError(w, err.Error(), http.StatusBadRequest)
		case internal.IsInvalidData(err):
			httpx.WriteError(w, "invalid subject values", http.StatusBadRequest)
		default:
			slog.ErrorContext(r.Context(), "failed to replace subject",
				util.AttrUserID(userID),
				util.AttrSubjectID(id),
				util.AttrError(err),
			)
			httpx.WriteError(w, "Failed to replace subject", http.StatusInternalServerError)
		}
		return
	}

	util.WriteJSON(w, r, http.StatusOK, subject)
}

func (h *Handler) UpdateSubject(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		httpx.WriteError(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	id, err := httpx.GetID(r)
	if err != nil {
		httpx.WriteError(w, err.Error(), http.StatusBadRequest)
		return
	}

	var req UpdateSubjectRequest

	if err := httpx.ReadJSON(r.Body, &req); err != nil {
		httpx.WriteDecodeError(w, err)
		return
	}

	subject, err := h.Service.updateSubject(r.Context(), userID, id, &req)
	if err != nil {
		if vErr, ok := errors.AsType[*ValidationError](err); ok {
			httpx.WriteError(w, vErr.Error(), http.StatusBadRequest)
			return
		}

		switch {
		case errors.Is(err, ErrNoFieldsToUpdate):
			httpx.WriteError(w, err.Error(), http.StatusBadRequest)
		case errors.Is(err, sql.ErrNoRows):
			httpx.WriteError(w, "Subject not found", http.StatusNotFound)
		case errors.Is(err, ErrSubjectAlreadyExists):
			httpx.WriteError(w, "Предмет с таким названием уже существует", http.StatusConflict)
		case errors.Is(err, ErrLocalThumbnailReference):
			httpx.WriteError(w, err.Error(), http.StatusBadRequest)
		case internal.IsInvalidData(err):
			httpx.WriteError(w, "invalid subject values", http.StatusBadRequest)
		default:
			slog.ErrorContext(r.Context(), "failed to update subject",
				util.AttrUserID(userID),
				util.AttrSubjectID(id),
				util.AttrError(err),
			)
			httpx.WriteError(w, "Failed to update subject", http.StatusInternalServerError)
		}
		return
	}

	util.WriteJSON(w, r, http.StatusOK, subject)
}

func (h *Handler) DeleteUserSubjects(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		httpx.WriteError(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	if err := h.Service.deleteUserSubjects(r.Context(), userID); err != nil {
		slog.ErrorContext(r.Context(), "failed to delete subjects",
			util.AttrError(err),
		)
		httpx.WriteError(w, "Failed to delete subjects", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) DeleteSubject(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		httpx.WriteError(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	id, err := httpx.GetID(r)
	if err != nil {
		httpx.WriteError(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := h.Service.deleteSubject(r.Context(), userID, id); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			httpx.WriteError(w, "No such element with this ID", http.StatusNotFound)
			return
		}

		slog.ErrorContext(r.Context(), "failed to delete subject",
			util.AttrError(err),
		)
		httpx.WriteError(w, "Failed to delete subject", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) UploadThumbnail(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()

	userID, err := httpx.GetUserID(r)
	if err != nil {
		httpx.WriteError(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	subjectID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil || subjectID <= 0 {
		httpx.WriteError(w, "invalid subject id", http.StatusBadRequest)
		return
	}

	const maxThumbnailBytes = 2 << 20 // 2 MB
	r.Body = http.MaxBytesReader(w, r.Body, maxThumbnailBytes)

	thumbnailURL, err := h.Service.uploadThumbnail(r.Context(), userID, subjectID, r.Body)
	if err != nil {
		if _, ok := errors.AsType[*http.MaxBytesError](err); ok {
			httpx.WriteError(w, "thumbnail is too large (max 2MB)", http.StatusRequestEntityTooLarge)
			return
		}

		switch {
		case errors.Is(err, media.ErrInvalidFormat):
			httpx.WriteError(w, err.Error(), http.StatusUnsupportedMediaType)
		case errors.Is(err, media.ErrDimensionsExceed), errors.Is(err, media.ErrDecodeFailed):
			httpx.WriteError(w, err.Error(), http.StatusBadRequest)
		case errors.Is(err, user.ErrUserNotFound):
			httpx.WriteError(w, "subject not found", http.StatusNotFound)
		default:
			slog.ErrorContext(r.Context(), "failed to upload thumbnail",
				util.AttrUserID(userID),
				util.AttrSubjectID(subjectID),
				util.AttrError(err),
			)
			httpx.WriteError(w, "failed to save thumbnail", http.StatusInternalServerError)
		}
		return
	}

	util.WriteJSON(w, r, http.StatusOK, thumbnail{ThumbnailURL: thumbnailURL})
}

func (h *Handler) UploadFile(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		httpx.WriteError(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	subjectID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil || subjectID <= 0 {
		httpx.WriteError(w, "invalid subject id", http.StatusBadRequest)
		return
	}

	const maxUploadBytes = maxFileSize + 1<<20 // Allow 1 MiB for multipart framing.
	if r.ContentLength > maxUploadBytes {
		httpx.WriteError(w, "upload exceeds the maximum size", http.StatusRequestEntityTooLarge)
		return
	}
	r.Body = http.MaxBytesReader(w, r.Body, maxUploadBytes)
	if err := r.ParseMultipartForm(1 << 20); err != nil {
		var tooLarge *http.MaxBytesError
		if errors.As(err, &tooLarge) || errors.Is(err, multipart.ErrMessageTooLarge) {
			httpx.WriteError(w, "upload exceeds the maximum size", http.StatusRequestEntityTooLarge)
			return
		}
		httpx.WriteError(w, "invalid multipart data", http.StatusBadRequest)
		return
	}
	defer func() { _ = r.MultipartForm.RemoveAll() }()

	file, header, err := r.FormFile("file")
	if err != nil {
		httpx.WriteError(w, "invalid file field", http.StatusBadRequest)
		return
	}
	defer file.Close()

	if header.Size > maxFileSize {
		httpx.WriteError(w, media.ErrFileTooLarge.Error(), http.StatusRequestEntityTooLarge)
		return
	}

	path, err := h.Service.uploadFile(r.Context(), userID, subjectID, file, header.Filename)
	if err != nil {
		switch {
		case errors.Is(err, media.ErrFileTooLarge):
			httpx.WriteError(w, err.Error(), http.StatusRequestEntityTooLarge)
			return
		case errors.Is(err, ErrFileQuotaExceeded):
			httpx.WriteCodedError(w, http.StatusConflict, "attachment_quota_exceeded", err.Error())
			return
		case errors.Is(err, media.ErrInvalidFileFormat):
			httpx.WriteError(w, err.Error(), http.StatusUnsupportedMediaType)
			return
		case errors.Is(err, media.ErrFileEmpty):
			httpx.WriteError(w, err.Error(), http.StatusBadRequest)
			return
		case errors.Is(err, sql.ErrNoRows):
			httpx.WriteError(w, "subject not found", http.StatusNotFound)
			return
		}
		slog.ErrorContext(r.Context(), "failed to upload file",
			util.AttrUserID(userID),
			util.AttrSubjectID(subjectID),
			util.AttrError(err),
		)
		httpx.WriteError(w, "internal server error", http.StatusInternalServerError)
		return
	}

	util.WriteJSON(w, r, http.StatusOK, fileResponse{FileURL: path})
}

func (h *Handler) DownloadFile(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Cache-Control", "private, no-store")
	userID, err := httpx.GetUserID(r)
	if err != nil {
		httpx.WriteError(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	filename := chi.URLParam(r, "filename")
	belongs, err := subjectFileBelongsToUser(r.Context(), h.Service.db, filesPublicDir+filename, userID)
	if err != nil {
		slog.ErrorContext(r.Context(), "failed to check file ownership", util.AttrError(err))
		httpx.WriteError(w, "internal server error", http.StatusInternalServerError)
		return
	}
	if !belongs {
		httpx.WriteError(w, "file not found", http.StatusNotFound)
		return
	}

	media.ServeStoredFile(w, r, filesDir, filename)
}

func (h *Handler) DownloadThumbnail(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Cache-Control", "private, no-store")
	userID, err := httpx.GetUserID(r)
	if err != nil {
		httpx.WriteError(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	filename := chi.URLParam(r, "filename")
	var belongs bool
	err = h.Service.db.QueryRowContext(r.Context(), `
		SELECT EXISTS (SELECT 1 FROM subjects WHERE user_id = $1 AND thumbnail_url = $2)
	`, userID, thumbnailsPublicDir+filename).Scan(&belongs)
	if err != nil {
		slog.ErrorContext(r.Context(), "failed to check thumbnail ownership", util.AttrError(err))
		httpx.WriteError(w, "internal server error", http.StatusInternalServerError)
		return
	}
	if !belongs {
		httpx.WriteError(w, "file not found", http.StatusNotFound)
		return
	}

	media.ServeStoredFile(w, r, thumbnailsDir, filename)
}
