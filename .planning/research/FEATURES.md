# Feature Landscape: Authentication & Security

**Domain:** SaaS auth system — creator/student course platform
**Researched:** 2026-03-02
**Confidence:** HIGH (based on direct codebase audit + established security standards)

---

## Current State Assessment

| Flow | Pages Exist | Actually Works | Security Issues |
|------|-------------|----------------|-----------------|
| Email/password login | Yes | Partially | No rate limiting |
| Email/password register | Yes | Partially | `createCreator` is public, UUID not verified |
| Google OAuth | Button exists | Not wired E2E | `redirectTo` passes unvalidated `next` param |
| Email verification | Page exists | Yes (Supabase sends) | Resend has no rate limiting |
| Forgot password | Page exists | Partially | No rate limiting on reset requests |
| Reset password | Page exists | Works once session active | Callback doesn't validate reset flow vs normal login |
| Session management | Middleware exists | Partially | No graceful expiry handling, silent cookie errors |

---

## Table Stakes

| Feature | Complexity | Current Status |
|---------|------------|----------------|
| Email + password login | Low | Exists, string-based error parsing is brittle |
| Google OAuth login | Medium | Button exists, untested end-to-end |
| Registration with email verification | Low | Flow exists; resend works; no rate limit on resend |
| Forgot password / reset flow | Medium | Pages exist; Supabase handles email; callback doesn't differentiate reset sessions |
| Redirect after login to intended page | Low | Partially via `next` param — has open redirect vuln |
| Authenticated-only dashboard access | Low | Implemented in middleware |
| Session persistence across page loads | Low | Supabase cookies + `updateSession` — silent cookie errors |
| Session expiry with graceful redirect | Medium | Not implemented — no "session expired" message |
| Consistent auth state across layers | Medium | Three-layer chain exists but fragile |

## Security Features (Non-Negotiable)

| Feature | Complexity | Current Status |
|---------|------------|----------------|
| Rate limiting on login endpoint | Medium | Missing entirely |
| Rate limiting on forgot-password | Medium | Missing entirely |
| Rate limiting on email verification resend | Low | Missing entirely |
| Open redirect fix in callback | Low | Vulnerability in `callback/route.ts` line 44 |
| Validate user ID in `createCreator` | Low | Public procedure, accepts any UUID |
| CSRF protection on auth mutations | Low | Implicit via SameSite cookies — verify |
| Secure cookie attributes | Low | Supabase SSR handles — verify production settings |

## Differentiators

| Feature | Complexity | Notes |
|---------|------------|-------|
| "Session expired" toast / redirect message | Low | Pass `?reason=session_expired` to login |
| Registration race condition protection | Low | Idempotent creator creation |
| OAuth creator profile auto-creation | Medium | Partially implemented in callback |
| Error code-based mapping (not string matching) | Low | Replace `message.includes()` patterns |
| Silent token refresh with retry | Medium | On 401, attempt refresh before redirect |

## Anti-Features (Do NOT Build)

| Anti-Feature | Why Avoid |
|--------------|-----------|
| Custom SMTP / email templates | Supabase built-in sufficient for v1 |
| Magic link login | Google OAuth covers "no-password" use case |
| 2FA / MFA | High complexity, low demand at this stage |
| GitHub, Apple OAuth | Marginal user base; Google covers majority |
| Student-specific auth pages | Same auth, role by context |
| In-memory rate limiting | Vercel serverless — doesn't persist |
| Email enumeration fix | Separate security pass, out of scope |
| Account deletion / data export | Future compliance milestone |

## Feature Dependencies

```
Email/password login
  requires: Rate limiting, consistent error messages

Google OAuth login
  requires: Open redirect fix, creator profile auto-creation

Registration (email/password)
  requires: Email verification, createCreator fix, race condition protection

Forgot password
  requires: Rate limiting, callback route fix

Reset password
  requires: Recovery session validation, consistent middleware chain

Session management
  requires: Middleware chain consistency, cookie error handling

Rate limiting
  requires: Upstash Redis (Vercel serverless constraint)
```

## MVP Delivery Order

1. Open redirect fix (lowest complexity, highest severity)
2. `createCreator` security fix
3. Cookie error handling
4. Google OAuth end-to-end
5. Rate limiting (Upstash setup)
6. Session expiry handling
7. Email verification polish
8. Password reset end-to-end