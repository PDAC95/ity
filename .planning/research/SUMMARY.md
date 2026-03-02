# Project Research Summary

**Project:** 12ity Auth & Security Milestone
**Domain:** Authentication hardening for Next.js 14 + Supabase + tRPC SaaS (creator/student course platform)
**Researched:** 2026-03-02
**Confidence:** HIGH

## Executive Summary

This milestone is not greenfield auth — it is hardening of an already-scaffolded but partially broken auth system. All major frameworks are already installed (Supabase Auth, Next.js 14 App Router, tRPC, Drizzle, Zod). The codebase has the right architectural foundation (three-layer auth: browser client, Next.js middleware, tRPC context) but contains five critical security defects and several moderate issues that prevent the system from being production-ready. The recommended approach is to fix security defects first, complete the auth flows second, then layer in rate limiting and session management — in that dependency order.

The primary security risks are an open redirect vulnerability in the OAuth callback route, a public tRPC procedure that accepts arbitrary UUIDs for creator creation, and a double-client pattern in middleware that causes stale session state. These three defects are interdependent: the callback route is the hub for all auth flows (OAuth, email verification, password reset), so it must be secured before those flows can be reliably completed. Only two new packages are required — `@upstash/ratelimit` and `@upstash/redis` — because Vercel's serverless environment makes in-memory rate limiting ineffective.

The key operational risk is sequencing. Attempting to wire Google OAuth end-to-end before the callback route is secured will expose the open redirect to production. Attempting rate limiting before the double-client middleware is fixed will produce unreliable behavior. The four-phase build order identified in ARCHITECTURE.md (Security Foundation → Complete Auth Flows → Rate Limiting → Session Management) is the only dependency-safe ordering and must be followed.

---

## Key Findings

### Recommended Stack

The existing stack is fixed and appropriate. Only two additions are required and both are driven by a hard infrastructure constraint: Vercel serverless functions have no shared memory between invocations, making all in-memory rate limiters useless. Upstash Redis solves this via an HTTP-based Redis client that works without persistent TCP connections.

**New packages required:**
- `@upstash/ratelimit`: Sliding window rate limiting — fixes the serverless stale-counter problem
- `@upstash/redis`: HTTP Redis client (Upstash) — works in Vercel cold-start environments

**Do not install:**
- `express-rate-limit`: In-memory only, resets on cold start — specifically harmful here
- `next-auth` / `auth.js`: Duplicates Supabase Auth and causes session conflicts
- `jsonwebtoken`, `bcrypt`, `argon2`, `passport`: Supabase manages all of these already

**Infrastructure prerequisite (manual):** Create Upstash Redis database, add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to env.

See `.planning/research/STACK.md` for full details.

### Expected Features

The feature landscape is split between fixing broken existing features and adding missing security controls. Every auth flow page exists in the codebase, but most have defects ranging from missing rate limiting to security vulnerabilities.

**Must have (table stakes — fix first):**
- Email/password login — exists but string-based error parsing is brittle
- Google OAuth — button exists but untested end-to-end; open redirect blocks this
- Registration with email verification — flow exists; resend has no rate limiting
- Forgot password / reset flow — pages exist; callback doesn't differentiate reset sessions
- Session persistence across page loads — Supabase cookies present but silent cookie errors
- Redirect after login to intended page — partially implemented; open redirect vulnerability
- Session expiry with graceful redirect — not implemented at all

**Must have (security — non-negotiable):**
- Rate limiting on login, forgot-password, resend, and callback endpoints
- Open redirect fix in `callback/route.ts`
- `createCreator` must use `protectedProcedure` with `ctx.user.id`
- CSRF protection verification via SameSite cookies

**Differentiators (quality, not blocking):**
- "Session expired" toast/redirect message via `?reason=session_expired`
- Error code-based mapping instead of `message.includes()` string matching
- Idempotent creator provisioning (upsert, not insert)
- Silent token refresh with retry on 401

**Defer to v2+:**
- Custom SMTP / email templates
- Magic link login
- 2FA / MFA
- GitHub, Apple OAuth
- Account deletion / data export

See `.planning/research/FEATURES.md` for full current-state assessment.

### Architecture Approach

The system has a correct three-layer auth architecture — Supabase client (browser), Next.js middleware (session refresh + route protection), tRPC context (per-request user extraction) — but each layer has implementation defects. The fix strategy is to repair each layer without restructuring it, since the architecture pattern itself is sound. The OAuth callback route (`apps/web/app/(auth)/callback/route.ts`) is the critical path: it handles all auth flows and is the single enforcement point for redirect safety and creator provisioning.

