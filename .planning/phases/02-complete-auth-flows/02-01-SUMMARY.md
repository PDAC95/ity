---
phase: 02-complete-auth-flows
plan: 01
subsystem: auth
tags: [auth, email-otp, middleware, supabase, verifyOtp]
dependency_graph:
  requires: [01-02]
  provides: [email-verification-route, password-recovery-route, middleware-next-param]
  affects: [auth-flows, middleware, redirect-allowlist]
tech_stack:
  added: []
  patterns: [verifyOtp-email-otp, next-param-preservation, allowlist-redirect-validation]
key_files:
  created:
    - ity/apps/web/app/auth/confirm/route.ts
  modified:
    - ity/apps/web/middleware.ts
    - ity/apps/web/lib/auth/redirect.ts
decisions:
  - "02-01-D1: /auth/confirm uses verifyOtp(token_hash) not exchangeCodeForSession — email OTP flows do not use OAuth PKCE code exchange"
  - "02-01-D2: /auth/confirm excluded from middleware matcher — prevents getUser() from consuming OTP token before verifyOtp runs"
  - "02-01-D3: Middleware preserves pathname as ?next= param on unauthenticated redirect — pathname is safe (already validated as /dashboard prefix)"
metrics:
  duration: 5min
  completed: "2026-03-05"
  tasks_completed: 2
  files_changed: 3
---

# Phase 2 Plan 1: Email OTP Confirm Route and Middleware next Param Summary

**One-liner:** Email OTP confirm route using verifyOtp(token_hash) for email verification and password recovery, with middleware preserving ?next= param on unauthenticated redirects.

## What Was Built

### /auth/confirm route (`app/auth/confirm/route.ts`)

A new GET route at `/auth/confirm` that handles two Supabase email-based auth flows:

1. **Email verification (type=email):** Verifies the OTP token, provisions a creator record via idempotent upsert (same pattern as `/callback/route.ts`), and redirects to `safeNext` (defaults to `/dashboard`).
2. **Password recovery (type=recovery):** Verifies the OTP token to establish a recovery session, then redirects to `/reset-password`.

The route validates `token_hash` and `type` presence before any auth call, uses `isAllowedRedirect` to validate the `next` param, and logs failures via `logAuthEvent`.

### Redirect allowlist update (`lib/auth/redirect.ts`)

Added `/reset-password` to `ALLOWED_PREFIXES` so password recovery redirect targets pass validation.

### Middleware updates (`middleware.ts`)

Two changes:
1. Unauthenticated users accessing `/dashboard` are now redirected to `/login?next=/dashboard` (previously dropped the destination).
2. The matcher regex now excludes `auth/confirm` to prevent middleware's `getUser()` from interfering with one-time OTP token verification.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create /auth/confirm route for email OTP verification | 4e8e76e | app/auth/confirm/route.ts, lib/auth/redirect.ts |
| 2 | Update middleware to preserve next param and exclude /auth/confirm | 1470eb4 | middleware.ts |

## Verification Results

- TypeScript: PASS (zero errors)
- /auth/confirm/route.ts exists at correct path (app/auth/confirm/, not app/(auth)/confirm/)
- verifyOtp used (not exchangeCodeForSession)
- Creator upsert present for type=email
- Middleware sets ?next= param on unauthenticated redirect
- Middleware matcher excludes auth/confirm
- redirect.ts ALLOWED_PREFIXES includes /reset-password

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] GoogleAuthButton missing next prop causing type error**
- **Found during:** Task 1 TypeScript verification
- **Issue:** `login/page.tsx` (already modified in working tree) passes `next` prop to `GoogleAuthButton`, but the component's type signature did not include `next`. This caused a TypeScript error blocking type check.
- **Fix:** The component file (`social-button.tsx`) was already updated by a formatter/prior edit before our read. After re-reading the file, it already had the `next` prop with proper type. The type error resolved with zero additional changes needed.
- **Files modified:** None (component was already fixed by prior working tree changes)
- **Commit:** Part of pre-existing working tree state

## Key Decisions

- **verifyOtp vs exchangeCodeForSession:** Email templates embed `token_hash`, not an OAuth authorization code. `exchangeCodeForSession` requires a PKCE verifier stored in browser storage — this fails cross-browser. `verifyOtp` is self-contained and correct for all email OTP flows.
- **Middleware matcher exclusion:** Adding `auth/confirm` to the negative-lookahead in the matcher prevents middleware from running at all on this route — the safest approach vs. adding it to a whitelist inside the middleware function.
- **Pathname as next param:** The `pathname` variable (already validated as `/dashboard*` by the `isDashboard` check) is passed directly as the `next` param without further encoding — it's always a safe relative path starting with `/dashboard`.

## Self-Check: PASSED

All created files verified on disk. All task commits verified in git log.

| Check | Result |
|-------|--------|
| ity/apps/web/app/auth/confirm/route.ts | FOUND |
| ity/apps/web/middleware.ts | FOUND |
| ity/apps/web/lib/auth/redirect.ts | FOUND |
| Commit 4e8e76e (Task 1) | FOUND |
| Commit 1470eb4 (Task 2) | FOUND |
