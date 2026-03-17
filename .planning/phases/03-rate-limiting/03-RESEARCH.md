# Phase 3: Rate Limiting - Research

**Researched:** 2026-03-17
**Domain:** Upstash Redis sliding window rate limiting in Next.js 14 App Router (serverless/Vercel)
**Confidence:** HIGH

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| RATE-01 | Login endpoint rate-limited to 5 attempts per 15 minutes per IP (sliding window via Upstash Redis) | API route proxy pattern; Ratelimit.slidingWindow(5, "15 m"); identifier = client IP |
| RATE-02 | Forgot-password endpoint rate-limited to 3 requests per hour per email | API route proxy pattern; Ratelimit.slidingWindow(3, "1 h"); identifier = email address |
| RATE-03 | Email verification resend rate-limited to 3 requests per hour per email | API route proxy pattern; Ratelimit.slidingWindow(3, "1 h"); identifier = email address |
| RATE-04 | Auth callback route rate-limited to 10 requests per minute per IP | Next.js middleware (already server-side); Ratelimit.slidingWindow(10, "1 m"); identifier = client IP |
| RATE-05 | Rate-limited requests receive a clear error message (not a generic 500) | HTTP 429 with JSON body `{ error: "...", retryAfter }` from route handlers; redirect to error page from middleware |
</phase_requirements>

---

## Summary

This phase adds Upstash Redis sliding window rate limiting to four auth endpoints. The project uses `@upstash/ratelimit` v2 with `@upstash/redis` as the HTTP-based Redis client — the only connectionless rate limiting library designed for serverless runtimes, which means it survives Vercel cold starts without TCP connection overhead.

**Critical architectural finding:** Three of the four endpoints that need rate limiting (login, forgot-password, verify-email resend) are currently **client-side** — they call Supabase directly from the browser using `createClient()`. You cannot rate-limit by IP from the browser. Each of these three pages must be refactored to POST to a new Next.js API route handler that (1) applies the rate limit check, (2) then calls Supabase server-side, and (3) returns the result. The callback route (`/callback`) is already a server-side route handler and can be rate-limited directly in Next.js middleware by URL pattern.

The requirements as written (success criteria) specify: 6th login attempt, 4th forgot-password attempt, 4th resend attempt, 11th callback hit. This means RATE-01 allows 5 attempts (6th is blocked), RATE-02/RATE-03 allow 3 (4th blocked), RATE-04 allows 10 (11th blocked) — matching the requirements exactly.

**Primary recommendation:** Install `@upstash/ratelimit@^2.0.0` and `@upstash/redis`, create three new API route handlers as server-side proxies for the currently-client-side flows, rate-limit the callback in Next.js middleware, and centralize all rate limit logic in `lib/ratelimit/`.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@upstash/ratelimit` | ^2.0.0 (latest: 2.0.8) | Sliding window rate limiting with Redis | The only HTTP-based (connectionless) rate limit lib for serverless; works in Vercel Edge and Node runtimes; official Vercel template uses it |
| `@upstash/redis` | latest | HTTP Redis client for Upstash | Required peer; `Redis.fromEnv()` auto-reads env vars; no TCP connections |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Already installed: `next` | ^14.2.0 | Route handlers + middleware | Rate limit in middleware (callback) and API routes (login, forgot-pw, resend) |
| Already installed: `sonner` | ^2.0.7 | Toast notifications | Display rate limit errors on client pages |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@upstash/ratelimit` | `rate-limiter-flexible` with Redis | Requires persistent TCP connection — does not survive cold starts |
| `@upstash/ratelimit` | Next.js middleware in-memory Map | Lost on cold start, not shared across Vercel edge instances — unusable |
| `@upstash/ratelimit` | Supabase built-in rate limiting | Supabase rate limits are per-project not configurable per-endpoint; cannot implement per-email limits |

**Installation:**
```bash
cd ity/apps/web && pnpm add @upstash/ratelimit @upstash/redis
```

**Required environment variables** (blocked by STATE.md prerequisite — must be created before implementation):
```
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...
```

---

## Architecture Patterns

### Recommended Project Structure

The refactoring adds a `lib/ratelimit/` module and three new API route handlers:

