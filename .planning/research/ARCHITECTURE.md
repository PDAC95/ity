# Architecture Research

**Domain:** Creator Dashboard — Template Gallery + LLM Chat + PRD Generation + Notifications (v1.2)
**Researched:** 2026-04-02
**Confidence:** HIGH — based on direct codebase audit + official documentation + integration pattern verification

---

## Standard Architecture

### System Overview (v1.2 additions layered onto existing)

```
Browser (Creator)
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│  apps/web  (Next.js 14 App Router)                           │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  (dashboard)/dashboard/landing/                        │  │
│  │                                                        │  │
│  │  page.tsx          ← Server Component: fetch request  │  │
│  │  templates/page.tsx ← Server Component: static data   │  │
│  │  chat/page.tsx     ← Client Component: chat wizard    │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  app/api/                                                     │
│    trpc/[trpc]/route.ts    ← existing (unchanged)            │
│    chat/route.ts           ← NEW: SSE streaming endpoint     │
│    notifications/route.ts  ← NEW: SSE notification stream    │
└──────────────────────────────────────────────────────────────┘
         │ tRPC (standard mutations/queries)
         ▼
┌──────────────────────────────────────────────────────────────┐
│  packages/api  (tRPC routers)                                │
│                                                               │
│  appRouter                                                   │
│    landing.requestPage       ← NEW: create landing request  │
│    landing.getStatus         ← NEW: poll request status     │
│    notifications.list        ← NEW: list notifications      │
│    notifications.markRead    ← NEW: mark as read            │
└──────────────────────────────────────────────────────────────┘
         │ Drizzle ORM
         ▼
┌──────────────────────────────────────────────────────────────┐
│  packages/db  (Drizzle + PostgreSQL via Supabase)            │
│                                                               │
│  landing_page_requests  ← NEW table                         │
│  notifications          ← NEW table                         │
│  (all existing tables unchanged)                            │
└──────────────────────────────────────────────────────────────┘
         │ Claude SDK (server-side only)
         ▼
┌──────────────────────────────────────────────────────────────┐
│  Anthropic API  (external)                                   │
│  ANTHROPIC_API_KEY in env, called from route handler only    │
└──────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Type |
|-----------|---------------|------|
| `dashboard/landing/page.tsx` | Landing page hub: show request status, link to templates or chat | Server Component |
| `dashboard/landing/templates/page.tsx` | Template gallery with filter tabs, preview modal trigger | Server Component (static data) |
| `dashboard/landing/chat/page.tsx` | Chat wizard shell, loads active request context | Server Component shell |
| `components/landing/template-gallery.tsx` | Renders template cards, handles filter state, opens preview | Client Component |
| `components/landing/template-preview-modal.tsx` | Dialog with mobile/desktop preview toggle, iframe or screenshot | Client Component |
| `components/landing/chat-wizard.tsx` | Multi-turn chat UI, streams from `/api/chat`, sends final submission | Client Component |
| `components/notifications/notification-bell.tsx` | Bell icon in header, unread count badge, dropdown list | Client Component |
| `app/api/chat/route.ts` | Receives messages + context, calls Claude SDK, streams SSE back | Node.js Route Handler |
| `app/api/notifications/route.ts` | Long-lived SSE endpoint for push notifications | Node.js Route Handler |
| `packages/api/src/routers/landing.ts` | requestPage, getStatus, savePrd (internal admin) | tRPC router |
| `packages/api/src/routers/notifications.ts` | list, markRead, markAllRead | tRPC router |

---

## Recommended Project Structure

```
apps/web/
  app/
    (dashboard)/
      dashboard/
        landing/
          page.tsx                        ← NEW: landing hub (shows status or onboards to templates)
          templates/
            page.tsx                      ← NEW: template gallery (Server Component, static data)
          chat/
            page.tsx                      ← NEW: chat wizard (Server Component shell + Client wizard)
    api/
      chat/
        route.ts                          ← NEW: SSE streaming endpoint (Node.js runtime, NOT edge)
      notifications/
        route.ts                          ← NEW: SSE push notifications stream
  components/
    landing/
      template-gallery.tsx               ← NEW: Client Component (filter state, card grid)
      template-card.tsx                  ← NEW: shadcn Card with preview button
      template-preview-modal.tsx         ← NEW: Dialog with mobile/desktop toggle
      chat-wizard.tsx                    ← NEW: Client Component (message state, SSE consumer)
      chat-message.tsx                   ← NEW: individual message bubble
      prd-submission-form.tsx            ← NEW: final confirmation before submitting PRD
    notifications/
      notification-bell.tsx              ← NEW: header bell icon with badge (Client Component)
      notification-item.tsx              ← NEW: single notification row
  lib/
    templates/
      registry.ts                        ← NEW: static template data (pure TS, no DB)
      types.ts                           ← NEW: Template type definition
    chat/
      system-prompt.ts                   ← NEW: wizard system prompt builder

