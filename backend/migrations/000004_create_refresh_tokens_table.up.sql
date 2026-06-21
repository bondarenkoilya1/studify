CREATE TABLE refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_id TEXT NOT NULL UNIQUE,
    token_hash TEXT NOT NULL UNIQUE ,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ NULL,
    replaced_by_token_id TEXT NULL
);
