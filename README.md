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

![Go](https://img.shields.io/badge/Go-1.26-00ADD8?style=for-the-badge&logo=go&logoColor=white) ![Chi](https://img.shields.io/badge/Chi-Router-111827?style=for-the-badge) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-pgx-4169E1?style=for-the-badge&logo=postgresql&logoColor=white) ![REST API](https://img.shields.io/badge/API-REST_JSON-16A34A?style=for-the-badge)

**Frontend**

![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=111827) ![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?style=for-the-badge&logo=typescript&logoColor=white) ![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white) ![Bun](https://img.shields.io/badge/Bun-runtime-000000?style=for-the-badge&logo=bun&logoColor=white) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white) ![TanStack Query](https://img.shields.io/badge/TanStack_Query-5-FF4154?style=for-the-badge&logo=reactquery&logoColor=white) ![React Router](https://img.shields.io/badge/React_Router-7-CA4245?style=for-the-badge&logo=reactrouter&logoColor=white) ![Oxc](https://img.shields.io/badge/Oxc-lint_%26_format-7C3AED?style=for-the-badge)

## Project Structure

```text
.
├── backend/
│   ├── cmd/api/            # Router and server entrypoint
│   ├── internal/database/  # PostgreSQL connection and query functions
│   ├── internal/handlers/  # HTTP handlers
│   ├── internal/models/    # API/data models
│   ├── internal/middlewares/
│   ├── migrations/         # SQL schema migrations
│   └── postman/            # REST client examples
├── frontend/
│   ├── src/app/       # App routes and providers
│   ├── src/entities/  # Shared TypeScript entity types
│   ├── src/features/  # Feature APIs and UI forms
│   ├── src/pages/     # Home, dashboard, tasks, subjects, and register pages
│   ├── src/shared/    # API client, config, helpers, UI
│   └── src/widgets/   # App layout
├── docker-compose.yaml
├── API.md
├── SETUP.md
└── preview.png
```

## API Overview

The backend exposes REST-style JSON routes for dashboard metrics, subjects,
tasks, users, and auth. The full route reference lives in
[API.md](./API.md).

Representative routes:

```http
GET   /api/dashboard
GET   /api/subjects/
POST  /api/subjects/
PATCH /api/subjects/{id}
GET   /api/tasks/
POST  /api/tasks/
PATCH /api/tasks/{id}
POST  /api/auth/register
POST  /api/auth/login
POST  /api/auth/refresh
PATCH /api/users/{username}
```

Example task payload:

```json
{
  "name": "Read chapter 4",
  "description": "Summarize the main definitions.",
  "deadline": "2026-05-30T00:00:00Z",
  "status": "ongoing",
  "subject_id": 1
}
```

Example partial update:

```json
{
  "status": "completed"
}
```

Runnable request examples are in `backend/postman/`.

## Setup

Install, database, and local run instructions live in [SETUP.md](./SETUP.md).
