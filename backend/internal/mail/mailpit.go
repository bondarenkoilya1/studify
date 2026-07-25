package mail

import (
	"net/smtp"
	"strings"
)

func SendConfirmationEmail(c *smtp.Client, sender, recipient, link string) error {
	if err := c.Mail(sender); err != nil {
		return err
	}

	if err := c.Rcpt(recipient); err != nil {
		return err
	}

	writer, err := c.Data()
	if err != nil {
		return err
	}

	var letter strings.Builder
	writeHeaders(&letter, sender, recipient, "Studify | Confirm your account")
	writeConfirmationBody(&letter, link)

	_, err = writer.Write([]byte(letter.String()))
	if err != nil {
		return err
	}

	if err = writer.Close(); err != nil {
		return err
	}

	return nil
}
