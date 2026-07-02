# API reference

The default base URL is `http://localhost:8080`. API routes use the `/api`
prefix. Request and response bodies are JSON unless stated otherwise.

## Authentication

`POST /api/auth/register` and `POST /api/auth/login` issue `access_token` and
`refresh_token` HttpOnly cookies. Send cookies on subsequent requests. All API
routes except register, login, and refresh require a valid access-token cookie.

The access token is valid for 15 minutes. The refresh token is valid for 30
days. `POST /api/auth/refresh` rotates both cookies. In production mode cookies
also use the `Secure` attribute.

Routes with a JSON request body require:

```http
Content-Type: application/json
```

Missing or invalid authentication returns `401 Unauthorized`. An unsupported
content type returns `415 Unsupported Media Type`. Handler validation errors
are returned as plain-text error bodies.

### Register

```http
POST /api/auth/register
```

```json
{
  "username": "student",
  "password": "strong password"
}
```

Usernames are 3–32 characters and may contain English letters, digits, dots,
and underscores. They cannot start or end with a dot or contain consecutive
dots. Registration passwords are 8–72 bytes.

Success: `201 Created` with the created user:

```json
{
  "id": 1,
  "username": "student"
}
```

### Login

```http
POST /api/auth/login
```

The request has the same shape as registration. Success: `200 OK` with an empty
body and new auth cookies.

### Refresh

```http
POST /api/auth/refresh
```

Requires the refresh-token cookie. Success: `204 No Content` and rotated auth
cookies.

### Logout

```http
POST /api/logout
```

Requires authentication. Revokes the current refresh token when the cookie is
available, clears both cookies, and returns `204 No Content`.

## Dashboard

```http
GET /api/dashboard
```

Returns statistics for the authenticated user:

```json
{
  "total_subjects": 2,
  "total_tasks": 4,
  "total_completed_tasks": 1,
  "total_ongoing_tasks": 2,
  "total_not_completed_tasks": 1,
  "completion_percent": 25,
  "nearest_deadline_task": {
    "id": 3,
    "name": "Prepare report",
    "description": "Add charts",
    "subject_id": 1,
    "deadline": "2026-07-10T12:00:00Z",
    "status": "ongoing"
  },
  "overdue_tasks": []
}
```

`nearest_deadline_task` is `null` when no unfinished future task exists.

## Subjects

Subject response:

```json
{
  "id": 1,
  "user_id": 1,
  "name": "Databases",
  "lecturer": "Dr. Smith",
  "lecturer_avatar_url": "/static/lecturer-avatars/file.webp",
  "exam_date": "2026-07-20T09:00:00Z"
}
```

`exam_date` is an RFC3339 timestamp or `null`.

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/subjects/` | List the current user's subjects |
| `POST` | `/api/subjects/` | Create subjects from a JSON array |
| `DELETE` | `/api/subjects/` | Delete all current user's subjects and their tasks |
| `GET` | `/api/subjects/{id}` | Get one subject |
| `PUT` | `/api/subjects/{id}` | Replace one subject |
| `PATCH` | `/api/subjects/{id}` | Update provided fields |
| `DELETE` | `/api/subjects/{id}` | Delete one subject and its tasks |
| `POST` | `/api/subjects/avatar/` | Upload a lecturer avatar |

Create request:

```json
[
  {
    "name": "Databases",
    "lecturer": "Dr. Smith",
    "lecturer_avatar_url": "",
    "exam_date": "2026-07-20T09:00:00Z"
  }
]
```

`PATCH` accepts `name`, `lecturer`, and `exam_date`. `PUT` uses the complete
subject representation accepted by the handler.

Avatar upload sends raw PNG, JPEG, or WebP bytes with the matching image content
type, for example:

```http
Content-Type: image/png
```

Success returns:

```json
{
  "lecturer_avatar_url": "/static/lecturer-avatars/generated-file.webp"
}
```

Uploaded files are publicly served by:

```http
GET /static/lecturer-avatars/{file}
```

## Tasks

Task response:

```json
{
  "id": 1,
  "name": "Read chapter 4",
  "description": "Write a summary",
  "subject_id": 1,
  "deadline": "2026-07-10T12:00:00Z",
  "status": "ongoing"
}
```

`deadline` is an RFC3339 timestamp or `null`. Supported statuses are
`not_completed`, `ongoing`, and `completed`.

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/tasks/` | List the current user's tasks |
| `POST` | `/api/tasks/` | Create tasks from a JSON array |
| `DELETE` | `/api/tasks/` | Delete all current user's tasks |
| `GET` | `/api/tasks/{id}` | Get one task |
| `PUT` | `/api/tasks/{id}` | Replace one task |
| `PATCH` | `/api/tasks/{id}` | Update provided fields |
| `DELETE` | `/api/tasks/{id}` | Delete one task |

Create request:

```json
[
  {
    "name": "Read chapter 4",
    "description": "Write a summary",
    "subject_id": 1,
    "deadline": "2026-07-10T12:00:00Z",
    "status": "ongoing"
  }
]
```

`PATCH` accepts `name`, `description`, `subject_id`, `deadline`, and `status`.

## Users

User response:

```json
{
  "id": 1,
  "username": "student"
}
```

Passwords are accepted in write requests but never returned.

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/users/` | List users |
| `DELETE` | `/api/users/` | Delete all users |
| `PUT` | `/api/users/{username}` | Replace username and password |
| `PATCH` | `/api/users/{username}` | Update username and/or password |
| `DELETE` | `/api/users/{username}` | Delete a user |

Replace request:

```json
{
  "username": "updated_student",
  "password": "new strong password"
}
```

Partial update:

```json
{
  "password": "another strong password"
}
```

These routes require authentication, but the current backend does not implement
roles or restrict user-management operations to the authenticated account.
They must not be exposed as an administrative API without additional
authorization.

## Request examples

Runnable JetBrains HTTP Client requests are in `backend/postman/`.
