# Setup

## Requirements

- Docker with the Compose plugin
- `psql` for running migrations from the root Makefile
- Go 1.26, only when running or checking the backend outside Docker

## Docker Compose

Create the root environment file:

```bash
make env
```

Fill the required values in `.env`. All supported root variables are listed in
`.env.example`.

- `POSTGRES_PASSWORD` is required. Generate a random URL-safe password, for
  example with `openssl rand -hex 32`.
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` must each be at least 32 bytes.
  Generate a separate random value for each with `openssl rand -hex 32`.
- `TOTP_ENCRYPTION_KEY` must be base64 that decodes to exactly 32 bytes:

```bash
openssl rand -base64 32
```

Start the stack:

```bash
make docker-up
```

This starts:

- PostgreSQL on `POSTGRES_HOST_PORT` (`4444` by default);
- the Go API with hot reload (`air`, configured in `backend/.air.toml`) on
  `BACKEND_HOST_PORT` (`8080` by default);
- the React frontend on `FRONTEND_HOST_PORT` (`5173` by default);
- Swagger UI on `SWAGGER_HOST_PORT` (`8081` by default);
- Mailpit, which catches every email the API sends, on `MAILPIT_WEB_PORT`
  (`8025` by default);
- Prometheus on `PROMETHEUS_HOST_PORT` (`9090` by default), scraping
  `backend:9091/metrics` on the Compose network;
- Grafana on `GRAFANA_HOST_PORT` (`3000` by default), login `admin` / `admin`.
  Dashboard JSON files go in `grafana/provisioning/dashboards/json/`.

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

`docker-down` preserves the named volumes. To remove stored data, run
`docker compose down -v`.

## Production backend image

Build the standalone backend image from the repository root.

```bash
docker build -f backend/Dockerfile -t studify-api backend
```

The runtime image contains the compiled API and runs as UID and GID 10001.
Apply the SQL migrations to the target PostgreSQL database before starting
the new image. Configure the environment with strong secrets, the database and
SMTP connections, the public HTTPS frontend URL in `APP_URL` and the frontend
origin in `CORS_ALLOWED_ORIGINS`.

```bash
docker run --name studify-api --stop-timeout 35 \
  --env-file /path/to/studify-production.env -e ENV=production \
  --mount type=volume,src=studify-data,dst=/app/data \
  -p 127.0.0.1:8080:8080 studify-api
```

Expose the API through your HTTPS reverse proxy. For a host bind mount in
place of the named volume, make the directory writable by UID and GID 10001.
The development Compose stack continues to use the Air image.

## Rotating credentials for an existing environment

1. Identify every instance sharing the old credentials and pause authentication
   writes during the cutover. Prepare independent replacements and confirm the
   database volume and a usable backup before changing the environment.
2. Count accounts with TOTP enabled or a nonempty `totp_encrypted` value. With
   existing ciphertext, coordinate a tested re-encryption using the old and new
   keys, or arrange 2FA re-enrollment if the factors may have been exposed.
   Keep the old key protected until the migration and recovery checks pass.
3. Stop the affected API instances. For Compose, change the password of the
   existing PostgreSQL role using PostgreSQL’s `\password` command. Updating
   `POSTGRES_PASSWORD` in `.env` changes the initialization environment, while
   passwords in an existing PostgreSQL volume are changed through the database.
4. Update the environment or secret store and recreate the services with the
   same data volume. Revoke sessions and any remaining unlinked refresh tokens
   before reopening the API. Verify that old credentials are rejected and that
   fresh sign-in and 2FA work. Restore service with the new credentials if a
   restart fails after revocation.

## Backend outside Docker

Create `backend/.env` from `backend/.env.example` and fill every required value:

```bash
cp backend/.env.example backend/.env
```

`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `TOTP_ENCRYPTION_KEY`, `ISSUER`,
`APP_NAME`, `APP_URL`, and `DATABASE_URL` are required. `SERVER_ADDR` defaults
to `:8080`, `ENV` defaults to `dev`, `SMTP_HOST` / `SMTP_PORT` default to
`localhost` / `1025`, and `CORS_ALLOWED_ORIGINS` defaults to
`http://localhost:5173,http://localhost:3000`.

The mail transport uses SMTP and supports Mailpit. Set `MAIL_FROM` to choose
the sender. Standalone development defaults to `noreply@studify.com` and Docker
Compose defaults to `noreply@studify.dev`. Set both `SMTP_USERNAME` and
`SMTP_PASSWORD` for authenticated delivery. SMTP operations have a five-second
timeout and use STARTTLS when the server offers it. Go's SMTP client requires
TLS for plain authentication to a remote host.

