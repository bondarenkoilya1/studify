BEGIN;

CREATE TABLE subject_file_cleanup (
    path TEXT PRIMARY KEY,
    retry_after TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE FUNCTION queue_deleted_subject_asset() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_TABLE_NAME = 'subjects' THEN
        INSERT INTO subject_file_cleanup (path)
        SELECT OLD.thumbnail_url WHERE OLD.thumbnail_url LIKE '/static/thumbnails/%'
        ON CONFLICT (path) DO NOTHING;
    ELSE
        INSERT INTO subject_file_cleanup (path)
        VALUES (OLD.path)
        ON CONFLICT (path) DO NOTHING;
    END IF;
    RETURN OLD;
END;
$$;

CREATE TRIGGER queue_deleted_subject_thumbnail
    AFTER DELETE ON subjects
    FOR EACH ROW EXECUTE FUNCTION queue_deleted_subject_asset();

CREATE TRIGGER queue_deleted_subject_attachment
    AFTER DELETE ON subjects_files
    FOR EACH ROW EXECUTE FUNCTION queue_deleted_subject_asset();

COMMIT;
