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
│   ├── internal/auth/      # authentication, two-factor setup, and sessions
│   ├── internal/subject/   # subject handlers, services, and queries
│   ├── internal/task/      # task handlers, services, and queries
│   ├── migrations/         # PostgreSQL migrations
│   └── postman/            # runnable HTTP request examples
├── frontend/               # React + Vite client
├── API.md                  # API contract
├── ISSUES.md               # open issues and audit status
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
POSTGRES_PASSWORD=replace-with-local-password
JWT_ACCESS_SECRET=replace-with-a-random-secret
JWT_REFRESH_SECRET=replace-with-a-different-random-secret
TOTP_ENCRYPTION_KEY=output-of-openssl-rand-base64-32
```

Generate the PostgreSQL password and each JWT secret separately with
`openssl rand -hex 32`.

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
The consolidated project audit is in [ISSUES.md](./ISSUES.md).

The calendar opens on the earliest month with an exam or visible task. It
opens the current month when there are no events.

## Checks

```bash
make backend-test
make -C backend fmt-check
make -C backend vet
make -C backend lint
cd frontend
bun install --frozen-lockfile
bun run lint
bun run test
VITE_API_URL=http://localhost:8080 bun run build
```


For the production API image and Chromium end-to-end tests, see
[SETUP.md](./SETUP.md).
