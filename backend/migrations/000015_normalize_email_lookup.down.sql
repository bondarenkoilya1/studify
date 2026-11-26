BEGIN;

DROP TRIGGER users_normalized_email ON users;
DROP FUNCTION enforce_normalized_email_uniqueness();
DROP INDEX users_normalized_email_idx;

COMMIT;
