# API reference

The default base URL is `http://localhost:8080`. API routes use the `/api`
prefix. Successful responses with a body are JSON unless stated otherwise.

The full contract is `backend/docs/openapi.yaml`. Swagger UI serves it at
`http://localhost:8081` when the Docker stack is running.

## Conventions

- Routes with a JSON body require `Content-Type: application/json`, otherwise
  they return `415 Unsupported Media Type`.
- JSON request bodies are limited to 1 MiB. Larger bodies return `413`.
- Application errors include a stable `code` and a human-readable `message`,
  for example `{"code":"invalid_credentials","message":"invalid email or password"}`.
  Branch on the code or HTTP status in clients.
- Unknown fields in JSON request objects return `400` with `unknown_field`.
  Invalid JSON or a body other than an object returns `400` with `invalid_json`.
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

Protected routes require a valid `access_token` cookie.
A missing or invalid token returns `401 Unauthorized`.

### Auth routes

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/api/auth/session` | optional cookies | Check the browser session |
| `POST` | `/api/auth/register` | – | Create a user, set cookies, queue a confirmation email |
| `POST` | `/api/auth/login` | – | Log in, or start a TOTP login |
| `POST` | `/api/auth/login/totp` | – | Finish two-factor sign-in |
| `POST` | `/api/auth/refresh` | refresh cookie | Rotate both cookies |
| `POST` | `/api/auth/logout` | – | Revoke the current session and clear cookies |
| `POST` | `/api/auth/logout-all` | ✓ | Revoke all active sessions and clear cookies |
| `POST` | `/api/auth/confirm/resend` | ✓ | Queue a new confirmation email |
| `POST` | `/api/auth/confirm/` | ✓ | Confirm the email address with a token body |
| `GET` | `/api/auth/sessions` | ✓ | List active user sessions |
| `DELETE` | `/api/auth/sessions` | ✓ | Revoke all active sessions |
| `GET` | `/api/auth/sessions/{id}` | ✓ | Get a session by ID |
| `DELETE` | `/api/auth/sessions/{id}` | ✓ | Revoke a session by ID |

### Request limits

Authentication routes return `429 Too Many Requests` with a `Retry-After`
header in seconds once a limit is reached. Limits apply per API process.
Limits by client IP and by account, email, or challenge apply independently.

| Operation | Limit by IP | Additional limit |
| --- | --- | --- |
| Sign-in | 30 per minute | 10 per minute per email |
| TOTP sign-in | 30 per minute | 5 per 2 minutes per challenge |
| Registration | 8 per 15 minutes | 3 per 15 minutes per email |
| Request a password reset | 10 per 15 minutes | 3 per 15 minutes per email |
| Verify or complete a password reset | 30 combined per 5 minutes | — |
| Resend email confirmation | 10 per 15 minutes | 3 per 15 minutes per account |
| Change email or disable TOTP | — | 5 per minute per account, separately for each operation |

Sign-in returns the same `401` response for an unknown email and a wrong
password.

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
be at least 8 characters when registering and at most 72 UTF-8 bytes.

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

New email addresses are stored in lowercase. An existing email returns `409`
regardless of letter case. Sign-in and password reset look up a unique address
without regard to case. If legacy accounts share the same normalized address,
use the exact address stored for the account.

Confirmation links use `{APP_URL}/confirm?token=...` and are valid for four
hours. If mail delivery fails, registration still returns `201` and sets the
auth cookies. Request a new confirmation link from the profile. Docker
captures mail in Mailpit at `http://localhost:8025`.

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
  "challenge_token": "<challenge_token>"
}
```

Finish sign-in with the code from the authenticator app or a saved recovery code:

```http
POST /api/auth/login/totp
```

```json
{
  "challenge_token": "<challenge_token>",
  "code": "123456"
}
```

Success: `200 OK`, auth cookies, and the user object. An invalid or expired
challenge or code returns `401`. A recovery code is consumed only when sign-in succeeds.

### Refresh and logout

`GET /api/auth/session` returns `200` with `{"authenticated": false}` for a guest,
or `{"authenticated": true, "user": {...}}` for a signed-in browser. An expired
access cookie can be replaced if the refresh cookie is valid. If a concurrent
request rotated the refresh cookie first, retry the `409` response with the
browser's current cookies.

`POST /api/auth/refresh` rotates the refresh token and sets new cookies for the
same session. Success: `204 No Content`. Invalid tokens return `401`. If another
request already rotated the token, `401` leaves the replacement cookies intact.

`POST /api/auth/logout` uses the refresh cookie to revoke the current session
and its tokens, clears both cookies, and returns `204 No Content`.

`POST /api/auth/logout-all` revokes all sessions and their tokens for the
authenticated user, clears both cookies, and returns `204 No Content`.

### Email confirmation

`POST /api/auth/confirm/` marks the email as verified and returns
`204 No Content`. It requires the user to be logged in and takes `{ "confirm_email_token": "..." }` in the JSON body. An invalid or expired
token returns `400`.

`POST /api/auth/confirm/resend` sends a new link and returns `204 No Content`.
An already verified address returns `409`. Requests within the cooldown
return `429` with `Retry-After`.

Changing the email through `PATCH /api/users/me/email` resets
`is_email_verified` to `false` and sends a new link.

## Two-factor authentication (TOTP)

The TOTP settings routes below require authentication. Starting and confirming
TOTP setup also require a verified email. An unverified account receives `403`.

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/auth/totp/setup` | Generate a secret and QR code |
| `POST` | `/api/auth/totp/setup/confirm` | Confirm with a code and enable TOTP |
| `POST` | `/api/auth/totp/recovery-codes` | Replace recovery codes using a current authenticator code |
| `DELETE` | `/api/auth/totp` | Disable TOTP |

