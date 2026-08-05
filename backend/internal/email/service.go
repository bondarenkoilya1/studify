package email

import (
	"database/sql"
	"fmt"
	"studify/internal/auth"
	"studify/internal/config"
	"studify/internal/mail"
)

type Service struct {
	DB     *sql.DB
	Mailer *mail.Mailer
	Config *config.Config
}

func (e *Service) SendConfirmationEmail(email string, userID auth.UserID) error {
	token, err := auth.CreateConfirmationToken(e.DB, userID)
	if err != nil {
		return fmt.Errorf("create confirmation link: %w", err)
	}

	link := fmt.Sprintf(
		"%s/confirm/%s",
		e.Config.AppURL,
		token,
	)

	if err := e.Mailer.SendConfirmationEmail("noreply@studify.com", email, link); err != nil {
		return fmt.Errorf("send confirmation email: %w", err)
	}

	return nil
}
