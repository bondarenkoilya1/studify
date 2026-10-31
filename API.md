# API reference

The default base URL is `http://localhost:8080`. API routes use the `/api`
prefix. Request and response bodies are JSON unless stated otherwise.

The full contract is `backend/docs/openapi.yaml`. Swagger UI serves it at
`http://localhost:8081` when the Docker stack is running.

## Conventions

- Routes with a JSON body require `Content-Type: application/json`, otherwise
  they return `415 Unsupported Media Type`.
- Errors are returned as plain text, for example `invalid email or password`.
- Timestamps are RFC3339 strings, for example `2026-07-20T09:00:00Z`.
- `{id}` path parameters must be integers, otherwise `400 Bad Request`.
- Users only see and change their own subjects and tasks. Another user's
  record returns `404 Not Found`.

## Authentication

Login and registration set two HttpOnly cookies:

| Cookie | Lifetime | Purpose |
| --- | --- | --- |
| `access_token` | 15 minutes | Sent with every protected request |
| `refresh_token` | 30 days | Used by `POST /api/auth/refresh` |

Both cookies use `Path=/` and `SameSite=Lax`. They also use `Secure` when `ENV`
is `prod` or `production`. Browser clients must send requests with credentials
(`fetch(..., { credentials: "include" })`).

Every route except register, login, login/totp, refresh, logout, the
reset-password routes, and `/metrics` requires a valid `access_token` cookie.
A missing or invalid token returns `401 Unauthorized`.

### Auth routes

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | – | Create a user, set cookies, send a confirmation email |
| `POST` | `/api/auth/login` | – | Log in, or start a TOTP login |
| `POST` | `/api/auth/login/totp` | – | Finish a TOTP login |
| `POST` | `/api/auth/refresh` | refresh cookie | Rotate both cookies |
| `POST` | `/api/auth/logout` | – | Revoke the refresh token and clear cookies |
| `POST` | `/api/auth/logout-all` | ✓ | Revoke all active sessions and clear cookies |
| `POST` | `/api/auth/confirm/resend` | ✓ | Send a new confirmation email |
| `POST` | `/api/auth/confirm/` | ✓ | Confirm the email address with a token body |

### Register

```http
POST /api/auth/register
```

```json
{
  "email": "student@example.com",
  "password": "strongPassword123"
}
```

The email must be a plain address of at most 254 characters. The password must
be 8–72 characters.

Success: `201 Created`, auth cookies, and the user:

```json
{
  "id": 1,
  "email": "student@example.com",
  "is_email_verified": false,
  "is_totp_enabled": false,
  "avatar_url": null
}
```

An existing email returns `409 Conflict`. The confirmation email contains the
link `{APP_URL}/confirm/{token}`, and the token is valid for 4 hours. In Docker
the email is caught by Mailpit at `http://localhost:8025`.

### Login

```http
POST /api/auth/login
```

The body has the same shape as registration. Wrong credentials return
`401 Unauthorized`.

- **TOTP disabled:** `200 OK`, auth cookies, and the user object.
- **TOTP enabled:** `200 OK` without cookies and with a challenge token that is
  valid for 2 minutes:

```json
{
  "challenge_token": "Xk3pN8vQ2mR7tY1wZ5cB9dF4gH6jL0sA2eU8iO3qT7y"
}
```

Finish the login with the code from the authenticator app:

```http
POST /api/auth/login/totp
```

```json
{
  "challenge_token": "Xk3pN8vQ2mR7tY1wZ5cB9dF4gH6jL0sA2eU8iO3qT7y",
  "code": "123456"
}
```

Success: `200 OK`, auth cookies, and the user object. An invalid or expired
challenge token returns `401`, and a wrong code returns `400`.

### Refresh and logout

`POST /api/auth/refresh` reads the `refresh_token` cookie, revokes it, and sets
new cookies. Success: `204 No Content`. On any refresh-token problem it clears
both cookies and returns `401`.

`POST /api/auth/logout` revokes the refresh token when the cookie is present,
clears both cookies, and returns `204 No Content`.

`POST /api/auth/logout-all` revokes all active refresh tokens for the authenticated
user, clears both cookies, and returns `204 No Content`.

### Email confirmation

`POST /api/auth/confirm/` marks the email as verified and returns
`204 No Content`. It requires the user to be logged in and takes `{ "confirm_email_token": "..." }` in the JSON body. An invalid or expired
token returns `400`.

`POST /api/auth/confirm/resend` sends a new link and returns `204 No Content`.

