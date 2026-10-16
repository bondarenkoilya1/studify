package reset_password

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log/slog"
	"studify/internal"
	"studify/internal/auth/credentials"
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

func (s *Service) requestPasswordReset(email string) error {
	if email == "" {
		return ErrEmailRequired
	}

	currentUser, err := user.GetUserByEmail(s.db, email)
	if err != nil {
		return fmt.Errorf("get user by email: %w", err)
	}

	t, err := s.createResetPasswordToken(internal.UserID(currentUser.ID))
	if err != nil {
		return fmt.Errorf("create password reset token: %w", err)
	}

	if err = s.mailService.SendPasswordResetEmail(currentUser.Email, string(t)); err != nil {
		return fmt.Errorf("send password reset email: %w", err)
	}

	return nil
}

func (s *Service) verifyResetPasswordToken(ctx context.Context, t token.Token) error {
	if t == "" {
		return ErrMissingToken
	}

	if _, err := s.validateResetPasswordToken(t); err != nil {
		return fmt.Errorf("%w: %w", ErrInvalidResetToken, err)
	}

	return nil
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

	tokenRecord, err := s.validateResetPasswordToken(t)
	if err != nil {
		return fmt.Errorf("%w: %w", ErrInvalidResetToken, err)
	}

	hash, err := credentials.HashPassword(newPassword)
	if err != nil {
		return fmt.Errorf("hash password: %w", err)
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("begin reset password tx: %w", err)
	}
	defer tx.Rollback()

	if err = user.UpdateUserPassword(ctx, tx, tokenRecord.UserID, hash); err != nil {
		return fmt.Errorf("update user password: %w", err)
	}

	if err = DeleteResetPasswordToken(ctx, tx, tokenRecord.UserID); err != nil {
		if errors.Is(err, ErrNotFoundResetToken) {
			return ErrInvalidResetToken
		}
		return fmt.Errorf("delete reset token: %w", err)
	}

	if err = tx.Commit(); err != nil {
		return fmt.Errorf("commit reset password tx: %w", err)
	}

	currentUser, err := user.GetUserByID(s.db, tokenRecord.UserID)
	if err != nil {
		slog.Error("failed to get user for new password email",
			slog.Int64("user_id", tokenRecord.UserID),
			slog.String("error", err.Error()),
		)
		return nil
	}

	if err = s.mailService.SendNewPasswordEmail(currentUser.Email); err != nil {
		slog.Error("failed to send new password email",
			slog.Int64("user_id", tokenRecord.UserID),
			slog.String("error", err.Error()),
		)
	}

	return nil
}

func (s *Service) validateResetPasswordToken(t token.Token) (*ResetPasswordTokenRecord, error) {
	hash := util.HashSHA256(string(t))

	resetToken, err := GetResetPasswordTokenByHash(context.TODO(), s.db, []byte(hash))
	if err != nil {
		return nil, err
	}

	if time.Now().After(resetToken.ExpiresAt) {
		return nil, ErrInvalidResetToken
	}

	return resetToken, nil
}

func (s *Service) createResetPasswordToken(userID internal.UserID) (token.Token, error) {
	t, err := token.GenerateAuthToken()
	if err != nil {
		return "", fmt.Errorf("generate reset password token: %w", err)
	}

	hash := util.HashSHA256(string(t))
	expiresAt := time.Now().Add(config.ResetPasswordTokenTTL)

	if err = DeleteResetPasswordToken(context.TODO(), s.db, int64(userID)); err != nil && !errors.Is(err, ErrNotFoundResetToken) {
		return "", fmt.Errorf("delete previous reset password token: %w", err)
	}

	if err = InsertResetPasswordToken(context.TODO(), s.db, int64(userID), []byte(hash), expiresAt); err != nil {
		return "", err
	}

	return t, nil
}
