---
phase: 03-rate-limiting
verified: 2026-03-17T18:00:00Z
status: passed
score: 9/9 must-haves verified
re_verification: false
human_verification:
  - test: "Submit login form 6 times with wrong credentials from same IP within 15 minutes"
    expected: "6th attempt returns a visible Spanish rate-limit error message, not a 500 or generic auth error"
    why_human: "Requires real Upstash Redis connection (env vars must be provisioned) and live HTTP calls"
  - test: "Submit forgot-password form 4 times with same email within 1 hour"
    expected: "4th attempt shows rate-limit error message; all 4 responses return success=true (email enumeration not possible)"
    why_human: "Requires live Upstash Redis and real request sequencing to confirm sliding window behavior"
  - test: "Hit /callback 11 times within 1 minute from same IP"
    expected: "11th request redirects to /login?error=too_many_requests; login page displays the rate-limit error banner"
    why_human: "Requires live traffic through middleware; can't be verified by static grep"
---

# Phase 3: Rate Limiting — Verification Report

**Phase Goal:** Auth endpoints are protected against brute-force and abuse via Upstash Redis sliding window rate limits that survive Vercel serverless cold starts
**Verified:** 2026-03-17T18:00:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (from PLAN must_haves + ROADMAP success criteria)

| #  | Truth                                                                                                 | Status     | Evidence                                                                                                    |
|----|-------------------------------------------------------------------------------------------------------|------------|-------------------------------------------------------------------------------------------------------------|
| 1  | 6th login attempt from same IP within 15 minutes returns 429 with Spanish error message               | VERIFIED   | `loginLimiter` uses `slidingWindow(5, '15 m')`; route returns 429 + Spanish message on `!success`          |
| 2  | 4th forgot-password request with same email within 1 hour returns 429                                 | VERIFIED   | `forgotPasswordLimiter` uses `slidingWindow(3, '1 h')`; route returns 429 on `!success`                    |
| 3  | 4th resend-verification request with same email within 1 hour returns 429                             | VERIFIED   | `resendVerificationLimiter` uses `slidingWindow(3, '1 h')`; route returns 429 on `!success`                |
| 4  | 11th callback hit from same IP within 1 minute redirects to login with error                          | VERIFIED   | `callbackLimiter` uses `slidingWindow(10, '1 m')`; middleware redirects to `/login?error=too_many_requests` |
| 5  | Rate-limited responses include Retry-After header and human-readable error (not generic 500)          | VERIFIED   | All 3 API routes and middleware return Retry-After header + Spanish error string on 429                     |
| 6  | Login page submits to /api/auth/login instead of calling Supabase directly                            | VERIFIED   | `login/page.tsx` line 57: `fetch('/api/auth/login', ...)` — no `supabase.auth.*` calls                     |
| 7  | Forgot-password page submits to /api/auth/forgot-password instead of calling Supabase directly        | VERIFIED   | `forgot-password/page.tsx` line 29: `fetch('/api/auth/forgot-password', ...)` — no `supabase.auth.*` calls |
| 8  | Verify-email resend button calls /api/auth/resend-verification instead of calling Supabase directly   | VERIFIED   | `verify-email/page.tsx` line 28: `fetch('/api/auth/resend-verification', ...)` — no `supabase.auth.*` calls |
| 9  | All three pages show a Spanish rate-limit error when receiving a 429 response                         | VERIFIED   | All pages: `if (res.status === 429) { setServerError(json.error) }` — renders error in red banner           |

**Score:** 9/9 truths verified

---

### Required Artifacts

