# 12ity — Authentication & Security System

## What This Is

Complete authentication and security system for 12ity, a SaaS platform where creators build online schools with courses, live classes, and student management. This milestone hardens the existing auth flow (Supabase → Next.js middleware → tRPC) by fixing known security vulnerabilities, completing incomplete features (OAuth, password reset, email verification), and establishing robust session management across all three layers.

## Core Value

Creators and students can authenticate securely via email/password or Google OAuth, with no exploitable security holes in the auth flow.

## Requirements

### Validated

- ✓ Email/password signup for creators — existing (partial, has security issues)
- ✓ Email/password login for creators — existing (partial)
- ✓ Supabase Auth integration — existing
- ✓ tRPC protectedProcedure enforces creator auth — existing
- ✓ Next.js middleware refreshes sessions and redirects — existing
- ✓ Auth route group with login/register/callback pages — existing

### Active

- [ ] Google OAuth login for creators and students
- [ ] Email verification flow after registration
- [ ] Password reset flow (forgot → email → reset → confirm)
- [ ] Rate limiting on auth endpoints (brute force protection)
- [ ] Fix open redirect vulnerability in auth callback
- [ ] Protect auth.createCreator (validate user ID matches authenticated user)
- [ ] Fix silent cookie error handling in Supabase server client
- [ ] Consistent auth middleware chain (Supabase → Next.js → tRPC)
- [ ] Session management with silent refresh and graceful expiry redirect

### Out of Scope

- Custom branded emails (Resend/SendGrid) — use Supabase built-in for now, swap later
- Student-specific auth flow (student signup/login pages) — students use same auth, role handled by context
- 2FA / MFA — future enhancement
- Magic link login — not needed for v1
- Social login beyond Google (GitHub, Apple, etc.) — defer
- Onboarding wizard post-signup — creators land in dashboard directly
- Email enumeration fix on checkEmail — separate security pass

## Context

**Existing codebase:** Turborepo monorepo with `apps/web` (Next.js 14), `apps/worker` (Cloudflare), `packages/api` (tRPC), `packages/db` (Drizzle/PostgreSQL), `packages/config`, `packages/ui`.

**Auth architecture:** Supabase Auth manages sessions and credentials. Next.js middleware (`apps/web/middleware.ts`) refreshes sessions and handles auth redirects. tRPC context extracts the authenticated user for `protectedProcedure` and `studentProcedure`.

**Known security issues (from codebase audit):**
- Open redirect in `apps/web/app/(auth)/callback/route.ts` — `next` param not validated
- `auth.createCreator` is public, accepts arbitrary UUID — no user ID verification
- Silent `try/catch` in cookie operations hides auth state failures
- No rate limiting on any auth endpoints
- Header trust issue with `X-School-ID`/`X-School-Domain` (separate from this milestone)

**Google OAuth:** Already configured in Supabase dashboard with client ID/secret.

**Session strategy:** Attempt silent token refresh on expiry. If refresh fails, redirect to login with "session expired" message. No hard logout on every request.

## Constraints

- **Auth provider**: Supabase Auth — all auth flows must go through Supabase, not custom JWT
- **Deployment**: Vercel — rate limiting must work in serverless (no persistent in-memory state across requests without external store)
- **Email**: Supabase built-in email service — no custom SMTP for now
- **Existing routes**: Auth route group already exists at `(auth)/` — modify in place, don't restructure
- **Manual steps**: Any Supabase dashboard config, env vars, or OAuth provider settings must be flagged explicitly as manual steps before implementation proceeds

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Google OAuth for both creators and students | Single auth system, role determined by context not provider | — Pending |
| App-level rate limiting (not edge) | Simpler to implement, fine-grained control per endpoint | — Pending |
| Supabase built-in emails for password reset | Good enough for now, avoids adding email service dependency | — Pending |
| Silent refresh → redirect on session expiry | Better UX than hard logout, catches most session issues | — Pending |
| Redirect validation via allowlist | Prevents open redirect by checking against known app routes | — Pending |

---
*Last updated: 2026-02-26 after initialization*
