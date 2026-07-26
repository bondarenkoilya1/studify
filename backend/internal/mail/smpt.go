package mail

import (
	"net/smtp"
	"strings"
)

func ConnectSMTP(addr string) (*smtp.Client, error) {
	c, err := smtp.Dial(addr)
	if err != nil {
		return nil, err
	}

	return c, nil
}

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

func writeHeaders(
	b *strings.Builder,
	sender,
	recipient,
	subject string,
) {
	b.WriteString("From: <")
	b.WriteString(sender)
	b.WriteString(">\r\n")

	b.WriteString("To: ")
	b.WriteString(recipient)
	b.WriteString("\r\n")

	b.WriteString("Subject: ")
	b.WriteString(subject)
	b.WriteString("\r\n")

	b.WriteString("MIME-Version: 1.0\r\n")
	b.WriteString("Content-Type: text/plain; charset=UTF-8\r\n")
}

func writeConfirmationBody(
	b *strings.Builder,
	link string,
) {
	b.WriteString("\r\n")

	b.WriteString("Hi,\r\n\r\n")
	b.WriteString("You're receiving this email because your email address ")
	b.WriteString("was used to register at Studify.\r\n\r\n")

	b.WriteString("Please click the following link: ")
	b.WriteString(link)
	b.WriteString("\r\n")
}
