---
phase: 09-db-schema-trpc-infrastructure
plan: 01
subsystem: database
tags: [drizzle, postgres, jsonb, schema, notifications, landing-page]

# Dependency graph
requires:
  - phase: 08-creator-profile
    provides: creators table with bio column (notifications FK target)
  - phase: 07-school-setup
    provides: schools table (landingPageRequests FK target)
provides:
  - landing_page_requests table with schoolId FK, templateId, status (varchar), prdData/chatHistory JSONB
  - notifications table with creatorId FK, type (varchar), isRead, composite index on (creator_id, is_read)
  - TypeScript types: LandingPageRequestStatus, ChatMessage, ChatHistory, PrdData, NotificationType, NotificationMetadata
  - Inverse relations on creatorsRelations and schoolsRelations
  - ANTHROPIC_API_KEY and RESEND_API_KEY placeholders in .env.example
affects: [10-trpc-routers, 11-chat-wizard, 12-prd-generation, 13-notifications]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "varchar over pgEnum for extensible status/type columns — avoids future migrations when adding new values"
    - "Separate JSONB columns (prdData, chatHistory) instead of combined blob — allows independent field queries"
    - ".$type<T>() on all JSONB columns for TypeScript inference at zero runtime cost"
    - "Composite index on (creator_id, is_read) to support efficient unreadCount queries"

key-files:
  created: []
  modified:
    - ity/packages/db/src/schema.ts
    - ity/.env.example

key-decisions:
  - "status and type columns are varchar (not pgEnum) — extensibility without migration (NOTF-07)"
  - "templateId is a dedicated column, not stored inside prdData JSONB — direct filtering without JSONB extraction"
  - "prdData and chatHistory are separate JSONB columns — independent update paths, cleaner type inference"
  - "isRead has .notNull().default(false) — DB-level default ensures consistency without app-level defaults"
  - "Composite index notifications_creator_read_idx on (creatorId, isRead) — covers the unreadCount query pattern"

patterns-established:
  - "New tables appended after domainVerificationsRelations — maintain ordering convention in schema.ts"
  - "Inverse relations added to parent tables (creatorsRelations, schoolsRelations) for Drizzle query API"

requirements-completed: [NOTF-07]

# Metrics
duration: 2min
completed: 2026-04-07
---

# Phase 9 Plan 01: DB Schema — Landing Page Requests + Notifications

**Drizzle schema extended with landing_page_requests and notifications tables using varchar status/type columns, JSONB data fields, and composite indexes**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-07T19:29:22Z
- **Completed:** 2026-04-07T19:31:29Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Added `landing_page_requests` table with schoolId FK, templateId, status (varchar), prdData/chatHistory (JSONB), and 2 indexes
- Added `notifications` table with creatorId FK, type (varchar), isRead, actionUrl, metadata (JSONB), and composite index for unreadCount queries
- Added 6 TypeScript types for the new columns (LandingPageRequestStatus, ChatMessage, ChatHistory, PrdData, NotificationType, NotificationMetadata)
- Updated creatorsRelations and schoolsRelations with inverse references for Drizzle query API
- Added ANTHROPIC_API_KEY and RESEND_API_KEY placeholders in .env.example

## Task Commits

Each task was committed atomically:

1. **Task 1: Add landing_page_requests and notifications tables to schema.ts** - `864109b` (feat)
2. **Task 2: Add env var placeholders to .env.example** - `d6f80f0` (chore)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified
- `ity/packages/db/src/schema.ts` - Extended with 2 new tables, 6 new types, 2 new relation blocks, 2 updated relation blocks
- `ity/.env.example` - Added ANTHROPIC_API_KEY and RESEND_API_KEY placeholders with phase context comments

## Decisions Made
- `status` and `type` are `varchar`, not `pgEnum` — allows adding new values (e.g. `in_review`) without a schema migration (NOTF-07 requirement)
- `templateId` is a dedicated `varchar` column, not embedded in `prdData` JSONB — enables direct filtering without JSONB extraction overhead
- `prdData` and `chatHistory` are separate JSONB columns — different update cadences (chat updates frequently, PRD finalizes once)
- Composite index `notifications_creator_read_idx` on `(creatorId, isRead)` — primary query pattern is "unread notifications for creator X"

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- `npx tsc` resolved to a stub binary; used `ity/apps/web/node_modules/.bin/tsc` directly with `--project` flag. TypeScript compilation passed with 0 errors.

## User Setup Required
The plan frontmatter (`user_setup`) documents that ANTHROPIC_API_KEY and RESEND_API_KEY will be needed in future phases. Placeholders are now in `.env.example`. No action required until Phase 11 (chat wizard) and Phase 13 (notifications).

## Next Phase Readiness
- DB schema foundation for all v1.2 features is in place
- Phase 10 (tRPC routers) can now import and use `landingPageRequests` and `notifications` from `@ity/db`
- No migration run yet — `db:push` to be executed in Phase 10 when the full router surface is defined

---
*Phase: 09-db-schema-trpc-infrastructure*
*Completed: 2026-04-07*
