BEGIN;

CREATE INDEX users_normalized_email_idx ON users (lower(email));

CREATE FUNCTION enforce_normalized_email_uniqueness() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        IF NEW.email = OLD.email THEN
            RETURN NEW;
        END IF;
    END IF;

    -- Existing case variants stay accessible. Serialize writes for each new address.
    PERFORM pg_advisory_xact_lock(hashtextextended(lower(NEW.email), 7474));
    IF EXISTS (SELECT 1 FROM users WHERE lower(email) = lower(NEW.email) AND id <> NEW.id) THEN
        RAISE unique_violation USING CONSTRAINT = 'users_email_normalized_key';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER users_normalized_email
    BEFORE INSERT OR UPDATE OF email ON users
    FOR EACH ROW EXECUTE FUNCTION enforce_normalized_email_uniqueness();

COMMIT;