packages/
  api/src/routers/
    landing.ts                           ← NEW: requestPage, getStatus
    notifications.ts                     ← NEW: list, markRead, markAllRead
  db/src/
    schema.ts                            ← MODIFY: add landing_page_requests + notifications tables
```

---

## Architectural Patterns

### Pattern 1: Static registry for template data (no DB)

Template definitions are static configuration, not user data. They never change at runtime and require no CRUD. Store them as a typed TypeScript array in `lib/templates/registry.ts` and import directly into Server Components. This keeps the gallery page fast (no DB query, no loading state) and templates easy to expand.

```typescript
// lib/templates/types.ts
export type Template = {
  id: string;
  name: string;
  category: 'fitness' | 'cooking' | 'business' | 'arts' | 'tech' | 'wellness';
  thumbnailUrl: string;        // S3 or public static path
  previewImageDesktop: string;
  previewImageMobile: string;
  description: string;
  features: string[];          // bullet points shown in preview
};

// lib/templates/registry.ts
import type { Template } from './types';
export const TEMPLATES: Template[] = [
  { id: 'fitness-hero-1', name: 'Strong Start', category: 'fitness', ... },
  { id: 'cooking-warm-1', name: 'Cocina Viva', category: 'cooking', ... },
  // ...
];
```

The gallery page passes `TEMPLATES` as props to the Client Component. The Client Component handles filter state locally with `useState` — no tRPC call needed.

### Pattern 2: SSE streaming via native Next.js Route Handler (not tRPC)

tRPC v10 does not support streaming responses — it serializes everything as JSON. LLM token streaming requires SSE. Use a native Next.js Route Handler at `app/api/chat/route.ts` alongside tRPC (they coexist at different URL paths).

The route handler must use the **Node.js runtime** (not edge). Edge runtime has reduced API surface and streaming timeout constraints. Vercel Pro allows up to 60s serverless function duration — sufficient for a chat wizard exchange.

The critical implementation rule: return the `Response` immediately and kick off async work inside the `ReadableStream`'s `start()` method. If you await inside the handler before returning, Next.js buffers everything and the client receives the full response at once.

```typescript
// app/api/chat/route.ts
import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic'; // prevents Vercel response caching

