# Technology Stack

**Analysis Date:** 2026-02-26

## Languages

**Primary:**
- TypeScript 5.6.0 - Used across entire monorepo (frontend, backend, worker scripts)

**Secondary:**
- JavaScript - Configuration files (Next.js config, Tailwind config)

## Runtime

**Environment:**
- Node.js 20.0.0+ (specified in engines: `"node": ">=20.0.0"`)

**Package Manager:**
- pnpm 9.15.0+ (monorepo root in `/c/dev/12ity/ity/package.json`)
- Lockfile: Present (pnpm-lock.yaml expected)

## Frameworks

**Core:**
- Next.js 14.2.0 - Frontend framework with App Router (`/c/dev/12ity/ity/apps/web`)
- React 18.3.0 - UI library with React DOM 18.3.0
- Cloudflare Workers - Serverless functions via wrangler 3.99.0 (`/c/dev/12ity/ity/apps/worker`)

**Backend/API:**
- tRPC 10.45.0 - Type-safe RPC for server-client communication
  - Server: @trpc/server 10.45.0
  - Client: @trpc/client 10.45.0, @trpc/react-query 10.45.0

**Database:**
- Drizzle ORM 0.38.0 - Lightweight SQL ORM for PostgreSQL
  - Client: postgres 3.4.0 (pure JavaScript PostgreSQL driver)
  - Schema definition: `@ity/db` workspace package at `/c/dev/12ity/ity/packages/db`
  - Migrations: drizzle-kit 0.30.0

**State Management:**
- zustand 5.0.0 - Lightweight state management (client-side)
- React Query / TanStack Query 4.36.0 - Server state & caching
- SuperJSON 2.2.0 - JSON serialization for tRPC

**Forms & Validation:**
- React Hook Form 7.54.0 - Form state management
- Zod 3.23.0 - Schema validation (used in all packages)
- @hookform/resolvers 3.9.0 - Integration layer

**UI & Styling:**
- Tailwind CSS 3.4.0 - Utility-first CSS framework
- PostCSS 8.4.49 - CSS processing (autoprefixer support)
- Tailwind CSS Animate 1.0.7 - Animation utilities
- class-variance-authority 0.7.0 - Component variant system
- clsx 2.1.0 - Conditional class name utility
- tailwind-merge 2.5.0 - Merge Tailwind classes
- Lucide React 0.468.0 - Icon library

**Internationalization:**
- next-intl 3.25.0 - Multi-language support (config supports 'en', 'es', 'fr', 'pt')

**Motion & Animation:**
- framer-motion 12.31.0 - React animation library

**Authentication & Database:**
- @supabase/supabase-js 2.45.0 - Supabase client (main auth provider)
- @supabase/ssr 0.5.0 - Supabase SSR utilities for Next.js

## Key Dependencies

**Critical:**
- drizzle-orm 0.38.0 - Database abstraction and query builder
- @supabase/supabase-js 2.45.0 - Authentication and real-time database
- @trpc/server & @trpc/client 10.45.0 - Type-safe API communication
- zod 3.23.0 - Runtime type validation

**Infrastructure:**
- postgres 3.4.0 - PostgreSQL database driver
- dotenv 16.4.0 - Environment variable loading (`@ity/db`)
- superjson 2.2.0 - Enhanced JSON serialization for complex types
- server-only 0.0.1 - Ensure server-only code safety

**Dev Tools:**
- turbo 2.3.0 - Monorepo build system
- tsx 4.19.0 - TypeScript execution for Node.js
- prettier 3.2.0 - Code formatter
- eslint 8.57.0 - Linting (with next/eslint-config-next 14.2.0)
- TypeScript 5.6.0 - Type checking
- @types/node 22.10.0 - Node.js type definitions
- @types/react 18.3.0, @types/react-dom 18.3.0 - React type definitions

## Configuration

**Environment:**
- `.env.example` at `/c/dev/12ity/ity/.env.example` with required variables documented
- Configuration validation via Zod in `@ity/config/src/env.ts`
- Drizzle config loads `.env.local` from monorepo root: `/c/dev/12ity/ity/packages/db/drizzle.config.ts`

**Build:**
- Next.js config: `/c/dev/12ity/ity/apps/web/next.config.js`
  - Transpiles workspace packages: `@ity/ui`, `@ity/api`, `@ity/db`, `@ity/config`
  - Image optimization for Supabase storage and Cloudflare R2
- Tailwind config: `/c/dev/12ity/ity/apps/web/tailwind.config.ts`
- PostCSS config: `/c/dev/12ity/ity/apps/web/postcss.config.js`
- Wrangler config (Cloudflare Workers): `/c/dev/12ity/ity/apps/worker/wrangler.toml`
  - Three environments: local (default), staging, production
  - KV namespace and R2 bucket bindings (commented, ready for setup)

**TypeScript:**
- Root config: `/c/dev/12ity/ity/apps/web/tsconfig.json`
  - Extends: `@ity/typescript-config/nextjs.json`
  - Path aliases: `"@/*": ["./*"]` for Next.js app directory imports

## Workspace Structure

**Monorepo Packages:**
- `@ity/db` - Database schema, ORM, migrations (published at `/c/dev/12ity/ity/packages/db`)
- `@ity/api` - tRPC router and procedures (published at `/c/dev/12ity/ity/packages/api`)
- `@ity/config` - Shared configuration, environment validation, constants (published at `/c/dev/12ity/ity/packages/config`)
- `@ity/ui` - Reusable UI components and styling utilities (published at `/c/dev/12ity/ity/packages/ui`)
- `@ity/typescript-config` - Shared TypeScript configurations
- `@ity/web` - Next.js application (published at `/c/dev/12ity/ity/apps/web`)
- `@ity/worker` - Cloudflare Worker domain router (published at `/c/dev/12ity/ity/apps/worker`)

## Platform Requirements

**Development:**
- Node.js >= 20.0.0
- pnpm >= 9.0.0
- PostgreSQL database (local development or via Supabase)
- Supabase project with auth enabled
- Cloudflare account (for Workers, R2, KV)

**Production:**
- Vercel (deployment target for Next.js)
- Supabase (PostgreSQL database and auth)
- Cloudflare (Workers for domain routing, R2 for file storage, KV for domain mapping)
- Stripe (payment processing - infrastructure in place)

---

*Stack analysis: 2026-02-26*
