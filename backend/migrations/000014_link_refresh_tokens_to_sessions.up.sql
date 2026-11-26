BEGIN;

ALTER TABLE refresh_tokens
    ADD COLUMN session_id BIGINT REFERENCES sessions (id) ON DELETE CASCADE;

CREATE INDEX refresh_tokens_session_id_idx
    ON refresh_tokens (session_id) WHERE session_id IS NOT NULL;

COMMIT;
