# Structure

## Directory Layout

```
ity/                                # Monorepo root
├── package.json                    # Root scripts (turbo build/dev/lint, db commands)
├── pnpm-workspace.yaml             # Workspace definition: apps/*, packages/*
├── turbo.json                      # Turbo task pipeline configuration
├── pnpm-lock.yaml
│
├── apps/
│   ├── web/                        # Next.js 14 App Router
│   │   ├── app/
│   │   │   ├── layout.tsx          # Root layout — Inter font, TRPCProvider
│   │   │   ├── page.tsx            # Landing/home page
│   │   │   ├── globals.css         # Tailwind imports + global styles
│   │   │   ├── (auth)/             # Auth route group
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── login/page.tsx
│   │   │   │   ├── register/page.tsx
│   │   │   │   ├── forgot-password/page.tsx
│   │   │   │   ├── reset-password/page.tsx
│   │   │   │   ├── verify-email/page.tsx
│   │   │   │   └── callback/route.ts  # OAuth/magic-link callback
│   │   │   ├── (dashboard)/        # Dashboard route group
│   │   │   │   ├── layout.tsx      # Auth guard + DashboardShell
│   │   │   │   ├── dashboard-shell.tsx  # Client: sidebar + header + mobile nav
│   │   │   │   └── dashboard/page.tsx   # Main dashboard page
│   │   │   └── api/
│   │   │       ├── trpc/           # tRPC HTTP handler
│   │   │       └── auth/           # Supabase auth webhooks
│   │   ├── components/
│   │   │   ├── auth/               # Auth UI: divider, google-icon, password-input, social-button
│   │   │   └── dashboard/          # Dashboard UI: header, sidebar, mobile-nav
│   │   ├── lib/
│   │   │   ├── supabase/           # client.ts, server.ts, middleware.ts
│   │   │   ├── trpc/               # client.ts, server.ts, provider.tsx
│   │   │   └── validations/        # auth.ts (Zod schemas for forms)
│   │   ├── middleware.ts           # Auth redirects + session refresh
│   │   ├── next.config.js
│   │   ├── tailwind.config.ts
│   │   └── postcss.config.js
│   │
│   └── worker/                     # Cloudflare Worker
│       └── src/index.ts            # Domain routing: KV lookup → proxy to Vercel
│
├── packages/
│   ├── api/                        # tRPC API layer
│   │   └── src/
│   │       ├── index.ts            # Exports appRouter, createCaller, createTRPCContext
│   │       ├── root.ts             # Router tree: auth, schools, courses
│   │       ├── trpc.ts             # tRPC init, context, middleware, procedure types
│   │       └── routers/
│   │           ├── auth.ts         # me, updateProfile, checkEmail, createCreator
│   │           ├── schools.ts      # list, get, getBySlug, create, update, updateBranding, delete
│   │           └── courses.ts      # Course CRUD operations
│   │
│   ├── db/                         # Drizzle ORM + PostgreSQL
│   │   ├── drizzle.config.ts       # Drizzle-kit config (loads .env.local from root)
│   │   └── src/
│   │       ├── index.ts            # DB client export
│   │       ├── schema.ts           # 10 tables: creators, schools, courses, modules, lessons, students, enrollments, payments, live_classes, announcements, domain_verifications
│   │       ├── client.ts           # Database connection (postgres.js driver)
│   │       └── seed.ts             # Seed script
│   │
│   ├── config/                     # Shared configuration
│   │   └── src/
│   │       ├── index.ts            # Re-exports all config
│   │       ├── env.ts              # Zod env validation schema
│   │       ├── constants.ts        # App name, locales, plans, lesson types, statuses, fonts
│   │       └── blocks.ts           # Course feature blocks definition
│   │
│   ├── ui/                         # Shared UI components
│   │   └── src/
│   │       ├── index.ts            # Component exports
│   │       └── utils.ts            # cn() utility (clsx + tailwind-merge)
│   │
│   └── typescript-config/          # Shared tsconfig bases
```

## Key Locations

| What | Where |
|------|-------|
| DB schema | `packages/db/src/schema.ts` |
| tRPC routers | `packages/api/src/routers/` |
| tRPC context & middleware | `packages/api/src/trpc.ts` |
| Auth pages | `apps/web/app/(auth)/` |
| Dashboard pages | `apps/web/app/(dashboard)/` |
| Supabase clients | `apps/web/lib/supabase/` |
| tRPC client/provider | `apps/web/lib/trpc/` |
| Form validations | `apps/web/lib/validations/` |
| Env validation | `packages/config/src/env.ts` |
| Domain worker | `apps/worker/src/index.ts` |

## Naming Conventions

- **Packages:** `@ity/{name}` — lowercase, single word
- **Files:** kebab-case (`dashboard-shell.tsx`, `social-button.tsx`)
- **Components:** PascalCase exports (`DashboardShell`, `SocialButton`)
- **DB tables:** snake_case (`live_classes`, `domain_verifications`)
- **DB columns:** snake_case (`creator_id`, `is_published`), camelCase in TS (`creatorId`, `isPublished`)
- **Routes:** kebab-case folders (`forgot-password/`, `verify-email/`)
- **tRPC routers:** camelCase (`schoolsRouter`, `authRouter`)
- **tRPC procedures:** camelCase (`getBySlug`, `updateBranding`)
- **Env vars:** SCREAMING_SNAKE_CASE (`NEXT_PUBLIC_SUPABASE_URL`)

## Package Dependencies

```
apps/web → @ity/api, @ity/db, @ity/ui, @ity/config
packages/api → @ity/db, @ity/config
packages/db → @ity/config
packages/ui → (standalone, peer: react)
packages/config → (standalone, zod only)
apps/worker → (standalone, Cloudflare types)
```