export async function POST(req: Request) {
  const { messages, schoolContext } = await req.json();
  const client = new Anthropic();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const anthropicStream = client.messages.stream({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: buildWizardSystemPrompt(schoolContext),
        messages,
      });

      anthropicStream.on('text', (text) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
      });

      await anthropicStream.finalMessage();
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
```

The Client Component (`chat-wizard.tsx`) consumes this with the browser's native `EventSource` or a simple `fetch` + `ReadableStream` reader. No additional library needed.

### Pattern 3: Multi-turn chat state management (client-side only during session)

Chat messages are **not persisted to DB during the conversation**. They live in `useState` in `chat-wizard.tsx`. Only the final extracted PRD JSON is persisted (via tRPC mutation `landing.requestPage`). This avoids a complex chat history table for a wizard that runs once per creator per milestone.

The wizard ends when the LLM signals completion (e.g. returns a special sentinel token or a structured JSON block). The Client Component detects this, extracts the PRD JSON, and calls `api.landing.requestPage.useMutation` to persist the request with `status: 'pending'`.

### Pattern 4: Notification delivery via DB polling (not SSE for now)

True SSE push notifications require a persistent server connection. On Vercel serverless, this hits function timeout limits and does not scale across multiple instances. For v1.2, use **DB polling** with a short interval (10s) via tRPC query:

```typescript
// components/notifications/notification-bell.tsx
const { data } = api.notifications.list.useQuery(
  { creatorId },
  { refetchInterval: 10_000 } // poll every 10s
);
```

This is simpler, stateless, Vercel-compatible, and sufficient for the notification volume in v1.2 (a few status updates per creator). The SSE notifications route handler can be deferred to v1.3 if real-time push is needed.

The `notifications` table stores all notifications. The bell component shows unread count from the query result. No SSE infrastructure needed.

### Pattern 5: PRD as internal JSONB, not creator-visible

The `landing_page_requests` table stores the PRD as a `jsonb` column (`prd_data`). The creator never sees raw PRD JSON — they see a status screen ("Solicitud enviada, te notificaremos cuando esté lista"). The PRD is for the 12ity team. An admin view (v1.3) will display it. No API exposure of `prd_data` to `protectedProcedure` callers.

---

## Data Flow

### Template Gallery Flow

```
Creator opens /dashboard/landing
  → Server Component: check landing_page_requests for this creator
  → If no request: render gallery entry point + "Start" CTA
  → If request pending: render status card (waiting, in progress)
  → If request complete: render preview/done state

Creator opens /dashboard/landing/templates
  → Server Component: import TEMPLATES from registry (no DB call)
  → Pass to TemplateGallery Client Component as props
  → Client Component: useState for activeCategory filter
  → Renders filtered grid of TemplateCards

Creator clicks "Preview"
  → TemplatePreviewModal opens (Dialog)
  → Tabs: Mobile / Desktop toggle
  → Image or iframe preview
  → "Elegir este template" button

Creator selects template
  → navigate to /dashboard/landing/chat?templateId={id}
  → templateId passed as searchParam, read in Server Component
```

### LLM Chat Wizard Flow

```
Creator opens /dashboard/landing/chat?templateId=fitness-hero-1
  → Server Component: fetch school data (name, description, branding)
  → Pass school context + templateId to ChatWizard Client Component

Creator answers wizard questions (multi-turn)
  → ChatWizard: POST /api/chat with { messages, schoolContext }
  → Route Handler: Anthropic SDK messages.stream()
  → SSE chunks: data: {"text": "..."}\n\n
  → ChatWizard: append streamed tokens to current assistant message in state
  → On [DONE]: mark message complete

LLM signals "chat complete" (structured JSON block or sentinel)
  → ChatWizard: extracts PRD JSON from final message
  → Renders PrdSubmissionForm: "Tu solicitud está lista — ¿Enviar?"
  → Creator confirms

Creator confirms
  → api.landing.requestPage.useMutation({
      schoolId,
      templateId,
      prdData: extractedPrd,
      status: 'pending'
    })
  → tRPC: INSERT into landing_page_requests
  → tRPC: INSERT into notifications (type: 'landing_request_received')
  → navigate to /dashboard/landing (shows status card)
```

### Notification Flow (polling)

```
Background: admin marks request as 'completed' (future v1.3 admin panel)
  → UPDATE landing_page_requests SET status = 'completed'
  → INSERT notifications (creatorId, type: 'landing_page_ready', ...)

Creator's dashboard (any page)
  → NotificationBell: useQuery notifications.list refetchInterval=10s
  → Detects new unread notification
  → Badge count increments
  → Creator clicks bell: dropdown shows "Tu landing page está lista"
  → Creator clicks notification: api.notifications.markRead.useMutation
  → navigate to /dashboard/landing (shows completed state)
