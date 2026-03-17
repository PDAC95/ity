# Requirements: 12ity Auth & Security

**Defined:** 2026-03-02
**Core Value:** Creators and students can authenticate securely via email/password or Google OAuth, with no exploitable security holes in the auth flow.

## v1 Requirements

### Security Fixes

- [x] **SEC-01**: Auth callback validates `next` parameter against allowlist of known app paths before redirecting (no open redirect)
- [x] **SEC-02**: `auth.createCreator` is a protected procedure that uses `ctx.user.id` from verified session (not user-supplied UUID)
- [x] **SEC-03**: Cookie errors in Supabase server client surface as warnings in development mode (not silently swallowed)
- [x] **SEC-04**: Middleware creates one Supabase client per request, returning user from `updateSession()` without double API call
- [x] **SEC-05**: Supabase client is passed to tRPC context (not null) for use in procedures
- [x] **SEC-06**: Sign-out route returns `Cache-Control: no-store` header to prevent edge caching
- [x] **SEC-07**: Post-login navigation uses `window.location.href` instead of `router.push` to ensure cookies are flushed

### Authentication Flows

- [x] **AUTH-01**: User can log in with Google OAuth and land in dashboard (creator record auto-created if new)
- [x] **AUTH-02**: User can log in with email/password and land in dashboard
- [x] **AUTH-03**: User can register with email/password and receive verification email from Supabase
- [x] **AUTH-04**: User clicking email verification link lands in dashboard with creator record created via callback
- [x] **AUTH-05**: Creator provisioning happens only in server-side callback route (not client-side), using idempotent upsert
- [x] **AUTH-06**: User can request password reset email from forgot-password page
- [x] **AUTH-07**: User clicking password reset link lands on reset-password page with valid recovery session
- [x] **AUTH-08**: Reset-password page validates recovery session exists before allowing password change
- [x] **AUTH-09**: After successful password reset, user is redirected to login with success message

### Rate Limiting

- [x] **RATE-01**: Login endpoint is rate-limited to 5 attempts per 15 minutes per IP (sliding window via Upstash Redis)
- [x] **RATE-02**: Forgot-password endpoint is rate-limited to 3 requests per hour per email
- [x] **RATE-03**: Email verification resend is rate-limited to 3 requests per hour per email
- [x] **RATE-04**: Auth callback route is rate-limited to 10 requests per minute per IP
- [x] **RATE-05**: Rate-limited requests receive a clear error message (not a generic 500)

### Session Management

- [ ] **SESS-01**: Middleware attempts silent session refresh when access token is expired but refresh token is valid
- [ ] **SESS-02**: When both tokens are expired, user is redirected to login with `?reason=session_expired` parameter
- [ ] **SESS-03**: Login page displays "Your session has expired" message when `reason=session_expired` is present
- [ ] **SESS-04**: Auth state is consistent across Supabase, Next.js middleware, and tRPC context (no layer disagrees)

## v2 Requirements

### Enhanced Security

- **SEC-V2-01**: `auth.checkEmail` endpoint removed or rate-limited to prevent email enumeration
- **SEC-V2-02**: Header trust validation for `X-School-ID`/`X-School-Domain` (prevent spoofing when bypassing Cloudflare Worker)
- **SEC-V2-03**: CSRF token validation on all auth mutations (beyond implicit SameSite cookie protection)

### Enhanced Auth

- **AUTH-V2-01**: Silent tRPC 401 retry — attempt session refresh before surfacing error to user
- **AUTH-V2-02**: Error code-based mapping replacing all `message.includes()` string detection patterns
- **AUTH-V2-03**: Custom branded emails via Resend/SendGrid replacing Supabase built-in

## Out of Scope

| Feature | Reason |
|---------|--------|
| Magic link login | Google OAuth covers "no-password" use case |
| 2FA / MFA | High complexity, low demand for course creators at this stage |
| GitHub, Apple OAuth | Marginal user base; Google covers majority |
| Student-specific auth pages | Same auth system, role determined by context |
| Custom email templates | Supabase built-in sufficient for v1 |
| Account deletion / data export | Future compliance milestone |
| Onboarding wizard post-signup | Separate feature, creators land in dashboard directly |
| Email enumeration fix | Separate security pass |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SEC-01 | Phase 1 | Complete |
| SEC-02 | Phase 1 | Complete |
| SEC-03 | Phase 1 | Complete |
| SEC-04 | Phase 1 | Complete |
| SEC-05 | Phase 1 | Complete |
| SEC-06 | Phase 1 | Complete |
| SEC-07 | Phase 1 | Complete |
| AUTH-01 | Phase 2 | Complete |
| AUTH-02 | Phase 2 | Complete |
| AUTH-03 | Phase 2 | Complete |
| AUTH-04 | Phase 2 | Complete |
| AUTH-05 | Phase 2 | Complete |
| AUTH-06 | Phase 2 | Complete |
| AUTH-07 | Phase 2 | Complete |
| AUTH-08 | Phase 2 | Complete |
| AUTH-09 | Phase 2 | Complete |
| RATE-01 | Phase 3 | Complete |
| RATE-02 | Phase 3 | Complete |
| RATE-03 | Phase 3 | Complete |
| RATE-04 | Phase 3 | Complete |
| RATE-05 | Phase 3 | Complete |
| SESS-01 | Phase 4 | Pending |
| SESS-02 | Phase 4 | Pending |
| SESS-03 | Phase 4 | Pending |
| SESS-04 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 25 total
- Mapped to phases: 25
- Unmapped: 0

---
*Requirements defined: 2026-03-02*
*Last updated: 2026-03-02 after roadmap creation — all 25 requirements mapped*
