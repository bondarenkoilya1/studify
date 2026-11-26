package user

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"studify/internal/httpx"
	"studify/internal/media"
	"studify/internal/util"
)

const (
	avatarsDir       = "./data/users/"
	avatarsPublicDir = "/static/users/"
)

func (h *Handler) GetUser(w http.ResponseWriter, r *http.Request) {
	user, err := h.Service.CurrentUser(r)
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}
		slog.ErrorContext(r.Context(), "failed to get current user",
			util.AttrError(err),
		)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err = json.NewEncoder(w).Encode(user); err != nil {
		slog.ErrorContext(r.Context(), "failed to encode current user to JSON",
			util.AttrError(err),
		)
	}
}

func (h *Handler) UpdateEmail(w http.ResponseWriter, r *http.Request) {
	body := emailRequest{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	userID, err := httpx.GetUserID(r)
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	newUser, err := h.Service.UpdateUserEmail(r.Context(), userID, body.NewEmail, body.CurrentPassword)
	if err != nil {
		switch {
		case errors.Is(err, ErrEmailRequired),
			errors.Is(err, ErrEmailInvalid),
			errors.Is(err, ErrEmailUnchanged),
			errors.Is(err, ErrCurrentPasswordRequired):
			http.Error(w, err.Error(), http.StatusBadRequest)
		case errors.Is(err, ErrInvalidCurrentPassword), errors.Is(err, ErrVerifiedEmailRequired):
			http.Error(w, err.Error(), http.StatusForbidden)
		case errors.Is(err, ErrUserNotFound):
			http.Error(w, "user not found", http.StatusNotFound)
		case errors.Is(err, ErrEmailTaken):
			http.Error(w, err.Error(), http.StatusConflict)
		default:
			slog.ErrorContext(r.Context(), "failed to update user email",
				util.AttrUserID(userID),
				util.AttrError(err),
			)
			http.Error(w, "internal server error", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err = json.NewEncoder(w).Encode(newUser); err != nil {
		slog.ErrorContext(r.Context(), "failed to encode current user to JSON",
			util.AttrError(err),
		)
	}
}

func (h *Handler) UpdatePassword(w http.ResponseWriter, r *http.Request) {
	request := passwordRequest{}
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "invalid JSON", http.StatusBadRequest)
		return
	}

	userID, err := httpx.GetUserID(r)
	if err != nil {
		slog.ErrorContext(r.Context(), "failed to get user id",
			util.AttrError(err),
		)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	err = h.Service.UpdateUserPassword(r.Context(), userID, request.CurrentPassword, request.NewPassword)
	if err != nil {
		switch {
		case errors.Is(err, ErrCurrentPasswordRequired),
			errors.Is(err, ErrPasswordUnchanged),
			errors.Is(err, ErrPasswordInvalid):
			http.Error(w, err.Error(), http.StatusBadRequest)
		case errors.Is(err, ErrInvalidCurrentPassword):
			http.Error(w, "invalid current password", http.StatusForbidden)
		case errors.Is(err, ErrUserNotFound):
			http.Error(w, "user not found", http.StatusNotFound)
		default:
			slog.ErrorContext(r.Context(), "failed to update user password",
				util.AttrUserID(userID),
				util.AttrError(err),
			)
			http.Error(w, "internal server error", http.StatusInternalServerError)
		}
		return
	}

	h.Cookies.Clear(w)
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) UploadAvatar(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()

	userID, err := httpx.GetUserID(r)
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	const maxAvatarBytes = 2 << 20 // 2 MB
	r.Body = http.MaxBytesReader(w, r.Body, maxAvatarBytes)

	url, err := h.Service.UploadAvatar(r.Context(), r.Body, userID)
	if err != nil {
		if _, ok := errors.AsType[*http.MaxBytesError](err); ok {
			http.Error(w, "avatar is too large (max 2MB)", http.StatusRequestEntityTooLarge)
			return
		}

		switch {
		case errors.Is(err, media.ErrInvalidFormat):
			http.Error(w, err.Error(), http.StatusUnsupportedMediaType)
		case errors.Is(err, media.ErrDimensionsExceed), errors.Is(err, media.ErrDecodeFailed):
			http.Error(w, err.Error(), http.StatusBadRequest)
		case errors.Is(err, ErrUserNotFound):
			http.Error(w, "user not found", http.StatusNotFound)
		default:
			slog.ErrorContext(r.Context(), "failed to upload avatar",
				util.AttrUserID(userID),
				util.AttrError(err),
			)
			http.Error(w, "internal server error", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err = json.NewEncoder(w).Encode(avatarResponse{AvatarURL: url}); err != nil {
		slog.ErrorContext(r.Context(), "failed to encode avatar response",
			util.AttrError(err),
		)
	}
}

func (h *Handler) DeleteAvatar(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	if err := h.Service.DeleteAvatar(r.Context(), userID); err != nil {
		if errors.Is(err, ErrUserNotFound) {
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}
		slog.ErrorContext(r.Context(), "failed to delete avatar",
			util.AttrUserID(userID),
			util.AttrError(err),
		)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