Changing the email through `PATCH /api/users/me/email` resets
`is_email_verified` to `false` and sends a new link.

## Two-factor authentication (TOTP)

All TOTP routes require authentication.

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/auth/totp/setup` | Generate a secret and QR code |
| `POST` | `/api/auth/totp/setup/confirm` | Confirm with a code and enable TOTP |
| `DELETE` | `/api/auth/totp` | Disable TOTP |

`POST /api/auth/totp/setup` returns a base64 PNG and the secret for manual
entry. TOTP is not enabled yet, and calling setup again replaces the secret.

```json
{
  "qr_code": "iVBORw0KGgoAAAANSUhEUgAA...",
  "text_key": "JBSWY3DPEHPK3PXP"
}
```

`POST /api/auth/totp/setup/confirm` enables TOTP when the code is valid:

```json
{
  "passcode": "123456"
}
```

Success: `200 OK` with 10 recovery codes, which are shown only once. A wrong
code returns `400`.

```json
{
  "codes": ["ABCD-EFGH-JK23", "MNPQ-RSTU-VW45"]
}
```

The API does not have an endpoint that accepts recovery codes yet.

`DELETE /api/auth/totp` disables TOTP and returns `204 No Content`.

## Password reset

These routes do not require authentication.

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/auth/reset-password/request` | Email a reset link |
| `POST` | `/api/auth/reset-password/verify` | Check that a token is valid |
| `POST` | `/api/auth/reset-password` | Set a new password |

1. Request a link. An unknown email returns `404`, otherwise `204 No Content`.
   The email links to `{APP_URL}/reset-password?token={token}`, and the token is
   valid for 30 minutes.

   ```json
   { "email": "student@example.com" }
   ```

2. Optionally verify the token. Success is `200 OK` with an empty body. An
   invalid or expired token returns `422`.

   ```json
   { "password_reset_token": "q8Zr3k1V0p9xWm2Lc7NfYt4Hb6Ds5Ja0Ue8Gi1Ko3Rw" }
   ```

3. Set the new password. Success: `204 No Content`. Mismatched passwords, an
   invalid password, or a bad token return `400`.

   ```json
   {
     "password_reset_token": "q8Zr3k1V0p9xWm2Lc7NfYt4Hb6Ds5Ja0Ue8Gi1Ko3Rw",
     "new_password": "newStrongPassword123",
     "new_password_confirmed": "newStrongPassword123"
   }
   ```

## Current user

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/users/me` | Get the current user |
| `PATCH` | `/api/users/me/email` | Change the email |
| `PATCH` | `/api/users/me/password` | Change the password |
| `POST` | `/api/users/me/avatar` | Upload an avatar |
| `DELETE` | `/api/users/me/avatar` | Remove the avatar |

`GET /api/users/me` returns the user object shown under [Register](#register).

Change the email. Success: `200 OK` with the user. The new email must differ
from the current one.

```json
{ "new_email": "new_student@example.com" }
```

The response has `is_totp_enabled: false` and `avatar_url: null` even when the
stored values differ. Call `GET /api/users/me` for the full profile. The new
email is not format-validated, and an email that is already taken returns
`500`.

Change the password. Success: `204 No Content`. A wrong current password
returns `401`. A new password that is invalid or equal to the current one
returns `400`.

```json
{
  "current_password": "strongPassword123",
  "new_password": "newStrongPassword123"
}
```

Upload an avatar by sending the raw image bytes as the request body, not as
multipart:

```http
POST /api/users/me/avatar
Content-Type: image/png
```

PNG, JPEG, and WebP are accepted, up to 2 MB and 2560×2560 px. The image is
stored as WebP:

```json
{ "avatar_url": "/static/users/26c15f91-1756-4be7-b4b5-4ea6732dbe11.webp" }
```

A file over 2 MB returns `413` and an unsupported format returns `415`.
Undecodable or oversized images return `400`.

`DELETE /api/users/me/avatar` sets `avatar_url` to `null` and returns
`204 No Content`.

## Dashboard

```http
GET /api/dashboard
```

```json
{
  "total_subjects": 2,
  "total_tasks": 8,
  "total_completed_tasks": 3,
  "total_ongoing_tasks": 2,
  "total_not_completed_tasks": 3,
  "completion_percent": 37.5,
  "nearest_deadline_task": {
    "id": 3,
    "subject_id": 1,
    "name": "Prepare report",
    "description": "Add charts",
    "deadline": "2026-07-10T12:00:00Z",
    "status": "ongoing"
  },
  "overdue_tasks": []
}
```

- `completion_percent` is rounded to two decimals, and is `0` with no tasks.
- `nearest_deadline_task` is the unfinished task with the closest future
  deadline, or `null`.
- `overdue_tasks` holds unfinished tasks whose deadline has passed, latest
  deadline first.
- Dashboard tasks only fill `id`, `subject_id`, `name`, `description`,
  `deadline`, and `status`. The other task fields are still present with zero
  values (`""`, `null`, `0001-01-01T00:00:00Z`). The example above leaves them
  out.

## Subjects

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/subjects` | List subjects, ordered by ID |
| `POST` | `/api/subjects` | Create one subject |
| `DELETE` | `/api/subjects` | Delete all subjects with their tasks |
| `GET` | `/api/subjects/{id}` | Get one subject, including files |
| `PUT` | `/api/subjects/{id}` | Replace a subject |
| `PATCH` | `/api/subjects/{id}` | Update the provided fields |
| `DELETE` | `/api/subjects/{id}` | Delete a subject with its tasks |
| `GET` | `/api/subjects/{id}/tasks` | List the subject's tasks |
| `POST` | `/api/subjects/{id}/thumbnail` | Upload a thumbnail image |
| `POST` | `/api/subjects/{id}/file` | Attach a PDF or text file |

