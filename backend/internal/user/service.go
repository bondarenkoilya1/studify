package user

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	mail2 "net/mail"
	"os"
	"path/filepath"
	"strings"
	"studify/internal"
	"studify/internal/auth/credentials"
	"studify/internal/httpx"
	"studify/internal/media"

	"golang.org/x/crypto/bcrypt"
)

type confirmationSender interface {
	SendConfirmationEmail(ctx context.Context, userID internal.UserID, email string) error
}

type Service struct {
	db                  *sql.DB
	emailConfirmService confirmationSender
}

func NewService(db *sql.DB, s confirmationSender) *Service {
	return &Service{db: db, emailConfirmService: s}
}

// avatarFilePath превращает публичный URL аватара в путь на диске.
// Второе значение false означает, что URL не похож на наш аватар.
func avatarFilePath(avatarURL string) (string, bool) {
	filename, ok := strings.CutPrefix(avatarURL, avatarsPublicDir)
	if !ok || filename == "" || filepath.Base(filename) != filename {
		return "", false
	}
	return filepath.Join(avatarsDir, filename), true
}

func (s *Service) CurrentUser(r *http.Request) (*User, error) {
	userID, err := httpx.GetUserID(r)
	if err != nil {
		return nil, err
	}

	currentUser, err := GetUserByID(s.db, userID)
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			return nil, ErrUserNotFound
		}

		return nil, fmt.Errorf("get current user: %w", err)
	}

	return currentUser, nil
}

func (s *Service) UpdateUserEmail(ctx context.Context, userID int64, oldEmail, newEmail string) (*User, error) {
	newEmail = strings.ToLower(strings.TrimSpace(newEmail))
	if newEmail == "" {
		return nil, ErrEmailRequired
	}

	addr, err := mail2.ParseAddress(newEmail)
	if err != nil || addr.Address != newEmail {
		return nil, ErrEmailInvalid
	}

	if newEmail == strings.ToLower(strings.TrimSpace(oldEmail)) {
		return nil, ErrEmailUnchanged
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("begin update user email tx: %w", err)
	}
	defer tx.Rollback()

	newUser, err := updateEmail(ctx, tx, userID, newEmail)
	if err != nil {
		return nil, fmt.Errorf("update user email (user_id=%d): %w", userID, err)
	}

	if err = tx.Commit(); err != nil {
		return nil, fmt.Errorf("commit update user email tx (user_id=%d): %w", userID, err)
	}

	if err = s.emailConfirmService.SendConfirmationEmail(ctx, internal.UserID(newUser.ID), newUser.Email); err != nil {
		slog.ErrorContext(ctx, "failed to send confirmation email",
			slog.String("error", err.Error()),
		)
		return nil, fmt.Errorf("send confirmation email: %w", err)
	}

	return newUser, nil
}

func (s *Service) UpdateUserPassword(userID int64, oldPassword, newPassword string) error {
	if oldPassword == "" {
		return ErrCurrentPasswordRequired
	}
	if oldPassword == newPassword {
		return ErrPasswordUnchanged
	}
	if err := credentials.ValidatePassword(newPassword, credentials.ActionRegister); err != nil {
		return fmt.Errorf("%w: %v", ErrPasswordInvalid, err)
	}

	passwordHash, err := GetUserPasswordHashByID(s.db, userID)
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			return ErrUserNotFound
		}
		return fmt.Errorf("get user password hash (user_id=%d): %w", userID, err)
	}

	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(oldPassword)); err != nil {
		if errors.Is(err, bcrypt.ErrMismatchedHashAndPassword) {
			return ErrInvalidCurrentPassword
		}
		return fmt.Errorf("compare password hash: %w", err)
	}

	newPasswordHash, err := credentials.HashPassword(newPassword)
	if err != nil {
		return fmt.Errorf("hash new password: %w", err)
	}

	if err := UpdateUserPassword(context.TODO(), s.db, userID, newPasswordHash); err != nil {
		if errors.Is(err, ErrUserNotFound) {
			return ErrUserNotFound
		}
		return fmt.Errorf("update user password (user_id=%d): %w", userID, err)
	}

	return nil
}

func (s *Service) UploadAvatar(ctx context.Context, rc io.Reader, userID int64) (string, error) {
	constraints := media.ImageConstraints{MaxWidth: 2560, MaxHeight: 2560, Quality: 85}

	filename, err := media.SaveImageAsWebp(rc, constraints, avatarsDir)
	if err != nil {
		return "", fmt.Errorf("save avatar image: %w", err)
	}

	avatarURL := avatarsPublicDir + filename
	oldURL, err := ReplaceUserAvatar(ctx, s.db, userID, avatarURL)
	if err != nil {
		if rmErr := os.Remove(filepath.Join(avatarsDir, filename)); rmErr != nil && !errors.Is(rmErr, os.ErrNotExist) {
			slog.Error("failed to delete orphaned avatar file", "error", rmErr, "user_id", userID)
		}
		return "", err
	}

	if oldURL != nil && *oldURL != "" {
		path, ok := avatarFilePath(*oldURL)
		if !ok {
			slog.Error("unexpected avatar url", "url", *oldURL, "user_id", userID)
		} else if rmErr := os.Remove(path); rmErr != nil && !errors.Is(rmErr, os.ErrNotExist) {
			slog.Error("failed to delete previous avatar file", "error", rmErr, "path", path, "user_id", userID)
		}
	}

	return avatarURL, nil
}

func (s *Service) DeleteAvatar(ctx context.Context, userID int64) error {
	oldURL, err := DeleteUserAvatar(ctx, s.db, userID)
	if err != nil {
		return fmt.Errorf("delete user avatar (user_id=%d): %w", userID, err)
	}

	if oldURL != nil && *oldURL != "" {
		path, ok := avatarFilePath(*oldURL)
		if !ok {
			slog.Error("unexpected avatar url", "url", *oldURL, "user_id", userID)
		} else if rmErr := os.Remove(path); rmErr != nil && !errors.Is(rmErr, os.ErrNotExist) {
			slog.Error("failed to delete avatar file", "error", rmErr, "path", path, "user_id", userID)
		}
	}

	return nil
}