`POST /api/auth/totp/setup` returns a base64 PNG and the secret for manual
entry. Setup can replace a pending secret. Once TOTP is enabled, setup and
setup confirmation return `409`.

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

Pass a saved recovery code as `code` to `POST /api/auth/login/totp`.

To replace your recovery codes, send a current authenticator code as
`passcode` to `POST /api/auth/totp/recovery-codes` while signed in. This
replaces the entire set. Codes issued before migration 000012 require
replacement through this endpoint.

Send the current password as JSON with `DELETE /api/auth/totp`. A wrong
password returns `403`. Success returns `204 No Content` and invalidates
recovery codes and pending sign-in challenges.

```json
{ "current_password": "strongPassword123" }
```

## Password reset

These routes do not require authentication.

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/auth/reset-password/request` | Email a reset link |
| `POST` | `/api/auth/reset-password/verify` | Check that a token is valid |
| `POST` | `/api/auth/reset-password` | Set a new password |

1. Request a link. The endpoint returns `204 No Content` both for a known email
   after queuing the link and for an unknown address.
   The email links to `{APP_URL}/reset-password?token={token}`, and the token is
   valid for 30 minutes.

   ```json
   { "email": "student@example.com" }
   ```

2. Optionally verify the token. Success is `200 OK` with an empty body. An
   invalid or expired token returns `422`.

   ```json
   { "password_reset_token": "<password_reset_token>" }
   ```

3. Set the new password. Success: `204 No Content`. This uses up the reset
   link and signs the account out on all devices. Missing tokens, mismatched
   passwords, and invalid passwords return `400`. Invalid, expired, or used
   links return `422`.

   ```json
   {
     "password_reset_token": "<password_reset_token>",
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

Changing the email requires a verified current address and the current password.
Either missing verification or a wrong password returns `403`. An invalid or
unchanged address returns `400`, and an address in use returns `409`.

```json
{ "new_email": "new_student@example.com", "current_password": "strongPassword123" }
```

Success returns `200 OK` with the updated profile. The new address needs to
be confirmed. Earlier confirmation and password reset links expire. Use
`POST /api/auth/confirm/resend` if the message does not arrive.

Change the password. Success: `204 No Content`. The server revokes all sessions
and clears the current browser's auth cookies. A wrong current password returns
`403`. An invalid or unchanged new password returns `400`.

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

## Sessions

All session routes require authentication via `access_token` cookie.

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/api/auth/sessions` | ✓ | List all active sessions of the authenticated user, newest first |
| `DELETE` | `/api/auth/sessions` | ✓ | Revoke all active sessions of the authenticated user |
| `GET` | `/api/auth/sessions/{id}` | ✓ | Get a specific session of the authenticated user by ID |
| `DELETE` | `/api/auth/sessions/{id}` | ✓ | Revoke a specific session of the authenticated user by ID |

Session response:

```json
{
  "id": 1,
  "user_id": 1,
  "os": "macOS",
  "browser": "Chrome",
  "device": "Computer",
  "country": "127.0.0.1",
  "last_login": "2026-11-02T19:50:00Z",
  "is_current": true
}
```

| Field | Values |
| --- | --- |
| `id` | Positive integer identifier |
| `user_id` | ID of the authenticated user |
| `os` | Operating system identified from User-Agent |
| `browser` | Browser name identified from User-Agent |
| `device` | Device type identified from User-Agent |
| `country` | IP address or country of the client |
| `last_login` | RFC3339 timestamp of the last sign-in or token refresh |
| `is_current` | Whether the request used this session's access token |

### List and get

- `GET /api/auth/sessions` returns `200 OK` with an array of active sessions belonging to the authenticated user, ordered by `last_login` descending.
- `GET /api/auth/sessions/{id}` returns `200 OK` with a single session by its ID. If the session doesn't exist or belongs to another user, returns `404 Not Found`.

### Revoke

- `DELETE /api/auth/sessions/{id}` immediately invalidates the session's access and refresh tokens and returns `204 No Content`. Missing or inaccessible sessions return `404 Not Found`.
- `DELETE /api/auth/sessions` immediately invalidates all sessions and tokens for the authenticated user and returns `204 No Content`.

## Dashboard

```http
GET /api/dashboard?time_zone=Europe%2FMoscow
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
  "overdue_total": 0,
  "overdue_tasks": []
}
```

The optional `time_zone` query parameter accepts an IANA time zone and defaults
to UTC. A date-only deadline becomes overdue when that calendar day has ended in
the selected zone. A timestamp-only deadline becomes overdue after its instant.

- `completion_percent` is rounded to two decimals, and is `0` with no tasks.
- `nearest_deadline_task` is the unfinished task with the closest future
  deadline, or `null`.
- `overdue_tasks` contains up to 10 unfinished tasks whose deadline has passed, latest
  deadline first.
- Dashboard tasks only fill `id`, `subject_id`, `name`, `description`,
  `deadline`, and `status`. The other task fields are still present with zero
  values (`""`, `null`, `0001-01-01T00:00:00Z`). The example above leaves them
  out.

## Study plan and calendar

`GET /api/dashboard/plan?time_zone=Europe%2FMoscow&overdue_offset=0` returns
study-task summaries, subject names, aggregate counts, and up to 10 overdue
tasks ordered by their earliest missed deadline. Advance `overdue_offset`
by 10 until it reaches `overdue_total`. The statistics endpoint also accepts
`overdue_offset` and reports `overdue_total`.

`GET /api/calendar?start_date=2026-11-23&end_date=2026-11-30&time_zone=Europe%2FMoscow`
returns exams and unfinished work overlapping the visible period. The start
day is inclusive and the end day is exclusive. The range may span 1–62 days.
Date-only task values stay on their calendar day. The time zone sets period
boundaries for exams and legacy timestamps. Omitted time zones default to UTC.

## Reminders

`GET /api/reminders/{target}/{id}` reads settings for a `task` or `subject`.
Use `PUT` with `lead_minutes` (5–10080) and an IANA `time_zone` to schedule a
notice to the verified email address. For tasks, reminders use the deadline.
For subjects, they use the event date. Use `DELETE` to turn the reminder off.

## Subjects

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/subjects` | List subjects by course and semester in descending order, missing values last |
| `POST` | `/api/subjects` | Create one subject |
| `DELETE` | `/api/subjects` | Delete all subjects with their tasks |
| `GET` | `/api/subjects/{id}` | Get one subject, including files |
| `PUT` | `/api/subjects/{id}` | Replace a subject |
| `PATCH` | `/api/subjects/{id}` | Update the provided fields |
| `DELETE` | `/api/subjects/{id}` | Delete a subject with its tasks |
| `GET` | `/api/subjects/{id}/tasks` | List the subject's tasks |
| `POST` | `/api/subjects/{id}/thumbnail` | Upload a thumbnail image |
| `POST` | `/api/subjects/{id}/file` | Attach a PDF or text file |

