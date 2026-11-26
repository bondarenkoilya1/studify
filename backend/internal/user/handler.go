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
			httpx.WriteError(w, "user not found", http.StatusNotFound)
			return
		}
		slog.ErrorContext(r.Context(), "failed to get current user",
			util.AttrError(err),
		)
		httpx.WriteError(w, "internal server error", http.StatusInternalServerError)
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
	if err := httpx.ReadJSON(r.Body, &body); err != nil {
		httpx.WriteDecodeError(w, err)
		return
	}

	userID, err := httpx.GetUserID(r)
	if err != nil {
		httpx.WriteError(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	newUser, err := h.Service.UpdateUserEmail(r.Context(), userID, body.NewEmail, body.CurrentPassword)
	if err != nil {
		switch {
		case errors.Is(err, ErrEmailRequired),
			errors.Is(err, ErrEmailInvalid),
			errors.Is(err, ErrEmailUnchanged),
			errors.Is(err, ErrCurrentPasswordRequired):
			httpx.WriteError(w, err.Error(), http.StatusBadRequest)
		case errors.Is(err, ErrInvalidCurrentPassword):
			httpx.WriteCodedError(w, http.StatusForbidden, "invalid_current_password", err.Error())
		case errors.Is(err, ErrVerifiedEmailRequired):
			httpx.WriteCodedError(w, http.StatusForbidden, "verified_email_required", err.Error())
		case errors.Is(err, ErrUserNotFound):
			httpx.WriteError(w, "user not found", http.StatusNotFound)
		case errors.Is(err, ErrEmailTaken):
			httpx.WriteError(w, err.Error(), http.StatusConflict)
		default:
			slog.ErrorContext(r.Context(), "failed to update user email",
				util.AttrUserID(userID),
				util.AttrError(err),
			)
			httpx.WriteError(w, "internal server error", http.StatusInternalServerError)
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
	if err := httpx.ReadJSON(r.Body, &request); err != nil {
		httpx.WriteDecodeError(w, err)
		return
	}

	userID, err := httpx.GetUserID(r)
	if err != nil {
		slog.ErrorContext(r.Context(), "failed to get user id",
			util.AttrError(err),
		)
		httpx.WriteError(w, "internal server error", http.StatusInternalServerError)
		return
	}

	err = h.Service.UpdateUserPassword(r.Context(), userID, request.CurrentPassword, request.NewPassword)
	if err != nil {
		switch {
		case errors.Is(err, ErrPasswordUnchanged):
			httpx.WriteCodedError(w, http.StatusBadRequest, "password_unchanged", err.Error())
		case errors.Is(err, ErrCurrentPasswordRequired), errors.Is(err, ErrPasswordInvalid):
			httpx.WriteError(w, err.Error(), http.StatusBadRequest)
		case errors.Is(err, ErrInvalidCurrentPassword):
			httpx.WriteCodedError(w, http.StatusForbidden, "invalid_current_password", "invalid current password")
		case errors.Is(err, ErrUserNotFound):
			httpx.WriteError(w, "user not found", http.StatusNotFound)
		default:
			slog.ErrorContext(r.Context(), "failed to update user password",
				util.AttrUserID(userID),
				util.AttrError(err),
			)
			httpx.WriteError(w, "internal server error", http.StatusInternalServerError)
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
		httpx.WriteError(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	const maxAvatarBytes = 2 << 20 // 2 MB
	r.Body = http.MaxBytesReader(w, r.Body, maxAvatarBytes)

	url, err := h.Service.UploadAvatar(r.Context(), r.Body, userID)
	if err != nil {
		if _, ok := errors.AsType[*http.MaxBytesError](err); ok {
			httpx.WriteError(w, "avatar is too large (max 2MB)", http.StatusRequestEntityTooLarge)
			return
		}

		switch {
		case errors.Is(err, media.ErrInvalidFormat):
			httpx.WriteError(w, err.Error(), http.StatusUnsupportedMediaType)
		case errors.Is(err, media.ErrDimensionsExceed), errors.Is(err, media.ErrDecodeFailed):
			httpx.WriteError(w, err.Error(), http.StatusBadRequest)
		case errors.Is(err, ErrUserNotFound):
			httpx.WriteError(w, "user not found", http.StatusNotFound)
		default:
			slog.ErrorContext(r.Context(), "failed to upload avatar",
				util.AttrUserID(userID),
				util.AttrError(err),
			)
			httpx.WriteError(w, "internal server error", http.StatusInternalServerError)
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
		httpx.WriteError(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	if err := h.Service.DeleteAvatar(r.Context(), userID); err != nil {
		if errors.Is(err, ErrUserNotFound) {
			httpx.WriteError(w, "user not found", http.StatusNotFound)
			return
		}
		slog.ErrorContext(r.Context(), "failed to delete avatar",
			util.AttrUserID(userID),
			util.AttrError(err),
		)
		httpx.WriteError(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
