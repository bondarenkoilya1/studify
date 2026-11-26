BEGIN;

DROP INDEX refresh_tokens_session_id_idx;
ALTER TABLE refresh_tokens DROP COLUMN session_id;

COMMIT;