```
ity/apps/web/
├── lib/
│   └── ratelimit/
│       └── limiters.ts          # All Ratelimit instances, getClientIp() helper
├── app/
│   └── api/
│       └── auth/
│           ├── login/
│           │   └── route.ts     # POST — rate-limited Supabase signInWithPassword proxy
│           ├── forgot-password/
│           │   └── route.ts     # POST — rate-limited Supabase resetPasswordForEmail proxy
│           └── resend-verification/
│               └── route.ts     # POST — rate-limited Supabase resend proxy
└── middleware.ts                # Extended: rate-limit /callback by IP before Supabase handler
```

The three client pages (login, forgot-password, verify-email) are updated to `fetch()` these new API routes instead of calling Supabase directly.

### Pattern 1: Centralized Rate Limiters Module

**What:** One file exports all Ratelimit instances and the IP extraction helper. Prevents duplicate Redis connections and makes limits easy to audit.

**When to use:** Always — singleton pattern avoids recreating instances per request.

```typescript
// lib/ratelimit/limiters.ts
// Source: https://upstash.com/docs/redis/sdks/ratelimit-ts/gettingstarted
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

// RATE-01: 5 attempts per 15 minutes per IP
export const loginLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'),
  prefix: 'rl:login',
  analytics: true,
});

// RATE-02: 3 requests per hour per email
export const forgotPasswordLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '1 h'),
  prefix: 'rl:forgot-pw',
  analytics: true,
});

// RATE-03: 3 requests per hour per email
export const resendVerificationLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '1 h'),
  prefix: 'rl:resend-verify',
  analytics: true,
});

// RATE-04: 10 requests per minute per IP (used in middleware)
export const callbackLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  prefix: 'rl:callback',
  analytics: true,
});

// IP extraction: handles Vercel proxy chain, Cloudflare, and direct connections
export function getClientIp(request: Request | import('next/server').NextRequest): string {
  const headers = request.headers;
  return (
    headers.get('cf-connecting-ip') ??      // Cloudflare (worker is in the stack)
    headers.get('x-real-ip') ??
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    '127.0.0.1'
  );
}
```

### Pattern 2: API Route Handler with Rate Limit (IP-based)

**What:** A POST route handler that checks the rate limit before calling Supabase. Returns 429 with a JSON error on block.

**When to use:** Login endpoint (RATE-01), callback (RATE-04 via middleware variant).

```typescript
// app/api/auth/login/route.ts
// Source: https://upstash.com/docs/redis/sdks/ratelimit-ts/methods (limit() return type)
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { loginLimiter, getClientIp } from '@/lib/ratelimit/limiters';

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { success, reset, remaining } = await loginLimiter.limit(ip);

  if (!success) {
    const retryAfterSec = Math.ceil((reset - Date.now()) / 1000);
    return NextResponse.json(
      {
        error: 'Demasiados intentos. Intenta de nuevo en unos minutos.',
        retryAfter: retryAfterSec,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfterSec),
          'X-RateLimit-Remaining': String(remaining),
        },
      }
    );
  }

  const { email, password } = await request.json();
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
```

### Pattern 3: API Route Handler with Rate Limit (email-based)

**What:** POST handler that uses the email from the request body as the identifier. Per-email limiting prevents a single actor from hammering reset flows.

**When to use:** Forgot-password (RATE-02) and resend-verification (RATE-03).

```typescript
// app/api/auth/forgot-password/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { forgotPasswordLimiter } from '@/lib/ratelimit/limiters';

export async function POST(request: Request) {
  const { email, redirectTo } = await request.json();

  // Identifier is normalized email — prevents trivial bypass via case variation
  const identifier = email.toLowerCase().trim();
  const { success, reset } = await forgotPasswordLimiter.limit(identifier);

  if (!success) {
    const retryAfterSec = Math.ceil((reset - Date.now()) / 1000);
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Intenta de nuevo mas tarde.' },
      { status: 429, headers: { 'Retry-After': String(retryAfterSec) } }
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

  // Always return success to prevent email enumeration
  if (error && !error.message.includes('User not found')) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
```

### Pattern 4: Middleware Rate Limit for /callback

**What:** The existing `middleware.ts` is already server-side. Add a URL-pattern check for `/callback` before the `updateSession()` call, return a JSON 429 directly from middleware.

**When to use:** RATE-04 — callback is a GET route, not a form POST, so a middleware intercept is the right layer.

```typescript
// middleware.ts — additions to existing file
import { callbackLimiter, getClientIp } from '@/lib/ratelimit/limiters';

export async function middleware(request: NextRequest) {
  // Rate-limit callback before any auth processing
  if (request.nextUrl.pathname.startsWith('/callback')) {
    const ip = getClientIp(request);
    const { success } = await callbackLimiter.limit(ip);
    if (!success) {
      return NextResponse.redirect(new URL('/login?error=too_many_requests', request.url));
    }
  }

  const { response, user } = await updateSession(request);
  // ... rest of existing logic unchanged
}
```

