# Studify Frontend

React frontend for the Studify backend.

## Stack

- React + TypeScript
- Vite + Bun
- Tailwind CSS
- TanStack React Query
- React Hook Form
- Zod

## Scripts

```bash
bun install
bun run dev
bun run build
bun run lint
```

Set `VITE_API_BASE_URL` in `frontend/.env` to point the frontend at the
backend. With Docker Compose, this value is provided from root `.env` through
`docker-compose.yaml`.
