ifneq (,$(wildcard .env))
include .env
export
endif

ifeq ($(strip $(POSTGRES_USER)),)
POSTGRES_USER = studify
endif
ifeq ($(strip $(POSTGRES_DB)),)
POSTGRES_DB = studify
endif
ifeq ($(strip $(POSTGRES_HOST_PORT)),)
POSTGRES_HOST_PORT = 4444
endif

MIGRATIONS_DIR = backend/migrations
MIGRATE_PSQL = PGPASSWORD="$$POSTGRES_PASSWORD" psql -h 127.0.0.1 -p "$(POSTGRES_HOST_PORT)" -U "$(POSTGRES_USER)" -d "$(POSTGRES_DB)" -v ON_ERROR_STOP=1

.PHONY: env check-docker-env check-postgres-env docker-up docker-down docker-ps docker-logs migrate-up migrate-down backend-run backend-test

env:
	test -f .env || (umask 077 && cp .env.example .env)

check-postgres-env:
	@test -n "$$POSTGRES_PASSWORD" || (echo "POSTGRES_PASSWORD is required in .env" >&2; exit 1)

check-docker-env: check-postgres-env
	@test -n "$$JWT_ACCESS_SECRET" || (echo "JWT_ACCESS_SECRET is required in .env"; exit 1)
	@test -n "$$JWT_REFRESH_SECRET" || (echo "JWT_REFRESH_SECRET is required in .env"; exit 1)
	@test -n "$$TOTP_ENCRYPTION_KEY" || (echo "TOTP_ENCRYPTION_KEY is required in .env (generate: openssl rand -base64 32)"; exit 1)

docker-up: check-docker-env
	docker compose up --build -d

docker-down:
	docker compose down

docker-ps:
	docker compose ps

docker-logs:
	docker compose logs -f

migrate-up: check-postgres-env
	$(MIGRATE_PSQL) -f $(MIGRATIONS_DIR)/000001_create_users_table.up.sql
	$(MIGRATE_PSQL) -f $(MIGRATIONS_DIR)/000002_create_subjects_table.up.sql
	$(MIGRATE_PSQL) -f $(MIGRATIONS_DIR)/000003_create_tasks_table.up.sql
	$(MIGRATE_PSQL) -f $(MIGRATIONS_DIR)/000004_create_refresh_tokens_table.up.sql
	$(MIGRATE_PSQL) -f $(MIGRATIONS_DIR)/000005_create_auth_tokens.up.sql
	$(MIGRATE_PSQL) -f $(MIGRATIONS_DIR)/000007_create_recovery_codes.up.sql
	$(MIGRATE_PSQL) -f $(MIGRATIONS_DIR)/000008_create_lecturers_table.up.sql
	$(MIGRATE_PSQL) -f $(MIGRATIONS_DIR)/000009_create_subjects_files_table.up.sql
	$(MIGRATE_PSQL) -f $(MIGRATIONS_DIR)/000010_create_shared_projects_table.up.sql
	$(MIGRATE_PSQL) -f $(MIGRATIONS_DIR)/000011_create_sessions_table.up.sql
	$(MIGRATE_PSQL) -f $(MIGRATIONS_DIR)/000012_activate_new_recovery_codes.up.sql
	$(MIGRATE_PSQL) -f $(MIGRATIONS_DIR)/000013_add_task_calendar_dates.up.sql
	$(MIGRATE_PSQL) -f $(MIGRATIONS_DIR)/000014_link_refresh_tokens_to_sessions.up.sql
	$(MIGRATE_PSQL) -f $(MIGRATIONS_DIR)/000015_normalize_email_lookup.up.sql
	$(MIGRATE_PSQL) -f $(MIGRATIONS_DIR)/000016_queue_deleted_subject_files.up.sql
	$(MIGRATE_PSQL) -f $(MIGRATIONS_DIR)/000017_shared_project_visibility.up.sql
	$(MIGRATE_PSQL) -f $(MIGRATIONS_DIR)/000018_auth_token_timestamps.up.sql
	$(MIGRATE_PSQL) -f $(MIGRATIONS_DIR)/000019_query_indexes.up.sql
	$(MIGRATE_PSQL) -f $(MIGRATIONS_DIR)/000020_mail_outbox.up.sql
	$(MIGRATE_PSQL) -f $(MIGRATIONS_DIR)/000021_study_reminders.up.sql

migrate-down: check-postgres-env
	$(MIGRATE_PSQL) -f $(MIGRATIONS_DIR)/000021_study_reminders.down.sql
	$(MIGRATE_PSQL) -f $(MIGRATIONS_DIR)/000020_mail_outbox.down.sql
	$(MIGRATE_PSQL) -f $(MIGRATIONS_DIR)/000019_query_indexes.down.sql
	$(MIGRATE_PSQL) -f $(MIGRATIONS_DIR)/000018_auth_token_timestamps.down.sql
	$(MIGRATE_PSQL) -f $(MIGRATIONS_DIR)/000017_shared_project_visibility.down.sql
	$(MIGRATE_PSQL) -f $(MIGRATIONS_DIR)/000016_queue_deleted_subject_files.down.sql
	$(MIGRATE_PSQL) -f $(MIGRATIONS_DIR)/000015_normalize_email_lookup.down.sql
	$(MIGRATE_PSQL) -f $(MIGRATIONS_DIR)/000014_link_refresh_tokens_to_sessions.down.sql
	$(MIGRATE_PSQL) -f $(MIGRATIONS_DIR)/000013_add_task_calendar_dates.down.sql
	$(MIGRATE_PSQL) -f $(MIGRATIONS_DIR)/000012_activate_new_recovery_codes.down.sql
	$(MIGRATE_PSQL) -f $(MIGRATIONS_DIR)/000011_create_sessions_table.down.sql
	$(MIGRATE_PSQL) -f $(MIGRATIONS_DIR)/000010_create_shared_projects_table.down.sql
	$(MIGRATE_PSQL) -f $(MIGRATIONS_DIR)/000009_create_subjects_files_table.down.sql
	$(MIGRATE_PSQL) -f $(MIGRATIONS_DIR)/000008_create_lecturers_table.down.sql
	$(MIGRATE_PSQL) -f $(MIGRATIONS_DIR)/000007_create_recovery_codes.down.sql
	$(MIGRATE_PSQL) -f $(MIGRATIONS_DIR)/000005_create_auth_tokens.down.sql
	$(MIGRATE_PSQL) -f $(MIGRATIONS_DIR)/000004_create_refresh_tokens_table.down.sql
	$(MIGRATE_PSQL) -f $(MIGRATIONS_DIR)/000003_create_tasks_table.down.sql
	$(MIGRATE_PSQL) -f $(MIGRATIONS_DIR)/000002_create_subjects_table.down.sql
	$(MIGRATE_PSQL) -f $(MIGRATIONS_DIR)/000001_create_users_table.down.sql

backend-run:
	$(MAKE) -C backend run

backend-test:
	$(MAKE) -C backend test
