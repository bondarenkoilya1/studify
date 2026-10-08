package mail

import (
	"fmt"
	netmail "net/mail"
	"net/smtp"
)

type Mailer struct {
	addr   string
	sender string
}

func NewMailer(addr, sender string) *Mailer {
	return &Mailer{addr: addr, sender: sender}
}

func (m *Mailer) send(recipient, subject, body string) error {
	addr, err := netmail.ParseAddress(recipient)
	if err != nil {
		return fmt.Errorf("invalid recipient %q: %w", recipient, err)
	}

	msg := buildMessage(m.sender, addr.Address, subject, body)

	if err := smtp.SendMail(m.addr, nil, m.sender, []string{addr.Address}, []byte(msg)); err != nil {
		return fmt.Errorf("send mail: %w", err)
	}

	return nil
}