Apply migration 000020 before releasing the API. Registration and password
reset queue mail in PostgreSQL. Confirmation and reset messages are written in
the transaction that saves the token. The worker retries after 5 seconds,
30 seconds, 2 minutes, 5 minutes, and 10 minutes while the link remains valid.
An SMTP server can accept a message just before the worker loses its
connection. Retrying in that case may deliver a duplicate with the same link.
The `studify_mail_delivery_total` metric tracks acceptance, retries, and
terminal failures. Outbox payloads are encrypted with a purpose-derived key
from `TOTP_ENCRYPTION_KEY`. Drain the outbox before routine key rotation. For
emergency rotation, ask users to request new links after the cutover.

The PostgreSQL pool defaults to 20 open connections and up to 5 idle
connections per process. Tune `DB_MAX_OPEN_CONNS` and `DB_MAX_IDLE_CONNS`
for your database. Idle connections are closed after 5 minutes and all
connections are recycled after 30 minutes. Statements have a default
10-second timeout. Set `statement_timeout` in the database connection
string to override it.

The authentication rate limiter uses the request's peer address by default.
If you run the API behind a reverse proxy, set `TRUSTED_PROXY_CIDRS` to the
comma-separated networks of your proxies so the API can resolve the client
address from `X-Forwarded-For`.

In standalone development, `/metrics` defaults to the API listener. Set
`METRICS_ADDR` to run it on a separate address. In production, the default is
`127.0.0.1:9091`. Keep that listener on a private network and omit it from
public proxy routes. Docker Compose uses the internal port `9091` for backend
metrics. The Prometheus UI binds to the host loopback interface.

The API allows 5 seconds to read request headers, 2 minutes to read a request,
and 3 minutes to write the response. `SIGINT` and `SIGTERM` stop new requests
and allow up to 30 seconds for active requests to finish.

PostgreSQL and Mailpit can still run in Docker:

```bash
docker compose up -d postgres mailpit
```

Run or check the backend:

```bash
make backend-run
make backend-test
make -C backend fmt-check
make -C backend vet
```

The backend Makefile loads `backend/.env` automatically when it exists.

## Frontend API client

Install frontend dependencies with `bun install --frozen-lockfile` in
`frontend/`. Both the local setup and Docker use the same `bun.lock`.

The frontend API client in `frontend/src/shared/api/generated/` is generated by
[orval](https://orval.dev) from `backend/docs/openapi.yaml`, so the OpenAPI spec
is the contract between backend and frontend. After changing an endpoint, update
the spec and regenerate the client:

```bash
cd frontend && bun run gen:api
```

Commit the generated files together with the spec change. Do not edit them by
hand: every request goes through `frontend/src/shared/api/fetcher.ts`, which
sends cookies, refreshes the session on 401, and throws `ApiError`.

## Browser tests

Use a dedicated development database and Mailpit inbox. Start the API and
Mailpit and apply the migrations before running the suite. Playwright can
start Vite if the frontend is down.

```bash
cd frontend
bun install --frozen-lockfile
bunx playwright install chromium
bun run test:e2e
```

The default addresses are `http://localhost:5173`, `http://localhost:8080`
and `http://localhost:8025` for the frontend, API and Mailpit. Override them
with `E2E_WEB_URL`, `E2E_API_URL` and `E2E_MAILPIT_URL`. Match the frontend
origin in the API's `APP_URL` and `CORS_ALLOWED_ORIGINS`. Local HTTP test runs
use `ENV=dev` for cookies. The GitHub Actions browser job uses an isolated
database and runs against the production image.

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
host:     127.0.0.1
port:     4444
```

The migration commands are not a migration-state manager: rerunning `migrate-up`
against an already migrated database can fail because objects already exist.

Apply the missing migrations through 000020 in order before starting the API.
For a local database already at 000014, run this command and enter the
password configured in `POSTGRES_PASSWORD`:

```bash
psql -h 127.0.0.1 -p 4444 -U studify -d studify -W -v ON_ERROR_STOP=1 \
  -f backend/migrations/000015_normalize_email_lookup.up.sql \
  -f backend/migrations/000016_queue_deleted_subject_files.up.sql \
  -f backend/migrations/000017_shared_project_visibility.up.sql \
  -f backend/migrations/000018_auth_token_timestamps.up.sql \
  -f backend/migrations/000019_query_indexes.up.sql \
  -f backend/migrations/000020_mail_outbox.up.sql
```

Migration 000015 preserves existing accounts whose addresses differ only by
case. Users with those addresses continue to sign in with their exact spelling.
Migration 000016 creates the file cleanup queue. The API processes the queue in
the background and retries failed deletions. Files orphaned before the migration
are outside the queue. Migration 000017 keeps existing shared projects private.
Owners can publish them in the catalog from the project editor.

Migration 000018 preserves existing token expiry instants and reconstructs
creation times from their configured lifetime at issuance. Migration 000019
adds lookup and cleanup indexes. The API sweeps expired records at startup
and hourly. Revoked refresh tokens are removed after seven days, or earlier
if expired. Apply both migrations before starting the new API.

After 000014, the first authenticated request with old cookies triggers a token
refresh in the web app. A valid refresh cookie creates a tracked session, so
the user can continue without signing in again.
