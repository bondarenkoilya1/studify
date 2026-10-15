package user

import (
	"encoding/json"
	"errors"
	_ "image/jpeg"
	_ "image/png"
	"log/slog"
	"net/http"
	"os"
	"studify/internal/httpx"
	"studify/internal/media"
)

const (
	avatarsDir       = "./data/users/"
	avatarsPublicDir = "/static/users/"
)

func (h *Handler) GetUser(w http.ResponseWriter, r *http.Request) {
	user, err := h.UserService.CurrentUser(r, h.DB)
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}
		slog.Error("failed to get current user", slog.String("error", err.Error()))
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err = json.NewEncoder(w).Encode(user); err != nil {
		slog.Error("failed to encode current user to JSON", slog.String("error", err.Error()))
	}
}

func (h *Handler) UpdateUserEmail(w http.ResponseWriter, r *http.Request) {
	body := emailRequest{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	user, err := h.UserService.CurrentUser(r, h.DB)
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}
		slog.Error("failed to get current user", slog.String("error", err.Error()))
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	newUser, err := h.UserService.UpdateUserEmail(r.Context(), user.ID, user.Email, body.NewEmail)
	if err != nil {
		switch {
		case errors.Is(err, ErrEmailRequired),
			errors.Is(err, ErrEmailInvalid),
			errors.Is(err, ErrEmailUnchanged):
			http.Error(w, err.Error(), http.StatusBadRequest)
		case errors.Is(err, ErrEmailTaken):
			http.Error(w, err.Error(), http.StatusConflict)
		default:
			slog.Error("failed to update user email",
				slog.Int64("user_id", user.ID), slog.String("error", err.Error()))
			http.Error(w, "internal server error", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err = json.NewEncoder(w).Encode(newUser); err != nil {
		slog.Error("failed to encode current user to JSON", slog.String("error", err.Error()))
	}
}

func (h *Handler) UpdateUserPassword(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)

	request := passwordRequest{}
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "invalid JSON", http.StatusBadRequest)
		return
	}

	userID, err := httpx.GetUserID(r)
	if err != nil {
		slog.Error("failed to get user id", slog.String("error", err.Error()))
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	err = h.UserService.UpdateUserPassword(userID, request.CurrentPassword, request.NewPassword)
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
			slog.Error("failed to update user password",
				slog.Int64("user_id", userID), slog.String("error", err.Error()))
			http.Error(w, "internal server error", http.StatusInternalServerError)
		}
		return
	}

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

	url, err := h.UserService.UploadAvatar(r.Context(), r.Body, userID)
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
			slog.Error("failed to upload avatar", slog.Int64("user_id", userID), slog.String("error", err.Error()))
			http.Error(w, "internal server error", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err = json.NewEncoder(w).Encode(avatarResponse{AvatarURL: url}); err != nil {
		slog.Error("failed to encode avatar response", slog.String("error", err.Error()))
	}
}

func (h *Handler) DeleteAvatar(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		slog.Error("failed to get user id", slog.String("error", err.Error()))
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	oldURL, err := DeleteUserAvatar(h.DB, userID)
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}
		slog.Error("failed to delete user avatar", slog.String("error", err.Error()))
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if oldURL != nil && *oldURL != "" {
		path, ok := avatarFilePath(*oldURL)
		if !ok {
			slog.Error("unexpected avatar url", "url", *oldURL, "user_id", userID)
		} else if err := os.Remove(path); err != nil && !errors.Is(err, os.ErrNotExist) {
			slog.Error("failed to delete avatar file", "error", err, "path", path, "user_id", userID)
		}
	}

	w.WriteHeader(http.StatusNoContent)
}
