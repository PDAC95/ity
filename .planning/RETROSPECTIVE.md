# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — Auth & Security

**Shipped:** 2026-03-31
**Phases:** 4 | **Plans:** 10 | **Timeline:** 33 days

### What Was Built
- Fixed 7 critical security vulnerabilities in the auth callback, middleware, and tRPC context
- Completed all auth flows end-to-end: Google OAuth, email/password, email verification, password reset
- Upstash Redis sliding-window rate limiting on 4 auth endpoints
- Bilingual AuthErrorCode enum with session-expired detection and graceful redirect
- Spanish localization across all auth pages

### What Worked
- Strict phase dependency ordering (security first → flows → rate limiting → session) prevented rework
- Server-side API route proxies pattern for rate limiting cleanly separated concerns
- AuthErrorCode enum eliminated fragile string matching across layers
- Idempotent upsert pattern for creator provisioning avoided race conditions

### What Was Inefficient
- Phase 2 ROADMAP tracking fell out of sync (showed 3/4 when 4/4 were complete) — manual reconciliation needed
- Some manual config steps (Supabase templates, Google OAuth URIs) required multiple sessions to complete
- SUMMARY.md files lacked one-liner fields, making automated extraction harder

### Patterns Established
- OTP flows use verifyOtp(token_hash), not exchangeCodeForSession — separate from OAuth PKCE
- Middleware must exclude /auth/confirm and /callback to preserve auth tokens
- Rate-limited auth goes through API route proxies (server-side enforcement), not direct Supabase client calls
- Spanish is primary UI language for auth pages

### Key Lessons
1. Middleware interference with auth tokens (PKCE verifiers, OTP tokens) is a subtle class of bug — always exclude auth completion routes from middleware
2. Rate limiting in serverless requires external state (Upstash Redis) — in-memory counters don't survive cold starts
3. Cookie-presence check for session detection is more reliable than getUser() call (avoids API latency on every redirect)

### Cost Observations
- Model mix: ~60% sonnet (execution), ~30% opus (planning/orchestration), ~10% haiku (extraction)
- Sessions: ~15 across the milestone
- Notable: Phase 1 and 3 executed fastest (2-3 min/plan) — well-scoped, focused plans

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Timeline | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | 33 days | 4 | First milestone — established GSD workflow with 4-phase auth hardening |

### Top Lessons (Verified Across Milestones)

1. Strict dependency ordering prevents rework — fix foundations before building features
2. Server-side enforcement (proxies, middleware) is more reliable than client-side validation
