BEGIN;

DROP TRIGGER queue_deleted_subject_attachment ON subjects_files;
DROP TRIGGER queue_deleted_subject_thumbnail ON subjects;
DROP FUNCTION queue_deleted_subject_asset();
DROP TABLE subject_file_cleanup;

COMMIT;
