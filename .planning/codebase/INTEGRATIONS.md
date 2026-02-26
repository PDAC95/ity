# External Integrations

**Analysis Date:** 2026-02-26

## APIs & External Services

**Supabase Authentication:**
- Supabase Auth - Primary authentication provider
  - SDK/Client: @supabase/supabase-js 2.45.0
  - Server-side: @supabase/ssr 0.5.0
  - Auth: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Implementation: OAuth callback handler at `/c/dev/12ity/ity/apps/web/app/(auth)/callback/route.ts`
  - User sync: On OAuth callback, creator profile auto-created in `creators` table from user metadata

**Stripe Payments:**
- Stripe - Payment processing for course purchases
  - Documentation in schema: `/c/dev/12ity/ity/packages/db/src/schema.ts` has payment tables with Stripe integration points
  - School Stripe Account: `stripeAccountId`, `stripeOnboarded` fields on schools table
  - Payment Tracking: `stripePaymentIntentId`, `stripeCheckoutSessionId` on payments table
  - Auth:
    - `STRIPE_SECRET_KEY` (sk_test_xxx / sk_live_xxx)
    - `STRIPE_WEBHOOK_SECRET` (whsec_xxx)
    - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (pk_test_xxx / pk_live_xxx)
  - Status: Infrastructure exists but payment endpoint implementation not visible in provided files

## Data Storage

**Databases:**
- PostgreSQL (via Supabase)
  - Connection: `DATABASE_URL=postgresql://postgres:[PASSWORD]@db.grifirzazwmovtzzxera.supabase.co:5432/postgres`
  - Client: postgres 3.4.0 (pure JavaScript driver)
  - ORM: Drizzle 0.38.0
  - Schema location: `/c/dev/12ity/ity/packages/db/src/schema.ts`
  - Tables: creators, schools, courses, modules, lessons, students, enrollments, payments, live_classes, announcements, domain_verifications

**File Storage:**
- Cloudflare R2 - Image and document storage
  - Bucket: `R2_BUCKET_NAME` env var (default: ity-dev-uploads)
  - Public URL: `R2_PUBLIC_URL` env var
  - Account: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`
  - Next.js Image Optimization: Remote patterns configured for `*.r2.cloudflarestorage.com` in `/c/dev/12ity/ity/apps/web/next.config.js`
  - Binding in Worker: Accessible as `env.UPLOADS` R2Bucket in `/c/dev/12ity/ity/apps/worker/src/index.ts`

**Caching:**
- Cloudflare KV - Domain-to-school mapping cache
  - Namespace: `DOMAIN_MAPPING` (KV bindings for staging and production)
  - Worker Integration: Worker looks up custom domain → schoolId mapping in `/c/dev/12ity/ity/apps/worker/src/index.ts`
  - Usage: Fast domain routing without database query on every request

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (Primary)
  - Implementation: OAuth flows via Supabase
  - Callback handler: `/c/dev/12ity/ity/apps/web/app/(auth)/callback/route.ts`
  - User context passed to tRPC via Supabase client initialization
  - Server-side: `/c/dev/12ity/ity/apps/web/lib/supabase/server.ts`
  - Client-side: `/c/dev/12ity/ity/apps/web/lib/supabase/client.ts`
  - Session management: Cookie-based via @supabase/ssr middleware at `/c/dev/12ity/ity/apps/web/lib/supabase/middleware.ts`

**tRPC Context:**
- User context injected into tRPC calls via `/c/dev/12ity/ity/packages/api/src/trpc.ts`
- Two auth middleware levels:
  - `protectedProcedure` - Requires authenticated creator
  - `studentProcedure` - Requires authenticated student within school context
- School context headers passed from Cloudflare Worker:
  - `X-School-ID` - School UUID
  - `X-School-Domain` - Custom domain

## Monitoring & Observability

**Error Tracking:**
- Not detected in provided codebase

**Logs:**
- Console-based logging observed in:
  - Cloudflare Worker error handling: `/c/dev/12ity/ity/apps/worker/src/index.ts` (console.error)
  - Database initialization: Console warnings/errors expected from Drizzle
- No external logging service configured

## CI/CD & Deployment

**Hosting:**
- Vercel (Next.js application)
  - Domain: ity-staging.vercel.app (staging), ity.vercel.app (production)
  - Env var: `VERCEL_URL` passed to Cloudflare Worker for request forwarding
  - Deployment: Via `vercel deploy` (implicit from Next.js app structure)

**Cloudflare Workers:**
- Cloudflare Workers - Domain routing gateway
  - App name: ity-domain-router (staging: ity-domain-router-staging)
  - Deployment: Via `wrangler deploy` / `wrangler deploy --env staging` / `wrangler deploy --env production`
  - Config: `/c/dev/12ity/ity/apps/worker/wrangler.toml`

**Build System:**
- Turbo - Monorepo build orchestration
  - Commands: `turbo build`, `turbo dev`, `turbo lint`, `turbo type-check`, `turbo test`
  - Task caching enabled

**CI Pipeline:**
- Not detected in provided codebase (no .github/workflows or CI config files found)

## Environment Configuration

**Required env vars:**

**Public (Client-side):**
- `NEXT_PUBLIC_APP_URL` - Application root URL (http://localhost:3000 for dev)
- `NEXT_PUBLIC_APP_ENV` - Environment: local/staging/production
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key (public)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key (optional, for client-side)

**Private (Server-side):**
- `DATABASE_URL` - PostgreSQL connection string
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role for admin operations (optional)
- `STRIPE_SECRET_KEY` - Stripe secret key for server-side payments
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account identifier
- `CLOUDFLARE_API_TOKEN` - Cloudflare API authentication token
- `R2_BUCKET_NAME` - R2 bucket name for uploads
- `R2_PUBLIC_URL` - Public URL prefix for R2 objects (optional)

**Feature Flags:**
- `ENABLE_DEBUG` - Enable debug logging (boolean, default: false)
- `ENABLE_MOCK_PAYMENTS` - Use mock payment flow instead of Stripe (boolean, default: false)

**Node/App:**
- `NODE_ENV` - development/test/production

**Secrets location:**
- `.env.local` at monorepo root (`/c/dev/12ity/ity/.env.local`)
- Not committed to git (should be in .gitignore)
- Template: `.env.example` at `/c/dev/12ity/ity/.env.example`

## Webhooks & Callbacks

**Incoming:**
- Stripe Webhooks (not yet implemented in provided code)
  - Expected webhook secret: `STRIPE_WEBHOOK_SECRET`
  - Typical events: payment_intent.succeeded, payment_intent.failed, charge.refunded
  - Handler endpoint: Not found (likely `app/api/webhooks/stripe/route.ts` or similar, needs implementation)

- Supabase Auth Callback
  - Handler: `/c/dev/12ity/ity/apps/web/app/(auth)/callback/route.ts`
  - Trigger: OAuth redirect after user authenticates in Supabase UI
  - Actions: Code exchange for session, auto-create creator profile in database

**Outgoing:**
- Cloudflare Worker Domain Lookup
  - Worker makes outbound request to Vercel application
  - Headers added: X-School-ID, X-School-Domain, X-Forwarded-Host
  - Error handling: Returns 404 if domain not found in KV, 502 if upstream fails

---

*Integration audit: 2026-02-26*
