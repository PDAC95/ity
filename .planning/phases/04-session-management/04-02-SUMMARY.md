---
phase: 04-session-management
plan: "02"
subsystem: auth
tags: [session, login, toast, error-codes, typescript]
dependency_graph:
  requires: [AuthErrorCode, getAuthMessage, AUTH_MESSAGES]
  provides: [session-expired-toast, code-based-error-branching, structured-login-api-response]
  affects: [login-page, login-api-route]
tech_stack:
  added: []
  patterns: [code-based-error-branching, dismissible-toast-by-id, url-param-cleanup-with-replacestate]
key_files:
  created: []
  modified:
    - ity/apps/web/app/api/auth/login/route.ts
    - ity/apps/web/app/(auth)/login/page.tsx
decisions:
  - "04-02-D1: server-side error.message.includes() in login route is acceptable — single mapping point from Supabase raw message to enum, client never does string matching"
  - "04-02-D2: sessionToastId stored in useRef (not useState) — avoids re-render on assignment, toast ID only needed for imperative dismiss"
  - "04-02-D3: URL cleanup uses new URL(window.location.href) + searchParams.delete('reason') — preserves all other params including ?next= without manual string manipulation"
metrics:
  duration: 3min
  completed_date: "2026-03-31"
  tasks_completed: 2
  files_changed: 2
---

# Phase 04 Plan 02: Session-Expired Messaging and Code-Based Error Handling Summary

**One-liner:** Login page shows dismissible warning toast on session expiry and branches on AuthErrorCode enum values instead of error string matching.

## What Was Built

### Task 1: API login route returns structured error codes

Modified `ity/apps/web/app/api/auth/login/route.ts` to include `AuthErrorCode` in the 400 error response.

- Added import of `AuthErrorCode` and `getAuthMessage` from `lib/auth/errors`
- On auth failure, classifies the Supabase raw error: "Email not confirmed" maps to `EMAIL_NOT_CONFIRMED`, everything else to `INVALID_CREDENTIALS`
- Returns `{ error: string, code: AuthErrorCode }` instead of `{ error: string }` on status 400
- Rate-limit 429 response left unchanged (separate error handling path per locked decision)

This is the single canonical location for mapping Supabase's raw message strings to the enum — all consumers downstream use the code value.

### Task 2: Session-expired toast and code-based error branching in login page

Modified `ity/apps/web/app/(auth)/login/page.tsx` with four changes:

1. **Added imports**: `useRef` from React, `AuthErrorCode` and `getAuthMessage` from `lib/auth/errors`

2. **Session-expired toast**: New `useEffect` reads `?reason=session_expired` URL param, shows `toast.warning()` with Spanish message ("Tu sesion ha expirado. Por favor, inicia sesion de nuevo."), then cleans the param from the URL via `window.history.replaceState()` preserving all other params (especially `?next=`)

3. **Targeted toast dismiss**: `sessionToastId` stored as `useRef` captures the toast ID returned by `toast.warning()`. Email input `onFocus` handler calls `toast.dismiss(sessionToastId.current)` — dismisses only the session-expired toast, not all toasts

4. **Code-based error branching**: Replaced `json.error?.includes('Email not confirmed')` with `json.code === AuthErrorCode.EMAIL_NOT_CONFIRMED`. Error messages now come from the centralized `AUTH_MESSAGES` map via `getAuthMessage()`. Zero `.includes()` string matches remain in auth pages.

## Verification Results

1. TypeScript compilation: `npx tsc --noEmit` passes with zero errors
2. Login page imports `AuthErrorCode` and `getAuthMessage` from `@/lib/auth/errors`
3. API login route returns `{ error, code }` with `AuthErrorCode` values
4. Login page uses `json.code === AuthErrorCode.EMAIL_NOT_CONFIRMED` — no `.includes()`
5. Login page handles `reason=session_expired` with `toast.warning()` + `replaceState`
6. Toast dismiss uses specific toast ID stored in `useRef` (not `toast.dismiss()` without args)
7. `replaceState` only deletes `reason` param, preserving `next` param
8. Zero `.includes()` patterns in `app/(auth)/` — grep confirms 0 matches

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | `6cbe42a` | feat(04-02): update login route to return structured AuthErrorCode |
| 2 | `feaf817` | feat(04-02): add session-expired toast and code-based error branching to login page |

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- `ity/apps/web/app/api/auth/login/route.ts` — FOUND (modified)
- `ity/apps/web/app/(auth)/login/page.tsx` — FOUND (modified)
- Commit `6cbe42a` — FOUND
- Commit `feaf817` — FOUND
