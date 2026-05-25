# Studify

Studify is a focused study workspace for students who want their coursework to
feel organized instead of scattered across notebooks, chats, calendars, and
random todo lists.

The app brings subjects, study tasks, deadlines, and progress tracking into one
clean interface. It is built for university students and junior developers who
need a practical dashboard for daily academic work: create a subject, add tasks
to it, set a deadline, choose a status, and keep moving without extra noise.

<p align="center">
  <img src="./preview.png" alt="Studify product preview" width="1000" />
</p>

## What It Does

- Create and view subjects with lecturer and exam date metadata.
- Create tasks connected to a subject through `subject_id`.
- Track task deadline and status.
- View subject-level task counts.
- Use a calm, minimal React interface backed by a Go API.

The current version focuses on the most important loop first: organize subjects
and manage the tasks connected to them.

## Stack

**Backend**

- Go
- Chi router
- SQLite through `modernc.org/sqlite`
- REST-style JSON API

**Frontend**

- React 19
- TypeScript
- Vite
- Bun
- Tailwind CSS
- TanStack React Query
- React Router
- Oxc tooling: `oxlint` and `oxfmt`

## Project Structure

```text
.
├── backend/
│   ├── database/      # SQLite connection and query functions
│   ├── handlers/      # HTTP handlers for subjects and tasks
│   ├── models/        # API/data models
│   └── main.go        # Router and server entrypoint
├── frontend/
│   ├── src/app/       # App routes and providers
│   ├── src/entities/  # Shared TypeScript entity types
│   ├── src/features/  # Feature APIs and UI forms
│   ├── src/pages/     # Tasks and subjects pages
│   ├── src/shared/    # API client, config, helpers, UI
│   └── src/widgets/   # App layout
└── preview.png
```

## API Overview

The backend runs on port `8080` by default.

### Subjects

```http
GET    /subjects/
POST   /subjects/
DELETE /subjects/
GET    /subjects/{id}
PUT    /subjects/{id}
DELETE /subjects/{id}
```

Subject JSON shape:

```json
{
  "id": 1,
  "name": "Databases",
  "lecturer": "Dr. Smith",
  "exam_date": "2026-06-10"
}
```

`POST /subjects/` currently expects an array:

```json
[
  {
    "name": "Databases",
    "lecturer": "Dr. Smith",
    "exam_date": "2026-06-10"
  }
]
```

### Tasks

```http
GET    /tasks/
POST   /tasks/
DELETE /tasks/
GET    /tasks/{id}
PUT    /tasks/{id}
DELETE /tasks/{id}
```

Task JSON shape:

```json
{
  "id": 1,
  "name": "Read chapter 4",
  "deadline": "2026-05-30",
  "status": "in_progress",
  "subject_id": 1
}
```

`POST /tasks/` currently expects an array:

```json
[
  {
    "name": "Read chapter 4",
    "deadline": "2026-05-30",
    "status": "in_progress",
    "subject_id": 1
  }
]
```

Supported frontend status values are:

- `not_completed`
- `in_progress`
- `completed`

## Local Setup

### Requirements

- Go
- Bun

### 1. Start the Backend

```bash
cd backend
go run .
```

The API will be available at:

```text
http://localhost:8080
```

SQLite data is stored at `backend/data/studify.db`. The backend creates the
required tables on startup.

### 2. Configure the Frontend

Create `frontend/.env` from the example:

```bash
cd frontend
cp .env.example .env
```

Set the backend URL:

```env
VITE_API_BASE_URL=http://localhost:8080
```

The frontend calls the backend directly. If the browser blocks requests, enable
CORS in the Go backend for the frontend origin.

### 3. Start the Frontend

```bash
cd frontend
bun install
bun run dev
```

Vite will print the local URL, usually:

```text
http://localhost:5173
```