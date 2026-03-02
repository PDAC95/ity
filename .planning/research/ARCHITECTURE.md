# Architecture: Auth & Security

**Domain:** Auth hardening for Next.js 14 + Supabase + tRPC SaaS
**Researched:** 2026-03-02
**Confidence:** HIGH (from direct source code audit)

---

## Three-Layer Auth Stack

### Layer 1: Supabase Auth (Browser)
- **Files:** `apps/web/lib/supabase/client.ts`, `apps/web/components/auth/*`
- **Role:** Manages signIn/signUp/OAuth/reset via browser-side `@supabase/ssr` client
- **Session:** Cookie-based, refreshed by Layer 2

### Layer 2: Next.js Middleware
- **Files:** `apps/web/middleware.ts`, `apps/web/lib/supabase/middleware.ts`
- **Role:** Refreshes JWT on every request, handles auth redirects (login ↔ dashboard)
- **Defect:** Creates a SECOND Supabase client that reads pre-refresh cookie state — double API call, stale data

### Layer 3: tRPC Context
- **Files:** `packages/api/src/trpc.ts`, `apps/web/app/api/trpc/[trpc]/route.ts`
- **Role:** Extracts authenticated user for `protectedProcedure` / `studentProcedure`
- **Defect:** `createCreator` is `publicProcedure` accepting arbitrary UUID; supabase client not passed to context

### Auth Callback Hub
- **File:** `apps/web/app/(auth)/callback/route.ts`
- **Role:** Hub for ALL auth flows (login, register, OAuth, email verify, password reset)
- **Defects:** Open redirect via unvalidated `next` param; unconditional creator creation on every callback

---

## Data Flow Per Auth Operation

### Registration (email/password)
```
Browser → signUp() → Supabase sends verification email
  → User clicks verify link → /callback?code=XXX&next=/dashboard
  → Callback: exchangeCodeForSession → creator insert → redirect
```
**Issue:** Client also calls `createCreator` independently — race condition with callback.

### Login (email/password)
```
Browser → signInWithPassword() → router.push('/dashboard')
  → Middleware: updateSession() → getUser() [double client] → allow/redirect
```
**Issue:** `router.push` fires before cookies flush — potential redirect loop.

### Google OAuth
```
Browser → signInWithOAuth({ provider: 'google' })
  → Google consent → Supabase callback → /callback?code=XXX
  → Callback: exchangeCodeForSession → creator upsert → redirect
```
**Issue:** `redirectTo` uses `window.location.origin` instead of env var.

### Password Reset
```
Browser → resetPasswordForEmail() → Supabase sends reset email
  → User clicks link → /callback?code=XXX&next=/reset-password
  → Callback: exchangeCodeForSession [recovery session] → redirect
  → /reset-password: updateUser({ password })
```
**Issue:** No verification that a recovery session exists before allowing password change.

### Session Refresh (every request)
```
Request → Middleware: updateSession()
  → @supabase/ssr refreshes token if needed → writes cookies to response
  → [BUG: second client reads pre-refresh cookies]
  → tRPC: getUser() per request → ctx.user for procedures
```

---

## Anti-Patterns Found

| Pattern | Current Code | Fix |
|---------|-------------|-----|
| Double Supabase client in middleware | `updateSession()` then new `createServerClient` | Return `{ response, user }` from `updateSession()` |
| Public procedure for user creation | `createCreator: publicProcedure` | Convert to `protectedProcedure`, use `ctx.user.id` |
| Unvalidated redirect | `redirect(${origin}${next})` | Allowlist validation utility |
| Silent cookie errors | Empty `catch {}` in `setAll` | Dev-mode `console.warn`, production silent |
| String-based error detection | `message.includes('already')` | Supabase error codes |

---

## Rate Limiting Placement

**Where:** Next.js middleware (runs before route handlers, single enforcement point)

**Why not tRPC:** Rate limiting needs to catch unauthenticated requests. tRPC procedures run after auth context creation. Middleware runs first.

**Implementation:** Upstash Redis via `@upstash/ratelimit` — HTTP-based, works in Vercel serverless.

**Targets:**
- `/callback` — 10 req/min/IP
- `/(auth)/login` POST — 5 req/15min/IP
- `/(auth)/forgot-password` POST — 3 req/hour/email
- `/(auth)/verify-email` resend — 3 req/hour/email

---

## Build Order (Dependency-Based)

```
Phase 1: Security Foundation (unblocks everything)
  ├── Fix open redirect in callback
  ├── Fix createCreator → protectedProcedure
  ├── Fix middleware double-client
  ├── Add cookie error logging
  ├── Pass supabase client to tRPC context
  └── Fix sign-out route caching

Phase 2: Complete Auth Flows (depends on Phase 1)
  ├── Google OAuth end-to-end
  ├── Email verification callback handling
  ├── Password reset recovery session validation
  ├── Creator provisioning → idempotent upsert in callback
  └── Post-login navigation fix (window.location.href)

Phase 3: Rate Limiting (depends on Phase 1)
  ├── Upstash Redis setup (manual step)
  ├── Rate limit middleware utility
  └── Apply to login, forgot-password, resend, callback

Phase 4: Session Management (depends on Phase 1)
  ├── Session expiry detection + redirect with message
  ├── Login page "session expired" display
  └── Consistent error handling across layers
```