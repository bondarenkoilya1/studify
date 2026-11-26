package mail

import (
	"context"
	"crypto/tls"
	"fmt"
	"net"
	netmail "net/mail"
	"net/smtp"
	"time"
)

type Mailer struct {
	addr     string
	sender   string
	username string
	password string
	timeout  time.Duration
}

func NewMailer(addr, sender, username, password string) *Mailer {
	return &Mailer{addr: addr, sender: sender, username: username, password: password, timeout: 5 * time.Second}
}

func (m *Mailer) send(ctx context.Context, recipient, subject, body string) error {
	addr, err := netmail.ParseAddress(recipient)
	if err != nil {
		return fmt.Errorf("invalid recipient: %w", err)
	}

	host, _, err := net.SplitHostPort(m.addr)
	if err != nil {
		return fmt.Errorf("invalid SMTP address: %w", err)
	}

	ctx, cancel := context.WithTimeout(ctx, m.timeout)
	defer cancel()
	var dialer net.Dialer
	conn, err := dialer.DialContext(ctx, "tcp", m.addr)
	if err != nil {
		return fmt.Errorf("connect to SMTP: %w", err)
	}
	defer func() { _ = conn.Close() }()
	deadline, _ := ctx.Deadline()
	if err := conn.SetDeadline(deadline); err != nil {
		return fmt.Errorf("set SMTP deadline: %w", err)
	}
	stop := context.AfterFunc(ctx, func() { _ = conn.SetDeadline(time.Now()) })
	defer stop()

	client, err := smtp.NewClient(conn, host)
	if err != nil {
		return fmt.Errorf("read SMTP greeting: %w", err)
	}

	if supported, _ := client.Extension("STARTTLS"); supported {
		if err := client.StartTLS(&tls.Config{ServerName: host, MinVersion: tls.VersionTLS12}); err != nil {
			return fmt.Errorf("start SMTP TLS: %w", err)
		}
	}
	if m.username != "" {
		if err := client.Auth(smtp.PlainAuth("", m.username, m.password, host)); err != nil {
			return fmt.Errorf("authenticate to SMTP: %w", err)
		}
	}

	if err := client.Mail(m.sender); err != nil {
		return fmt.Errorf("set SMTP sender: %w", err)
	}
	if err := client.Rcpt(addr.Address); err != nil {
		return fmt.Errorf("set SMTP recipient: %w", err)
	}
	message, err := client.Data()
	if err != nil {
		return fmt.Errorf("start SMTP message: %w", err)
	}
	if _, err := message.Write([]byte(buildMessage(m.sender, addr.Address, subject, body))); err != nil {
		return fmt.Errorf("write SMTP message: %w", err)
	}
	if err := message.Close(); err != nil {
		return fmt.Errorf("send SMTP message: %w", err)
	}

	// A successful DATA response means the server accepted the message.
	_ = client.Quit()
	return nil
}
