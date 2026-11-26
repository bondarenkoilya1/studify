BEGIN;

-- The old expiration values were explicitly written in UTC. Creation used the
-- database session time zone, so recover it from each token type's lifetime.
UPDATE auth_tokens
SET created_at = expires_at - CASE type
    WHEN 'email_confirmation' THEN interval '4 hours'
    WHEN 'password_reset' THEN interval '30 minutes'
    WHEN 'auth_challenge' THEN interval '2 minutes'
END;

ALTER TABLE auth_tokens
    ALTER COLUMN created_at DROP DEFAULT,
    ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
    ALTER COLUMN expires_at TYPE TIMESTAMPTZ USING expires_at AT TIME ZONE 'UTC',
    ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;

COMMIT;
