---
phase: 09-db-schema-trpc-infrastructure
plan: 02
subsystem: api
tags: [trpc, routers, notifications, landing-page, security]

# Dependency graph
requires:
  - phase: 09-db-schema-trpc-infrastructure
    plan: 01
    provides: landingPageRequests + notifications tables in @ity/db
  - phase: 07-school-setup
    provides: schools table with creatorId for ownership checks
provides:
  - landingRouter with getStatus, saveDraft, requestPage procedures
  - notificationsRouter with list, unreadCount, markRead, markAllRead procedures
  - appRouter updated with landing + notifications keys
affects: [10-trpc-routers, 11-chat-wizard, 12-prd-generation, 13-notifications]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "protectedProcedure for all landing + notification procedures — authenticated creators only"
    - "School ownership verified via eq(schools.creatorId, ctx.user.id) before any mutation"
    - "Drizzle columns selector to explicitly exclude prdData/chatHistory from getStatus response"
    - "sql<number> template with count(*)::int for unreadCount — avoids importing count helper"
    - "All notification queries filter by eq(notifications.creatorId, ctx.user.id) — SEC-05 query-level scoping"
    - ".returning() result guard (inserted[0] with TRPCError fallback) — TypeScript strict null safety"

key-files:
  created:
    - ity/packages/api/src/routers/landing.ts
    - ity/packages/api/src/routers/notifications.ts
  modified:
    - ity/packages/api/src/root.ts

key-decisions:
  - "getStatus uses Drizzle columns selector to explicitly exclude prdData and chatHistory — data leakage prevention at query level"
  - "saveDraft checks existing non-completed request before insert — 1:1 school->active request enforced at application layer"
  - "requestPage creates notifications row on draft->pending transition — NOTF-05 fulfilled in the same mutation"
  - "unreadCount uses sql<number> count(*)::int — avoids count() import, works with existing Drizzle query builder pattern"
  - "inserted[0] guard with TRPCError fallback — TS strict null check on .returning() array element"

requirements-completed: [NOTF-05, NOTF-07, SEC-05]

# Metrics
duration: 2min
completed: 2026-04-07
---

# Phase 9 Plan 02: tRPC Routers — Landing Page + Notifications

**Landing and notifications tRPC routers with ownership-scoped queries, draft/pending state machine, and notification creation on submission**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-07T19:33:59Z
- **Completed:** 2026-04-07T19:35:24Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created `landingRouter` with `getStatus` (status-only, excludes prdData/chatHistory), `saveDraft` (upsert with conflict guard), and `requestPage` (draft->pending transition + notification creation)
- Created `notificationsRouter` with `list` (last 50), `unreadCount` (sql count), `markRead`, and `markAllRead` — all scoped to `ctx.user.id`
- Registered both routers in `appRouter` — `AppRouter` type now includes `api.landing.*` and `api.notifications.*`
- All notification queries enforce SEC-05: `eq(notifications.creatorId, ctx.user.id)` in every WHERE clause
- `requestPage` fulfills NOTF-05: inserts a `landing_submitted` notification row in the same mutation

## Task Commits

Each task was committed atomically:

1. **Task 1: Create landing and notifications tRPC routers** - `7a92e83` (feat)
2. **Task 2: Register routers in root.ts** - `d8d1da0` (feat)

## Files Created/Modified
- `ity/packages/api/src/routers/landing.ts` - New router: getStatus, saveDraft, requestPage
- `ity/packages/api/src/routers/notifications.ts` - New router: list, unreadCount, markRead, markAllRead
- `ity/packages/api/src/root.ts` - Added imports and registration for both new routers

## Decisions Made
- `getStatus` uses Drizzle `columns` selector to explicitly return only `id`, `status`, `templateId`, `createdAt`, `updatedAt` — prdData and chatHistory never leave the DB layer through this procedure
- `saveDraft` checks for an existing non-completed request before inserting — a `CONFLICT` error is thrown if one exists and is not a draft, enforcing 1:1 school->active request at app layer
- `requestPage` inserts the notification in the same DB transaction context as the status update — atomic enough for a single-service app
- `unreadCount` uses `sql<number>\`count(*)::int\`` — consistent with the existing codebase's query builder patterns, avoids the `count` import

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript strict null check on .returning() array destructure**
- **Found during:** Task 1 (tsc verification)
- **Issue:** `const [created] = ...returning(...)` yields `created` as possibly undefined — TS18048 error
- **Fix:** Changed to `const inserted = ...returning(...)` + explicit `inserted[0]` check with `TRPCError` fallback on falsy
- **Files modified:** `ity/packages/api/src/routers/landing.ts`
- **Commit:** `7a92e83`

## Self-Check: PASSED