**Major components:**
1. **Supabase Auth client** (`lib/supabase/client.ts`, `components/auth/*`) — manages all signIn/signUp/OAuth/reset; no changes to structure, fix cookie error handling
2. **Next.js Middleware** (`middleware.ts`, `lib/supabase/middleware.ts`) — fix double-client pattern; add rate limiting enforcement; skip auth redirect for `/callback`
3. **Auth Callback Route** (`app/(auth)/callback/route.ts`) — fix open redirect; consolidate all creator provisioning here as idempotent upsert
4. **tRPC Context** (`packages/api/src/trpc.ts`) — pass `supabase` client to context; convert `createCreator` to `protectedProcedure`

**Rate limiting placement:** Next.js middleware only — it runs before route handlers and catches unauthenticated requests. tRPC procedures run after auth context creation, too late for unauthenticated attack mitigation.

See `.planning/research/ARCHITECTURE.md` for data flow diagrams and anti-pattern inventory.

### Critical Pitfalls

1. **Open redirect in callback** (`callback/route.ts` line 44) — `${origin}${next}` where `next` is unvalidated query string. Attacker uses `//evil.com`. Fix: allowlist validation (`startsWith('/')`, not `startsWith('//')`, normalize URL to catch `%2F%2F` encoding bypasses). Fix first — this blocks OAuth and password reset phases.

2. **`createCreator` accepts arbitrary UUIDs** (`packages/api/src/routers/auth.ts`) — `publicProcedure` allows attacker to pre-create creator records with a target UUID, locking out legitimate users. Fix: `protectedProcedure` using `ctx.user.id`. Test with email-confirmation both on and off.

3. **Middleware double Supabase client** (`middleware.ts`) — `updateSession()` refreshes token, then a second `createServerClient` reads pre-refresh cookies, creating stale data and double API calls. Fix: return `{ supabaseResponse, user }` from `updateSession()` and reuse it.

4. **Registration race condition** (`register/page.tsx` lines 48-59) — client calls `signUp()` then `createCreator()` separately; callback also creates creator. Double-click or timing creates duplicate/missing state. Fix: move all creator provisioning to callback route as idempotent upsert; remove client-side `createCreator` call.

5. **Password reset session not validated** — `/reset-password` calls `updateUser({ password })` without verifying a recovery session exists. A logged-in user navigating directly can change password without email verification. Fix: check session type before rendering reset form.

See `.planning/research/PITFALLS.md` for full pitfall inventory with file references.

---

## Implications for Roadmap

Based on research, the four-phase structure identified in ARCHITECTURE.md is the dependency-safe ordering. Each phase is a prerequisite for the next. No phase should be reordered.

### Phase 1: Security Foundation

**Rationale:** All subsequent auth flows route through the callback and middleware. These layers must be secure and correct before any flow can be reliably completed or tested. This phase has zero external dependencies — all fixes are code changes to existing packages.

**Delivers:** A secure, correctly functioning auth infrastructure layer that unblocks all other phases.

**Implements:**
- Open redirect fix in `callback/route.ts` (CRITICAL — blocks all other phases)
- `createCreator` → `protectedProcedure` with `ctx.user.id`
- Fix middleware double-client (return `{ supabaseResponse, user }` from `updateSession()`)
- Cookie error logging in dev mode (`lib/supabase/server.ts`)
- Pass `supabase` client to tRPC context
- Fix sign-out route cache headers (`Cache-Control: no-store`)
- Fix `router.push` → `window.location.href` for post-login navigation

**Avoids:** Open redirect exploit, creator account takeover, stale session data

### Phase 2: Complete Auth Flows

**Rationale:** With the callback route secured and the middleware fixed, each individual auth flow can be wired and tested end-to-end. These flows share the callback hub and must be completed as a group since they affect the same route. Manual prerequisite: configure OAuth redirect URIs in Google Console and Supabase allowlist.

**Delivers:** All auth flows working end-to-end: Google OAuth, email verification, password reset, creator provisioning.

**Implements:**
- Google OAuth end-to-end (configure redirect URIs, use `process.env.NEXT_PUBLIC_APP_URL`)
- Email verification callback handling
- Password reset recovery session validation
- Creator provisioning → idempotent upsert in callback only (removes client-side race)
- Skip auth redirect check for `/callback` in middleware (prevents PKCE code consumption)

**Manual steps:** Google Cloud Console OAuth redirect URI + Supabase Redirect URLs allowlist

**Avoids:** PKCE verifier lost in middleware, OAuth redirect URI mismatch in staging, password reset without email verification

### Phase 3: Rate Limiting

