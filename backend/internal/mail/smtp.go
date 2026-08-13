package mail

import (
	"net/smtp"
	"strings"
)

type Mailer struct {
	addr string
}

func NewMailer(addr string) *Mailer {
	return &Mailer{addr: addr}
}

func (m *Mailer) SendConfirmationEmail(sender, recipient, link string) error {
	c, err := smtp.Dial(m.addr)
	if err != nil {
		return err
	}

	defer c.Quit()

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
	writeEmailConfirmationBody(&letter, link)

	_, err = writer.Write([]byte(letter.String()))
	if err != nil {
		return err
	}

	return writer.Close()
}

func (m *Mailer) SendPasswordResetEmail(sender, recipient, link string) error {
	c, err := smtp.Dial(m.addr)
	if err != nil {
		return err
	}
	defer c.Quit()

	if err = c.Mail(sender); err != nil {
		return err
	}

	if err = c.Rcpt(recipient); err != nil {
		return err
	}

	writer, err := c.Data()
	if err != nil {
		return err
	}

	var letter strings.Builder
	writeHeaders(&letter, sender, recipient, "Studify | Reset your password")
	writePasswordResetBody(&letter, link)

	_, err = writer.Write([]byte(letter.String()))
	if err != nil {
		return err
	}

	return writer.Close()
}

func (m *Mailer) SendNewPasswordEmail(sender, recipient, password string) error {
	c, err := smtp.Dial(m.addr)
	if err != nil {
		return err
	}
	defer c.Quit()

	if err = c.Mail(sender); err != nil {
		return err
	}

	if err = c.Rcpt(recipient); err != nil {
		return err
	}

	writer, err := c.Data()
	if err != nil {
		return err
	}

	var letter strings.Builder
	writeHeaders(&letter, sender, recipient, "Studify | Your new password")
	writePasswordChangedBody(&letter, password)

	_, err = writer.Write([]byte(letter.String()))
	if err != nil {
		return err
	}

	return writer.Close()
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

func writeEmailConfirmationBody(
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

func writePasswordResetBody(
	b *strings.Builder,
	link string,
) {
	b.WriteString("\r\n")

	b.WriteString("Hi,\r\n\r\n")

	b.WriteString("We received a request to reset the password for your Studify account.\r\n\r\n")

	b.WriteString("If you made this request, use the link below to choose a new password:\r\n\r\n")

	b.WriteString(link)
	b.WriteString("\r\n\r\n")

	b.WriteString("This link will expire in 30 minutes and can only be used once.\r\n\r\n")

	b.WriteString("If you didn't request a password reset, you can safely ignore this email. ")
	b.WriteString("Your password will not be changed unless the reset link is used.\r\n\r\n")

	b.WriteString("For your security, never share this link or your password with anyone. ")
	b.WriteString("Studify will never ask you to send us your password.\r\n\r\n")

	b.WriteString("Best,\r\n")
	b.WriteString("The Studify Team\r\n")
}

func writePasswordChangedBody(
	b *strings.Builder,
	password string,
) {
	b.WriteString("\r\n")

	b.WriteString("Hi,\r\n\r\n")

	b.WriteString("Your Studify password has been changed.\r\n\r\n")

	b.WriteString("Your new password is:\r\n\r\n")

	b.WriteString(password)
	b.WriteString("\r\n\r\n")

	b.WriteString("You can use this password to sign in to your Studify account.\r\n\r\n")

	b.WriteString("If you didn't make this change, please reset your password immediately and contact us if you need help.\r\n\r\n")

	b.WriteString("For your security, don't share your password with anyone.\r\n\r\n")

	b.WriteString("Best,\r\n")
	b.WriteString("The Studify Team\r\n")
}
