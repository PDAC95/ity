# Architecture

## Pattern

**Monorepo SaaS** — Turborepo + pnpm workspaces with clear separation between apps and shared packages.

**Multi-tenant by design:** Creators build Schools, each with optional custom domains routed through a Cloudflare Worker.

## Apps

### `apps/web` — Next.js 14 (App Router)
- **Role:** Creator dashboard + future student-facing portal
- **Entry:** `apps/web/app/layout.tsx` → TRPCProvider wraps entire app
- **Route groups:**
  - `(auth)/` — login, register, forgot-password, reset-password, verify-email, callback
  - `(dashboard)/` — authenticated creator dashboard with sidebar/header shell
  - `api/trpc/` — tRPC HTTP handler
  - `api/auth/` — Supabase auth webhooks
- **Middleware:** `apps/web/middleware.ts` — session refresh + auth redirects (login ↔ dashboard)
- **Client state:** Zustand for local UI, TanStack Query (via tRPC) for server state

### `apps/worker` — Cloudflare Worker
- **Role:** Custom domain routing
- **Flow:** Incoming request → KV lookup by hostname → forwards to Vercel with `X-School-ID` / `X-School-Domain` headers
- **Bindings:** `DOMAIN_MAPPING` (KV), `UPLOADS` (R2), `VERCEL_URL` (string)

## Packages

### `packages/api` — tRPC v10 API layer
- **Entry:** `packages/api/src/index.ts` → re-exports `appRouter`, `createCaller`, `createTRPCContext`
- **Router tree:** `auth`, `schools`, `courses`
- **Context:** `{ db, supabase, user, schoolId, schoolDomain }`
- **Procedure types:** `publicProcedure`, `protectedProcedure` (creator auth), `studentProcedure` (student + school context)
- **Transformer:** superjson
- **Validation:** Zod schemas inline per procedure

### `packages/db` — Drizzle ORM + PostgreSQL
- **Entry:** `packages/db/src/index.ts`
- **Schema:** `packages/db/src/schema.ts` — 10 tables with typed JSONB columns
- **Tables:** `creators`, `schools`, `courses`, `modules`, `lessons`, `students`, `enrollments`, `payments`, `live_classes`, `announcements`, `domain_verifications`
- **Relations:** Drizzle relational queries (`relations()`) defined alongside tables
- **Migrations:** `drizzle-kit push` (schema-push model, no migration files)
- **Seed:** `packages/db/src/seed.ts` via `tsx`

### `packages/config` — Shared configuration
- **Entry:** `packages/config/src/index.ts` → re-exports env, constants, blocks
- **Env validation:** Zod schema in `env.ts` — validates Supabase, Stripe, Cloudflare, feature flag vars
- **Constants:** App name, supported locales, plan tiers, lesson types, payment/live-class statuses, fonts
- **Blocks:** Course feature blocks (videos, live, quizzes, downloads, announcements, progress)

### `packages/ui` — Shared UI primitives
- **Entry:** `packages/ui/src/index.ts`
- **Utilities:** `cn()` via clsx + tailwind-merge in `utils.ts`
- **Styling:** class-variance-authority (cva) for variant-based components

### `packages/typescript-config` — Shared tsconfig bases

## Data Flow

```
Browser → Cloudflare Worker (custom domain) → Vercel (Next.js)
                                                  ↓
                                          Middleware (auth check)
                                                  ↓
                                    App Router (RSC / Client Components)
                                                  ↓
                                       tRPC Client → tRPC Server
                                                  ↓
                                          Drizzle ORM → PostgreSQL
                                                  ↓
                                        Supabase Auth (session)
```

## Authentication Flow

1. **Registration:** Client → Supabase Auth signup → callback route → `auth.createCreator` tRPC mutation → DB record
2. **Login:** Client → Supabase Auth signIn → callback route → session cookies set
3. **Session:** Middleware calls `updateSession()` + `getUser()` on every request
4. **Authorization:** tRPC middleware enforces auth via `protectedProcedure` / `studentProcedure`

## Multi-Tenancy Model

- **Creator context:** Authenticated user ID from Supabase → `protectedProcedure` → queries scoped by `creatorId`
- **School context:** Headers from Cloudflare Worker (`X-School-ID`, `X-School-Domain`) → `studentProcedure` requires `schoolId`
- **Domain mapping:** Cloudflare KV stores `hostname → schoolId`, Worker injects headers
