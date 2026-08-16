CREATE TABLE auth_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    token_hash BYTEA NOT NULL,
    type TEXT NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,

    CHECK (type IN (
        'password_reset',
        'email_confirmation',
        'auth_challenge'
    ))
);

CREATE UNIQUE INDEX one_email_confirmation_token_per_user
    ON auth_tokens (user_id)
    WHERE type = 'email_confirmation';

CREATE UNIQUE INDEX one_password_reset_token_per_user
    ON auth_tokens (user_id)
    WHERE type = 'password_reset';

CREATE UNIQUE INDEX auth_tokens_by_hash
    ON auth_tokens (token_hash);

CREATE INDEX auth_challenges_by_user_id
    ON auth_tokens (user_id)
    WHERE type = 'auth_challenge';