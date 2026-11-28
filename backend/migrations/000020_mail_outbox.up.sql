BEGIN;

CREATE TABLE mail_outbox (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash BYTEA UNIQUE,
    payload BYTEA NOT NULL,
    attempts SMALLINT NOT NULL DEFAULT 0,
    next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX mail_outbox_due_idx ON mail_outbox (next_attempt_at, id);
CREATE INDEX mail_outbox_user_idx ON mail_outbox (user_id);

COMMIT;
