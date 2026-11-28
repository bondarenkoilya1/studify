package mail

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log/slog"
	"mime"
	"studify/internal/util"
	"time"
)

func (s *Service) RunStudyReminders(ctx context.Context) {
	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()
	for ctx.Err() == nil {
		for range 20 {
			found, err := s.queueStudyReminder(ctx)
			if err != nil && ctx.Err() == nil {
				slog.ErrorContext(ctx, "failed to queue study reminder", util.AttrError(err))
			}
			if err != nil || !found {
				break
			}
		}
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		}
	}
}

func (s *Service) queueStudyReminder(ctx context.Context) (bool, error) {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return false, err
	}
	defer func() { _ = tx.Rollback() }()

	var id, userID, subjectID int64
	var taskID *int64
	var email, subjectName, eventName string
	var emailKey []byte
	var eventAt, sendAt time.Time
	err = tx.QueryRowContext(ctx, `
		SELECT s.id, s.user_id, s.subject_id, s.task_id, s.email, s.subject_name, s.event_name,
			s.email_key, s.event_at, s.send_at
		FROM study_reminder_schedule s JOIN study_reminders r ON r.id = s.id
		WHERE s.send_at <= statement_timestamp() AND s.event_at > statement_timestamp()
			AND s.handled_for IS DISTINCT FROM s.event_at
			AND NOT EXISTS (SELECT 1 FROM mail_outbox m WHERE m.reminder_id = s.id)
		ORDER BY s.send_at, s.id
		LIMIT 1 FOR UPDATE OF r SKIP LOCKED
	`).Scan(&id, &userID, &subjectID, &taskID, &email, &subjectName, &eventName, &emailKey, &eventAt, &sendAt)
	if errors.Is(err, sql.ErrNoRows) {
		return false, nil
	}
	if err != nil {
		return false, err
	}

	link := fmt.Sprintf("%s/subjects/%d", s.appURL, subjectID)
	category := "Предстоит событие по предмету"
	body := subjectName
	if taskID != nil {
		link += fmt.Sprintf("?task=%d", *taskID)
		category = "Приближается срок сдачи задачи"
		body = fmt.Sprintf("%s\nПредмет: %s", eventName, subjectName)
	} else {
		link += "?event=true"
	}
	payload, err := s.sealMessage(message{
		Recipient: email,
		Subject:   mime.QEncoding.Encode("UTF-8", "Studify · "+category),
		Body:      fmt.Sprintf("%s\n\n%s\n\nОткрыть в Studify: %s\n", category, body, link),
	})
	if err != nil {
		return false, err
	}
	_, err = tx.ExecContext(ctx, `
		INSERT INTO mail_outbox (user_id, payload, expires_at, reminder_id, reminder_event_at, reminder_send_at, reminder_email_key)
		VALUES ($1,$2,$3,$4,$3,$5,$6) ON CONFLICT (reminder_id) DO NOTHING
	`, userID, payload, eventAt, id, sendAt, emailKey)
	if err != nil {
		return false, err
	}
	return true, tx.Commit()
}
