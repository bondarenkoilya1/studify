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

// todo: don't do it here
func (s *Service) SendConfirmationEmail(email string, userID internal.UserID) error {
	t, err := token.CreateConfirmationToken(s.db, int64(userID))
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