```

---

## New Database Tables

### `landing_page_requests`

```typescript
export const landingPageRequests = pgTable('landing_page_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  schoolId: uuid('school_id')
    .references(() => schools.id, { onDelete: 'cascade' })
    .notNull(),
  creatorId: uuid('creator_id')
    .references(() => creators.id, { onDelete: 'cascade' })
    .notNull(),
  templateId: varchar('template_id', { length: 100 }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  // status values: 'pending' | 'in_progress' | 'completed' | 'rejected'
  prdData: jsonb('prd_data').$type<Record<string, unknown>>(),
  // Internal only — never exposed via protectedProcedure
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

### `notifications`

```typescript
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  creatorId: uuid('creator_id')
    .references(() => creators.id, { onDelete: 'cascade' })
    .notNull(),
  type: varchar('type', { length: 100 }).notNull(),
  // type values: 'landing_request_received' | 'landing_page_ready' | 'landing_rejected'
  title: varchar('title', { length: 255 }).notNull(),
  body: text('body'),
  isRead: boolean('is_read').default(false),
  actionUrl: varchar('action_url', { length: 500 }),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow(),
});
```

---

## Integration Points

### New components and their integration with existing architecture

| New Item | Integrates With | How |
|----------|----------------|-----|
| `app/api/chat/route.ts` | Anthropic SDK (`@anthropic-ai/sdk`) | Server-side only, Node.js runtime, ANTHROPIC_API_KEY env var |
| `app/api/chat/route.ts` | `apps/web/lib/supabase/server` | Auth check at start of handler — reject unauthenticated requests |
| `packages/api/src/routers/landing.ts` | `landing_page_requests` table | tRPC `protectedProcedure` — creatorId from `ctx.user.id` |
| `packages/api/src/routers/notifications.ts` | `notifications` table | tRPC `protectedProcedure` — always scoped to `ctx.user.id` |
| `components/notifications/notification-bell.tsx` | `components/dashboard/header.tsx` | Added to header JSX alongside existing user menu |
| `lib/templates/registry.ts` | `dashboard/landing/templates/page.tsx` | Direct import (no API, no DB) |
| `chat-wizard.tsx` | `/api/chat` route handler | `fetch` + `ReadableStream` reader (native, no EventSource polyfill) |

### What is NOT changed in existing architecture

| Existing | Status |
|----------|--------|
| `app/api/trpc/[trpc]/route.ts` | Unchanged — tRPC handler coexists with new `/api/chat` and `/api/notifications` |
| `packages/api/src/root.ts` | Add two new routers (`landing`, `notifications`) to `appRouter` |
| `(dashboard)/layout.tsx` | Unchanged — auth guard continues to protect all dashboard routes |
| `packages/db/src/schema.ts` | Append two new tables — existing tables untouched |
| `components/dashboard/sidebar.tsx` | Add "Landing Page" nav item pointing to `/dashboard/landing` |
| AWS S3 upload pattern | Unchanged — template thumbnails hosted on S3 or public CDN |

### Environment Variables Required (new)

```
ANTHROPIC_API_KEY=sk-ant-...   # Only accessed server-side in app/api/chat/route.ts
```

Add to `packages/config/src/env.ts` as a server-only variable. Never expose to the client bundle.

---

## Build Order (dependency-driven)

Build in this order to avoid blocking on unfinished dependencies:

**Step 1 — DB schema + tRPC routers (unblocks everything)**
- Add `landing_page_requests` + `notifications` tables to `packages/db/src/schema.ts`
- Run `db:push`
- Add `landing.ts` + `notifications.ts` routers
- Register them in `packages/api/src/root.ts`

**Step 2 — Template registry + gallery (no external deps, verifiable immediately)**
- Create `lib/templates/registry.ts` with initial set of templates
- Build `template-gallery.tsx`, `template-card.tsx`, `template-preview-modal.tsx`
- Build `dashboard/landing/templates/page.tsx` (Server Component, passes static data)
- This step can be completed and tested without Claude API or notifications

**Step 3 — Chat route handler + wizard UI**
- Add `ANTHROPIC_API_KEY` to env
- Build `app/api/chat/route.ts` (auth check, SSE stream, Claude SDK)
- Build `chat-wizard.tsx` (message state, fetch stream consumer)
- Build `dashboard/landing/chat/page.tsx` (shell, passes school context)
- Build `lib/chat/system-prompt.ts` (wizard prompt builder)

**Step 4 — PRD submission + landing hub**
- Build `prd-submission-form.tsx` (confirmation step at wizard end)
- Connect wizard completion to `api.landing.requestPage.useMutation`
- Build `dashboard/landing/page.tsx` (status-aware hub: gallery entry / pending / done)

**Step 5 — Notifications**
- Build `notifications.ts` tRPC router
- Build `notification-bell.tsx` + `notification-item.tsx`
- Wire `NotificationBell` into `header.tsx`
- Notifications are inserted as side effects of `landing.requestPage` mutation

---

## Anti-Patterns

### Anti-Pattern 1: Routing SSE through tRPC

**What people do:** Try to add a tRPC subscription for streaming LLM tokens because everything else in the app uses tRPC.

**Why it's wrong:** tRPC v10 serializes all responses as JSON. Subscriptions in v10 require WebSocket transport (`createWSClient`), which needs a persistent WebSocket server — incompatible with Vercel serverless. The tRPC SSE example repo targets tRPC v11 which has a different subscription model.

**Do this instead:** Use a native Next.js Route Handler at `/api/chat/route.ts` alongside tRPC. Both coexist at different URL paths. tRPC handles all standard queries/mutations; the route handler handles streaming only.

### Anti-Pattern 2: Persisting every chat message to DB

**What people do:** Store each chat turn in a `chat_messages` table for history, analytics, or "resume" functionality.

**Why it's wrong:** For a one-shot wizard (runs once per creator per milestone), this adds a table, a router, and ongoing storage for data that has no value after the PRD is extracted. It couples the chat UI to DB availability and makes the wizard stateful in a way that requires cleanup logic.

**Do this instead:** Keep chat state in `useState` for the duration of the session. Only persist the final extracted PRD JSON to `landing_page_requests.prd_data`. If resumability becomes a requirement, introduce persistence then.

### Anti-Pattern 3: Exposing prd_data via creator-facing tRPC procedure

**What people do:** Include `prdData` in the `landing.getStatus` response so the frontend can display it.

**Why it's wrong:** PRDs are internal documents containing structured team instructions. Exposing them to creators leaks implementation intent and invites confusion or gaming.

**Do this instead:** `landing.getStatus` returns only `{ id, status, templateId, createdAt }`. A separate admin-only procedure (introduced in v1.3) exposes the full PRD.

### Anti-Pattern 4: Using Edge Runtime for the chat route handler

**What people do:** Add `export const runtime = 'edge'` to the chat route handler for lower latency global distribution.

**Why it's wrong:** Edge runtime has a reduced Node.js API surface and streaming timeouts that are shorter than a full LLM response exchange. The Anthropic SDK uses Node.js-specific APIs that may not be available on the Edge. Vercel Pro's Node.js runtime with 60s timeout is sufficient.

**Do this instead:** Leave the chat route handler on the default Node.js runtime (no `runtime` export needed). Only add `export const dynamic = 'force-dynamic'` to prevent Vercel from caching SSE responses.

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-500 creators | DB polling every 10s is fine. Single Anthropic API key. |
| 500-5k creators | Add Upstash Redis queue for LLM requests to avoid API rate limits. Move notification delivery to background job (Cloudflare Worker already exists in monorepo). |
| 5k+ creators | Introduce proper job queue (BullMQ or Cloudflare Queues). SSE push for notifications via Redis pub/sub across multiple instances. |

For v1.2, the 0-500 creator range applies. No scaling infrastructure changes needed.

---

## Sources

- Anthropic SDK TypeScript streaming: https://platform.claude.com/docs/en/build-with-claude/streaming
- Upstash SSE + LLM streaming in Next.js: https://upstash.com/blog/sse-streaming-llm-responses
- Next.js Route Handler streaming pattern: https://nextjs.org/docs/app/api-reference/file-conventions/route
- Vercel streaming timeout limits: https://vercel.com/docs/functions/configuring-functions/duration
- tRPC v10 subscriptions (WebSocket only): https://trpc.io/docs/server/subscriptions
- tRPC v11 SSE subscriptions (not applicable — project is on v10): https://trpc.io/blog/announcing-trpc-v11
- Next.js Route Handlers + App Router: https://nextjs.org/docs/app/building-your-application/routing/route-handlers

---

*Architecture research for: v1.2 — Template Gallery + LLM Chat + PRD Generation + Notifications*
*Researched: 2026-04-02*
*Previous version: v1.1 Creator Dashboard (2026-03-31)*