Note: The middleware matcher currently **excludes** `/callback`. The matcher must be updated to include `/callback` for RATE-04, while keeping `auth/confirm` excluded.

### Pattern 5: Client-Side Page Fetch Pattern

**What:** Refactored login page calls the API proxy instead of Supabase directly. Error handling includes detecting the 429 status.

**When to use:** All three currently-client-side pages after creating their API route proxies.

```typescript
// In login page onSubmit (replacing direct supabase.auth.signInWithPassword call)
const res = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: data.email, password: data.password }),
});

if (res.status === 429) {
  setServerError('Demasiados intentos. Intenta de nuevo en unos minutos.');
  return;
}

if (!res.ok) {
  const json = await res.json();
  // existing error handling logic
  return;
}

// success — redirect as before
const nextParam = searchParams.get('next');
const safeRedirect = isAllowedRedirect(nextParam);
window.location.href = safeRedirect;
```

### Anti-Patterns to Avoid

- **Rate limiting in middleware for form POSTs:** Middleware runs on every matched route. For form submissions, the rate limit check must happen in the route handler where the email identifier is available in the request body — middleware only has access to headers and URL.
- **Multiple Ratelimit instances with same prefix:** Each `new Ratelimit({ prefix: 'x' })` shares the same Redis key namespace. Use distinct prefixes per endpoint.
- **Not awaiting `pending`:** The `limit()` return includes a `pending` Promise for analytics. In serverless functions without `waitUntil()`, analytics may not flush. Call `event.waitUntil(pending)` in middleware if using analytics, or accept that some analytics calls may be dropped.
- **Using `request.ip` directly:** Vercel sets `request.ip` in Edge middleware but it is `undefined` in Node.js runtime route handlers. Always use the header-parsing `getClientIp()` helper for portability across runtimes.
- **Hardcoding Redis URL:** Always use `Redis.fromEnv()` or the env var pattern — never hardcode credentials.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sliding window counter | Custom Redis INCR + EXPIRE | `@upstash/ratelimit` | Race conditions at window boundary; requires Lua scripts; clock skew issues |
| In-memory rate limit | `Map<string, number>` in module scope | `@upstash/ratelimit` | Lost on cold start; not shared across concurrent Vercel instances |
| Token bucket | Custom logic | `Ratelimit.tokenBucket()` | Subtle math errors; bucket drain concurrency issues |
| IP extraction | Custom header parsing | `getClientIp()` utility (above) | Must handle Cloudflare + Vercel proxy chain ordering correctly |
| 429 response shape | Custom error body | Standard `{ error, retryAfter }` pattern | Sonner toast already in place; client just needs to read `error` field |

**Key insight:** Serverless rate limiting looks simple but has three hard problems: distributed counter state (no shared memory), atomic window boundaries (Lua on Redis), and cold-start counter loss. `@upstash/ratelimit` solves all three.

---

## Common Pitfalls

### Pitfall 1: Client-side flows cannot be rate-limited by IP
**What goes wrong:** Login, forgot-password, and resend-verification currently call `supabase.auth.*` from the browser. There is no server that can inspect the client IP.
**Why it happens:** The current architecture prioritizes simplicity — no route handler needed for flows that don't require server-side session access.
**How to avoid:** Create thin API route proxies. The proxy receives the request, extracts IP from headers, applies rate limit, then calls Supabase server-side.
**Warning signs:** If you try to add rate limiting and the IP is always `127.0.0.1` or `::1`, you forgot to proxy.

### Pitfall 2: Middleware matcher excludes /callback
**What goes wrong:** The current middleware matcher explicitly excludes `callback`. If you add the callback rate limit to middleware without updating the matcher, it will never run.
**Why it happens:** The callback exclusion was added in Phase 2 to prevent middleware `getUser()` from consuming the PKCE verifier before the route handler.
**How to avoid:** Update the matcher to **include** `/callback` (for rate limit check), but execute the rate limit check **before** calling `updateSession()`. The PKCE concern was about `getUser()` consuming the code — not about middleware running at all.
**Warning signs:** Rate limit counter never increments for callback requests.

