---
phase: 04-session-management
plan: "01"
subsystem: auth
tags: [session, middleware, error-handling, typescript]
dependency_graph:
  requires: []
  provides: [AuthErrorCode, AUTH_MESSAGES, getAuthMessage, expired-session-detection]
  affects: [middleware.ts, login-page-reason-param]
tech_stack:
  added: []
  patterns: [enum-based-error-codes, bilingual-message-map, cookie-presence-check]
key_files:
  created:
    - ity/apps/web/lib/auth/errors.ts
  modified:
    - ity/apps/web/middleware.ts
decisions:
  - "04-01-D1: AuthErrorCode uses TypeScript enum (not as const object) per CONTEXT.md locked decision"
  - "04-01-D2: getAuthMessage returns Spanish (es) — primary UI language per project convention"
  - "04-01-D3: Cookie check uses .includes('-auth-token') not .endsWith() to catch chunked cookies (sb-<ref>-auth-token.0, .1, etc)"
  - "04-01-D4: No changes to lib/supabase/middleware.ts — SESS-01 silent refresh already handled by updateSession() calling getUser()"
metrics:
  duration: 2min
  completed_date: "2026-03-31"
  tasks_completed: 2
  files_changed: 2
---

# Phase 04 Plan 01: Auth Error Foundation and Expired-Session Detection Summary

**One-liner:** AuthErrorCode enum with bilingual (en/es) messages plus middleware cookie-presence check to distinguish expired sessions from never-authenticated users.

## What Was Built

### Task 1: Auth error enum and bilingual message map

Created `ity/apps/web/lib/auth/errors.ts` as the single source of truth for auth error codes used across phase 04 plans.

- `AuthErrorCode` enum with 4 values: `SESSION_EXPIRED`, `INVALID_CREDENTIALS`, `EMAIL_NOT_CONFIRMED`, `UNAUTHORIZED`
- `AUTH_MESSAGES` Record mapping each code to `{ en: string; es: string }` bilingual messages
- `getAuthMessage(code)` helper returning the Spanish message (primary UI language)

### Task 2: Expired-session detection in middleware

Modified `ity/apps/web/middleware.ts` to detect expired sessions when redirecting unauthenticated dashboard visitors.

Before redirecting a `!user && isDashboard` request, checks for a stale Supabase auth cookie using:
```
request.cookies.getAll().some(c => c.name.startsWith('sb-') && c.name.includes('-auth-token'))
```

- Cookie present + null user → `/login?next=<path>&reason=session_expired` (token expired, refresh token also gone)
- No cookie + null user → `/login?next=<path>` (first-time visitor, never authenticated)

Silent token refresh (SESS-01) remains handled by `updateSession()` calling `supabase.auth.getUser()` — no changes needed to `lib/supabase/middleware.ts`.

## Verification Results

1. TypeScript compilation: `npx tsc --noEmit` passes with zero errors
2. `lib/auth/errors.ts` exports `AuthErrorCode` enum with 4 values and `AUTH_MESSAGES` with `en`/`es` keys
3. `middleware.ts` contains `startsWith('sb-')` + `includes('-auth-token')` cookie check
4. `middleware.ts` conditionally sets `reason=session_expired` only when stale cookie exists
5. `middleware.ts` always sets `next=<pathname>` for unauthenticated dashboard access (existing behavior preserved)

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | `7006554` | feat(04-01): create AuthErrorCode enum and bilingual message map |
| 2 | `3928443` | feat(04-01): add expired-session detection to middleware |

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- `ity/apps/web/lib/auth/errors.ts` — FOUND
- `ity/apps/web/middleware.ts` — FOUND (modified)
- Commit `7006554` — FOUND
- Commit `3928443` — FOUND
