package mail

import (
	"database/sql"
	"fmt"
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

func (s *Service) SendConfirmationEmail(email string, token token.Token) error {
	link := fmt.Sprintf("%s/confirm?token=%s", s.cfg.AppURL, token)
	body := fmt.Sprintf(confirmationBody, link)
	if err := s.mailer.send(email, confirmationSubject, body); err != nil {
		return fmt.Errorf("send confirmation email: %w", err)
	}

	return nil
}

func (s *Service) SendPasswordResetEmail(email, token string) error {
	link := fmt.Sprintf("%s/reset-password?token=%s", s.cfg.AppURL, token)
	body := fmt.Sprintf(passwordResetBody, link)
	if err := s.mailer.send(email, passwordResetSubject, body); err != nil {
		return fmt.Errorf("send password reset email: %w", err)
	}

	return nil
}

func (s *Service) SendNewPasswordEmail(email string) error {
	if err := s.mailer.send(email, newPasswordSubject, newPasswordBody); err != nil {
		return fmt.Errorf("send new password email: %w", err)
	}

	return nil
}
