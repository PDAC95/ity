# Concerns

## Security

### Open Redirect in Auth Callback
`apps/web/app/(auth)/callback/route.ts` — The `next` query parameter used for post-auth redirect is not validated. An attacker could craft a callback URL redirecting to a malicious site.

### Email Enumeration
`packages/api/src/routers/auth.ts` — `auth.checkEmail` is a public procedure that reveals whether an email is registered. This enables email enumeration attacks.

### Public Creator Creation
`packages/api/src/routers/auth.ts` — `auth.createCreator` is a public procedure accepting an arbitrary UUID as `id`. No verification that the provided ID matches the authenticated Supabase user.

### Silent Cookie Errors
`apps/web/lib/supabase/server.ts` — Supabase cookie operations likely have silent `try/catch` blocks, hiding auth state issues.

### Header Trust
`packages/api/src/trpc.ts` — School context (`schoolId`, `schoolDomain`) comes from HTTP headers (`X-School-ID`, `X-School-Domain`). If the Cloudflare Worker is bypassed (direct Vercel access), these headers can be spoofed.

## Technical Debt

### Incomplete Features
- **Payments:** Schema and Stripe env vars exist, but no webhook handler or checkout flow is implemented
- **Live Classes:** Table exists, but no video provider integration (no API for room creation)
- **File Uploads:** R2 bucket binding exists in Worker, but no upload API routes in the web app
- **Email Notifications:** No email service configured (no SendGrid, Resend, etc.)
- **Internationalization:** `next-intl` is a dependency but not configured (no messages files, no locale routing)

### Courses Router
`packages/api/src/routers/courses.ts` — Likely has N+1 query patterns when loading courses with nested modules/lessons. No pagination on list queries.

### No Caching in Domain Worker
`apps/worker/src/index.ts` — Every request does a KV lookup without caching. High-traffic custom domains will have unnecessary KV reads (though KV is already edge-cached by Cloudflare).

### Schema Push vs Migrations
`packages/db/drizzle.config.ts` — Uses `drizzle-kit push` (direct schema push) instead of migration files. This works for development but is risky for production (no rollback path, no migration history).

### Manual Authorization Checks
Each tRPC procedure in `schools.ts` manually checks `creatorId === ctx.user.id` via `and(eq(...), eq(...))`. No shared authorization middleware — easy to forget on new procedures.

## Performance

### Unbounded JSONB Loading
`packages/db/src/schema.ts` — Large JSONB columns (`landingPageData`, `content`, `progress`, `attendees`) are loaded on every query. No selective column queries for list views.

### No Pagination
`packages/api/src/routers/schools.ts` — `schools.list` returns all schools without limit/offset. Same likely applies to courses and other list queries.

### Missing Compound Indexes
Some query patterns (e.g., filtering by `schoolId` + `isPublished` on courses) lack compound indexes.

## Test Coverage

**Zero test coverage.** No test framework, no test files, no CI test pipeline. See `TESTING.md` for details and recommendations.

## Fragile Areas

### Auth State Synchronization
Authentication spans three layers: Supabase Auth → Next.js middleware → tRPC context. Silent failures in any layer can leave the user in an inconsistent state (e.g., logged in to Supabase but no creator record in DB).

### Registration Race Condition
`apps/web/app/(auth)/callback/route.ts` — After Supabase signup, the callback creates a creator record. If the user hits the callback twice (double-click, browser retry), the second call could fail or create duplicate state.

### String-Based Error Detection
Error handling likely uses `message.includes('already')` patterns instead of proper error codes, making it brittle to message changes.

### JSONB Schema Drift
Typed JSONB columns (e.g., `Branding`, `LessonContent`, `EnrollmentProgress`) have TypeScript types but no runtime validation when reading from the database. If the DB contains data that doesn't match the type, it will silently pass.

## Missing Infrastructure

- **No CI/CD pipeline** — No GitHub Actions, no automated testing or deployment
- **No error monitoring** — No Sentry, LogRocket, or similar
- **No analytics** — No tracking of user behavior or feature usage
- **No rate limiting** — Public tRPC procedures have no rate limiting
- **No CORS configuration** — Default Next.js CORS (may be an issue with custom domains)
