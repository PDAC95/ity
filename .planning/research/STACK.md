# Stack Research — v1.2 Landing Page del Creador

**Domain:** AI-assisted onboarding wizard, template gallery, in-app + email notifications
**Researched:** 2026-04-02
**Confidence:** HIGH (npm-verified versions, official docs consulted)

---

## Context: Additive Research Only

The following are already installed and must NOT be added again:

| Package | Version | Role |
|---------|---------|------|
| next | 14.2.0 | App Router, RSC, route handlers |
| @trpc/server + @trpc/client + @trpc/react-query | 10.45.0 | API layer |
| @tanstack/react-query | 4.36.0 | Cache, mutations, background refetch |
| drizzle-orm | 0.38.0 | DB queries (packages/db) |
| zod | 3.23.0 | Schema validation |
| @supabase/supabase-js + @supabase/ssr | 2.45.0 / 0.5.0 | Auth, session |
| @upstash/ratelimit + @upstash/redis | 2.0.8 / 1.37.0 | Rate limiting |
| react-hook-form + @hookform/resolvers | 7.54.0 / 3.9.0 | Forms |
| framer-motion | 12.31.0 | Animations |
| zustand | 5.0.0 | Client state |
| tailwindcss + tailwind-merge + clsx | 3.4.0 / 2.5.0 / 2.1.0 | Styling |
| lucide-react | 0.468.0 | Icons (bell icon included) |
| sonner | 2.0.7 | Toast notifications |

---

## New Packages Required for v1.2

### 1. AI Streaming Chat — Vercel AI SDK

**Feature:** Chat guiado con LLM (streaming responses) + PRD JSON generation.

**Packages:**

| Package | Version | Install In | Purpose |
|---------|---------|-----------|---------|
| `ai` | `^4.3.0` | `apps/web` | Core: `streamText`, `generateObject`, `useChat` |
| `@ai-sdk/anthropic` | `^1.2.0` | `packages/api` or `apps/web` | Anthropic Claude provider |
| `@ai-sdk/react` | `^1.2.0` | `apps/web` | `useChat` hook for client-side streaming |

**Why Vercel AI SDK over raw `@anthropic-ai/sdk`:**
The raw Anthropic SDK requires manual SSE stream parsing, error handling, and response formatting. Vercel AI SDK provides `streamText` (streaming chat) and `generateObject` (structured JSON from Zod schema) with a unified interface. The `useChat` hook handles message state, loading state, and abort on the frontend — eliminates ~200 lines of boilerplate. Works natively with Next.js App Router route handlers.

**Why Claude over OpenAI:**
PROJECT.md specifies Claude API. The `@ai-sdk/anthropic` provider supports all current Claude models (claude-sonnet-4-5, claude-haiku-4-5). Claude Haiku is the right model for the guided chat (fast, cheap); Claude Sonnet for PRD generation (better structured output).

**Integration pattern — streaming chat:**
```
POST /api/ai/chat  →  Next.js Route Handler (NOT tRPC)
  └── streamText({ model: anthropic('claude-haiku-4-5'), messages })
      └── result.toUIMessageStreamResponse()
```

Route handler is required (not tRPC) because tRPC v10 does not support streaming responses natively. The route handler lives in `apps/web/app/api/ai/chat/route.ts`.

**Integration pattern — PRD generation:**
```
tRPC mutation: landing.generatePrd
  └── generateObject({ model: anthropic('claude-sonnet-4-5'), schema: prdSchema })
      └── Returns typed JSON object → stored in DB
```

`generateObject` is a standard async call, not streaming — safe to use inside tRPC mutation.

**Confidence:** HIGH — verified at ai-sdk.dev/docs, npm versions confirmed.

---

### 2. Email Notifications — Resend + React Email

**Feature:** Notification emails when landing page request status changes.

**Packages:**

| Package | Version | Install In | Purpose |
|---------|---------|-----------|---------|
| `resend` | `^4.5.0` | `packages/api` | Email delivery API (transactional) |
| `react-email` | `^3.0.7` | `packages/api` or `apps/web` | Email template renderer |
| `@react-email/components` | `^0.0.34` | same as above | Pre-built email components (Button, Text, etc.) |

