package auth

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"studify/internal/auth/token"
	"studify/internal/user"
)

var ErrInvalidConfirmationToken = errors.New("invalid confirmation token")

type Service struct {
	db *sql.DB
}

func NewService(db *sql.DB) *Service {
	return &Service{db: db}
}

func (s *Service) ConfirmEmail(ctx context.Context, t token.Token) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("begin confirm email transaction: %w", err)
	}
	defer tx.Rollback()

	tokenRecord, err := token.ValidateConfirmationToken(tx, t)
	if err != nil {
		if errors.Is(err, token.ErrEmailConfirmationNotFound) ||
			errors.Is(err, token.ErrEmailConfirmationTokenExpired) {
			return ErrInvalidConfirmationToken
		}
		return fmt.Errorf("validate confirmation token: %w", err)
	}

	if err = user.VerifyUserEmail(tx, tokenRecord.UserID); err != nil {
		return fmt.Errorf("verify user email: %w", err)
	}

	if err = token.DeleteConfirmationToken(tx, tokenRecord.UserID); err != nil {
		if errors.Is(err, token.ErrEmailConfirmationNotFound) {
			return ErrInvalidConfirmationToken
		}
		return fmt.Errorf("delete confirmation token: %w", err)
	}

	if err = tx.Commit(); err != nil {
		return fmt.Errorf("commit confirm email transaction: %w", err)
	}

	return nil
}
