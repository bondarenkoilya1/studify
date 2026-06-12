# Setup

This guide covers local installation, database setup, and running Studify.

## Requirements

- Go
- Bun
- Docker, if you want the full local stack with PostgreSQL
- `psql`, if you run migrations from your host machine

## Option A: Start Everything With Docker Compose

```bash
docker compose up --build -d
```

The services will be available at:

```txt
Backend:  http://localhost:8080
Frontend: http://localhost:5173
Postgres: localhost:4444
```

The backend reads `DATABASE_URL`. Docker Compose sets it to the internal
PostgreSQL service URL.

Run the SQL files in `backend/migrations` against the database before using a
fresh database.

```bash
psql "postgres://studify:studify@localhost:4444/studify?sslmode=disable" -f backend/migrations/000001_create_subjects_table.up.sql
psql "postgres://studify:studify@localhost:4444/studify?sslmode=disable" -f backend/migrations/000002_create_tasks_table.up.sql
psql "postgres://studify:studify@localhost:4444/studify?sslmode=disable" -f backend/migrations/000003_create_users_table.up.sql
```

## Option B: Start Services Manually

Start PostgreSQL and set the backend database URL:

```bash
export DATABASE_URL="postgres://studify:studify@localhost:5432/studify?sslmode=disable"
```

Run migrations from `backend/migrations`, then start the API:

```bash
psql "$DATABASE_URL" -f backend/migrations/000001_create_subjects_table.up.sql
psql "$DATABASE_URL" -f backend/migrations/000002_create_tasks_table.up.sql
psql "$DATABASE_URL" -f backend/migrations/000003_create_users_table.up.sql
cd backend
make run
```

The API will be available at:

```txt
http://localhost:8080
```

## Frontend

Create `frontend/.env` from the example:

```bash
cd frontend
cp .env.example .env
```

Set the backend URL:

```env
VITE_API_BASE_URL=http://localhost:8080
```

The frontend calls the backend directly. The Go backend is configured to allow
local Vite origins such as `http://localhost:5173`.

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
