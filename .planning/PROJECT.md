# 12ity — Online School Platform

## What This Is

SaaS white-label donde creadores/maestros construyen su propia web app de educación sin saber programar. Cada escuela tiene su marca propia, dominio propio y sistema de cursos — el alumno ve todo como la plataforma del creador, sin rastro de 12ity. El creador puede monetizar directamente con pocos alumnos (sin necesitar millones de views como YouTube ni pagar alto % como Udemy). El valor humano de la clase supera a la IA. Stack: Turborepo monorepo con Next.js 14, tRPC, Drizzle/PostgreSQL, Supabase Auth, AWS S3.

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
- ✓ Rate limiting on all auth endpoints — v1.0
- ✓ Session management with silent refresh and graceful expiry redirect — v1.0
- ✓ Bilingual auth error codes (AuthErrorCode enum, Spanish primary) — v1.0
- ✓ All auth pages localized to Spanish — v1.0
- ✓ Dashboard layout with sidebar, header, responsive nav — v1.1
- ✓ School setup (name, description, slug, logo, brand colors) — v1.1
- ✓ Creator profile (name, bio, avatar with crop, contact info, social links) — v1.1
- ✓ File upload via AWS S3 presigned URLs with ownership validation — v1.1
- ✓ Onboarding checklist with progress tracking — v1.1
- ✓ Placeholders for future sections (Cursos, Alumnos, Métricas, Equipo, Dominio) — v1.1

### Active

## Current Milestone: v1.2 Landing Page del Creador

**Goal:** Paula puede solicitar la landing page de su escuela mediante biblioteca de templates + chat guiado con IA que genera un PRD interno para el equipo de 12ity.

**Target features:**
- Biblioteca de templates (galeria, filtros, preview mobile/desktop)
- Chat guiado con LLM para recopilar info de la escuela
- Generacion de PRD estructurado (JSON) — interno, no visible para el creador
- Estado de espera + sistema de notificaciones (in-app + email)

### Out of Scope

- Custom branded emails (Resend/SendGrid) — use Supabase built-in for now
- Student-specific auth flow — students use same auth, role handled by context
- 2FA / MFA — future enhancement
- Magic link login — not needed
- Social login beyond Google (GitHub, Apple) — defer
- Builder visual de landing (drag & drop) — sistema de templates es suficiente
- App móvil nativa — Web-first, responsive es suficiente
- Chat en tiempo real alumno-maestro — alta complejidad, no es core
- Marketplace de cursos — contradice modelo white-label
- Gamificación (badges, puntos) — no es core
- Account deletion / data export — future compliance milestone

## Context

**Current state (post v1.1):** Turborepo monorepo with `apps/web` (Next.js 14), `apps/worker` (Cloudflare), `packages/api` (tRPC), `packages/db` (Drizzle/PostgreSQL), `packages/config`, `packages/ui`. 6,733 LOC TypeScript/TSX.

**Infrastructure:**
- Auth: Supabase Auth (Google OAuth + email/password)
- Database: Supabase PostgreSQL via Drizzle ORM
- File storage: AWS S3 (`ity-uploads` bucket) with presigned URLs
- Rate limiting: Upstash Redis
- Deployment: Vercel

**What's built:**
- Full auth system (login, register, password reset, session management, rate limiting)
- Dashboard with responsive sidebar, header, onboarding checklist
- School setup (name, description, slug, logo upload, brand colors)
- Creator profile (name, bio, avatar with circular crop, contact, social links)
- Reusable upload widget with drag-and-drop, progress, and validation

**Platform vision (white-label):**
- Cada creador tiene su propia escuela con marca propia
- Alumnos ven todo como la plataforma del creador (sin rastro de 12ity)
- Landing pages personalizadas con sistema de templates por tipo de clase
- Dominio propio del creador (DNS/SSL — futuro milestone)
- Dos roles/vistas: maestro (gestión) y alumno (contenido)
- Clases en vivo y pregrabadas (futuro milestone)

**Future milestone roadmap:**
- v1.3: Ejecucion automatica del PRD + revision/aprobacion de landing + dominio + admin panel
- v1.4: Lado alumno (Cecilia) — registro en escuela, dashboard alumno, inscripcion a cursos
- v1.5: Cursos y lecciones (pregrabadas y en vivo)
- v1.6: Suscripcion/pagos de creadores a 12ity (Stripe)
- v1.7: Dominios propios (DNS/SSL) + gestion de equipo + metricas

## Constraints

- **Auth provider**: Supabase Auth — all auth flows must go through Supabase
- **Deployment**: Vercel — rate limiting uses Upstash Redis (not in-memory)
- **Email**: Supabase built-in email service — no custom SMTP yet
- **Storage**: AWS S3 — presigned URLs for direct browser uploads
- **Language**: Spanish is the primary UI language

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Google OAuth for both creators and students | Single auth system, role determined by context | ✓ Good |
| App-level rate limiting via Upstash Redis | Serverless-compatible, per-endpoint control | ✓ Good |
| Supabase built-in emails for password reset | Avoids adding email service dependency | ✓ Good for now |
| Silent refresh → redirect on session expiry | Better UX than hard logout | ✓ Good |
| AuthErrorCode enum with bilingual messages | Spanish primary, centralized error handling | ✓ Good |
| AWS S3 over Supabase Storage | Industry standard, scalable for future video content, zero egress lock-in risk | ✓ Good |
| FormProvider + useFormContext for form cards | Avoids prop-drilling register/errors to sub-components | ✓ Good |
| avatarUrl in local useState, not in form | Avatar persists immediately via separate mutation | ✓ Good |
| db:push over db:migrate for schema changes | Migration 0000 is initial snapshot, push applies only diff | ⚠️ Revisit — need proper migration workflow |
| Slug as separate tRPC procedure | Uniqueness check must exclude current school's own slug | ✓ Good |
| react-easy-crop for avatar | Circular crop with zoom, lightweight, well-maintained | ✓ Good |

---
*Last updated: 2026-04-02 after v1.2 milestone started*
