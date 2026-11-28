package mail

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"studify/internal/util"
	"time"
)

const (
	logMailID   = "mail_id"
	logAttempts = "attempts"
)

const currentReminder = `
		EXISTS (
			SELECT 1 FROM study_reminder_schedule s WHERE s.id = m.reminder_id
				AND s.event_at = m.reminder_event_at AND s.send_at = m.reminder_send_at
				AND s.email_key = m.reminder_email_key
				AND s.handled_for IS DISTINCT FROM s.event_at
		)
`

var retryDelays = [...]time.Duration{5 * time.Second, 30 * time.Second, 2 * time.Minute, 5 * time.Minute, 10 * time.Minute}

func (s *Service) RunOutbox(ctx context.Context, recordDelivery func(string)) {
	ticker := time.NewTicker(time.Second)
	defer ticker.Stop()
	for ctx.Err() == nil {
		if err := s.deliverBatch(ctx, recordDelivery); err != nil && ctx.Err() == nil {
			slog.ErrorContext(ctx, "failed to process mail outbox", util.AttrError(err))
		}
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		}
	}
}

func (s *Service) deliverBatch(ctx context.Context, recordDelivery func(string)) error {
	_, err := s.db.ExecContext(ctx, `
		WITH discarded AS (
			DELETE FROM mail_outbox m
			WHERE m.expires_at <= clock_timestamp()
				OR (m.attempts >= $1 AND m.next_attempt_at <= clock_timestamp())
				OR (m.reminder_id IS NOT NULL AND NOT `+currentReminder+`)
				OR (m.token_hash IS NOT NULL AND NOT EXISTS (
					SELECT 1 FROM auth_tokens t WHERE t.token_hash = m.token_hash AND t.user_id = m.user_id
					AND t.expires_at > clock_timestamp()
				))
			RETURNING m.reminder_id, m.reminder_event_at, m.attempts, m.next_attempt_at
		)
		UPDATE study_reminders r SET handled_for = d.reminder_event_at, outcome = 'exhausted'
		FROM discarded d
		WHERE r.id = d.reminder_id AND d.attempts >= $1 AND d.next_attempt_at <= clock_timestamp()
	`, len(retryDelays)+1)
	if err != nil {
		return fmt.Errorf("discard obsolete email: %w", err)
	}

	for range 20 {
		found, err := s.deliverNext(ctx, recordDelivery)
		if err != nil || !found {
			return err
		}
	}
	return nil
}

func (s *Service) deliverNext(ctx context.Context, recordDelivery func(string)) (bool, error) {
	// Lease the job longer than the SMTP timeout without holding a connection during SMTP.
	var id int64
	var attempt int
	var payload []byte
	err := s.db.QueryRowContext(ctx, `
		WITH job AS (
			SELECT id FROM mail_outbox m
			WHERE next_attempt_at <= clock_timestamp() AND expires_at > clock_timestamp() AND attempts < $1
				AND (token_hash IS NULL OR EXISTS (
					SELECT 1 FROM auth_tokens t WHERE t.token_hash = m.token_hash AND t.user_id = m.user_id
					AND t.expires_at > clock_timestamp()
				))
				AND (m.reminder_id IS NULL OR `+currentReminder+`)
			ORDER BY next_attempt_at, id LIMIT 1 FOR UPDATE SKIP LOCKED
		)
		UPDATE mail_outbox m
		SET next_attempt_at = clock_timestamp() + interval '30 seconds', attempts = attempts + 1
		FROM job WHERE m.id = job.id
		RETURNING m.id, m.attempts, m.payload
	`, len(retryDelays)+1).Scan(&id, &attempt, &payload)
	if errors.Is(err, sql.ErrNoRows) {
		return false, nil
	}
	if err != nil {
		return false, fmt.Errorf("lease queued email: %w", err)
	}

	data, err := s.box.Open(nil, nil, payload, nil)
	var mail message
	if err != nil || json.Unmarshal(data, &mail) != nil {
		recordDelivery("invalid")
		slog.ErrorContext(ctx, "unable to read encrypted email", slog.Int64(logMailID, id))
		return true, s.finish(ctx, id, attempt, "exhausted")
	}
	if err := s.mailer.send(ctx, mail.Recipient, mail.Subject, mail.Body); err == nil {
		recordDelivery("accepted")
		finishCtx, cancel := context.WithTimeout(context.WithoutCancel(ctx), 3*time.Second)
		defer cancel()
		return true, s.finish(finishCtx, id, attempt, "accepted")
	}
	if ctx.Err() != nil {
		return true, ctx.Err()
	}
	if attempt > len(retryDelays) {
		recordDelivery("exhausted")
		slog.WarnContext(ctx, "mail delivery attempts exhausted",
			slog.Int64(logMailID, id),
			slog.Int(logAttempts, attempt),
		)
		return true, s.finish(ctx, id, attempt, "exhausted")
	}

	recordDelivery("retry")
	_, err = s.db.ExecContext(ctx, `
		UPDATE mail_outbox SET next_attempt_at = clock_timestamp() + $3 * interval '1 second'
		WHERE id = $1 AND attempts = $2
	`, id, attempt, int64(retryDelays[attempt-1]/time.Second))
	return true, err
}

func (s *Service) finish(ctx context.Context, id int64, attempt int, outcome string) error {
	_, err := s.db.ExecContext(ctx, `
		WITH locked AS MATERIALIZED (
			SELECT r.id FROM study_reminders r JOIN mail_outbox m ON m.reminder_id = r.id
			WHERE m.id = $1 AND m.attempts = $2 FOR UPDATE OF r
		), removed AS (
			DELETE FROM mail_outbox m
			WHERE m.id = $1 AND m.attempts = $2
				AND (m.reminder_id IS NULL OR m.reminder_id IN (SELECT id FROM locked))
			RETURNING m.reminder_id, m.reminder_event_at
		)
		UPDATE study_reminders r SET handled_for = d.reminder_event_at, outcome = $3
		FROM removed d WHERE d.reminder_id = r.id
	`, id, attempt, outcome)
	return err
}