**Rationale:** Rate limiting depends on Phase 1 because middleware must be functioning correctly before rate limiting is added to it. Upstash Redis requires a manual infrastructure setup step that should be confirmed before coding begins.

**Delivers:** Brute-force and abuse protection across all auth endpoints.

**Implements:**
- Upstash Redis infrastructure setup (manual prerequisite)
- Rate limit middleware utility using `@upstash/ratelimit` sliding window
- Apply to: login (5/15min/IP), forgot-password (3/hour/email), verify-email resend (3/hour/email), callback (10/min/IP)

**Stack:** `@upstash/ratelimit` + `@upstash/redis` — only new packages in this milestone

**Avoids:** In-memory rate limiter trap (useless on Vercel serverless cold starts)

### Phase 4: Session Management Polish

**Rationale:** Session management improvements are quality-of-life features that depend on the auth flows being complete. They require the middleware layer to be stable (Phase 1) and the flows to be wired (Phase 2) so session states can be reliably tested.

**Delivers:** Graceful session expiry, consistent error messaging, user-visible feedback on auth events.

**Implements:**
- Session expiry detection in middleware → redirect with `?reason=session_expired`
- Login page "session expired" message display
- Error code-based mapping to replace `message.includes()` string parsing
- Consistent error handling across all three auth layers

**Avoids:** Broken redirect loops on expiry, silent session failures reaching users as blank errors

### Phase Ordering Rationale

- **Security Foundation must come first:** The callback route is the hub for all other flows. Securing it before building on top of it prevents shipping an open redirect to production during OAuth testing.
- **Auth Flows before Rate Limiting:** Rate limits need the middleware to be stable. Adding rate limiting to a buggy middleware creates unreliable state that's hard to debug.
- **Session Polish last:** These features add user experience improvements but have no security urgency. They're safe to defer if timeline pressure exists.
- **No phase can be parallelized** within this milestone — each has hard dependencies on the previous phase's fixes.

### Research Flags

Phases with well-documented patterns (skip additional research):
- **Phase 1 (Security Foundation):** All fixes are standard OWASP patterns and Supabase SSR patterns. File locations and fixes are exactly specified in research.
- **Phase 3 (Rate Limiting):** Upstash + `@upstash/ratelimit` is well-documented; sliding window algorithm and placement are resolved.
- **Phase 4 (Session Management):** Standard UX patterns; no complex integrations.

Phases that may need targeted research during planning:
- **Phase 2 (Auth Flows — Google OAuth):** Manual steps in Google Cloud Console may have changed since research. Verify OAuth callback URI format against current Supabase documentation before implementation.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Two new packages (Upstash) are community-consensus pattern for Vercel serverless. Versions need npm verification before install. Everything else is HIGH — existing stack is confirmed working. |
| Features | HIGH | Based on direct codebase audit. Current state of each flow is documented with file references and line numbers. |
| Architecture | HIGH | From direct source code analysis. Anti-patterns have specific file/line references. Build order derived from actual dependency graph. |
| Pitfalls | HIGH | All critical pitfalls identified via codebase analysis, not speculation. Each has a specific file reference and concrete fix. |

**Overall confidence:** HIGH

### Gaps to Address

- **Upstash package versions:** Versions for `@upstash/ratelimit` and `@upstash/redis` were not verified against current npm. Confirm latest stable versions before install.
- **Google OAuth redirect URI format:** The exact callback URI format required by Supabase may vary by Supabase project plan or version. Confirm against current Supabase Auth documentation during Phase 2 planning.
- **CSRF verification:** Research notes that CSRF is "implicit via SameSite cookies — verify." This was not tested. Add explicit verification step to Phase 1.
- **Email enumeration:** The `checkEmail` public endpoint (`{ exists: true/false }`) is a known vulnerability but was explicitly deferred per PROJECT.md. It should be flagged for the next security milestone.

---

## Sources

### Primary (HIGH confidence)
- Direct codebase audit (`apps/web/`, `packages/api/`) — current state of all auth flows, anti-patterns, file/line references
- Supabase SSR documentation (`@supabase/ssr 0.5.0`) — `getUser()` vs `getSession()`, middleware patterns
- OWASP Open Redirect guidelines — allowlist validation pattern

### Secondary (MEDIUM confidence)
- Upstash documentation + community patterns — rate limiting on Vercel serverless
- Next.js App Router documentation — middleware execution order, PKCE handling

### Tertiary (LOW confidence — needs validation)
- Upstash Redis package versions — not verified against current npm at research time

---

*Research completed: 2026-03-02*
*Ready for roadmap: yes*
