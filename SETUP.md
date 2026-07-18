# Setup

## Requirements

- Docker with the Compose plugin
- `psql` for running migrations from the root Makefile
- Go, only when running or checking the backend outside Docker

## Docker Compose

Create the root environment file:

```bash
make publicEnv
```

`JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` must be non-empty. Use different,
random values. All supported root variables are listed in `.publicEnv.example`.

Start the stack:

```bash
make docker-up
```

This starts:

- PostgreSQL on `POSTGRES_HOST_PORT` (`4444` by default);
- the Go API on `BACKEND_HOST_PORT` (`8080` by default);
- an empty Vite placeholder on `FRONTEND_HOST_PORT` (`5173` by default).

Apply the database migrations after PostgreSQL is healthy:

```bash
make migrate-up
```

Useful commands:

```bash
make docker-ps
make docker-logs
make docker-down
make migrate-down
```

`docker-down` preserves the PostgreSQL named volume. To remove stored data,
explicitly remove the Compose volume separately.

## Backend outside Docker

Create `backend/.publicEnv` from `backend/.publicEnv.example` and fill every required value:

```bash
cp backend/.publicEnv.example backend/.publicEnv
```

Example:

```publicEnv
JWT_ACCESS_SECRET=replace-with-a-random-secret
JWT_REFRESH_SECRET=replace-with-a-different-random-secret
ISSUER=studify
DATABASE_URL=postgres://studify:studify@localhost:4444/studify?sslmode=disable
SERVER_ADDR=:8080
ENV=dev
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `ISSUER`, and `DATABASE_URL` are
required. `SERVER_ADDR` defaults to `:8080`, `ENV` defaults to `dev`, and
`CORS_ALLOWED_ORIGINS` defaults to
`http://localhost:5173,http://localhost:3000`.

Run or check the backend:

```bash
make backend-run
make backend-test
make -C backend fmt-check
make -C backend vet
```

The backend Makefile loads `backend/.publicEnv` automatically when it exists.

## Migrations

The root migration commands connect through the PostgreSQL host port and run
the versioned SQL files in order:

```bash
make migrate-up
make migrate-down
```

Defaults:

```text
database: studify
user:     studify
password: studify
host:     localhost
port:     4444
```

The migration commands are not a migration-state manager: rerunning `migrate-up`
against an already migrated database can fail because objects already exist.
