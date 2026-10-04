# Studify

Studify is a Go REST API for managing users, subjects, study tasks, and dashboard
statistics. PostgreSQL stores application data. The React frontend lives in
`frontend/` and runs in the same Docker Compose stack.

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
├── frontend/               # React + Vite client
├── API.md                  # API contract
├── SETUP.md                # local setup and commands
└── docker-compose.yaml
```

## Quick start

Requirements: Docker with the Compose plugin and `psql`.

```bash
make env
```

Fill the required secrets in `.env`:

```env
JWT_ACCESS_SECRET=replace-with-a-random-secret
JWT_REFRESH_SECRET=replace-with-a-different-random-secret
TOTP_ENCRYPTION_KEY=output-of-openssl-rand-base64-32
```

Start the stack and apply the migrations:

```bash
make docker-up
make migrate-up
```

Default addresses:

- API: `http://localhost:8080`
- Swagger UI: `http://localhost:8081`
- OpenAPI specification: `backend/docs/openapi.yaml`
- frontend: `http://localhost:5173`
- Mailpit (caught emails): `http://localhost:8025`
- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3000` (`admin` / `admin`)
- PostgreSQL: `localhost:4444`

See [SETUP.md](./SETUP.md) for configuration and operational commands. See
[API.md](./API.md) for routes, authentication, payloads, and responses.

## Checks

```bash
make backend-test
make -C backend fmt-check
make -C backend vet
```