| Artifact                                                          | Expected                                        | Status     | Details                                                                           |
|-------------------------------------------------------------------|-------------------------------------------------|------------|-----------------------------------------------------------------------------------|
| `ity/apps/web/lib/ratelimit/limiters.ts`                          | 4 Ratelimit instances + getClientIp helper       | VERIFIED   | All 4 limiters exported; `getClientIp` exported; 49 lines — substantive          |
| `ity/apps/web/app/api/auth/login/route.ts`                        | POST handler — rate-limited login proxy          | VERIFIED   | Exports `POST`; calls `loginLimiter.limit(ip)` before `signInWithPassword`        |
| `ity/apps/web/app/api/auth/forgot-password/route.ts`              | POST handler — rate-limited forgot-pw proxy      | VERIFIED   | Exports `POST`; calls `forgotPasswordLimiter.limit(identifier)` before Supabase  |
| `ity/apps/web/app/api/auth/resend-verification/route.ts`          | POST handler — rate-limited resend proxy         | VERIFIED   | Exports `POST`; calls `resendVerificationLimiter.limit(identifier)` before Supabase |
| `ity/apps/web/app/(auth)/login/page.tsx`                          | fetch to /api/auth/login with 429 handling       | VERIFIED   | `fetch('/api/auth/login')` at line 57; 429 branch + `too_many_requests` error URL param handled |
| `ity/apps/web/app/(auth)/forgot-password/page.tsx`                | fetch to /api/auth/forgot-password with 429 handling | VERIFIED | `fetch('/api/auth/forgot-password')` at line 29; 429 branch present              |
| `ity/apps/web/app/(auth)/verify-email/page.tsx`                   | fetch to /api/auth/resend-verification with 429 handling | VERIFIED | `fetch('/api/auth/resend-verification')` at line 28; 429 branch + `resendError` state rendered |
| `ity/apps/web/middleware.ts`                                       | Callback rate limiting before updateSession      | VERIFIED   | `/callback` check at top of `middleware()`; early `NextResponse.next()` preserves PKCE |
| `ity/apps/web/package.json`                                        | @upstash/ratelimit and @upstash/redis present    | VERIFIED   | `"@upstash/ratelimit": "^2.0.8"`, `"@upstash/redis": "^1.37.0"`                 |

---

### Key Link Verification

| From                                         | To                            | Via                                    | Status   | Details                                                                                          |
|----------------------------------------------|-------------------------------|----------------------------------------|----------|--------------------------------------------------------------------------------------------------|
| `app/api/auth/login/route.ts`                | `lib/ratelimit/limiters.ts`   | `import loginLimiter, getClientIp`     | WIRED    | Line 3 import confirmed; `loginLimiter.limit(ip)` called at line 7                              |
| `app/api/auth/forgot-password/route.ts`      | `lib/ratelimit/limiters.ts`   | `import forgotPasswordLimiter`         | WIRED    | Line 3 import confirmed; `forgotPasswordLimiter.limit(identifier)` called at line 11            |
| `app/api/auth/resend-verification/route.ts`  | `lib/ratelimit/limiters.ts`   | `import resendVerificationLimiter`     | WIRED    | Line 3 import confirmed; `resendVerificationLimiter.limit(identifier)` called at line 11        |
| `middleware.ts`                              | `lib/ratelimit/limiters.ts`   | `import callbackLimiter, getClientIp`  | WIRED    | Line 3 import confirmed; `callbackLimiter.limit(ip)` called at line 10                          |
| `app/(auth)/login/page.tsx`                  | `/api/auth/login`             | `fetch POST on form submit`            | WIRED    | `fetch('/api/auth/login', { method: 'POST', ... })` at line 57; response handled in both 429 and non-ok branches |
| `app/(auth)/forgot-password/page.tsx`        | `/api/auth/forgot-password`   | `fetch POST on form submit`            | WIRED    | `fetch('/api/auth/forgot-password', { method: 'POST', ... })` at line 29; response handled      |
| `app/(auth)/verify-email/page.tsx`           | `/api/auth/resend-verification` | `fetch POST on resend click`         | WIRED    | `fetch('/api/auth/resend-verification', { method: 'POST', ... })` at line 28; response handled  |

---

### Requirements Coverage

| Requirement | Source Plan(s) | Description                                                              | Status    | Evidence                                                                                          |
|-------------|---------------|--------------------------------------------------------------------------|-----------|---------------------------------------------------------------------------------------------------|
| RATE-01     | 03-01, 03-02  | Login endpoint rate-limited to 5 req/15 min per IP (sliding window)      | SATISFIED | `slidingWindow(5, '15 m')` in limiters.ts; login route checks before Supabase call; login page calls route |
| RATE-02     | 03-01, 03-02  | Forgot-password endpoint rate-limited to 3 req/hour per email            | SATISFIED | `slidingWindow(3, '1 h')` in limiters.ts; forgot-pw route checks before Supabase call; page calls route |
| RATE-03     | 03-01, 03-02  | Email verification resend rate-limited to 3 req/hour per email           | SATISFIED | `slidingWindow(3, '1 h')` in limiters.ts; resend route checks before Supabase call; verify-email page calls route |
| RATE-04     | 03-01         | Auth callback rate-limited to 10 req/min per IP                          | SATISFIED | `slidingWindow(10, '1 m')` in limiters.ts; middleware checks `/callback` by IP with early return to preserve PKCE |
| RATE-05     | 03-01, 03-02  | Rate-limited requests receive clear error message (not generic 500)      | SATISFIED | All 3 routes return `429` with Spanish string + `Retry-After`; middleware redirects with `error=too_many_requests`; all client pages render the error visibly |

