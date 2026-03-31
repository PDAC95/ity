# 12ity — Online School Platform

## What This Is

SaaS white-label donde creadores/maestros construyen su propia web app de educación sin saber programar. Cada escuela tiene su marca propia, dominio propio y sistema de cursos — el alumno ve todo como la plataforma del creador, sin rastro de 12ity. El creador puede monetizar directamente con pocos alumnos (sin necesitar millones de views como YouTube ni pagar alto % como Udemy). El valor humano de la clase supera a la IA. Stack: Turborepo monorepo con Next.js 14, tRPC, Drizzle/PostgreSQL, Supabase Auth.

## Current Milestone: v1.1 Creator Dashboard

**Goal:** El creador tiene un dashboard funcional donde configura su escuela y perfil, con la estructura de navegación lista para features futuras.

**Target features:**
- Layout principal del dashboard (sidebar, header, navegación)
- Configuración de escuela (nombre, logo, descripción, colores, slug)
- Perfil del creador (nombre, foto, bio)
- Placeholders para secciones futuras (cursos, alumnos, métricas, equipo, dominio)

## Core Value

Creadores pueden lanzar su propia escuela online con marca propia — configuración, contenido y alumnos en un solo lugar.

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

- [ ] Dashboard layout (sidebar, header, navegación entre secciones)
- [ ] School setup (nombre, logo, descripción, colores, slug)
- [ ] Perfil del creador (nombre, foto, bio)
- [ ] Placeholders para secciones futuras

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

**Platform vision (white-label):**
- Cada creador tiene su propia escuela con marca propia
- Alumnos ven todo como la plataforma del creador (sin rastro de 12ity)
- Landing pages personalizadas con sistema de templates por tipo de clase
- Dominio propio del creador (DNS/SSL — futuro milestone)
- Dos roles/vistas: maestro (gestión) y alumno (contenido)
- Clases en vivo y pregrabadas (futuro milestone)

**Tech stack additions from v1.0:**
- Upstash Redis for rate limiting (`@upstash/ratelimit`, `@upstash/redis`)
- AuthErrorCode enum with bilingual message map (`lib/auth/errors.ts`)
- API route proxies for auth flows (`app/api/auth/login`, `/forgot-password`, `/resend-verification`)
- OTP confirmation route (`app/(auth)/auth/confirm`)

**Future milestone roadmap:**
- v1.2: Landing page pública + templates + registro de alumnos + dashboard alumno
- v1.3: Cursos y lecciones (pregrabadas y en vivo)
- v1.4: Dominios propios (DNS/SSL) + gestión de equipo + métricas

**Known security candidates (defer to security milestone):**
- SEC-V2-01: Remove or rate-limit `auth.checkEmail` (email enumeration)
- SEC-V2-02: Header trust validation for X-School-ID/X-School-Domain
- SEC-V2-03: CSRF token validation
- AUTH-V2-01: Silent tRPC 401 retry
- AUTH-V2-02: Code-based error mapping (partially done)
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
*Last updated: 2026-03-31 after v1.1 milestone start*
