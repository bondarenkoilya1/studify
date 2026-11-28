BEGIN;
DELETE FROM mail_outbox WHERE reminder_id IS NOT NULL;
ALTER TABLE mail_outbox
    DROP COLUMN reminder_id,
    DROP COLUMN reminder_event_at,
    DROP COLUMN reminder_send_at,
    DROP COLUMN reminder_email_key;
DROP VIEW study_reminder_schedule;
DROP TABLE study_reminders;
COMMIT;
