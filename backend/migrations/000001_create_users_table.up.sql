CREATE TABLE users
(
    id                    BIGSERIAL PRIMARY KEY,
    email                 TEXT        NOT NULL UNIQUE,
    password              TEXT        NOT NULL,
    is_email_verified     BOOLEAN     NOT NULL DEFAULT FALSE,

    is_totp_enabled       BOOLEAN     NOT NULL DEFAULT FALSE,
    totp_encrypted TEXT NOT NULL DEFAULT '',

    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

    avatar_url TEXT
);

-- Rename password to passwordHash