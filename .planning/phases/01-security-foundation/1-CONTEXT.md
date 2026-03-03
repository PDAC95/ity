# Phase 1: Security Foundation - Context

**Gathered:** 2026-03-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix the 7 critical security defects in the auth infrastructure: open redirect in callback, unprotected createCreator, silent cookie errors, middleware double-client, missing supabase in tRPC context, sign-out caching, and post-login navigation. These are prerequisites for all other phases. No new auth flows are added — this phase only secures the existing plumbing.

</domain>

<decisions>
## Implementation Decisions

### Redirect Allowlist
- Prefix-based matching: any path starting with `/dashboard`, `/courses`, `/settings`, or `/school` is allowed
- Hardcoded array in a utility file (`lib/auth/redirect.ts`) — not configurable via env
- Invalid redirect attempts: silently fallback to `/dashboard` AND log the attempt server-side as structured JSON
- Validation rules: must start with `/`, must NOT start with `//`, must match one of the allowed prefixes
- URL is normalized before allowlist check (handle `%2F%2F` encoding bypass)

### Error Responses
- Auth failures redirect to `/login` with error context passed as URL query params (e.g. `?error=auth_failed`)
- Login page reads query params and displays a toast notification with the error message
- Toast library: install `sonner` (or similar) — project doesn't have one yet. This is a new dependency for Phase 1.
- Error messages are generic in production ("Something went wrong. Please try again.") — no specific error details to prevent info leakage
- In development mode, detailed error info is logged to console

### Creator Provisioning Move
- `auth.createCreator` moves from `publicProcedure` to `protectedProcedure`, using `ctx.user.id` exclusively
- Safety net: Dashboard layout (server component) checks if authenticated user has a creator record. If missing, auto-creates it via upsert. This catches edge cases from the old flow.
- Unified callback route: one `/callback` route handles ALL auth types (signup, login, OAuth, password reset)
- Callback determines auth event type using BOTH Supabase query params (`type=signup`, `type=recovery`, etc.) AND session state verification
- Creator provisioning in callback uses idempotent upsert (INSERT ... ON CONFLICT DO NOTHING)

### Dev vs Prod Behavior
- Cookie errors in `server.ts`: THROW in development mode (hard failure to catch issues), console.warn in production
- Security fixes are invisible to existing users — no forced re-login, no visible state change
- All auth failures are logged server-side in all environments (visible in Vercel function logs)

### Auth Logging
- New utility module: `lib/auth/logger.ts` with typed log functions
- Structured JSON format: `{ event: 'auth_failure', type: 'invalid_redirect', ip: '...', timestamp: '...', details: {...} }`
- Reusable across all phases — Phase 2+ auth flows will use the same logger
- Logs go to server stdout (readable in Vercel logs) — no external monitoring service for now

### Sign-Out & Navigation
- Sign-out route adds `Cache-Control: no-store` header to prevent edge caching
- Post-login navigation uses `window.location.href` instead of `router.push` to ensure cookies flush before navigation
- These are invisible fixes — users won't notice any change

### Claude's Discretion
- Exact toast library choice (sonner, react-hot-toast, etc.)
- Middleware refactoring approach (how to merge updateSession + user extraction)
- tRPC context wiring details
- Exact Zod schema for redirect validation

</decisions>

<specifics>
## Specific Ideas

- Cookie error behavior should feel like a TypeScript strict-mode check: break loudly in dev so you can't ship broken code, but degrade gracefully in production
- The auth logger should be structured enough that if Sentry or DataDog is added later, the log format maps cleanly to their event schema
- The callback route is becoming a hub — design it so Phase 2 can add OAuth and password reset handling without restructuring

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-security-foundation*
*Context gathered: 2026-03-03*