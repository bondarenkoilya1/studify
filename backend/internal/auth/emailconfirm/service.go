package emailconfirm

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"studify/internal"
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

func (s *Service) CreateConfirmationToken(ctx context.Context, userID int64) (token.Token, error) {
	oldToken, err := GetConfirmationTokenByUserID(ctx, s.db, userID)
	switch {
	case err == nil:
		// Старый токен есть: проверяем лимит и удаляем его.
		if time.Since(oldToken.CreatedAt) < time.Minute {
			return "", ErrResendTooSoon
		}
		if err := DeleteConfirmationToken(ctx, s.db, userID); err != nil &&
			!errors.Is(err, ErrEmailConfirmationNotFound) {
			return "", fmt.Errorf("delete old confirmation token: %w", err)
		}
	case errors.Is(err, ErrEmailConfirmationNotFound):
		// Токена нет: это нормальный случай, просто создаём новый.
	default:
		return "", fmt.Errorf("get old confirmation token: %w", err)
	}

	authToken, err := token.GenerateAuthToken()
	if err != nil {
		return "", fmt.Errorf("generate confirmation token: %w", err)
	}

	tokenHash := util.HashSHA256(string(authToken))
	expiresAt := time.Now().Add(config.ConfirmationTokenTTL)

	if err := InsertConfirmationToken(ctx, s.db, userID, []byte(tokenHash), expiresAt); err != nil {
		return "", err
	}

	return authToken, nil
}

func (s *Service) ValidateConfirmationToken(
	ctx context.Context,
	authToken token.Token,
) (*EmailConfirmationRecord, error) {
	tokenHash := util.HashSHA256(string(authToken))

	confirmationToken, err := GetConfirmationTokenByHash(ctx, s.db, []byte(tokenHash))
	if err != nil {
		return nil, err
	}

	if time.Now().After(confirmationToken.ExpiresAt) {
		return nil, ErrEmailConfirmationTokenExpired
	}

	return confirmationToken, nil
}

func (s *Service) ConfirmEmail(ctx context.Context, t token.Token) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("begin confirm email transaction: %w", err)
	}
	defer tx.Rollback()

	tokenRecord, err := s.ValidateConfirmationToken(ctx, t)
	if err != nil {
		if errors.Is(err, ErrEmailConfirmationNotFound) ||
			errors.Is(err, ErrEmailConfirmationTokenExpired) {
			return ErrInvalidConfirmationToken
		}
		return fmt.Errorf("validate confirmation token: %w", err)
	}

	if err := user.VerifyUserEmail(tx, tokenRecord.UserID); err != nil {
		return fmt.Errorf("verify user email: %w", err)
	}

	if err := DeleteConfirmationToken(ctx, tx, tokenRecord.UserID); err != nil {
		if errors.Is(err, ErrEmailConfirmationNotFound) {
			return ErrInvalidConfirmationToken
		}
		return fmt.Errorf("delete confirmation token: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("commit confirm email transaction: %w", err)
	}

	return nil
}

func (s *Service) SendConfirmationEmail(ctx context.Context, userID internal.UserID, email string) error {
	t, err := s.CreateConfirmationToken(ctx, int64(userID))
	if err != nil {
		return fmt.Errorf("create confirmation token: %w", err)
	}

	if err := s.mailService.SendConfirmationEmail(email, t); err != nil {
		return fmt.Errorf("send confirmation email: %w", err)
	}

	return nil
}