### Pitfall 3: `request.ip` is undefined in Node.js route handlers
**What goes wrong:** `request.ip` works in Edge middleware but returns `undefined` in the default Node.js runtime used by App Router route handlers.
**Why it happens:** `request.ip` is a Vercel Edge Runtime extension, not standard Web API.
**How to avoid:** Always use `request.headers.get('x-forwarded-for')` chain in route handlers. The `getClientIp()` helper in Pattern 1 above handles this correctly.
**Warning signs:** `identifier` is `undefined` or `'undefined'` as a string in Redis keys.

### Pitfall 4: Email identifier case sensitivity
**What goes wrong:** `user@Example.com` and `user@example.com` get separate rate limit counters, defeating per-email limits.
**Why it happens:** Redis keys are case-sensitive; email addresses are case-insensitive by convention.
**How to avoid:** Always `email.toLowerCase().trim()` before passing as identifier to `limiter.limit()`.
**Warning signs:** A determined user submits with mixed case and sees fresh limits.

### Pitfall 5: Forgot-password always returns success (email enumeration)
**What goes wrong:** Returning a 400 error when an email doesn't exist in the database tells an attacker which emails are registered.
**Why it happens:** Naively passing Supabase's error through to the client.
**How to avoid:** Return `{ success: true }` for both "email exists" and "email not found" Supabase responses. Only surface actual server errors (network failure, etc.) as 500.
**Warning signs:** `error.message` contains "User not found" leaking to client.

### Pitfall 6: Analytics `pending` not awaited in serverless
**What goes wrong:** The `pending` Promise from `limit()` resolves asynchronously. Without `waitUntil()`, the Vercel function may terminate before analytics flush to Upstash.
**Why it happens:** Vercel serverless functions terminate after the response is sent.
**How to avoid:** Either disable `analytics: false` (simplest), or use `NextFetchEvent.waitUntil(pending)` in middleware. For route handlers, analytics loss is acceptable — disable in route handlers if needed.
**Warning signs:** Upstash analytics dashboard shows zero events despite rate limiting being triggered.

### Pitfall 7: RATE-04 callback uses GET, not POST
**What goes wrong:** You might try to create an API route proxy for the callback like the other three endpoints. But `/callback` is a GET redirect from Google/Supabase — you cannot change it to POST.
**Why it happens:** OAuth redirect flows always use GET.
**How to avoid:** Use Next.js middleware for RATE-04 (not an API route proxy). The middleware intercepts the GET request before the route handler runs.
**Warning signs:** Trying to wrap callback in a POST route and OAuth redirects break.

---

## Code Examples

Verified patterns from official sources:

### Complete limit() Response Destructuring
```typescript
// Source: https://upstash.com/docs/redis/sdks/ratelimit-ts/methods
const { success, limit, remaining, reset, pending } = await ratelimiter.limit(identifier);
// success: boolean — pass (true) or exceeded (false)
// limit: number — max requests in window
// remaining: number — requests left in current window
// reset: number — Unix timestamp (ms) when window resets
// pending: Promise<unknown> — analytics/multi-region sync
```

### Sliding Window Constructor
```typescript
// Source: https://upstash.com/docs/redis/sdks/ratelimit-ts/gettingstarted
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),                       // reads UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
  limiter: Ratelimit.slidingWindow(5, '15 m'),  // 5 requests per 15 minutes
  prefix: 'rl:login',                           // namespaces Redis keys
  analytics: true,                              // optional Upstash console tracking
});
```

### Time Window String Format
```typescript
// Source: https://github.com/upstash/ratelimit-js (README examples)
// Supported formats: "10 s", "15 m", "1 h", "1 d"
// Use these exact strings — the library parses them, not raw milliseconds
Ratelimit.slidingWindow(5, '15 m')   // RATE-01: login
Ratelimit.slidingWindow(3, '1 h')    // RATE-02/03: forgot-pw, resend
Ratelimit.slidingWindow(10, '1 m')   // RATE-04: callback
```

### 429 Response from Route Handler
```typescript
// Source: https://www.hashbuilds.com/articles/next-js-rate-limiting-upstash-redis-implementation-tutorial
// (verified against Next.js App Router Response.json() API)
if (!success) {
  const retryAfterSec = Math.ceil((reset - Date.now()) / 1000);
  return NextResponse.json(
    { error: 'Demasiados intentos. Intenta de nuevo en unos minutos.' },
    {
      status: 429,
      headers: { 'Retry-After': String(retryAfterSec) },
    }
  );
}
```

