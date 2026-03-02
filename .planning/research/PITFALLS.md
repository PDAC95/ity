# Domain Pitfalls: Auth & Security Hardening

**Domain:** Authentication & security for Next.js 14 + Supabase + tRPC SaaS
**Researched:** 2026-03-02
**Confidence:** HIGH — derived from direct codebase analysis

---

## Critical Pitfalls

### Pitfall 1: Open Redirect via Unvalidated `next` Parameter
**File:** `apps/web/app/(auth)/callback/route.ts` line 44
**What:** `${origin}${next}` where `next` from query string — `//evil.com` redirects to attacker site.
**Fix:** Allowlist validation: `startsWith('/')`, not `startsWith('//')`, match against known paths.
**Phase:** 1 (security fixes)

### Pitfall 2: `auth.createCreator` Accepts Arbitrary UUIDs
**File:** `packages/api/src/routers/auth.ts`
**What:** `publicProcedure` accepting any UUID as `id`. Attacker pre-creates creator records, locking out real users.
**Fix:** Convert to `protectedProcedure`, use `ctx.user.id`.
**Phase:** 1 (security fixes)

### Pitfall 3: Registration Race Condition
**File:** `apps/web/app/(auth)/register/page.tsx` lines 48-59
**What:** Client calls `signUp()` then `createCreator()` separately. Double-click or callback race creates duplicate/missing state. Error caught via `message.includes('already')` — brittle.
**Fix:** Move all creator provisioning to server-side callback route. Make idempotent with upsert.
**Phase:** 1 + 2

### Pitfall 4: Middleware Double Supabase Client
**File:** `apps/web/middleware.ts`
**What:** `updateSession()` refreshes token, then a second `createServerClient` reads pre-refresh cookies. Double API call, stale data.
**Fix:** Return `{ supabaseResponse, user }` from `updateSession()`.
**Phase:** 1 (security fixes)

### Pitfall 5: Password Reset Session Not Validated
**What:** `/reset-password` calls `updateUser({ password })` without checking for recovery session. Logged-in user navigating directly can change password without email verification.
**Fix:** Verify recovery session type before rendering reset form.
**Phase:** 3 (password reset flow)

---

## Moderate Pitfalls

### Pitfall 6: In-Memory Rate Limiting Fails on Vercel Serverless
**What:** No persistent memory between invocations. In-memory counters reset on cold start.
**Fix:** Upstash Redis + `@upstash/ratelimit`. Manual prereq: create Upstash account, get env vars.
**Phase:** Rate limiting phase. **Manual step required.**

### Pitfall 7: Silent Cookie Errors
**File:** `apps/web/lib/supabase/server.ts` lines 18-22
**What:** Empty `catch {}` in `setAll` hides auth state failures.
**Fix:** `console.warn` in dev mode. Silent in production.
**Phase:** 1

### Pitfall 8: `router.push` Before Cookies Flush
**File:** `apps/web/app/(auth)/login/page.tsx`
**What:** `router.push('/dashboard')` fires before Supabase cookies settle — middleware sees no session, redirect loop.
**Fix:** Use `window.location.href = '/dashboard'` for hard navigation.
**Phase:** 1

### Pitfall 9: PKCE Code Consumed by Middleware Before Callback
**What:** Middleware runs on `/callback`, may redirect to `/login` before code exchange.
**Fix:** Skip auth redirect checks for `/callback` route in middleware.
**Phase:** 2

### Pitfall 10: OAuth `redirectTo` Uses `window.location.origin`
**File:** `apps/web/components/auth/social-button.tsx`
**What:** Must match registered URI in Google Console + Supabase allowlist exactly. Breaks in staging.
**Fix:** Use `process.env.NEXT_PUBLIC_APP_URL`. **Manual step:** configure in 4 places (env, Vercel, Google, Supabase).
**Phase:** 2. **Manual step required.**

### Pitfall 11: Supabase Client Not Passed to tRPC Context
**File:** `apps/web/app/api/trpc/[trpc]/route.ts`
**What:** Only `user` passed to context, not `supabase` client. `ctx.supabase` is always `null`.
**Fix:** Pass `supabase` to `createTRPCContext`.
**Phase:** 1

### Pitfall 12: Sign-Out Route May Be Cached by Edge
**File:** `apps/web/app/api/auth/signout/route.ts`
**What:** 302 redirect without cache headers — `signOut()` may never run.
**Fix:** Add `Cache-Control: no-store` header.
**Phase:** 1

### Pitfall 13: Email Enumeration via `checkEmail` (Out of Scope)
**What:** Public endpoint returns `{ exists: true/false }`.
**Status:** Deferred to future security pass per PROJECT.md.

---

## Phase-Specific Warnings

| Phase | Pitfall | Mitigation |
|-------|---------|------------|
| Security fixes | URL encoding bypasses (`%2F%2F`) | Normalize URL before allowlist check |
| Security fixes | Breaking registration on `protectedProcedure` switch | Test with email-confirmation on and off |
| OAuth | Redirect URI mismatch | Manual step in Supabase + Google Console |
| OAuth | PKCE verifier lost in SSR | Supabase browser client handles via localStorage |
| Password reset | Recovery session not enforced | Check session type before showing form |
| Rate limiting | In-memory implementation | Upstash Redis required — flag prerequisite |
| Session mgmt | Cookie not flushed before navigation | `window.location.href` not `router.push()` |