Deleting a subject queues its attachments and thumbnail for removal after the
database transaction commits. Thumbnails still used by another subject are kept.

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
| `name` | Required, up to 100 characters, unique per user (`409 Conflict` on a duplicate) |
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
returns `201 Created`. Only `name` is required. Subject and lecturer names have a
limit of 100 characters, notes have a limit of 200, and each lecturer needs a
valid `position`. Invalid values return `400` and duplicate names return `409`.

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

`PATCH /api/subjects/{id}` changes only the fields it receives. Pass `null`
to clear `exam_date`, `note`, `course`, or `term`. Supplying `lecturers`
replaces the full ordered list. An empty array or `null` clears the list.
`PUT` retains the current lecturers.

### Thumbnail

Send the raw image bytes as the body, as for the user avatar. The limits and
errors are the same: PNG, JPEG, or WebP, up to 2 MB and 2560×2560 px.
The uploaded cover is accessible to the subject owner.

```json
{ "thumbnail_url": "/static/thumbnails/26c15f91-1756-4be7-b4b5-4ea6732dbe11.webp" }
```

### Files

Send `multipart/form-data` with the file in the `file` field. PDF and plain
text files up to 50 MiB are accepted, with a 51 MiB cap on the multipart body.

```bash
curl -b cookies.txt -F "file=@lecture-1.pdf" http://localhost:8080/api/subjects/1/file
```