No orphaned requirements — all 5 RATE IDs declared in both plans and all 5 map to verified implementation.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `app/(auth)/login/page.tsx` | 130, 156 | `placeholder` attribute | Info | HTML `<input placeholder>` — not a code anti-pattern |
| `app/(auth)/forgot-password/page.tsx` | 119 | `placeholder` attribute | Info | HTML `<input placeholder>` — not a code anti-pattern |

No blockers. No warnings. The placeholder matches are HTML input field labels, not code stubs.

---

### Implementation Notes

**Security correctness verified:**

- Email normalization (`toLowerCase().trim()`) before rate limit key in both forgot-password and resend routes — prevents case-sensitivity bypass (e.g., `User@Example.com` and `user@example.com` share the same bucket).
- Forgot-password returns `{ success: true }` even when Supabase returns "User not found" — prevents email enumeration. Only genuine server failures (non-"User not found" errors) return a 500.
- Callback rate limiting uses early `NextResponse.next()` after passing the check, bypassing `updateSession()`. This preserves the PKCE verifier cookie — `getUser()` cannot run before `exchangeCodeForSession()` in the callback route handler.
- `analytics: false` on all Ratelimit instances avoids a pending serverless Promise anti-pattern documented in Upstash research.
- Middleware matcher regex no longer contains `callback|` exclusion — `/callback` now runs through middleware and receives rate limiting.

**TypeScript:** `npx tsc --noEmit` exits with zero errors across the full app.

---

### Human Verification Required

The following behaviors require a running Upstash Redis instance and live HTTP traffic to verify.

#### 1. Login Rate Limit End-to-End

**Test:** Submit the login form 6 times in rapid succession with valid email but wrong password from the same IP.
**Expected:** The 6th attempt shows "Demasiados intentos. Intenta de nuevo en unos minutos." in the red error banner on the login page. Attempts 1-5 return "Email o contrasena incorrectos".
**Why human:** Requires `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to be provisioned and real HTTP requests to trigger the sliding window counter.

#### 2. Forgot-Password Rate Limit End-to-End

**Test:** Submit the forgot-password form 4 times with the same email address within 1 hour.
**Expected:** The 4th attempt shows "Demasiadas solicitudes. Intenta de nuevo mas tarde." All 4 requests (including rate-limited ones) do not reveal whether the email exists in the system.
**Why human:** Requires live Upstash Redis and real request sequencing.

#### 3. Callback Rate Limit and Login Page Error Display

**Test:** Trigger 11 `/callback` requests within 1 minute from the same IP (e.g., using curl in a loop).
**Expected:** The 11th request redirects to `/login?error=too_many_requests`. The login page displays the "Demasiados intentos" message in both the toast notification and the red error banner.
**Why human:** Requires live middleware execution with real IP headers.

---

## Summary

Phase 3 goal is fully achieved. All four auth flows are protected by server-side Upstash sliding window rate limits:

- **Login (RATE-01):** 5 req/15 min per IP via `/api/auth/login` route
- **Forgot password (RATE-02):** 3 req/1 hour per email via `/api/auth/forgot-password` route
- **Resend verification (RATE-03):** 3 req/1 hour per email via `/api/auth/resend-verification` route
- **OAuth callback (RATE-04):** 10 req/1 min per IP via middleware with PKCE-safe early return

All three client pages (login, forgot-password, verify-email) have been refactored to call server-side proxies instead of Supabase directly, closing the rate-limiting circuit — client pages can no longer bypass limits by calling Supabase from the browser. All 429 responses carry Spanish-language error messages and `Retry-After` headers (RATE-05). TypeScript compiles clean with zero errors across the app.

The only remaining action is external service provisioning: Upstash Redis credentials must be added to `.env.local` and Vercel environment variables before the rate limits can function at runtime.

---

_Verified: 2026-03-17T18:00:00Z_
_Verifier: Claude (gsd-verifier)_