Subject response:

```json
{
  "id": 1,
  "user_id": 1,
  "name": "Databases",
  "note": "Intro to SQL",
  "type": "university",
  "scope": "technology",
  "exam_type": "exam",
  "exam_date": "2026-07-20T09:00:00Z",
  "course": 2,
  "term": 1,
  "lecturers": [{ "name": "Dr. Smith", "position": "lecturer" }],
  "thumbnail_url": "/static/thumbnails/1d9c94a6-8f8a-45ad-a0ec-692123f8c7dd.webp",
  "files": [
    {
      "name": "lecture-1.pdf",
      "url": "/static/files/9b1e6f2a-0c3d-4e5f-8a7b-6c5d4e3f2a1b.pdf",
      "size_bytes": "182734",
      "content_type": "application/pdf"
    }
  ]
}
```

| Field | Values |
| --- | --- |
| `name` | Required, unique per user (`409 Conflict` on a duplicate) |
| `note` | Up to 200 characters, or `null` |
| `type` | `university` (default), `personal` |
| `scope` | `technology`, `healthcare`, `humanities`, `business`, `social`, `science`, `other` (default) |
| `exam_type` | `exam` (default), `credit`, `coursework`, `project`, `other` |
| `course` | 1–6 or `null` |
| `term` | 1–4 or `null` |
| `lecturers[].position` | `lecturer`, `practical_instructor`, `lab_instructor`, `assistant` |

`lecturers` and `files` are `null` when empty. `files` is only filled by
`GET /api/subjects/{id}`, so it is always `null` in the list and create
responses. `size_bytes` is a string.

### Create, replace, update

`POST /api/subjects` takes all fields except `id`, `user_id`, and `files`, and
returns `201 Created`. Only `name` is required. Each lecturer needs a valid
`position`, otherwise the API returns `500`.

```json
{
  "name": "Databases",
  "type": "university",
  "scope": "technology",
  "exam_type": "exam",
  "exam_date": "2026-07-20T09:00:00Z",
  "course": 2,
  "term": 1,
  "lecturers": [{ "name": "Dr. Smith", "position": "lecturer" }]
}
```

`PUT /api/subjects/{id}` takes the same body and clears omitted optional fields.

`PATCH /api/subjects/{id}` changes only the fields it receives. `null` cannot
clear a field.

Lecturers can only be set on create. `PUT` and `PATCH` ignore `lecturers`.

### Thumbnail

Send the raw image bytes as the body, as for the user avatar. The limits and
errors are the same: PNG, JPEG, or WebP, up to 2 MB and 2560×2560 px.

```json
{ "thumbnail_url": "/static/thumbnails/26c15f91-1756-4be7-b4b5-4ea6732dbe11.webp" }
```

### Files

Send `multipart/form-data` with the file in the `file` field. PDF and plain
text up to 50 MB are accepted.

```bash
curl -b cookies.txt -F "file=@lecture-1.pdf" http://localhost:8080/api/subjects/1/file
```

```json
{ "file_url": "/static/files/26c15f91-1756-4be7-b4b5-4ea6732dbe11.pdf" }
```

A missing `file` field returns `400`. An unsupported type, a file over 50 MB,
or an unknown subject currently return `500`.