```json
{ "file_url": "/static/files/26c15f91-1756-4be7-b4b5-4ea6732dbe11.pdf" }
```

Invalid multipart data and missing or empty files return `400`. A missing or
inaccessible subject returns `404`, an oversized upload returns `413`, and an
unsupported file type returns `415`. Each account can store up to 100
attachments totaling 500 MiB. Exceeding either quota returns `409` with
`attachment_quota_exceeded`. Downloads require subject ownership.

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
| `scheduled_date`, `deadline_date` | Calendar date (`YYYY-MM-DD`) or `null` |

Use `scheduled_date` for the day to work on a task and `deadline_date` for
the day it is due. These calendar dates are independent of each other.
A calendar date takes precedence over the matching timestamp in Studify.
Send just a timestamp for a task with a specific time. Existing timestamp-only
records retain their instant. The API still supplies an end-of-day UTC
`deadline` for compatibility when only `deadline_date` is sent. On PATCH,
sending a timestamp on its own replaces its matching calendar date.

`POST /api/tasks` returns `201 Created`, and `PUT /api/tasks/{id}` returns
`200 OK`. Both take the task fields without `id`, `created_at`, and
`updated_at`. The backend applies no defaults, so `type`, `status`,
`difficulty`, and `priority` must be sent. Missing or invalid values return
`400`. Task names have a limit of 200 characters and descriptions have a limit
of 2000. A subject that does not belong to the user returns `404`.

`PATCH /api/tasks/{id}` changes only the fields it receives. An explicit
`null` clears the estimate, schedule, or deadline. When the request contains
either member of a calendar date and timestamp pair, it replaces both. An
update to another field, such as status, preserves both date pairs. Invalid
fields return `400`.

## Shared projects

All shared projects routes require authentication via `access_token` cookie.

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/api/shared-projects` | ✓ | List shared projects of the authenticated user, newest first |
| `POST` | `/api/shared-projects` | ✓ | Create a new shared project |
| `GET` | `/api/shared-projects/catalog` | ✓ | Browse published projects from newest to oldest |
| `GET` | `/api/shared-projects/{id}` | ✓ | Get an owned or published project by ID |
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
  "author_avatar_url": "https://avatars.githubusercontent.com/u/1234567",
  "is_public": false
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
| `is_public` | Boolean. Defaults to false on create. Omit in an update to preserve existing visibility. |

### Create and update

`POST /api/shared-projects` creates a shared project for the authenticated user and returns `201 Created`:

```json
{
  "name": "Distributed Systems Notes",
  "url": "https://github.com/studify-community/distributed-systems",
  "author": "Alex River",
  "author_avatar_url": "https://avatars.githubusercontent.com/u/1234567",
  "is_public": false
}
```

- If `name` or `author` is empty, or `url` is not a valid HTTP/HTTPS URL, returns `400 Bad Request`.
- If a project with this `url` already exists, returns `409 Conflict`.

`PUT /api/shared-projects/{id}` updates an existing shared project owned by the authenticated user and returns `200 OK`. The request body has the same shape as create.
- Modifying another user's project returns `404 Not Found`.

### Catalog, get, and delete

- `GET /api/shared-projects/catalog` returns `items` and `next_before`.
  Pages have up to 24 entries. Use `?before=<next_before>` for the next page
  when `next_before` is present. The catalog contains only projects whose owner
  opted to publish them.

- `GET /api/shared-projects` returns `200 OK` with an array of all shared projects owned by the authenticated user, ordered by ID descending.
- `GET /api/shared-projects/{id}` returns `200 OK` with the shared project by its ID. An unknown or private project owned by another user returns `404 Not Found`.
- `DELETE /api/shared-projects/{id}` deletes the project owned by the authenticated user and returns `204 No Content`. Deleting a non-existent or another user's project returns `404 Not Found`.

## Files and monitoring

`GET /static/{path}` requires authentication. Subject attachments under
`/static/files/` can only be opened by the owner of the subject. Unknown or
inaccessible attachments return `404`. Avatar and thumbnail links are
available to signed-in users. The API serves individual files without directory listings.

`GET /metrics` is on the private metrics listener in production and Docker
Compose. In standalone development, the default is the API listener.

## Request examples

Runnable JetBrains HTTP Client requests are in `backend/postman/`. Known
limitations are tracked in [ISSUES.md](ISSUES.md).
