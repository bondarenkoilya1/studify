BEGIN;

CREATE INDEX tasks_subject_created_idx ON tasks (subject_id, created_at DESC);
CREATE INDEX lecturers_subject_id_idx ON lecturers (subject_id, id);
CREATE INDEX subjects_files_subject_id_idx ON subjects_files (subject_id, id);
CREATE INDEX subjects_files_path_idx ON subjects_files (path);
CREATE INDEX shared_projects_user_id_idx ON shared_projects (user_id, id DESC);
CREATE INDEX sessions_user_id_idx ON sessions (user_id, last_login DESC, id DESC);
CREATE INDEX refresh_tokens_user_id_idx ON refresh_tokens (user_id);
CREATE INDEX refresh_tokens_expires_idx ON refresh_tokens (expires_at);
CREATE INDEX refresh_tokens_revoked_idx ON refresh_tokens (revoked_at) WHERE revoked_at IS NOT NULL;
CREATE INDEX auth_tokens_expires_idx ON auth_tokens (expires_at);

COMMIT;
