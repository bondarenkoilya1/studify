# API Reference

The backend runs on port `8080` by default.

```txt
http://localhost:8080
```

JSON API routes are served under `/api`. Routes that create or change resources
require `Content-Type: application/json`. Static files are served from
`/static/lecturer-avatars/*`.

Date/time fields use RFC3339 timestamps, for example
`2026-06-10T00:00:00Z`. Nullable date/time fields are returned as `null` when
unset.

## Dashboard

### `GET /api/dashboard`

Returns aggregate study metrics.

Response:

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
    "description": "Finish graphs and notes.",
    "deadline": "2026-06-01T00:00:00Z",
    "status": "ongoing",
    "subject_id": 1
  },
  "overdue_tasks": []
}
```

If there is no upcoming unfinished task, `nearest_deadline_task` is `null`.

## Subjects

Subject shape:

```json
{
  "id": 1,
  "name": "Databases",
  "lecturer": "Dr. Smith",
  "lecturer_avatar_url": "/static/lecturer-avatars/example.webp",
  "exam_date": "2026-06-10T00:00:00Z"
}
```

### `GET /api/subjects/`

Returns all subjects.

### `POST /api/subjects/`

Creates one or more subjects. The request body is an array.

Request:

```json
[
  {
    "name": "Databases",
    "lecturer": "Dr. Smith",
    "lecturer_avatar_url": "",
    "exam_date": "2026-06-10T00:00:00Z"
  }
]
```

### `DELETE /api/subjects/`

Deletes all subjects. Related tasks are deleted first by the backend.

### `GET /api/subjects/{id}`

Returns one subject by numeric ID.

### `PUT /api/subjects/{id}`

Replaces a subject.

Request:

```json
{
  "name": "Advanced Databases",
  "lecturer": "Dr. Smith",
  "exam_date": "2026-06-12T00:00:00Z"
}
```

### `PATCH /api/subjects/{id}`

Updates only the provided subject fields.

Request:

```json
{
  "lecturer": "Prof. Elena Petrova"
}
```

Supported fields:

- `name`
- `lecturer`
- `exam_date`

### `DELETE /api/subjects/{id}`

Deletes one subject by numeric ID. Related tasks are deleted first by the
backend.

### `POST /api/subjects/avatar/`

Uploads a lecturer avatar image and stores it as WebP.

Headers:

```http
Content-Type: image/png
```

Supported image formats:

- `png`
- `jpeg`
- `webp`

Response:

```json
{
  "lecturer_avatar_url": "/static/lecturer-avatars/uuid.webp"
}
```

## Tasks

Task shape:

```json
{
  "id": 1,
  "name": "Read chapter 4",
  "description": "Summarize the main definitions.",
  "deadline": "2026-05-30T00:00:00Z",
  "status": "ongoing",
  "subject_id": 1
}
```

Supported frontend status values:

- `not_completed`
- `ongoing`
- `completed`

### `GET /api/tasks/`

Returns all tasks.

### `POST /api/tasks/`

Creates one or more tasks. The request body is an array.

Request:

```json
[
  {
    "name": "Read chapter 4",
    "description": "Summarize the main definitions.",
    "deadline": "2026-05-30T00:00:00Z",
    "status": "ongoing",
    "subject_id": 1
  }
]
```

### `DELETE /api/tasks/`

Deletes all tasks.

### `GET /api/tasks/{id}`

Returns one task by numeric ID.

### `PUT /api/tasks/{id}`

Replaces a task.

Request:

```json
{
  "name": "Read chapters 4-6",
  "description": "Expanded reading scope before exam week.",
  "deadline": "2026-06-04T00:00:00Z",
  "status": "ongoing",
  "subject_id": 1
}
```

### `PATCH /api/tasks/{id}`

Updates only the provided task fields.

Request:

```json
{
  "status": "completed"
}
```

Supported fields:

- `name`
- `description`
- `deadline`
- `status`
- `subject_id`

### `DELETE /api/tasks/{id}`

Deletes one task by numeric ID.

## Users And Auth

User response shape:

```json
{
  "id": 1,
  "username": "student"
}
```

Passwords are accepted in request bodies but are never returned by the API.

### `POST /api/auth/register`

Registers a user.

Request:

```json
{
  "username": "student",
  "password": "secret"
}
```

### `POST /api/auth/login`

Checks a username and password.

Request:

```json
{
  "username": "student",
  "password": "secret"
}
```

Success response: `200 OK` with an empty body.

### `POST /api/auth/refresh`

Rotates the refresh token cookie and issues new access and refresh cookies.

Success response: `204 No Content`.

### `POST /api/logout`

Logs out the current user.

Success response: `204 No Content`.

### `GET /api/users/`

Returns all users.

### `DELETE /api/users/`

Deletes all users.

### `PUT /api/users/{username}`

Replaces a user identified by username. Both `username` and `password` are
required.

Request:

```json
{
  "username": "updated_student",
  "password": "new_secret"
}
```

### `PATCH /api/users/{username}`

Updates only the provided user fields.

Request:

```json
{
  "password": "new_secret"
}
```

Supported fields:

- `username`
- `password`

### `DELETE /api/users/{username}`

Deletes one user by username.

## REST Client Examples

Runnable request examples live in `backend/postman/`:

- `dashboard.http`
- `subjects.http`
- `tasks.http`
- `auth.http`
- `users.http`

## Static Files

### `GET /static/lecturer-avatars/{file}`

Serves uploaded lecturer avatar files.
