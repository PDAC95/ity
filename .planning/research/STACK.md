# Technology Stack — Auth & Security

**Project:** 12ity Auth & Security Milestone
**Researched:** 2026-03-02
**Context:** Additive research — existing stack is fixed. This covers only auth/security-specific additions.

---

## Existing Auth Stack (Do Not Change)

Already installed and working:

| Package | Version | Role |
|---------|---------|------|
| @supabase/supabase-js | 2.45.0 | Auth client, session tokens |
| @supabase/ssr | 0.5.0 | SSR cookie adapter for Next.js |
| Next.js | 14.2.0 | App Router, middleware, server actions |
| tRPC | 10.45.0 | API layer with protectedProcedure |
| Drizzle ORM | 0.38.0 | DB queries |
| Zod | 3.23.0 | Input validation (already used everywhere) |

---

## Additions Required for This Milestone

### 1. Rate Limiting

**Recommended: `@upstash/ratelimit` + `@upstash/redis`**

**Why:** Vercel serverless functions are stateless — no shared memory between invocations. In-memory rate limiters reset on every cold start. Upstash Redis is HTTP-based, works in serverless without persistent TCP connections.

**Why not alternatives:**
- `express-rate-limit` — In-memory only, meaningless in serverless
- `rate-limiter-flexible` — Requires persistent TCP connection, incompatible with Vercel without adapter
- Vercel WAF rate limiting — Enterprise plan only

**Confidence:** MEDIUM — Dominant community pattern for Vercel. Versions need npm verification.

| Package | Purpose |
|---------|---------|
| `@upstash/ratelimit` | Sliding window rate limiting algorithms |
| `@upstash/redis` | HTTP Redis client (serverless-compatible) |

**Algorithm:** Sliding Window — Fixed window allows burst attacks at window boundaries. Sliding window eliminates this.

**Rate limits:**
- Login: 5 attempts / 15 min / IP
- Register: 3 attempts / hour / IP
- Auth callback: 10 / min / IP
- Password reset request: 3 / hour / email

**Infrastructure:** Upstash Redis database (free tier at console.upstash.com). New env vars:
```
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

### 2. Supabase SSR Session Management

**No new package needed** — `@supabase/ssr 0.5.0` already installed. **Confidence:** HIGH.

Key rules:
1. **Use `getUser()` not `getSession()`** — `getSession()` reads cookies without server-side JWT validation. `getUser()` validates against Supabase's server.
2. **Session refresh in middleware only** — Server components use already-refreshed cookies.
3. **Silent refresh strategy:** If refresh token valid, `@supabase/ssr` handles automatically. If both tokens expired → redirect to `/login?message=session_expired`.
4. **Fix silent catch** in `apps/web/lib/supabase/server.ts` — Only suppress expected errors in Server Components.

### 3. Open Redirect Prevention

**No new library** — Custom utility function. **Confidence:** HIGH (OWASP pattern).

Allowlist-based validation: `startsWith('/')` + not `startsWith('//')` + path allowlist.

### 4. tRPC Authorization Fix

**No new library** — Use `ctx.user.id` from protectedProcedure instead of user-supplied input. **Confidence:** HIGH.

### 5. Google OAuth

**No new library** — Supabase built-in `signInWithOAuth`. **Confidence:** HIGH.

**Manual step:** Verify OAuth redirect URI in Google Cloud Console matches `https://<project-ref>.supabase.co/auth/v1/callback`.

### 6. Email Verification & Password Reset

**No new library** — Core Supabase Auth features. **Confidence:** HIGH.

**Manual step:** Add password reset callback URL to Supabase "Redirect URLs" allowlist.

---

## Summary: New Packages Required

| Package | Purpose | Confidence |
|---------|---------|------------|
| `@upstash/ratelimit` | Sliding window rate limiting for Vercel serverless | MEDIUM |
| `@upstash/redis` | HTTP Redis client (Upstash), no TCP, serverless-compatible | MEDIUM |

**Everything else is code changes to existing packages.**

## What NOT to Install

| Package | Reason |
|---------|--------|
| `express-rate-limit` | In-memory only, resets on cold start |
| `next-auth` / `auth.js` | Duplicates Supabase Auth, causes session conflicts |
| `jsonwebtoken` | Supabase manages JWT verification |
| `bcrypt` / `argon2` | Supabase manages password hashing |
| `passport` | Express ecosystem, not Next.js App Router |

## Installation

```bash
pnpm add @upstash/ratelimit @upstash/redis --filter @ity/web
```

## Environment Variables Required

```bash
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```