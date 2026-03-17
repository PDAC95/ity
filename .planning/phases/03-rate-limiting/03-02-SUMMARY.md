---
phase: 03-rate-limiting
plan: 02
subsystem: auth
tags: [rate-limiting, client-pages, fetch-proxy, 429-handling]

# Dependency graph
requires:
  - phase: 03-rate-limiting
    plan: 01
    provides: /api/auth/login, /api/auth/forgot-password, /api/auth/resend-verification routes with rate limiting
provides:
  - app/(auth)/login/page.tsx using fetch to /api/auth/login with 429 + too_many_requests handling
  - app/(auth)/forgot-password/page.tsx using fetch to /api/auth/forgot-password with 429 handling
  - app/(auth)/verify-email/page.tsx using fetch to /api/auth/resend-verification with 429 handling
affects: [client-auth-ux, rate-limiting-circuit-complete]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Client pages use fetch() to server-side API route proxies instead of direct Supabase browser client calls"
    - "429 detection: res.status === 429 -> read json.error -> setServerError()"
    - "Callback rate limit redirect: errorParam === too_many_requests -> toast.error()"
    - "Error display for resend: resendError state with JSX below button"

key-files:
  created: []
  modified:
    - ity/apps/web/app/(auth)/login/page.tsx
    - ity/apps/web/app/(auth)/forgot-password/page.tsx
    - ity/apps/web/app/(auth)/verify-email/page.tsx

key-decisions:
  - "03-02-D1: resendError shown below button only when not-resent — wrapped button and error in fragment inside conditional to preserve layout"
  - "03-02-D2: forgot-password removes siteUrl/redirectTo construction from client — API route now owns redirectTo server-side using NEXT_PUBLIC_SITE_URL from server env"

requirements-completed: [RATE-01, RATE-02, RATE-03, RATE-05]

# Metrics
duration: 2min
completed: 2026-03-17
---

# Phase 3 Plan 2: Client Page Proxy Wiring Summary

**Three auth client pages wired to server-side rate-limited API route proxies via fetch(), replacing direct Supabase browser client calls — completes the rate-limiting circuit**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-17T17:42:28Z
- **Completed:** 2026-03-17T17:44:17Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Replaced `supabase.auth.signInWithPassword()` in login page with `fetch('/api/auth/login')` — 429 responses now display Spanish rate limit error, `error=too_many_requests` from callback redirect shows toast
- Replaced `supabase.auth.resetPasswordForEmail()` in forgot-password page with `fetch('/api/auth/forgot-password')` — removed client-side `siteUrl`/`redirectTo` construction (server now owns it)
- Replaced `supabase.auth.resend()` in verify-email page with `fetch('/api/auth/resend-verification')` — added `resendError` state with UI display below resend button
- All three pages no longer import `createClient` from `@/lib/supabase/client` for auth operations
- Full project TypeScript compilation passes with zero errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Refactor login page to use /api/auth/login proxy with 429 handling** - `44bd1cd` (feat)
2. **Task 2: Refactor forgot-password and verify-email pages to use API route proxies** - `5cd97c3` (feat)

## Files Created/Modified

- `ity/apps/web/app/(auth)/login/page.tsx` - fetch to /api/auth/login, 429 handling, too_many_requests toast + banner
- `ity/apps/web/app/(auth)/forgot-password/page.tsx` - fetch to /api/auth/forgot-password, 429 handling, removed siteUrl construction
- `ity/apps/web/app/(auth)/verify-email/page.tsx` - fetch to /api/auth/resend-verification, resendError state + UI display

## Decisions Made

- **resendError placement:** Error shown below button only when in not-resent state — wrapped button and error in a React fragment inside the conditional block to preserve layout structure cleanly.
- **Server owns redirectTo:** Forgot-password page no longer constructs `siteUrl` or `redirectTo` on the client. The API route handler reads `NEXT_PUBLIC_SITE_URL` from the server environment directly, which is more reliable.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## Rate Limiting Circuit — Now Complete

With this plan complete, all four auth flows are fully rate-limited end-to-end:

| Flow | Rate Limit | Client Page | API Route |
|------|-----------|-------------|-----------|
| Login | 5 req/15m (IP) | login/page.tsx | /api/auth/login |
| Forgot password | 3 req/1h (email) | forgot-password/page.tsx | /api/auth/forgot-password |
| Resend verification | 3 req/1h (email) | verify-email/page.tsx | /api/auth/resend-verification |
| OAuth callback | 10 req/1m (IP) | N/A | middleware.ts |

## Next Phase Readiness

- All rate limiting is complete — Phase 3 is done
- Upstash Redis database must still be provisioned before any testing (see Plan 01 setup instructions)

---
*Phase: 03-rate-limiting*
*Completed: 2026-03-17*