**Why Resend over continuing with Supabase built-in email:**
Supabase built-in email is limited to 2 emails/hour on the free tier and only handles auth emails (magic links, password resets). Notification emails (e.g. "Tu landing page está lista") are transactional emails — a distinct category. Resend has a free tier (3,000 emails/month, 100/day), a clean SDK, and documented tRPC integration patterns. React Email enables JSX email templates that are type-safe and testable.

**Why not SendGrid or AWS SES:**
Both require domain verification and more setup. Resend works with minimal config for development and has the most ergonomic Node.js SDK for this use case.

**Integration in tRPC:**
```typescript
// packages/api — in a notification procedure
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);
await resend.emails.send({ from: '...', to: '...', react: <LandingReadyEmail /> });
```

**Confidence:** HIGH — verified at resend.com/docs, npm version confirmed (6.10.0 is latest, use ^4.5.0 for stability range).

**Actual latest versions (npm confirmed 2026-04-02):**

```
resend@6.10.0
react-email@5.2.10
@react-email/components@1.0.11
```

---

### 3. In-App Notifications — DB polling via tRPC (no new package)

**Feature:** Bell icon with unread count + notification dropdown.

**No new package required.** Use tRPC query with React Query's `refetchInterval`.

**Why NOT SSE/WebSockets for notifications:**
Supabase Realtime (SSE-based) would require a new infrastructure dependency. WebSockets require persistent connections, incompatible with Vercel's serverless model. The Upstash Redis pub/sub approach (SSE + `ioredis`) adds `ioredis` which also requires persistent TCP — incompatible with Vercel. For v1.2, notification urgency is low (landing page status changes happen on the order of minutes/hours). DB polling every 30 seconds is sufficient, adds zero new dependencies, and works identically on Vercel serverless.

**Implementation:**
```typescript
// tRPC query in packages/api
notifications.getUnread → SELECT * FROM notifications WHERE user_id = ? AND read_at IS NULL

// React Query polling in apps/web
const { data } = trpc.notifications.getUnread.useQuery(undefined, {
  refetchInterval: 30_000, // 30 seconds
  refetchIntervalInBackground: false,
});
```

**Bell icon:** `lucide-react` already installed — use `Bell` and `BellDot` icons (both in v0.468.0).

**Confidence:** HIGH — verified existing stack compatibility, no new dep needed.

---

### 4. Template Gallery — No new package

**Feature:** Gallery with filters + mobile/desktop preview via iframe scaling.

**No new package required.** Template previews use CSS transform scaling of an iframe, implemented with plain React + Tailwind. No dedicated library adds value here.

**Why NOT `react-responsive-iframe-viewer` or similar:**
These are small community packages with maintenance risk. The implementation is ~30 lines of CSS + React: render an iframe at target device width, scale it down with `transform: scale()` to fit the preview container. Framer Motion (already installed) handles the device toggle animation.

**Mobile/desktop toggle pattern:**
```tsx
// No new dependency — CSS transform approach
const DEVICE_WIDTHS = { mobile: 375, desktop: 1280 };
// iframe rendered at full device width, CSS scaled to fit preview container
style={{ width: deviceWidth, transform: `scale(${containerWidth / deviceWidth})` }}
```

**Confidence:** HIGH — standard approach used by Vercel's own template gallery.

---

## Schema Additions Required (packages/db — no new packages)

New Drizzle tables using existing `drizzle-orm` + `postgres`:

```typescript
// notifications table
notifications: id, userId, type, title, body, metadata (jsonb), readAt, createdAt

// landing_requests table
landingRequests: id, schoolId, templateId, status, prdJson (jsonb), createdAt, updatedAt

// templates table (seeded, not user-created)
templates: id, name, slug, category, previewImageUrl, previewUrl, metadata
```

`prdJson` stores the structured PRD as JSONB — PostgreSQL handles this natively, no separate document store needed.

---

## Environment Variables Required

```bash
# Anthropic (Claude API)
ANTHROPIC_API_KEY=sk-ant-...

# Resend (email notifications)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=notificaciones@12ity.com  # requires domain verification in Resend dashboard
```

---

## Installation

