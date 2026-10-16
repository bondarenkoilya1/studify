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
	"studify/internal/mail"
	"studify/internal/user"
)

type Service struct {
	db          *sql.DB
	mailService *mail.Service
}

func NewService(db *sql.DB, mailService *mail.Service) *Service {
	return &Service{db: db, mailService: mailService}
}

func (s *Service) RequestPasswordReset(email string) error {
	if email == "" {
		return ErrEmailRequired
	}

	currentUser, err := user.GetUserByEmail(s.db, email)
	if err != nil {
		return fmt.Errorf("get user by email: %w", err)
	}

	if err = s.mailService.SendPasswordResetEmail(
		currentUser.Email,
		internal.UserID(currentUser.ID),
	); err != nil {
		return fmt.Errorf("send password reset email: %w", err)
	}

	return nil
}

func (s *Service) VerifyResetPasswordToken(ctx context.Context, t token.Token) error {
	if t == "" {
		return ErrMissingToken
	}

	if _, err := token.ValidateResetPasswordToken(s.db, t); err != nil {
		return fmt.Errorf("%w: %w", ErrInvalidResetToken, err)
	}

	return nil
}

func (s *Service) ResetPassword(ctx context.Context, resetPasswordToken token.Token, newPassword, newPasswordConfirmed string) error {
	if resetPasswordToken == "" {
		return ErrMissingToken
	}

	if newPassword != newPasswordConfirmed {
		return ErrPasswordsMismatch
	}

	if err := credentials.ValidatePassword(newPassword, credentials.ActionRegister); err != nil {
		return fmt.Errorf("%w: %w", ErrInvalidPassword, err)
	}

	tokenRecord, err := token.ValidateResetPasswordToken(s.db, resetPasswordToken)
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

	if err = token.DeleteResetPasswordToken(ctx, tx, tokenRecord.UserID); err != nil {
		if errors.Is(err, token.ErrResetPasswordTokenNotFound) {
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

	if err = s.mailService.SendNewPasswordEmail(currentUser.Email, newPassword); err != nil {
		slog.Error("failed to send new password email",
			slog.Int64("user_id", tokenRecord.UserID),
			slog.String("error", err.Error()),
		)
	}

	return nil
}
