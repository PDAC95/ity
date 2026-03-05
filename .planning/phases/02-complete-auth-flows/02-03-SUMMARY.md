---
phase: 02-complete-auth-flows
plan: "03"
subsystem: auth
tags: [supabase, next.js, react, password-reset, email-verification, i18n]

# Dependency graph
requires:
  - phase: 01-security-foundation
    provides: Supabase auth callback route at /auth/confirm that handles email OTP token exchanges
provides:
  - Forgot-password page using NEXT_PUBLIC_SITE_URL for redirectTo pointing to /auth/confirm with recovery type
  - Reset-password page with session guard via getUser() and window.location.href post-reset redirect
  - Verify-email page with Spanish copy and resend functionality
affects: [02-complete-auth-flows, testing]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "NEXT_PUBLIC_SITE_URL ?? window.location.origin fallback for redirectTo URLs"
    - "Session guard via useEffect + getUser() before rendering protected form (hooks called before conditional returns)"
    - "window.location.href for post-auth redirects requiring cookie flush (SEC-07 pattern)"

key-files:
  created: []
  modified:
    - ity/apps/web/app/(auth)/forgot-password/page.tsx
    - ity/apps/web/app/(auth)/reset-password/page.tsx
    - ity/apps/web/app/(auth)/verify-email/page.tsx

key-decisions:
  - "Reset-password hooks (useState, useForm, useEffect) declared before conditional session guard returns to comply with React Rules of Hooks"
  - "redirectTo uses /auth/confirm?type=recovery&next=/reset-password (not /callback) — correct path for email OTP recovery flow"

patterns-established:
  - "Session guard pattern: all hooks at top, useEffect checks getUser, conditional null returns after hooks"

requirements-completed: [AUTH-06, AUTH-08, AUTH-09]

# Metrics
duration: 1min
completed: 2026-03-05
---

# Phase 02 Plan 03: Auth Pages — Spanish Localization and Password Reset Flow Wiring Summary

**Forgot-password page rewired to /auth/confirm with env-based redirectTo, reset-password guarded by getUser() session check and window.location.href flush, all three pages localized to Spanish**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-05T21:28:53Z
- **Completed:** 2026-03-05T21:29:53Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Fixed forgot-password redirectTo from `/callback?next=/reset-password` to `/auth/confirm?type=recovery&next=/reset-password` using `NEXT_PUBLIC_SITE_URL ?? window.location.origin`
- Added session guard to reset-password (getUser in useEffect, redirect to login on missing session) and switched post-reset redirect to `window.location.href` for cookie flush
- Localized all three auth pages (forgot-password, reset-password, verify-email) to Spanish

## Task Commits

Each task was committed atomically:

1. **Task 1: Update forgot-password and reset-password pages** - `2d0e510` (feat)
2. **Task 2: Localize verify-email page to Spanish** - `8a66268` (feat)

## Files Created/Modified

- `ity/apps/web/app/(auth)/forgot-password/page.tsx` - Fixed redirectTo URL, added NEXT_PUBLIC_SITE_URL env var, Spanish copy
- `ity/apps/web/app/(auth)/reset-password/page.tsx` - Added useEffect session guard, window.location.href redirect, Spanish copy
- `ity/apps/web/app/(auth)/verify-email/page.tsx` - Spanish copy only, logic unchanged

## Decisions Made

- All hooks (useState, useForm, useEffect) placed before conditional null returns in reset-password to follow React Rules of Hooks — onSubmit is a regular async function that can be defined after conditional returns
- Used `/auth/confirm?type=recovery` path per plan spec — this is the Supabase PKCE-compliant token exchange endpoint established in Phase 1

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Password reset flow (forgot-password -> email -> /auth/confirm -> reset-password -> login) is fully wired
- Email verification confirmation page is complete with resend functionality
- All three pages display Spanish text
- Ready for Phase 2 Plan 04 (Google OAuth) or end-to-end testing of the password reset flow

---
*Phase: 02-complete-auth-flows*
*Completed: 2026-03-05*
