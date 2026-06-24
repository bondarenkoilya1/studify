ifneq (,$(wildcard .env))
include .env
export
endif

ifeq ($(strip $(POSTGRES_USER)),)
POSTGRES_USER = studify
endif
ifeq ($(strip $(POSTGRES_PASSWORD)),)
POSTGRES_PASSWORD = studify
endif
ifeq ($(strip $(POSTGRES_DB)),)
POSTGRES_DB = studify
endif
ifeq ($(strip $(POSTGRES_HOST_PORT)),)
POSTGRES_HOST_PORT = 4444
endif

MIGRATIONS_DIR = backend/migrations
POSTGRES_DSN = postgres://$(POSTGRES_USER):$(POSTGRES_PASSWORD)@localhost:$(POSTGRES_HOST_PORT)/$(POSTGRES_DB)?sslmode=disable

.PHONY: env check-docker-env docker-up docker-down docker-ps docker-logs migrate-up migrate-down backend-run backend-test frontend-dev

env:
	test -f .env || cp .env.example .env

check-docker-env:
	@test -n "$(JWT_ACCESS_SECRET)" || (echo "JWT_ACCESS_SECRET is required in .env"; exit 1)
	@test -n "$(JWT_REFRESH_SECRET)" || (echo "JWT_REFRESH_SECRET is required in .env"; exit 1)

docker-up: check-docker-env
	docker compose up --build -d

docker-down:
	docker compose down

docker-ps:
	docker compose ps

docker-logs:
	docker compose logs -f

migrate-up:
	psql "$(POSTGRES_DSN)" -v ON_ERROR_STOP=1 -f $(MIGRATIONS_DIR)/000001_create_users_table.up.sql
	psql "$(POSTGRES_DSN)" -v ON_ERROR_STOP=1 -f $(MIGRATIONS_DIR)/000002_create_subjects_table.up.sql
	psql "$(POSTGRES_DSN)" -v ON_ERROR_STOP=1 -f $(MIGRATIONS_DIR)/000003_create_tasks_table.up.sql
	psql "$(POSTGRES_DSN)" -v ON_ERROR_STOP=1 -f $(MIGRATIONS_DIR)/000004_create_refresh_tokens_table.up.sql

migrate-down:
	psql "$(POSTGRES_DSN)" -v ON_ERROR_STOP=1 -f $(MIGRATIONS_DIR)/000004_create_refresh_tokens_table.down.sql
	psql "$(POSTGRES_DSN)" -v ON_ERROR_STOP=1 -f $(MIGRATIONS_DIR)/000003_create_tasks_table.down.sql
	psql "$(POSTGRES_DSN)" -v ON_ERROR_STOP=1 -f $(MIGRATIONS_DIR)/000002_create_subjects_table.down.sql
	psql "$(POSTGRES_DSN)" -v ON_ERROR_STOP=1 -f $(MIGRATIONS_DIR)/000001_create_users_table.down.sql

backend-run:
	$(MAKE) -C backend run

backend-test:
	$(MAKE) -C backend test

frontend-dev:
	cd frontend && bun run dev
