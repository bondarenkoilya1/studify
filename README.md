# Studify

Studify is a Go REST API for managing users, subjects, study tasks, and dashboard
statistics. PostgreSQL stores application data. A minimal frontend placeholder
is kept only so the complete Docker Compose stack can start while the client is
rebuilt.

## Backend stack

- Go
- chi
- PostgreSQL with `database/sql` and pgx
- JWT access and refresh tokens in HttpOnly cookies
- SQL migrations
- Docker Compose

## Repository

```text
.
├── backend/
│   ├── cmd/api/            # application entrypoint and HTTP router
│   ├── internal/config/    # environment configuration
│   ├── internal/database/  # database queries
│   ├── internal/handlers/  # HTTP handlers
│   ├── internal/models/    # request and response models
│   ├── internal/utils/     # auth, validation, and helpers
│   ├── migrations/         # PostgreSQL migrations
│   └── postman/            # runnable HTTP request examples
├── frontend/               # empty Vite placeholder for Docker
├── API.md                  # API contract
├── SETUP.md                # local setup and commands
└── docker-compose.yaml
```

## Quick start

Requirements: Docker with the Compose plugin and `psql`.

```bash
make env
```

Set non-empty secrets in `.env`:

```env
JWT_ACCESS_SECRET=replace-with-a-random-secret
JWT_REFRESH_SECRET=replace-with-a-different-random-secret
```

Start PostgreSQL, the backend, Swagger UI, and the empty frontend placeholder:

```bash
make docker-up
make migrate-up
```

Default addresses:

- API: `http://localhost:8080`
- Swagger UI: `http://localhost:8081`
- OpenAPI specification: `backend/docs/openapi.yaml`
- frontend placeholder: `http://localhost:5173`
- PostgreSQL: `localhost:4444`

See [SETUP.md](./SETUP.md) for configuration and operational commands. See
[API.md](./API.md) for routes, authentication, payloads, and responses.

## Checks

```bash
make backend-test
make -C backend fmt-check
make -C backend vet
```
