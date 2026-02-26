# Testing

## Current State

**No test framework is configured.** There are no test files, no test runner dependencies, and no test scripts that execute actual tests. The `turbo test` task exists in the pipeline but no package implements it.

## Type Safety as Validation

The codebase relies heavily on TypeScript + Zod for correctness instead of tests:

### Zod Validation
- **tRPC inputs:** Every procedure validates inputs with inline Zod schemas (`z.object({ ... })`)
- **Env validation:** `packages/config/src/env.ts` validates all environment variables at startup
- **Form validation:** `apps/web/lib/validations/auth.ts` provides client-side Zod schemas for forms
- **tRPC error formatter:** Surfaces `ZodError.flatten()` to clients

### TypeScript Strictness
- Shared tsconfig bases in `packages/typescript-config/`
- `type-check` script defined in all packages (`tsc --noEmit`)
- Turbo pipeline runs `type-check` across all packages
- Typed JSONB columns in schema via `.$type<T>()`

### Drizzle ORM Type Safety
- Schema types auto-inferred from table definitions
- Relational queries provide typed nested results
- `drizzle-kit push` validates schema against live database

## What Would Need Testing

### Priority 1: Auth flows
- Registration → creator record creation
- Login → session management
- OAuth callback handling
- Middleware redirects (auth pages ↔ dashboard)

### Priority 2: tRPC procedures
- Authorization: protected procedures reject unauthenticated requests
- Input validation: invalid inputs return proper Zod errors
- Business logic: slug uniqueness, ownership checks, CRUD operations

### Priority 3: Domain routing
- Cloudflare Worker: KV lookup → header injection → proxy
- Edge cases: localhost bypass, missing school, upstream errors

### Priority 4: Component behavior
- Form submission flows (react-hook-form + Zod)
- Dashboard navigation state
- Error/loading states

## Recommended Setup

Given the stack (Next.js 14, tRPC, Drizzle, Supabase):
- **Unit/integration:** Vitest (fast, TS-native, works with tRPC callers)
- **E2E:** Playwright (Next.js integration, auth flow testing)
- **DB testing:** Test against real Supabase project or local Postgres with `drizzle-kit push`
- **tRPC testing:** `createCaller()` already exported — ideal for direct procedure testing

## Linting

- ESLint configured in `apps/web` (`eslint-config-next`)
- Prettier for formatting (`prettier --write "**/*.{ts,tsx,md,json}"`)
- `turbo lint` runs across workspace
