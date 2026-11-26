package mail

import (
	"context"
	"fmt"
	"studify/internal/auth/token"
	"studify/internal/config"
)

type Service struct {
	mailer *Mailer
	cfg    *config.Config
}

func NewService(mailer *Mailer, cfg *config.Config) *Service {
	return &Service{mailer: mailer, cfg: cfg}
}

func (s *Service) SendConfirmationEmail(ctx context.Context, email string, token token.Token) error {
	link := fmt.Sprintf("%s/confirm?token=%s", s.cfg.AppURL, token)
	body := fmt.Sprintf(confirmationBody, link)
	if err := s.mailer.send(ctx, email, confirmationSubject, body); err != nil {
		return fmt.Errorf("send confirmation email: %w", err)
	}

	return nil
}

func (s *Service) SendPasswordResetEmail(ctx context.Context, email, token string) error {
	link := fmt.Sprintf("%s/reset-password?token=%s", s.cfg.AppURL, token)
	body := fmt.Sprintf(passwordResetBody, link)
	if err := s.mailer.send(ctx, email, passwordResetSubject, body); err != nil {
		return fmt.Errorf("send password reset email: %w", err)
	}

	return nil
}

func (s *Service) SendNewPasswordEmail(ctx context.Context, email string) error {
	if err := s.mailer.send(ctx, email, newPasswordSubject, newPasswordBody); err != nil {
		return fmt.Errorf("send new password email: %w", err)
	}

	return nil
}