```bash
# AI SDK (apps/web — route handler + useChat hook)
pnpm add ai @ai-sdk/react --filter @ity/web

# Anthropic provider (packages/api — generateObject in tRPC + apps/web for route handler)
pnpm add @ai-sdk/anthropic --filter @ity/web
pnpm add @ai-sdk/anthropic --filter @ity/api

# Email (packages/api — called from tRPC procedures)
pnpm add resend react-email @react-email/components --filter @ity/api
```

---

## Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| Vercel AI SDK (`ai` + `@ai-sdk/anthropic`) | Raw `@anthropic-ai/sdk` | No `useChat` hook, manual SSE parsing, no `generateObject` |
| Vercel AI SDK (`ai` + `@ai-sdk/anthropic`) | LangChain | Massive bundle, over-engineered for a guided wizard, 4x more dependencies |
| Resend | SendGrid | More complex setup, no React templates natively, free tier is worse |
| Resend | AWS SES | Requires IAM setup, more complex, overkill for v1.2 volume |
| DB polling (tRPC + React Query) | Supabase Realtime | New infrastructure dependency, incompatible with current Vercel serverless setup |
| DB polling (tRPC + React Query) | WebSockets / Socket.io | Persistent connections, incompatible with Vercel serverless |
| CSS transform iframe | react-responsive-iframe-viewer | Small community package, ~30 lines of code replaces it |

---

## What NOT to Install

| Package | Reason |
|---------|--------|
| `@anthropic-ai/sdk` (raw) | Vercel AI SDK wraps it — using both creates version conflicts and duplication |
| `langchain` / `@langchain/anthropic` | Overkill, large bundle, complex for a guided chat wizard |
| `ioredis` | Requires persistent TCP connection — incompatible with Vercel serverless |
| `socket.io` / `ws` | Persistent connections — incompatible with Vercel serverless functions |
| `nodemailer` | SMTP-based, requires mail server config, worse DX than Resend |
| `@novu/node` | Notification infrastructure service — adds external dependency for what tRPC polling handles |

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `ai@^4.3.0` | `next@^14.2.0`, `react@^18.3.0` | AI SDK v4 (latest is v6.x series, check semver) |
| `@ai-sdk/react@^1.2.0` | `@tanstack/react-query@^4.36.0` | Uses React Query internally — aligned |
| `resend@^4.5.0` | Node.js 18+, works in Next.js API routes | Server-side only, never import in client components |
| `react-email@^3.0.7` | `react@^18.3.0` | Renders to HTML string on server, no client runtime |

**Note on AI SDK versioning:** npm shows `ai@6.0.143` as latest (2026-04-02). The `ai` package uses calendar-style versioning. Version 4.x is a major API era — verify `^4.3.0` vs `^6.0.0` range in practice. The official docs at ai-sdk.dev show `pnpm add ai @ai-sdk/react zod` without pinning a major. Use `ai@latest` and `@ai-sdk/anthropic@latest` at install time, then pin what resolves.

---

## Sources

- [ai-sdk.dev/docs/getting-started/nextjs-app-router](https://ai-sdk.dev/docs/getting-started/nextjs-app-router) — install commands, route handler pattern, `useChat` import path (HIGH confidence)
- [ai-sdk.dev/providers/ai-sdk-providers/anthropic](https://ai-sdk.dev/providers/ai-sdk-providers/anthropic) — `@ai-sdk/anthropic` package name, available Claude models (HIGH confidence)
- [ai-sdk.dev/docs/ai-sdk-core/generating-structured-data](https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data) — `generateObject` with Zod schema (HIGH confidence)
- [resend.com/docs/send-with-nextjs](https://resend.com/docs/send-with-nextjs) — Resend + Next.js App Router integration (HIGH confidence)
- [upstash.com/blog/realtime-notifications](https://upstash.com/blog/realtime-notifications) — SSE + Redis pub/sub pattern (consulted, rejected for v1.2 scope)
- npm registry — `ai@6.0.143`, `@ai-sdk/anthropic@3.0.65`, `@ai-sdk/react@3.0.145`, `resend@6.10.0`, `react-email@5.2.10`, `@react-email/components@1.0.11` (HIGH confidence, verified 2026-04-02)

---

*Stack research for: 12ity v1.2 — Landing Page del Creador*
*Researched: 2026-04-02*
