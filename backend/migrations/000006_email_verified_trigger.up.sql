-- +migrate StatementBegin
CREATE OR REPLACE FUNCTION reset_email_verified()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.email IS DISTINCT FROM OLD.email THEN
        NEW.is_email_verified := FALSE;
END IF;

RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- +migrate StatementEnd

CREATE TRIGGER users_reset_email_verified
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION reset_email_verified();