## Tasks

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/tasks` | List all tasks, newest first |
| `POST` | `/api/tasks` | Create one task |
| `DELETE` | `/api/tasks` | Delete all tasks |
| `GET` | `/api/tasks/{id}` | Get one task |
| `PUT` | `/api/tasks/{id}` | Replace a task |
| `PATCH` | `/api/tasks/{id}` | Update the provided fields |
| `DELETE` | `/api/tasks/{id}` | Delete a task |

Task response:

```json
{
  "id": 10,
  "subject_id": 1,
  "name": "Read chapter 4",
  "type": "coursework",
  "description": "Write a short summary",
  "estimated_time": 90,
  "scheduled_at": "2026-07-08T12:00:00Z",
  "deadline": "2026-07-10T12:00:00Z",
  "status": "ongoing",
  "difficulty": "medium",
  "priority": "high",
  "created_at": "2026-07-01T12:00:00Z",
  "updated_at": "2026-07-02T09:00:00Z"
}
```

| Field | Values |
| --- | --- |
| `subject_id` | One of the user's subjects |
| `type` | `exam`, `credit`, `coursework`, `project`, `other` |
| `status` | `not_completed`, `ongoing`, `completed` |
| `difficulty`, `priority` | `low`, `medium`, `high` |
| `estimated_time` | Positive integer or `null` |
| `scheduled_at`, `deadline` | Timestamp or `null` |

`POST /api/tasks` returns `201 Created`, and `PUT /api/tasks/{id}` returns
`200 OK`. Both take the task fields without `id`, `created_at`, and
`updated_at`. The backend applies no defaults, so `type`, `status`,
`difficulty`, and `priority` must be sent. Missing or invalid values return
`500`. A subject that does not belong to the user returns `404`.

`PATCH /api/tasks/{id}` changes only the fields it receives. Values are not
validated, and an invalid one returns `500`.

## Shared projects

All shared projects routes require authentication via `access_token` cookie.

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/api/shared-projects` | ✓ | List shared projects of the authenticated user, newest first |
| `POST` | `/api/shared-projects` | ✓ | Create a new shared project |
| `GET` | `/api/shared-projects/{id}` | ✓ | Get a shared project by ID |
| `PUT` | `/api/shared-projects/{id}` | ✓ | Update an existing shared project owned by the user |
| `DELETE` | `/api/shared-projects/{id}` | ✓ | Delete a shared project owned by the user |

Shared project response:

```json
{
  "id": 1,
  "user_id": 1,
  "name": "Distributed Systems Notes",
  "url": "https://github.com/studify-community/distributed-systems",
  "author": "Alex River",
  "author_avatar_url": "https://avatars.githubusercontent.com/u/1234567"
}
```

| Field | Values |
| --- | --- |
| `id` | Positive integer identifier |
| `user_id` | ID of the user who owns the project |
| `name` | Required, non-empty string |
| `url` | Required, valid HTTP/HTTPS URL, unique across all shared projects (`409 Conflict` on duplicate) |
| `author` | Required, non-empty string |
| `author_avatar_url` | String (can be empty) |

### Create and update

`POST /api/shared-projects` creates a shared project for the authenticated user and returns `201 Created`:

```json
{
  "name": "Distributed Systems Notes",
  "url": "https://github.com/studify-community/distributed-systems",
  "author": "Alex River",
  "author_avatar_url": "https://avatars.githubusercontent.com/u/1234567"
}
```

- If `name` or `author` is empty, or `url` is not a valid HTTP/HTTPS URL, returns `400 Bad Request`.
- If a project with this `url` already exists, returns `409 Conflict`.

`PUT /api/shared-projects/{id}` updates an existing shared project owned by the authenticated user and returns `200 OK`. The request body has the same shape as create.
- Modifying another user's project returns `404 Not Found`.

### Get and delete

- `GET /api/shared-projects` returns `200 OK` with an array of all shared projects owned by the authenticated user, ordered by ID descending.
- `GET /api/shared-projects/{id}` returns `200 OK` with the shared project by its ID. An unknown ID returns `404 Not Found`.
- `DELETE /api/shared-projects/{id}` deletes the project owned by the authenticated user and returns `204 No Content`. Deleting a non-existent or another user's project returns `404 Not Found`.

## Files and monitoring

`GET /static/{path}` serves uploaded files, for example
`/static/users/{file}.webp`. It requires authentication but does not check
ownership.

`GET /metrics` exposes Prometheus metrics without authentication.

## Request examples

Runnable JetBrains HTTP Client requests are in `backend/postman/`.
