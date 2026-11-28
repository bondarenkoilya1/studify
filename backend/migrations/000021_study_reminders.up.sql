BEGIN;

CREATE TABLE study_reminders (
    id BIGSERIAL PRIMARY KEY,
    task_id BIGINT UNIQUE REFERENCES tasks(id) ON DELETE CASCADE,
    subject_id BIGINT UNIQUE REFERENCES subjects(id) ON DELETE CASCADE,
    lead_minutes INTEGER NOT NULL CHECK (lead_minutes BETWEEN 5 AND 10080),
    time_zone TEXT NOT NULL,
    handled_for TIMESTAMPTZ,
    outcome TEXT CHECK (outcome IN ('accepted', 'exhausted')),
    CHECK ((task_id IS NULL) <> (subject_id IS NULL))
);

CREATE VIEW study_reminder_schedule AS
SELECT r.id, u.id AS user_id, u.email,
       sha256(convert_to(u.email, 'UTF8')) AS email_key,
       s.id AS subject_id, r.task_id, s.name AS subject_name,
       COALESCE(t.name, s.name) AS event_name,
       e.event_at, e.event_at - make_interval(mins => r.lead_minutes) AS send_at,
       r.handled_for
FROM study_reminders r
LEFT JOIN tasks t ON t.id = r.task_id
JOIN subjects s ON s.id = COALESCE(t.subject_id, r.subject_id)
JOIN users u ON u.id = s.user_id
CROSS JOIN LATERAL (
    SELECT CASE
        WHEN r.task_id IS NULL THEN s.exam_date
        WHEN t.status = 'completed' THEN NULL
        WHEN t.deadline_date IS NOT NULL THEN (t.deadline_date + 1)::timestamp AT TIME ZONE r.time_zone
        ELSE t.deadline
    END AS event_at
) e
WHERE u.is_email_verified AND e.event_at IS NOT NULL;

ALTER TABLE mail_outbox
    ADD COLUMN reminder_id BIGINT UNIQUE REFERENCES study_reminders(id) ON DELETE CASCADE,
    ADD COLUMN reminder_event_at TIMESTAMPTZ,
    ADD COLUMN reminder_send_at TIMESTAMPTZ,
    ADD COLUMN reminder_email_key BYTEA,
    ADD CONSTRAINT mail_outbox_reminder_snapshot CHECK (
        (reminder_id IS NULL AND reminder_event_at IS NULL AND reminder_send_at IS NULL AND reminder_email_key IS NULL)
        OR (reminder_id IS NOT NULL AND reminder_event_at IS NOT NULL AND reminder_send_at IS NOT NULL
            AND reminder_email_key IS NOT NULL AND token_hash IS NULL)
    );

COMMIT;
