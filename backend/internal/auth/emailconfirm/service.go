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

func (s *Service) createConfirmationToken(ctx context.Context, userID int64, email string) (token.Token, error) {
	authToken, err := token.GenerateAuthToken()
	if err != nil {
		return "", fmt.Errorf("generate confirmation token: %w", err)
	}

	hash := util.HashSHA256(string(authToken))
	ttlSeconds := int64(config.ConfirmationTokenTTL / time.Second)
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return "", err
	}
	defer func() { _ = tx.Rollback() }()
	current, err := user.GetUserByIDForUpdate(ctx, tx, userID)
	if err != nil {
		return "", err
	}
	if current.IsEmailVerified {
		return "", ErrAlreadyVerified
	}
	if current.Email != email {
		return "", errors.New("confirmation email no longer current")
	}
	if err := saveConfirmationToken(ctx, tx, userID, []byte(hash), ttlSeconds); err != nil {
		return "", err
	}
	if err := tx.Commit(); err != nil {
		return "", err
	}
	return authToken, nil
}

func (s *Service) ConfirmEmail(ctx context.Context, t token.Token) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("begin confirm email transaction: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	hash := util.HashSHA256(string(t))
	userID, err := findConfirmationUserID(ctx, tx, []byte(hash))
	if err != nil {
		return err
	}
	if _, err := user.GetUserByIDForUpdate(ctx, tx, userID); err != nil {
		if errors.Is(err, user.ErrUserNotFound) {
			return ErrInvalidConfirmationToken
		}
		return err
	}
	if _, err := consumeConfirmationToken(ctx, tx, []byte(hash)); err != nil {
		return err
	}
	if err := user.VerifyUserEmail(tx, userID); err != nil {
		return fmt.Errorf("verify user email: %w", err)
	}
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("commit confirm email transaction: %w", err)
	}
	return nil
}

func (s *Service) SendConfirmationEmail(ctx context.Context, userID internal.UserID, email string) error {
	t, err := s.createConfirmationToken(ctx, int64(userID), email)
	if err != nil {
		return fmt.Errorf("create confirmation token: %w", err)
	}
	if err := s.mailService.SendConfirmationEmail(email, t); err != nil {
		return fmt.Errorf("send confirmation email: %w", err)
	}
	return nil
}
