---
phase: 01-security-foundation
plan: 01
subsystem: auth
tags: [supabase, next.js, trpc, middleware, cookies, cache-control]

# Dependency graph
requires: []
provides:
  - Cache-Control: no-store header on sign-out redirect (SEC-06)
  - Full-page navigation via window.location.href after login (SEC-07)
  - Cookie setAll errors surfaced in dev (throw) and prod (console.warn) (SEC-03)
  - Middleware single getUser() call via updateSession returning { response, user } (SEC-04)
  - Supabase client wired into tRPC context in both API route and RSC caller (SEC-05)
affects: [01-02, phase-02, phase-03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - updateSession returns { response, user } — consumer uses user without second getUser() call
    - middleware.ts imports zero Supabase clients — user comes entirely from updateSession
    - tRPC context receives supabase client instance in both HTTP and RSC call paths

key-files:
  created: []
  modified:
    - ity/apps/web/app/api/auth/signout/route.ts
    - ity/apps/web/app/(auth)/login/page.tsx
    - ity/apps/web/lib/supabase/server.ts
    - ity/apps/web/lib/supabase/middleware.ts
    - ity/apps/web/middleware.ts
    - ity/apps/web/app/api/trpc/[trpc]/route.ts
    - ity/apps/web/lib/trpc/server.ts

key-decisions:
  - "SEC-03: Cookie errors THROW in development (hard fail to surface problems) and console.warn in production — throw in dev is intentional per CONTEXT.md locked decision"
  - "SEC-04: updateSession() return type changed from NextResponse to { response, user } — single getUser() call serves both session refresh and auth state needs"
  - "SEC-05: tRPC context supabase field was already in the Context type signature — it just needed to be passed at both call sites"

patterns-established:
  - "Middleware pattern: single Supabase client in updateSession, destructure { response, user } in middleware.ts"
  - "tRPC pattern: both API route and RSC caller must pass supabase to createTRPCContext"

requirements-completed: [SEC-03, SEC-04, SEC-05, SEC-06, SEC-07]

# Metrics
duration: 2min
completed: 2026-03-04
---

# Phase 01 Plan 01: Security Foundation Auth Wiring Summary

**Five surgical auth security fixes: sign-out cache header, full-page login nav, visible cookie errors, single-client middleware, and supabase wired into tRPC context**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-04T18:58:12Z
- **Completed:** 2026-03-04T19:00:32Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Eliminated browser caching of sign-out redirects with Cache-Control: no-store header
- Fixed auth cookie propagation gap by switching login navigation to window.location.href (full page load)
- Made cookie errors visible in development (throw) and logged in production (console.warn)
- Removed second Supabase client and second getUser() call from middleware.ts by restructuring updateSession() to return both response and user
- Wired supabase client instance into tRPC context at both entry points (HTTP API route and RSC caller)

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix sign-out caching, login navigation, and cookie error surfacing (SEC-06, SEC-07, SEC-03)** - `8b57c15` (fix)
2. **Task 2: Eliminate middleware double-client and wire supabase into tRPC context (SEC-04, SEC-05)** - `b0cfc52` (fix)

## Files Created/Modified
- `ity/apps/web/app/api/auth/signout/route.ts` - Added Cache-Control: no-store header on sign-out redirect
- `ity/apps/web/app/(auth)/login/page.tsx` - Replaced router.push/refresh with window.location.href for full-page navigation
- `ity/apps/web/lib/supabase/server.ts` - Replaced silent catch with throw in dev / console.warn in prod
- `ity/apps/web/lib/supabase/middleware.ts` - Changed updateSession() return type to { response, user }, captures user from getUser()
- `ity/apps/web/middleware.ts` - Removed second createServerClient and getUser() call; user comes from updateSession destructuring
- `ity/apps/web/app/api/trpc/[trpc]/route.ts` - Added supabase to createTRPCContext call
- `ity/apps/web/lib/trpc/server.ts` - Added supabase to createTRPCContext call

## Decisions Made
- SEC-03: Cookie errors THROW in development (hard fail to surface problems) and console.warn in production. The throw in dev is intentional — it surfaces cookie problems that would otherwise be invisible. Per CONTEXT.md locked decision.
- SEC-04: updateSession() now returns `{ response, user }` instead of just `response`. This eliminates the second Supabase client in middleware.ts entirely. Single getUser() call serves both session refresh and auth state needs.
- SEC-05: The `supabase` parameter was already in the `createTRPCContext` function signature — it just wasn't being passed at either call site. Fix was a one-line addition at each of the two callers.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- `npx tsc` intercepted by a shim (not the real TypeScript compiler). Resolved by using the local binary at `apps/web/node_modules/.bin/tsc`. No code changes required.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 5 prerequisite wiring fixes complete — Plan 02 (callback route and createCreator changes) can proceed
- TypeScript compiles cleanly with zero errors across all 7 modified files
- No new dependencies added; no configuration changes required

---
*Phase: 01-security-foundation*
*Completed: 2026-03-04*

## Self-Check: PASSED

All files confirmed present. All commits confirmed in git log.
- 8 files checked: all found
- 2 commits checked: 8b57c15, b0cfc52 — both found
