package user

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
	"studify/internal"
	"studify/internal/auth"
	"studify/internal/httpx"
	"studify/internal/util"

	"github.com/chai2010/webp"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type AvatarResponse struct {
	AvatarURL string `json:"avatar_url"`
}

func (h *Handler) GetUser(w http.ResponseWriter, r *http.Request) {
	user, err := CurrentUser(r, h.DB)
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}
		log.Printf("failed to get current user: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err = json.NewEncoder(w).Encode(user); err != nil {
		log.Printf("failed to encode current user to JSON: %v", err)
	}
}

func (h *Handler) UpdateUserEmail(w http.ResponseWriter, r *http.Request) {
	body := EmailRequest{}
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
		log.Printf("failed to get current user: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if strings.TrimSpace(body.NewEmail) == strings.TrimSpace(user.Email) {
		http.Error(w, "invalid data", http.StatusBadRequest)
		return
	}

	newUser, err := UpdateUserEmail(h.DB, user.ID, body.NewEmail)
	if err != nil {
		log.Printf("failed to update user email: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if err = h.EmailService.SendConfirmationEmail(newUser.Email, internal.UserID(newUser.ID)); err != nil {
		log.Printf("failed to send confirmation email: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err = json.NewEncoder(w).Encode(newUser); err != nil {
		log.Printf("failed to encode current user to JSON: %v", err)
	}
}

func (h *Handler) UpdateUserPassword(w http.ResponseWriter, r *http.Request) {
	request := PasswordRequest{}
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		log.Printf("failed to decode password update request: %v", err)
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

	if err := auth.ValidatePassword(request.NewPassword, auth.AuthActionRegister); err != nil {
		log.Printf("failed to validate new password: %v", err)
		http.Error(w, "invalid data", http.StatusBadRequest)
		return
	}

	userID, err := httpx.GetUserID(r)
	if err != nil {
		log.Printf("failed to get user id: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	passwordHash, err := GetUserPasswordHashByID(h.DB, userID)
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}

		log.Printf("failed to get user password hash: %v", err)
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

		log.Printf("failed to compare password hash: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	newPasswordHash, err := auth.HashPassword(request.NewPassword)
	if err != nil {
		log.Printf("failed to hash new password: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	if err := UpdateUserPassword(h.DB, userID, newPasswordHash); err != nil {
		if errors.Is(err, ErrUserNotFound) {
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}

		log.Printf("failed to update user password: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) UploadAvatar(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()

	userID, err := httpx.GetUserID(r)
	if err != nil {
		log.Printf("failed to get user id: %v", err)
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	const (
		maxAvatarBytes = 2 << 20
		maxWidth       = 2560
		maxHeight      = 2560
	)

	r.Body = http.MaxBytesReader(w, r.Body, maxAvatarBytes)

	img, format, err := image.Decode(r.Body)
	if err != nil {
		if _, ok := errors.AsType[*http.MaxBytesError](err); ok {
			http.Error(w, "avatar is too large", http.StatusRequestEntityTooLarge)
			return
		}

		http.Error(w, "invalid image", http.StatusBadRequest)
		return
	}

	switch format {
	case "png", "jpeg", "webp":
	default:
		http.Error(w, "invalid file format. Use PNG, JPEG or WEBP", http.StatusUnsupportedMediaType)
		return
	}

	bounds := img.Bounds()
	width := bounds.Dx()
	height := bounds.Dy()

	if width > maxWidth || height > maxHeight {
		http.Error(w, fmt.Sprintf("file resolution is too large. Maximum resolution is %dx%d", maxWidth, maxHeight), http.StatusRequestEntityTooLarge)
		return
	}

	dir := "./data/users/"
	if err = util.EnsureDir(dir); err != nil {
		log.Printf("failed to ensure dir: %v", err)
		http.Error(w, "wrong directory on the server", http.StatusInternalServerError)
		return
	}

	filename := uuid.New().String() + ".webp"
	fullPath := dir + filename

	dst, err := os.Create(fullPath)
	if err != nil {
		log.Printf("failed to create file: %v", err)
		http.Error(w, "failed to create file", http.StatusInternalServerError)
		return
	}
	defer dst.Close()

	if err = webp.Encode(dst, img, &webp.Options{Quality: 85}); err != nil {
		log.Printf("failed to encode webp: %v", err)
		http.Error(w, "failed to save image", http.StatusInternalServerError)
		return
	}

	avatarURL := "/static/users/" + filename

	if err = UpdateUserAvatar(h.DB, userID, avatarURL); err != nil {
		if errors.Is(err, ErrUserNotFound) {
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}
		log.Printf("failed to update user avatar: %v", err)
		http.Error(w, "failed to update user avatar", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err = json.NewEncoder(w).Encode(AvatarResponse{AvatarURL: avatarURL}); err != nil {
		log.Printf("failed to encode avatar response: %v", err)
	}
}

func (h *Handler) DeleteAvatar(w http.ResponseWriter, r *http.Request) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		log.Printf("failed to get user id: %v", err)
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	if err := DeleteUserAvatar(h.DB, userID); err != nil {
		if errors.Is(err, ErrUserNotFound) {
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}
		log.Printf("failed to delete user avatar: %v", err)
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
