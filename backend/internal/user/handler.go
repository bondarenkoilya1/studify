package user

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	_ "image/jpeg"
	_ "image/png"
	"log/slog"
	"net/http"
	"strings"
	"studify/internal"
	"studify/internal/auth/credentials"
	"studify/internal/httpx"
	"studify/internal/media"

	"golang.org/x/crypto/bcrypt"
)

func (h *Handler) GetUser(w http.ResponseWriter, r *http.Request) {
	user, err := CurrentUser(r, h.DB)
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

	body.NewEmail = strings.TrimSpace(body.NewEmail)
	if body.NewEmail == "" {
		http.Error(w, "email is required", http.StatusBadRequest)
		return
	}

	user, err := CurrentUser(r, h.DB)
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}
		slog.Error("failed to get current user", slog.String("error", err.Error()))
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if strings.TrimSpace(body.NewEmail) == strings.TrimSpace(user.Email) {
		http.Error(w, "invalid data", http.StatusBadRequest)
		return
	}

	newUser, err := UpdateUserEmail(h.DB, user.ID, body.NewEmail)
	if err != nil {
		slog.Error("failed to update user email", slog.String("error", err.Error()))
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if err = h.EmailService.SendConfirmationEmail(newUser.Email, internal.UserID(newUser.ID)); err != nil {
		slog.Error("failed to send confirmation email", slog.String("error", err.Error()))
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err = json.NewEncoder(w).Encode(newUser); err != nil {
		slog.Error("failed to encode current user to JSON", slog.String("error", err.Error()))
	}
}

func (h *Handler) UpdateUserPassword(w http.ResponseWriter, r *http.Request) {
	request := passwordRequest{}
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		slog.Error("failed to decode password update request", slog.String("error", err.Error()))
		http.Error(w, "invalid JSON", http.StatusBadRequest)
		return
	}

	if request.CurrentPassword == "" {
		http.Error(w, "current password is required", http.StatusBadRequest)
		return
	}

	if request.CurrentPassword == request.NewPassword {
		http.Error(w, "invalid data", http.StatusBadRequest)
		return
	}

	if err := credentials.ValidatePassword(request.NewPassword, credentials.ActionRegister); err != nil {
		slog.Error("failed to validate new password", slog.String("error", err.Error()))
		http.Error(w, "invalid data", http.StatusBadRequest)
		return
	}

	userID, err := httpx.GetUserID(r)
	if err != nil {
		slog.Error("failed to get user id", slog.String("error", err.Error()))
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	passwordHash, err := GetUserPasswordHashByID(h.DB, userID)
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}

		slog.Error("failed to get user password hash", slog.String("error", err.Error()))
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if err := bcrypt.CompareHashAndPassword(
		[]byte(passwordHash),
		[]byte(request.CurrentPassword),
	); err != nil {
		if errors.Is(err, bcrypt.ErrMismatchedHashAndPassword) {
			http.Error(w, "invalid current password", http.StatusUnauthorized)
			return
		}

		slog.Error("failed to compare password hash", slog.String("error", err.Error()))
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	newPasswordHash, err := credentials.HashPassword(request.NewPassword)
	if err != nil {
		slog.Error("failed to hash new password", slog.String("error", err.Error()))
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if err := UpdateUserPassword(h.DB, userID, newPasswordHash); err != nil {
		if errors.Is(err, ErrUserNotFound) {
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}

		slog.Error("failed to update user password", slog.String("error", err.Error()))
		http.Error(w, "internal server error", http.StatusInternalServerError)
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

	constraints := media.ImageConstraints{
		MaxWidth:  2560,
		MaxHeight: 2560,
		Quality:   85,
	}

	filename, err := media.SaveImageAsWebp(r.Body, constraints, "./data/users/")
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
		default:
			slog.Error("failed to save image", slog.String("error", err.Error()))
			http.Error(w, "failed to save image", http.StatusInternalServerError)
		}
		return
	}

	avatarURL := "/static/users/" + filename

	if err = UpdateUserAvatar(h.DB, userID, avatarURL); err != nil {
		if errors.Is(err, ErrUserNotFound) {
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}
		slog.Error("failed to update user avatar", slog.String("error", err.Error()))
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err = json.NewEncoder(w).Encode(avatarResponse{AvatarURL: avatarURL}); err != nil {
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

	if err := DeleteUserAvatar(h.DB, userID); err != nil {
		if errors.Is(err, ErrUserNotFound) {
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}
		slog.Error("failed to delete user avatar", slog.String("error", err.Error()))
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func CurrentUser(r *http.Request, db *sql.DB) (*User, error) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		return nil, err
	}

	currentUser, err := GetUserByID(db, userID)
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			return nil, ErrUserNotFound
		}

		return nil, fmt.Errorf("get current user: %w", err)
	}

	return currentUser, nil
}
