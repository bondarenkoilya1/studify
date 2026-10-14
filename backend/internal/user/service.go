package user

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	mail2 "net/mail"
	"strings"
	"studify/internal"
	"studify/internal/httpx"
	"studify/internal/mail"
)

type Service struct {
	db          *sql.DB
	mailService *mail.Service
}

func NewService(db *sql.DB, mailService *mail.Service) *Service {
	return &Service{db: db, mailService: mailService}
}

func (s *Service) CurrentUser(r *http.Request, db *sql.DB) (*User, error) {
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

	if err = s.mailService.SendConfirmationEmail(newUser.Email, internal.UserID(newUser.ID)); err != nil {
		slog.Error("failed to send confirmation email",
			slog.Int64("user_id", userID), slog.String("error", err.Error()))
	}

	return newUser, nil
}
