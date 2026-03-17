---
phase: 02-complete-auth-flows
plan: 04
subsystem: auth
tags: [supabase, google-oauth, email-templates, e2e-testing, middleware]

# Dependency graph
requires:
  - phase: 02-complete-auth-flows (plans 01-03)
    provides: Auth confirm route, login/register/forgot-password/reset-password pages with Spanish, next param wiring
provides:
  - NEXT_PUBLIC_SITE_URL environment variable configured for email redirect URLs
  - Supabase email templates pointing to /auth/confirm with token_hash variables
  - Google OAuth redirect URI configured in Google Cloud Console
  - Middleware /callback exclusion fix for OAuth flow
  - End-to-end verified auth flows (Google OAuth, email/password login)
affects: [rate-limiting, session-management]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Middleware matcher must exclude all auth-related routes (/auth/confirm, /callback) to prevent interference"

key-files:
  created: []
  modified:
    - ity/apps/web/.env.local
    - ity/apps/web/middleware.ts
    - ity/README.md

key-decisions:
  - "02-04-D1: Added /callback to middleware matcher exclusion — OAuth redirect was being intercepted by middleware, causing redirect loop back to /login"
  - "02-04-D2: NEXT_PUBLIC_SITE_URL set to http://localhost:8080 matching NEXT_PUBLIC_APP_URL — Supabase email templates use SiteURL variable for redirect links"

patterns-established:
  - "Auth route exclusions: Any route involved in auth token exchange must be excluded from middleware matcher"
  - "Test users documented in README for staging environment reference"

requirements-completed: [AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, AUTH-07, AUTH-08, AUTH-09]

# Metrics
duration: 8min
completed: 2026-03-05
---

# Phase 2 Plan 4: Manual Config & E2E Verification Summary

**Supabase email templates, Google OAuth URIs, and env vars configured; middleware /callback exclusion bugfix; email/password and Google OAuth flows verified end-to-end**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-05T21:33:30Z
- **Completed:** 2026-03-05T21:41:30Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- NEXT_PUBLIC_SITE_URL environment variable added for Supabase email redirect URLs
- Supabase email templates configured with /auth/confirm token_hash URLs, redirect URLs allowlisted, Google OAuth redirect URI added
- Middleware matcher bugfix: /callback route excluded to prevent OAuth redirect loop
- Email/password login and Google OAuth login verified working end-to-end
- Test user credentials documented in README

## Task Commits

Each task was committed atomically:

1. **Task 1: Verify NEXT_PUBLIC_SITE_URL in environment** - (no commit, .env.local is gitignored)
2. **Task 2: Configure Supabase email templates and Google OAuth** - (no commit, external dashboard configuration)
3. **Task 3: End-to-end verification of all auth flows** - `455446c` (fix: middleware /callback exclusion + README test users)

## Files Created/Modified
- `ity/apps/web/.env.local` - Added NEXT_PUBLIC_SITE_URL=http://localhost:8080 (gitignored)
- `ity/apps/web/middleware.ts` - Added /callback to matcher exclusion pattern
- `ity/README.md` - Added test users table for staging environment

## Decisions Made
- **02-04-D1:** Added /callback to middleware matcher exclusion list. The OAuth callback route was being intercepted by middleware which ran getUser() and redirected to /login, breaking the Google OAuth flow. This is the same pattern as /auth/confirm exclusion from plan 02-01.
- **02-04-D2:** Set NEXT_PUBLIC_SITE_URL=http://localhost:8080 to match the existing NEXT_PUBLIC_APP_URL. Supabase email templates reference {{ .SiteURL }} which resolves from this env var for redirect links.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Middleware intercepting /callback route broke Google OAuth**
- **Found during:** Task 3 (E2E verification)
- **Issue:** The middleware matcher pattern did not exclude /callback, so middleware ran getUser() on the OAuth callback URL and redirected unauthenticated users back to /login before the callback could exchange the auth code
- **Fix:** Added `callback` to the middleware matcher exclusion regex pattern
- **Files modified:** ity/apps/web/middleware.ts
- **Verification:** Google OAuth login completed successfully after fix
- **Committed in:** 455446c

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential fix for OAuth flow to work. No scope creep.

## Issues Encountered
- Google OAuth was redirecting back to /login instead of completing — root cause was middleware intercepting /callback route. Fixed by adding /callback to matcher exclusions.

## User Setup Required
External services were manually configured as part of Task 2:
- Supabase email templates updated with /auth/confirm token_hash URLs
- Supabase redirect URLs allowlist updated with http://localhost:8080/**
- Google OAuth redirect URI added: https://grifirzazwmovtzzxera.supabase.co/auth/v1/callback

## Next Phase Readiness
- All auth flows verified working end-to-end (Google OAuth, email/password login)
- Phase 2 complete — ready for Phase 3 (Rate Limiting)
- Blocker for Phase 3: Upstash Redis database must be created and env vars configured

---
*Phase: 02-complete-auth-flows*
*Completed: 2026-03-05*
