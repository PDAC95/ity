---
phase: 01-security-foundation
plan: 02
subsystem: auth
tags: [supabase, next.js, trpc, security, open-redirect, creator-provisioning, sonner, toast]

# Dependency graph
requires: [01-01]
provides:
  - Open redirect fix via isAllowedRedirect() allowlist validation (SEC-01)
  - Structured JSON auth event logger for invalid redirects and failures (SEC-01)
  - Idempotent creator upsert in callback route (SEC-01)
  - createCreator as protectedProcedure using ctx.user.id (SEC-02)
  - Dashboard creator safety-net upsert for edge cases (SEC-02)
  - sonner Toaster in root layout with toast.error on login error params (SEC-02)
affects: [phase-02, phase-03]

# Tech tracking
tech-stack:
  added:
    - sonner@^2.0.7 (toast notifications, installed in apps/web)
  patterns:
    - Redirect allowlist: prefix-based matching with decodeURIComponent before validation
    - Auth logger: structured JSON to stdout { event, timestamp, environment, details }
    - Creator provisioning: idempotent upsert at callback, safety-net upsert at dashboard layout
    - protectedProcedure pattern: id and email come from ctx.user, not input

key-files:
  created:
    - ity/apps/web/lib/auth/redirect.ts
    - ity/apps/web/lib/auth/logger.ts
  modified:
    - ity/apps/web/app/(auth)/callback/route.ts
    - ity/packages/api/src/routers/auth.ts
    - ity/apps/web/app/(auth)/register/page.tsx
    - ity/apps/web/app/(dashboard)/layout.tsx
    - ity/apps/web/app/layout.tsx
    - ity/apps/web/app/(auth)/login/page.tsx

key-decisions:
  - "SEC-01: Redirect allowlist uses prefix-based matching (not exact match) — allows /dashboard/courses etc while blocking //evil.com and %2F%2Fevil.com"
  - "SEC-01: isAllowedRedirect() always decodes percent-encoded input before checking — prevents encoding bypass attacks"
  - "SEC-01: Creator provisioning in callback changed from select+insert to single upsert with onConflict ignoreDuplicates — idempotent, handles repeat callbacks"
  - "SEC-02: createCreator now requires authenticated session — any unauthenticated POST returns 401 UNAUTHORIZED"
  - "SEC-02: Dashboard layout safety-net uses Supabase client (not Drizzle) — layout is a server component, not a tRPC procedure"

patterns-established:
  - "Auth security pattern: validate redirect target BEFORE any auth processing"
  - "tRPC security pattern: never accept id/email from client input — always use ctx.user from session"
  - "Provisioning pattern: dual safety net — upsert at callback + upsert at dashboard layout"

requirements-completed: [SEC-01, SEC-02]

# Metrics
duration: 3min
completed: 2026-03-04
---

# Phase 01 Plan 02: Open Redirect Fix and Protected Creator Provisioning Summary

**Open redirect closed via allowlist validation (SEC-01) and createCreator locked to authenticated sessions with server-side creator provisioning (SEC-02)**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-04T19:04:53Z
- **Completed:** 2026-03-04T19:07:53Z
- **Tasks:** 2
- **Files created:** 2
- **Files modified:** 6

## Accomplishments

- Created `lib/auth/redirect.ts` with `isAllowedRedirect()` — prefix allowlist validates `next` param, decodes percent-encoded bypasses, falls back to `/dashboard` on any invalid input
- Created `lib/auth/logger.ts` with `logAuthEvent()` — structured JSON logger for invalid redirect attempts, auth failures, and creator provision errors
- Rewrote callback route to validate redirect before auth processing, use idempotent upsert for creator provisioning, and log failures
- Converted `createCreator` from `publicProcedure` to `protectedProcedure` — id and email now sourced from `ctx.user` (session), eliminating the injection vector
- Removed client-side `createCreator.mutateAsync()` call from register page — provisioning now happens server-side only
- Added creator safety-net upsert to dashboard layout — catches edge cases (old registration flow, direct OAuth without callback)
- Installed `sonner` and added `<Toaster position="top-right" />` to root layout
- Added `toast.error()` with `useEffect` to login page for error query params alongside existing inline error div

## Task Commits

Each task was committed atomically:

1. **Task 1: Create redirect allowlist utility, auth logger, and secure callback route (SEC-01)** - `4820275` (feat)
2. **Task 2: Convert createCreator to protectedProcedure, add dashboard safety net, install sonner (SEC-02)** - `ce26743` (feat)

## Files Created/Modified

- `ity/apps/web/lib/auth/redirect.ts` (created) - isAllowedRedirect() with ALLOWED_PREFIXES allowlist and decodeURIComponent validation
- `ity/apps/web/lib/auth/logger.ts` (created) - logAuthEvent() structured JSON logger for auth events
- `ity/apps/web/app/(auth)/callback/route.ts` - Validates next param via isAllowedRedirect, logs invalid attempts, idempotent upsert for creator
- `ity/packages/api/src/routers/auth.ts` - createCreator changed to protectedProcedure with ctx.user.id, onConflictDoNothing
- `ity/apps/web/app/(auth)/register/page.tsx` - Removed trpc import and createCreator mutation; signUp only, creator provisioned server-side
- `ity/apps/web/app/(dashboard)/layout.tsx` - Added creator safety-net upsert after auth check
- `ity/apps/web/app/layout.tsx` - Added Toaster import and component from sonner
- `ity/apps/web/app/(auth)/login/page.tsx` - Added toast import, useEffect, and toast.error() for error params

## Decisions Made

- SEC-01: Redirect allowlist uses prefix-based matching (not exact match) — `/dashboard/courses` is valid, `//evil.com` is not. `decodeURIComponent` runs before check to block percent-encoded bypasses like `%2F%2Fevil.com`.
- SEC-01: Invalid redirect attempts are logged BEFORE auth processing completes — the log captures the attack attempt regardless of whether the code exchange succeeds.
- SEC-01: Creator provisioning in callback changed from check-then-insert to single `upsert` with `onConflict: 'id', ignoreDuplicates: true` — eliminates TOCTOU race condition and handles repeat callbacks safely.
- SEC-02: `createCreator` now requires an authenticated session. Any unauthenticated caller receives 401 UNAUTHORIZED from `protectedProcedure`.
- SEC-02: Dashboard layout safety-net uses Supabase client (not Drizzle or tRPC) — server component layouts call Supabase directly. The upsert is idempotent so it has zero cost when creator already exists.

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

- Both SEC-01 and SEC-02 are fully implemented — Phase 1 security foundation is complete
- TypeScript compiles with zero errors across all 8 modified/created files
- `sonner` installed and wired; ready for use in any future toast notifications
- Creator provisioning is now fully server-side and idempotent at two safety net points

---
*Phase: 01-security-foundation*
*Completed: 2026-03-04*

## Self-Check: PASSED
