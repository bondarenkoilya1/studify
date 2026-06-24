# Setup

This guide covers local installation, database setup, and running Studify.

## Requirements

- Go
- Bun
- Docker, if you want the full local stack with PostgreSQL
- `psql`, if you run migrations from your host machine

## Environment Files

Root `.env` is used by Docker Compose and root `Makefile` commands.

```bash
make env
```

Fill at least:

```env
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
```

The other root `.env` values are optional. If they are empty, the local defaults
from `docker-compose.yaml` and `Makefile` are used:

```txt
Backend:  http://localhost:8080
Frontend: http://localhost:5173
Postgres: localhost:4444
```

For manual app runs, use app-specific env files:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

## Docker Compose

Start the full stack:

```bash
make docker-up
```

Apply migrations to the PostgreSQL instance exposed on the host:

```bash
make migrate-up
```

Other useful commands:

```bash
make docker-ps
make docker-logs
make docker-down
```

Docker Compose builds the backend `DATABASE_URL` from root `.env` and uses the
internal Docker hostname `postgres`.

## Manual Backend

Fill `backend/.env`:

```env
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
ISSUER=
DATABASE_URL=
SERVER_ADDR=
ENV=
CORS_ALLOWED_ORIGINS=
```

For a local PostgreSQL instance, `DATABASE_URL` usually looks like:

```env
DATABASE_URL=postgres://studify:studify@localhost:5432/studify?sslmode=disable
SERVER_ADDR=:8080
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

Run the backend:

```bash
make backend-run
```

The backend `Makefile` automatically loads `backend/.env` when it exists.

## Manual Frontend

Fill `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8080
```

Start the frontend:

```bash
cd frontend
bun install
bun run dev
```

Vite will print the local URL, usually:

```txt
http://localhost:5173
```

## Migrations

Root `make migrate-up` and `make migrate-down` use the PostgreSQL values from
root `.env`:

```env
POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_DB=
POSTGRES_HOST_PORT=
```

Empty values fall back to local defaults:

```txt
POSTGRES_USER=studify
POSTGRES_PASSWORD=studify
POSTGRES_DB=studify
POSTGRES_HOST_PORT=4444
```
