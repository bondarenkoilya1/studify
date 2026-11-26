BEGIN;

DROP INDEX auth_tokens_expires_idx;
DROP INDEX refresh_tokens_revoked_idx;
DROP INDEX refresh_tokens_expires_idx;
DROP INDEX refresh_tokens_user_id_idx;
DROP INDEX sessions_user_id_idx;
DROP INDEX shared_projects_user_id_idx;
DROP INDEX subjects_files_path_idx;
DROP INDEX subjects_files_subject_id_idx;
DROP INDEX lecturers_subject_id_idx;
DROP INDEX tasks_subject_created_idx;

COMMIT;
