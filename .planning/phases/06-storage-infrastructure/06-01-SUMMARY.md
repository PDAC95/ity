---
phase: 06-storage-infrastructure
plan: 01
subsystem: infra
tags: [supabase, storage, rls, server-action, sql-migration]

# Dependency graph
requires:
  - phase: 05-dashboard-layout
    provides: authenticated dashboard shell; creator session confirmed
provides:
  - SQL migration creating 'uploads' public bucket with 7 RLS policies
  - getSignedUploadUrl Server Action with auth and ownership validation
  - getPublicStorageUrl pure helper for constructing public object URLs
  - SignedUploadResult discriminated union type
affects: [06-02-image-upload-widget, 07-school-setup, 08-creator-profile]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Signed URL upload pattern: Server Action validates ownership, returns signed URL, browser uploads directly to Supabase Storage (bypasses Vercel 4.5MB body limit)"
    - "RLS path-prefix scoping: storage.foldername()[1]/[2] with 1-based PostgreSQL array indexing"
    - "School ownership verification: EXISTS sub-select on public.schools checking creator_id = auth.uid()"
    - "Pure URL helper: NEXT_PUBLIC_SUPABASE_URL + path construction avoids Supabase client in synchronous context"

key-files:
  created:
    - ity/supabase/migrations/20260401_storage_bucket_and_rls.sql
    - ity/apps/web/app/actions/storage.ts
  modified: []

key-decisions:
  - "Single 'uploads' bucket with path-based separation (profiles/{user_id}/avatar and schools/{school_id}/logo) — simpler than per-entity buckets"
  - "getPublicStorageUrl implemented as pure URL string construction using NEXT_PUBLIC_SUPABASE_URL — no Supabase client needed, avoids server/client boundary issues"
  - "School ownership validated in Server Action AND in RLS policies — defense in depth; application layer prevents unnecessary storage calls"

patterns-established:
  - "Server Action ownership check: profiles/ validates user_id path segment against auth.uid(); schools/ queries public.schools with eq(creator_id, user.id)"
  - "RLS policies: 3 per entity (INSERT/UPDATE/DELETE) — all 3 required for upsert to work on second upload"

requirements-completed: [SCHOOL-02, PROF-02]

# Metrics
duration: 2min
completed: 2026-04-01
---

# Phase 6 Plan 01: Storage Infrastructure Summary

**Supabase Storage upload infrastructure: 'uploads' public bucket, 7 RLS policies (path-prefix scoped), and a Server Action returning signed upload URLs with ownership validation**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-01T14:16:36Z
- **Completed:** 2026-04-01T14:18:24Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- SQL migration creates 'uploads' public bucket (idempotent) with 7 RLS policies enforcing creator isolation
- Server Action validates auth and path ownership before issuing signed upload URLs
- Pure URL helper constructs public object URLs without any network request or Supabase client

## Task Commits

Each task was committed atomically:

1. **Task 1: Create SQL migration for uploads bucket and RLS policies** - `1b8fda1` (feat)
2. **Task 2: Create Server Action for signed upload URLs and public URL helper** - `059d579` (feat)

## Files Created/Modified
- `ity/supabase/migrations/20260401_storage_bucket_and_rls.sql` - Creates 'uploads' bucket + 7 RLS policies (public read, 3 profile, 3 school)
- `ity/apps/web/app/actions/storage.ts` - getSignedUploadUrl Server Action + getPublicStorageUrl helper + SignedUploadResult type

## Decisions Made
- Single 'uploads' bucket with path-based separation keeps management simple — `profiles/{user_id}/avatar` and `schools/{school_id}/logo`
- `getPublicStorageUrl` is a pure function using `NEXT_PUBLIC_SUPABASE_URL` env var rather than the Supabase client, avoiding server/client boundary issues inside a `'use server'` file
- Ownership is validated both at the application layer (Server Action) and at the database layer (RLS policies) — defense in depth

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- `npx tsc` intercepted by a shim warning; resolved by using the local `apps/web/node_modules/.bin/tsc` binary directly. TypeScript compiled with zero errors.

## User Setup Required
None - no external service configuration required. The SQL migration file must be applied to the Supabase project (via `supabase db push` or Supabase dashboard SQL editor) before uploads will work.

## Next Phase Readiness
- Plan 02 (ImageUploadWidget) can now consume `getSignedUploadUrl` and `getPublicStorageUrl` directly
- SQL migration must be applied to the live Supabase project before end-to-end upload testing
- No blockers for Plan 02 implementation

---
*Phase: 06-storage-infrastructure*
*Completed: 2026-04-01*