### Middleware Rate Limit for GET Routes
```typescript
// Source: https://upstash.com/blog/edge-rate-limiting
// Middleware returns redirect (not JSON) — client is a browser following a redirect
if (!success) {
  return NextResponse.redirect(new URL('/login?error=too_many_requests', request.url));
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| In-memory rate limiting (Map) | Redis-backed sliding window | ~2022 (serverless became standard) | Required — in-memory counters are lost on cold start, not shared across instances |
| Fixed window counters | Sliding window | Always preferred | Fixed window allows 2x burst at window boundary; sliding window prevents this |
| `ioredis` / `redis` npm with TCP | `@upstash/redis` HTTP client | ~2021 with Upstash launch | TCP connections don't survive cold starts; HTTP client works in all runtimes |

**Current project: `@upstash/ratelimit` v2.0.8** (released 2026-01-12 per GitHub) — stable API, no breaking changes expected in v2.x.

---

## Open Questions

1. **Middleware matcher update for /callback**
   - What we know: The current matcher string `'/((?!_next/static|_next/image|favicon.ico|api/|auth/confirm|callback|.*\\.(?:svg|...)$).*)'` explicitly excludes `callback`.
   - What's unclear: Whether adding the callback rate limit inside middleware (before `updateSession()`) is safe given the Phase 2 PKCE concern, or whether a separate rate-limit-only middleware pass is needed.
   - Recommendation: The PKCE issue was caused by `getUser()` consuming the code — not by middleware running. It is safe to add the rate limit check at the top of the middleware function for `/callback` URLs, as long as the rate limit runs before `updateSession()` is called. If the rate limit passes, fall through to `updateSession()` normally. The matcher must be updated to not exclude `callback`.

2. **Upstash Redis database provisioning**
   - What we know: STATE.md flags this as a prerequisite: "Upstash Redis database must be created and env vars added before Phase 3 can be implemented."
   - What's unclear: Whether the database already exists or needs to be created.
   - Recommendation: Wave 0 of the plan must include a manual task: create Upstash Redis database, add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to `.env.local` and Vercel project env vars.

3. **Login page cookie handling after server-side proxy**
   - What we know: The current login page calls `supabase.auth.signInWithPassword()` directly, which sets cookies automatically via `@supabase/ssr`. When proxied through an API route, the route handler calls `createClient()` which uses Supabase SSR — cookies are set via `Next-Set-Cookie` headers in the response.
   - What's unclear: Whether `window.location.href` redirect after a successful API proxy call correctly picks up the cookies set by the server-side route handler.
   - Recommendation: The API route handler uses `createClient()` (server-side SSR client) which sets `Set-Cookie` headers on the response. The browser receives these headers on the fetch response. The subsequent `window.location.href` navigation will carry those cookies. This should work, but must be verified in testing.

---

## Sources

### Primary (HIGH confidence)
- https://upstash.com/docs/redis/sdks/ratelimit-ts/gettingstarted — constructor, `Redis.fromEnv()`, installation
- https://upstash.com/docs/redis/sdks/ratelimit-ts/methods — complete `limit()` return type: success, limit, remaining, reset, pending
- https://upstash.com/docs/redis/sdks/ratelimit-ts/features — algorithm options, ephemeralCache, prefix, analytics, timeout
- https://github.com/upstash/ratelimit-js — version 2.0.8 confirmed, algorithm signatures, identifier patterns

### Secondary (MEDIUM confidence)
- https://upstash.com/blog/edge-rate-limiting — `request.ip` in Edge middleware, redirect pattern for middleware rate limits
- https://www.hashbuilds.com/articles/next-js-rate-limiting-upstash-redis-implementation-tutorial — `getClientIp()` multi-header pattern, 429 response shape with `retryAfter`
- https://www.cloudapp.dev/nextjs-14-rate-limiting-with-upstash-redis-made-easy — `NextResponse.json({ error }, { status: 429 })` pattern

### Tertiary (LOW confidence — validate before use)
- WebSearch result: "Using `request.ip` is undefined in Node.js runtime" — needs validation in the actual Vercel deployment; verified by multiple community sources but not official Vercel docs

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — `@upstash/ratelimit` v2.0.8 confirmed via GitHub; API verified against official Upstash docs
- Architecture: HIGH — client-side vs server-side distinction confirmed by reading actual source files; proxy pattern is well-established
- Pitfalls: HIGH — middleware matcher exclusion verified by reading actual middleware.ts; IP header issue verified by multiple independent sources

**Research date:** 2026-03-17
**Valid until:** 2026-06-17 (90 days — `@upstash/ratelimit` v2 API is stable)
