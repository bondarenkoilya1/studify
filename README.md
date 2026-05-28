# Studify

Studify is a focused study workspace for students who want their coursework to
feel organized instead of scattered across notebooks, chats, calendars, and
random task lists.

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
- View dashboard totals, completion percentage, nearest deadline, and overdue
  tasks.
- Use a calm, minimal React interface backed by a Go API.

The current version focuses on the most important loop first: organize subjects,
manage the tasks connected to them, and keep the main study metrics visible.

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
│   ├── handlers/      # HTTP handlers for subjects, tasks, and dashboard stats
│   ├── models/        # API/data models
│   └── main.go        # Router and server entrypoint
├── frontend/
│   ├── src/app/       # App routes and providers
│   ├── src/entities/  # Shared TypeScript entity types
│   ├── src/features/  # Feature APIs and UI forms
│   ├── src/pages/     # Home, tasks, and subjects pages
│   ├── src/shared/    # API client, config, helpers, UI
│   └── src/widgets/   # App layout
└── preview.png
```

## API Overview

The backend runs on port `8080` by default.

### Dashboard

```http
GET /dashboard
```

Dashboard JSON shape:

```json
{
  "total_subjects": 3,
  "total_tasks": 8,
  "total_completed_tasks": 2,
  "total_ongoing_tasks": 4,
  "total_not_completed_tasks": 2,
  "completion_percent": 25,
  "nearest_deadline_task": {
    "id": 5,
    "name": "Prepare lab report",
    "deadline": "2026-06-01",
    "status": "ongoing",
    "subject_id": 1
  },
  "overdue_tasks": []
}
```

If there is no upcoming unfinished task, `nearest_deadline_task` is `null`.

### Subjects

```http
GET    /subjects/
POST   /subjects/
DELETE /subjects/
GET    /subjects/{id}
PUT    /subjects/{id}
PATCH  /subjects/{id}
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

`PATCH /subjects/{id}` accepts a partial subject object. Send only the fields
that should change:

```json
{
  "lecturer": "Prof. Elena Petrova"
}
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
  "status": "ongoing",
  "subject_id": 1
}
```

`POST /tasks/` currently expects an array:

```json
[
  {
    "name": "Read chapter 4",
    "deadline": "2026-05-30",
    "status": "ongoing",
    "subject_id": 1
  }
]
```

Supported frontend status values are:

- `not_completed`
- `ongoing`
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

The frontend calls the backend directly. The Go backend is configured to allow
local Vite origins such as `http://localhost:5173`.

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
