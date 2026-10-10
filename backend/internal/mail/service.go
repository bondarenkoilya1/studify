package mail

import (
	"database/sql"
	"fmt"
	"studify/internal"
	"studify/internal/auth/token"
	"studify/internal/config"
)

type Service struct {
	db     *sql.DB
	mailer *Mailer
	cfg    *config.Config
}

func NewService(db *sql.DB, mailer *Mailer, cfg *config.Config) *Service {
	return &Service{db: db, mailer: mailer, cfg: cfg}
}

func (s *Service) SendConfirmationEmail(email string, userID internal.UserID) error {
	t, err := token.CreateConfirmationToken(s.db, userID)
	if err != nil {
		return fmt.Errorf("create confirmation token: %w", err)
	}

	link := fmt.Sprintf("%s/confirm?token=%s", s.cfg.AppURL, t)
	body := fmt.Sprintf(confirmationBody, link)
	if err := s.mailer.send(email, confirmationSubject, body); err != nil {
		return fmt.Errorf("send confirmation email: %w", err)
	}

	return nil
}

func (s *Service) SendPasswordResetEmail(email string, userID internal.UserID) error {
	t, err := token.CreateResetPasswordToken(s.db, userID)
	if err != nil {
		return fmt.Errorf("create password reset token: %w", err)
	}

	link := fmt.Sprintf("%s/reset-password?token=%s", s.cfg.AppURL, t)
	body := fmt.Sprintf(passwordResetBody, link)
	if err := s.mailer.send(email, passwordResetSubject, body); err != nil {
		return fmt.Errorf("send password reset email: %w", err)
	}

	return nil
}

func (s *Service) SendNewPasswordEmail(email, password string) error {
	body := fmt.Sprintf(newPasswordBody, password)
	if err := s.mailer.send(email, newPasswordSubject, body); err != nil {
		return fmt.Errorf("send new password email: %w", err)
	}

	return nil
}
