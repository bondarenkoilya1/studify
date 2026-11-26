package mail

import (
	"context"
	"errors"
	"net"
	"testing"
	"time"
)

func TestSendTimesOutWaitingForSMTPGreeting(t *testing.T) {
	listener, err := (&net.ListenConfig{}).Listen(t.Context(), "tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	defer func() { _ = listener.Close() }()

	done := make(chan struct{})
	go func() {
		defer close(done)
		conn, err := listener.Accept()
		if err == nil {
			defer func() { _ = conn.Close() }()
			// Keep the connection open without sending an SMTP greeting.
			var data [1]byte
			_, _ = conn.Read(data[:])
		}
	}()

	ctx, cancel := context.WithTimeout(t.Context(), 2*time.Second)
	defer cancel()
	mailer := NewMailer(listener.Addr().String(), "sender@example.com", "", "")
	mailer.timeout = 50 * time.Millisecond
	err = mailer.send(ctx, "student@example.com", "Test", "Test")
	var timeout net.Error
	if !errors.As(err, &timeout) || !timeout.Timeout() || ctx.Err() != nil {
		t.Fatalf("expected an SMTP timeout before the request deadline, got %v", err)
	}
	<-done
}
