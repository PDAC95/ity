---
phase: 02-complete-auth-flows
plan: 02
subsystem: auth-pages
tags: [auth, localization, redirect, oauth, spanish]
dependency_graph:
  requires: [02-01]
  provides: [AUTH-01, AUTH-02, AUTH-03]
  affects: [login-page, register-page, google-auth-button]
tech_stack:
  added: []
  patterns:
    - isAllowedRedirect for safe post-login redirect
    - NEXT_PUBLIC_SITE_URL for stable email redirect URLs
    - window.location.href for hard redirect after login (SEC-07)
    - toast.success via sonner for transient messages
key_files:
  created: []
  modified:
    - ity/apps/web/app/(auth)/login/page.tsx
    - ity/apps/web/app/(auth)/register/page.tsx
    - ity/apps/web/components/auth/social-button.tsx
decisions:
  - "Login uses window.location.href (not router.push) for post-login redirect per SEC-07"
  - "GoogleAuthButton uses NEXT_PUBLIC_SITE_URL ?? window.location.origin for OAuth redirectTo base"
  - "Register emailRedirectTo points to /auth/confirm (not /callback) — matches Phase 01 confirm route"
  - "Toast replaces green inline banner for password_reset message per CONTEXT.md"
metrics:
  duration: 2min
  completed: "2026-03-05"
  tasks: 2
  files_modified: 3
---

# Phase 2 Plan 2: Auth Pages — next param wiring, Spanish localization Summary

**One-liner:** Spanish-localized login, register, and GoogleAuthButton with `next` param redirect wiring and env-var-based email redirect URLs.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Update login page — next param, toasts, Spanish copy | f0a87df | ity/apps/web/app/(auth)/login/page.tsx |
| 2 | Update GoogleAuthButton and register page — next prop, env redirectTo, Spanish | a7c474a | ity/apps/web/components/auth/social-button.tsx, ity/apps/web/app/(auth)/register/page.tsx |

## What Was Built

### Login Page (login/page.tsx)

- Imports and uses `isAllowedRedirect` from `@/lib/auth/redirect` to validate the `next` query parameter
- After successful `signInWithPassword`, redirects to `isAllowedRedirect(searchParams.get('next'))` via `window.location.href`
- Passes `next={searchParams.get('next')}` to `GoogleAuthButton`
- Replaces green inline `message` banner with `toast.success` for `password_reset` message
- Removed unused `useRouter` import (not needed after switching to `window.location.href`)
- All user-facing text translated to Spanish

### GoogleAuthButton (social-button.tsx)

- Added `next?: string | null` prop
- Imports `isAllowedRedirect` and validates next before using it
- OAuth `redirectTo` built as: `${NEXT_PUBLIC_SITE_URL ?? window.location.origin}/callback?next=${encodeURIComponent(safeNext)}`
- Default label changed to `'Continuar con Google'`

### Register Page (register/page.tsx)

- `emailRedirectTo` now uses `process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin` as base URL
- Points to `/auth/confirm?next=/dashboard` (Phase 01 confirm route)
- All user-facing text translated to Spanish

## Decisions Made

1. **window.location.href for post-login redirect** — Per SEC-07 decision from Phase 1. Forces full page reload, ensuring middleware re-evaluates session cookies cleanly.

2. **NEXT_PUBLIC_SITE_URL ?? window.location.origin** — Env var takes precedence in production (stable URL), falls back to origin in development.

3. **emailRedirectTo uses /auth/confirm (not /callback)** — Consistent with Phase 01-01 which added the `/auth/confirm` OTP verification route specifically for email confirmations.

4. **Toast replaces green banner** — Per CONTEXT.md decision to use sonner toasts for transient success messages.

## Deviations from Plan

None — plan executed exactly as written.

## Verification Results

- TypeScript compiled with zero errors after both tasks complete
- `isAllowedRedirect` imported and used in login page
- `window.location.href` used (not router.push) for post-login redirect
- `toast.success` used for password_reset (no inline green banner)
- GoogleAuthButton has `next` prop with `isAllowedRedirect` validation
- GoogleAuthButton uses `NEXT_PUBLIC_SITE_URL` for redirectTo base
- Register page uses `NEXT_PUBLIC_SITE_URL` for `emailRedirectTo`
- All user-facing text in Spanish across all three files

## Self-Check: PASSED
