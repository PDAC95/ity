# 12ity — Authentication & Security System

## What This Is

Complete authentication and security system for 12ity, a SaaS platform where creators build online schools with courses, live classes, and student management. The auth system provides secure email/password and Google OAuth login, rate-limited endpoints, bilingual error handling, and graceful session management across the Supabase → Next.js middleware → tRPC stack.

## Core Value

Creators and students can authenticate securely via email/password or Google OAuth, with no exploitable security holes in the auth flow.

## Requirements

### Validated

- ✓ Open redirect vulnerability fixed via allowlist validation — v1.0
- ✓ createCreator protected with verified session (no arbitrary UUID) — v1.0
- ✓ Cookie errors surfaced in development mode — v1.0
- ✓ Single Supabase client per request in middleware — v1.0
- ✓ Supabase wired into tRPC context — v1.0
- ✓ Sign-out Cache-Control: no-store — v1.0
- ✓ Post-login navigation with cookie flush — v1.0
- ✓ Google OAuth login for creators and students — v1.0
- ✓ Email/password login and registration with verification — v1.0
- ✓ Password reset flow (forgot → email → reset → confirm) — v1.0
- ✓ Creator provisioning as idempotent server-side upsert — v1.0
- ✓ Rate limiting on all auth endpoints (login, forgot-password, verification, callback) — v1.0
- ✓ Session management with silent refresh and graceful expiry redirect — v1.0
- ✓ Bilingual auth error codes (AuthErrorCode enum, Spanish primary) — v1.0
- ✓ All auth pages localized to Spanish — v1.0

### Active

(Empty — define with next milestone via `/gsd:new-milestone`)

### Out of Scope

- Custom branded emails (Resend/SendGrid) — use Supabase built-in for now
- Student-specific auth flow — students use same auth, role handled by context
- 2FA / MFA — future enhancement
- Magic link login — not needed
- Social login beyond Google (GitHub, Apple) — defer
- Onboarding wizard post-signup — creators land in dashboard directly
- Email enumeration fix on checkEmail — separate security pass
- Account deletion / data export — future compliance milestone

## Context

**Current state (post v1.0):** Turborepo monorepo with `apps/web` (Next.js 14), `apps/worker` (Cloudflare), `packages/api` (tRPC), `packages/db` (Drizzle/PostgreSQL), `packages/config`, `packages/ui`.

**Auth architecture:** Supabase Auth manages sessions and credentials. Next.js middleware refreshes sessions, detects expired cookies, and redirects with `?reason=session_expired`. tRPC context receives Supabase client from middleware. Auth pages use server-side API route proxies with Upstash rate limiting.

**Tech stack additions from v1.0:**
- Upstash Redis for rate limiting (`@upstash/ratelimit`, `@upstash/redis`)
- AuthErrorCode enum with bilingual message map (`lib/auth/errors.ts`)
- API route proxies for auth flows (`app/api/auth/login`, `/forgot-password`, `/resend-verification`)
- OTP confirmation route (`app/(auth)/auth/confirm`)

**Known v2 candidates:**
- SEC-V2-01: Remove or rate-limit `auth.checkEmail` (email enumeration)
- SEC-V2-02: Header trust validation for X-School-ID/X-School-Domain
- SEC-V2-03: CSRF token validation
- AUTH-V2-01: Silent tRPC 401 retry
- AUTH-V2-02: Code-based error mapping (partially done — login route uses AuthErrorCode)
- AUTH-V2-03: Custom branded emails via Resend/SendGrid

## Constraints

- **Auth provider**: Supabase Auth — all auth flows must go through Supabase
- **Deployment**: Vercel — rate limiting uses Upstash Redis (not in-memory)
- **Email**: Supabase built-in email service — no custom SMTP yet
- **Existing routes**: Auth route group at `(auth)/` — modify in place
- **Language**: Spanish is the primary UI language for auth pages

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Google OAuth for both creators and students | Single auth system, role determined by context | ✓ Good — working in prod |
| App-level rate limiting via Upstash Redis | Serverless-compatible, per-endpoint control | ✓ Good — 4 endpoints protected |
| Supabase built-in emails for password reset | Avoids adding email service dependency | ✓ Good for v1 — revisit for branded emails |
| Silent refresh → redirect on session expiry | Better UX than hard logout | ✓ Good — cookie-presence check catches expired sessions |
| Redirect validation via allowlist | Prevents open redirect, handles encoding bypasses | ✓ Good — uses decodeURIComponent + prefix match |
| AuthErrorCode enum (not as const) | TypeScript enum per user preference | ✓ Good — bilingual messages centralized |
| API route proxies for rate-limited auth | Server-side rate limit enforcement, client calls fetch() | ✓ Good — consistent pattern across 3 flows |
| OTP verifyOtp (not exchangeCodeForSession) | Email flows use token_hash, not OAuth PKCE code | ✓ Good — separate route avoids middleware interference |
| Middleware excludes /auth/confirm and /callback | Prevents getUser() from consuming OTP tokens/PKCE verifiers | ✓ Good — critical for auth flow integrity |

---
*Last updated: 2026-03-31 after v1.0 milestone*
