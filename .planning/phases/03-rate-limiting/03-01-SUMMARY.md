---
phase: 03-rate-limiting
plan: 01
subsystem: auth
tags: [upstash, redis, rate-limiting, middleware, next-api-routes]

# Dependency graph
requires:
  - phase: 02-complete-auth-flows
    provides: middleware.ts with updateSession, /callback route, supabase server client
provides:
  - lib/ratelimit/limiters.ts with 4 Ratelimit instances and getClientIp helper
  - app/api/auth/login/route.ts — IP-rate-limited Supabase signInWithPassword proxy
  - app/api/auth/forgot-password/route.ts — email-rate-limited resetPasswordForEmail proxy
  - app/api/auth/resend-verification/route.ts — email-rate-limited resend proxy
  - middleware.ts updated to rate-limit /callback by IP before passing through
affects: [03-rate-limiting/03-02, client-auth-pages]

# Tech tracking
tech-stack:
  added: ["@upstash/ratelimit ^2.0.8", "@upstash/redis ^1.37.0"]
  patterns:
    - "Centralized rate limiter module with named exports per flow"
    - "Sliding window rate limits: login 5/15m (IP), forgot-pw 3/1h (email), resend 3/1h (email), callback 10/1m (IP)"
    - "IP extraction priority: cf-connecting-ip -> x-real-ip -> x-forwarded-for -> 127.0.0.1"
    - "analytics: false on all limiters to avoid serverless pending Promise"
    - "Email normalization (toLowerCase().trim()) before rate limit key to prevent bypass"
    - "Always-success pattern on forgot-password to prevent email enumeration"

key-files:
  created:
    - ity/apps/web/lib/ratelimit/limiters.ts
    - ity/apps/web/app/api/auth/login/route.ts
    - ity/apps/web/app/api/auth/forgot-password/route.ts
    - ity/apps/web/app/api/auth/resend-verification/route.ts
  modified:
    - ity/apps/web/package.json
    - ity/apps/web/middleware.ts

key-decisions:
  - "03-01-D1: Callback rate-limiting uses early return (NextResponse.next()) not updateSession — preserves PKCE verifier cookie for OAuth exchange"
  - "03-01-D2: callback| exclusion removed from middleware matcher so /callback now runs through middleware for rate limiting"
  - "03-01-D3: All 429 responses include Retry-After header computed from reset timestamp"

patterns-established:
  - "Rate limiter pattern: check limit -> if !success return 429 with Spanish error + Retry-After -> proxy to Supabase"
  - "Email identifier normalization before ratelimit key prevents case-sensitivity bypass"

requirements-completed: [RATE-01, RATE-02, RATE-03, RATE-04, RATE-05]

# Metrics
duration: 3min
completed: 2026-03-17
---

# Phase 3 Plan 1: Rate Limiting Infrastructure Summary

**Upstash sliding-window rate limits on 4 auth flows via centralized limiters module, 3 new API route proxies (login/forgot-pw/resend), and callback IP protection added to Next.js middleware**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-17T17:37:08Z
- **Completed:** 2026-03-17T17:40:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Created `lib/ratelimit/limiters.ts` with 4 named Ratelimit instances (login, forgot-pw, resend-verify, callback) and `getClientIp` helper
- Built 3 server-side API route proxies that enforce rate limits before proxying to Supabase — replaces direct client-side Supabase calls for these auth flows
- Updated `middleware.ts` to rate-limit `/callback` by IP with early return to preserve PKCE verifier, and removed `callback|` from matcher exclusion

## Task Commits

Each task was committed atomically:

1. **Task 1: Install deps and create centralized rate limiters module** - `e040853` (feat)
2. **Task 2: Create 3 API route proxies and add callback rate limit to middleware** - `f55ecc9` (feat)

## Files Created/Modified

- `ity/apps/web/lib/ratelimit/limiters.ts` - 4 Ratelimit instances + getClientIp helper
- `ity/apps/web/app/api/auth/login/route.ts` - IP-based rate limited login proxy (5 req/15m)
- `ity/apps/web/app/api/auth/forgot-password/route.ts` - Email-based rate limited forgot-pw proxy (3 req/1h), always-success response
- `ity/apps/web/app/api/auth/resend-verification/route.ts` - Email-based rate limited resend proxy (3 req/1h)
- `ity/apps/web/package.json` - Added @upstash/ratelimit and @upstash/redis
- `ity/apps/web/middleware.ts` - Added callback rate limiting with PKCE-safe early return

## Decisions Made

- **Callback early return:** After rate limit check passes on `/callback`, use `NextResponse.next()` instead of falling through to `updateSession()`. This preserves the PKCE verifier — `getUser()` must not run before `exchangeCodeForSession()` in the callback route handler.
- **Email normalization:** Lowercase + trim the email before using it as the rate limit key to prevent case-sensitivity bypass attacks.
- **Always-success forgot-password:** Return `{ success: true }` even when Supabase says user not found — prevents email enumeration attacks.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript error: `Object is possibly 'undefined'` in getClientIp**
- **Found during:** Task 1 (creating limiters.ts)
- **Issue:** `forwarded.split(',')[0]` has type `string | undefined` with strict null checks; TypeScript correctly flagged it
- **Fix:** Changed to `(forwarded.split(',')[0] ?? forwarded).trim()` with nullish coalescing fallback
- **Files modified:** ity/apps/web/lib/ratelimit/limiters.ts
- **Verification:** `tsc --noEmit` on project source files shows zero errors
- **Committed in:** f55ecc9 (Task 2 commit)

**2. [Rule 1 - Bug] Fixed TypeScript error: redundant `headers` destructuring on union type**
- **Found during:** Task 1 (verifying limiters.ts)
- **Issue:** `request instanceof Request ? request.headers : request.headers` caused TS2339 on union type
- **Fix:** Changed to `const { headers } = request as { headers: Headers }` — both `Request` and `NextRequest` have `.headers: Headers`, cast resolves the union narrowing
- **Files modified:** ity/apps/web/lib/ratelimit/limiters.ts
- **Verification:** No errors for limiters.ts in tsc output
- **Committed in:** e040853 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 Rule 1 bugs — TypeScript strict null/union errors)
**Impact on plan:** Both fixes required for correct TypeScript compilation. No scope creep.

## Issues Encountered

- None beyond the two auto-fixed TypeScript errors above.

## User Setup Required

**External services require manual configuration before this code can run.**

The Upstash Redis database must be created before any rate-limited route will work:

1. Go to https://console.upstash.com and create a new Redis database
2. Choose the region closest to your Vercel deployment
3. Copy the REST API URL and Token from the database dashboard
4. Add to `.env.local` (and Vercel environment variables):
   ```
   UPSTASH_REDIS_REST_URL=https://your-database.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your-token-here
   ```

Without these env vars, `Redis.fromEnv()` will throw at runtime.

## Next Phase Readiness

- All rate limiting infrastructure is in place — Plan 02 can wire the client-side auth pages to call the new `/api/auth/*` routes instead of Supabase directly
- `too_many_requests` error param from middleware callback redirect needs to be handled in the login page (Plan 02 work)
- Upstash Redis database must be provisioned before any testing

---
*Phase: 03-rate-limiting*
*Completed: 2026-03-17*
