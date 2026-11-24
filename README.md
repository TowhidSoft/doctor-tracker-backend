# Doctor Tracker – API

REST API for **Doctor Tracker**, an admin-only portal for managing doctors and the patients assigned to them, with search, filtering, pagination and dashboard analytics. Built with Express, TypeScript, Prisma and MongoDB.

> Frontend repository: `doctor-tracker-frontend` (Next.js). The two apps talk over REST only.

## Description

Doctor Tracker gives clinic administrators one place to keep the doctor roster, attach patients to doctors, and see how intake is trending. Every endpoint is protected by JWT and restricted to the `ADMIN` role. List endpoints are server-side paginated, searchable and filterable, and the analytics endpoint aggregates inside MongoDB so the dashboard stays fast as data grows.

## Setup Guide

Requirements: Node.js 20+, a MongoDB **replica set** (MongoDB Atlas free tier works out of the box; locally run `mongod --replSet rs0` and `rs.initiate()`), npm or pnpm.

```bash
# 1. Install
npm install

# 2. Configure environment
cp .env.example .env
#   set DATABASE_URL, JWT_ACCESS_SECRET_KEY, JWT_REFRESH_SECRET_KEY, FRONTEND_URL, Admin_Password

# 3. Create collections and indexes
npx prisma generate
npm run db:push

# 4. (optional) load demo data: 14 doctors, 150 patients over the last 90 days
npm run seed:doctors

# 5. Run
npm run dev        # http://localhost:8080 (PORT in .env)
```

On first boot an admin user is created automatically: `admin@gmail.com` / `123456` (override with `Admin_Email` / `Admin_Password`). **Change these before deploying.** There is no public sign-up: the only way in is this admin account.

Key variables (see `.env.example` for the full list):

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | MongoDB connection string (needs a replica set for Prisma) |
| `JWT_ACCESS_SECRET_KEY` / `JWT_REFRESH_SECRET_KEY` | Token signing secrets |
| `FRONTEND_URL` | Allowed browser origin / email links |
| `APP_TIMEZONE` | IANA zone used to bucket "days" in filters and charts (default `UTC`) |

CORS allows `FRONTEND_URL` (set it to your deployed frontend) plus the localhost dev origins listed in `src/server.ts`.

### API summary (all under `/api/v1`, header `token: <accessToken>`, role `ADMIN`)

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/auth/login` | returns `accessToken`, `refreshToken` |
| POST | `/auth/refreshToken` | body `{ refreshToken }` → new `accessToken` |
| GET | `/user` | the signed-in admin's profile |
| GET / POST | `/doctors` | list (`page, limit, search, specialization, hospital, dateFrom, dateTo, sortBy, sortOrder`) / create |
| GET | `/doctors/filter-options` | distinct specializations and hospitals |
| GET / PATCH | `/doctors/:id` | detail with `patientCount` / update |
| GET / POST | `/doctors/:id/patients` | that doctor's patients (same filters as `/patients`) / add one |
| DELETE | `/doctors/:id/patients/:patientId` | remove a patient from this doctor |
| GET | `/patients` | list all (`condition, gender, doctorId` + common params) |
| GET | `/patients/filter-options` | distinct conditions, doctors |
| PATCH / DELETE | `/patients/:id` | edit (can reassign `doctorId`) / delete |
| GET | `/analytics/overview?days=7\|30\|90` | totals, timeline, per-doctor, condition, gender, specialization, recent |

Errors use one envelope: `{ status:false, message, errors:[{ path, message }] }`, where `path` is the form field for validation errors.

## System Architecture

```
Next.js client ──REST/JSON──▶ Express app(Monolith) ──▶ route (Auth: ADMIN) ──▶ controller ──▶ service ──▶ Prisma ──▶ MongoDB
 (RTK Query cache)               │                                       │ zod parse        │ indexes + aggregation
                                 └─ helmet · cors · rate limit           └─ global error handler (zod / Prisma / ApiError)
```

Each feature is a module (`doctor`, `patient`, `analytics`) with `route → controller → service → validation`. Controllers parse input with Zod, services own the queries, and a global error handler turns Zod, Prisma and `ApiError` failures into the single error envelope above.

## Technical Decisions

**1. Indexes shaped by the list queries, and aggregation inside the database.**
Every list has a default sort on `createdAt` and optional equality filters, so each filter is paired with `createdAt` in a compound index (`specialization+createdAt`, `hospital+createdAt`, `doctorId+createdAt`, `condition+createdAt`, `gender+createdAt`). MongoDB can then filter and sort from one index instead of sorting in memory, and an `id` tiebreaker keeps pages stable. The dashboard does not fetch rows and count them in JavaScript: per-doctor, per-condition and per-gender figures use `groupBy`, and the day-by-day timeline uses a `$group` / `$dateToString` aggregation (in `APP_TIMEZONE`), so cost depends on the chosen window, not on table size. Trade-off: free-text search uses case-insensitive `contains`, which MongoDB runs as a regex and cannot serve from a plain index. That is fine at this scale; the next step would be an Atlas Search / text index.

**2. Validate at the edge with Zod, and report errors per field.**
Each handler parses `query`, `params` and `body` with a Zod schema before any query runs, so malformed ids, out-of-range pagination and bad enums return `400` instead of reaching Prisma. Schemas coerce and normalise (trimmed, lower-cased emails, `""` → `null` for optional fields), and the error handler returns `errors[].path`, so the frontend can highlight the exact input. The same rules are mirrored in the frontend form validation. A duplicate doctor email is reported on the `email` field rather than as a generic database error. (The boilerplate's `validateRequest` middleware discards the parse result, so the new modules call `schema.parse` directly.)

## Visual Evidence

See the frontend README for desktop and mobile screenshots.

## Security notes

- There is no registration endpoint; the single admin account is created on boot from `.env`.
- All Doctor Tracker routes require an `ADMIN` token.
- Keep `.env` out of git (now in `.gitignore`).
