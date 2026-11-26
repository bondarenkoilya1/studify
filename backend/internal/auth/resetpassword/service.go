package resetpassword

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log/slog"
	"strings"
	"studify/internal/auth/credentials"
	"studify/internal/auth/session"
	"studify/internal/auth/token"
	"studify/internal/config"
	"studify/internal/mail"
	"studify/internal/user"
	"studify/internal/util"
	"time"
)

type Service struct {
	db          *sql.DB
	mailService *mail.Service
}

func NewService(db *sql.DB, mailService *mail.Service) *Service {
	return &Service{db: db, mailService: mailService}
}

func (s *Service) requestPasswordReset(ctx context.Context, email string) error {
	email = strings.TrimSpace(email)
	if email == "" {
		return ErrEmailRequired
	}

	currentUser, err := user.GetUserByEmail(ctx, s.db, email)
	if err != nil {
		return fmt.Errorf("get user by email: %w", err)
	}

	t, err := s.createResetPasswordToken(ctx, currentUser.ID, currentUser.Email)
	if err != nil {
		return fmt.Errorf("create password reset token: %w", err)
	}

	if err = s.mailService.SendPasswordResetEmail(ctx, currentUser.Email, string(t)); err != nil {
		slog.ErrorContext(ctx, "failed to send password reset email",
			util.AttrUserID(currentUser.ID),
			util.AttrError(err),
		)
	}

	return nil
}

func (s *Service) verifyResetPasswordToken(ctx context.Context, t token.Token) error {
	if t == "" {
		return ErrMissingToken
	}

	_, err := s.validateResetPasswordToken(ctx, t)
	return err
}

func (s *Service) resetPassword(ctx context.Context, t token.Token, newPassword, newPasswordConfirmed string) error {
	if t == "" {
		return ErrMissingToken
	}

	if newPassword != newPasswordConfirmed {
		return ErrPasswordsMismatch
	}

	if err := credentials.ValidatePassword(newPassword, credentials.ActionRegister); err != nil {
		return fmt.Errorf("%w: %w", ErrInvalidPassword, err)
	}

	tokenRecord, err := s.validateResetPasswordToken(ctx, t)
	if err != nil {
		return err
	}

	hash, err := credentials.HashPassword(newPassword)
	if err != nil {
		return fmt.Errorf("hash password: %w", err)
	}

	tx, err := session.BeginForUser(ctx, s.db, tokenRecord.UserID)
	if errors.Is(err, sql.ErrNoRows) {
		return ErrInvalidResetToken
	}
	if err != nil {
		return fmt.Errorf("begin reset password tx: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	if err := consumeResetPasswordToken(ctx, tx, tokenRecord.UserID, tokenRecord.TokenHash); err != nil {
		return err
	}

	if err := user.ReplacePasswordAndRevokeSessions(ctx, tx, tokenRecord.UserID, hash); err != nil {
		return fmt.Errorf("update user password: %w", err)
	}

	if err = tx.Commit(); err != nil {
		return fmt.Errorf("commit reset password tx: %w", err)
	}

	currentUser, err := user.GetUserByID(s.db, tokenRecord.UserID)
	if err != nil {
		slog.ErrorContext(ctx, "failed to get user for new password email",
			util.AttrUserID(tokenRecord.UserID),
			util.AttrError(err),
		)
		return nil
	}

	if err = s.mailService.SendNewPasswordEmail(ctx, currentUser.Email); err != nil {
		slog.ErrorContext(ctx, "failed to send new password email",
			util.AttrUserID(tokenRecord.UserID),
			util.AttrError(err),
		)
	}

	return nil
}

func (s *Service) validateResetPasswordToken(ctx context.Context, t token.Token) (*TokenRecord, error) {
	hash := util.HashSHA256(string(t))

	resetToken, err := GetResetPasswordTokenByHash(ctx, s.db, []byte(hash))
	if errors.Is(err, ErrNotFoundResetToken) {
		return nil, ErrInvalidResetToken
	}
	if err != nil {
		return nil, err
	}

	if time.Now().After(resetToken.ExpiresAt) {
		return nil, ErrInvalidResetToken
	}

	return resetToken, nil
}

func (s *Service) createResetPasswordToken(ctx context.Context, userID int64, email string) (token.Token, error) {
	t, err := token.GenerateAuthToken()
	if err != nil {
		return "", fmt.Errorf("generate reset password token: %w", err)
	}

	hash := util.HashSHA256(string(t))
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return "", fmt.Errorf("begin password reset token tx: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	currentUser, err := user.GetUserByIDForUpdate(ctx, tx, userID)
	if err != nil {
		return "", err
	}
	if currentUser.Email != email {
		return "", user.ErrUserNotFound
	}

	if err = DeleteResetPasswordToken(ctx, tx, userID); err != nil && !errors.Is(err, ErrNotFoundResetToken) {
		return "", fmt.Errorf("delete previous reset password token: %w", err)
	}

	expiresAt := time.Now().UTC().Add(config.ResetPasswordTokenTTL)
	if err = InsertResetPasswordToken(ctx, tx, userID, []byte(hash), expiresAt); err != nil {
		return "", err
	}
	if err := tx.Commit(); err != nil {
		return "", fmt.Errorf("commit password reset token: %w", err)
	}
	return t, nil
}
