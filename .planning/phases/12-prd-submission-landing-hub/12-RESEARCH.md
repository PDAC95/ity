# Phase 12: PRD Submission + Landing Hub - Research

**Researched:** 2026-04-15
**Domain:** AI structured output generation, tRPC mutation wiring, state-aware React UI in Next.js App Router
**Confidence:** HIGH

## Summary

Phase 12 closes the landing page request loop: the chat wizard ends, the LLM synthesizes a structured PRD from the collected conversation, the creator reviews it as a card inside the chat, confirms, and the request transitions from `draft` → `pending` in the DB. The creator's "My Page" sidebar link then renders a state-aware hub showing submission status.

The core technical challenge is **PRD generation**: calling `generateObject` (AI SDK v6 — still exported alongside `Output.object`) inside an existing Next.js API route (`/api/chat` or a dedicated `/api/prd`) with a Zod schema, validating the result, and only persisting it if validation passes (SEC-04). The `requestPage` tRPC mutation already exists and accepts `prdData: z.record(z.unknown())` — the PRD schema is intentionally `PrdData = Record<string, unknown>` in the DB type, so the Zod schema is purely a generation + validation contract, not a DB schema change.

The UI consists of three new chat-embedded components (summary card, success card, error card) and a new `/a/landing` page (or route group update). The existing sidebar nav item (`nav.myPage`) points to `/a/landing/templates`; Phase 12 changes that entry point to `/a/landing` which becomes a smart hub. All new UI must use the Phase 11.5 `glass-card`, `glass-btn`, and CSS variable system (`--content-heading`, `#bfdbfe` accent, `bg-[var(--content-subtle-bg)]`).

**Primary recommendation:** Add a dedicated `/api/prd/generate` route for PRD generation (keeps `/api/chat` clean, allows different `maxDuration`), trigger it from the `ChatWizard` client component after the bot signals completion, render summary/error/success cards inside the existing messages area, and call `trpc.landing.requestPage` mutation only after creator confirms.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Summary appears as a **premium-styled card inside the chat** — not a separate page or modal
- Shows **all fields grouped by section** (info básica, audiencia, estilo, etc.) — complete and transparent
- Card is **read-only** — no inline editing. If the creator wants to change something, they click "Quiero cambiar algo"
- "Quiero cambiar algo" sends a message to the bot, which asks "¿Qué te gustaría cambiar?" — conversational correction flow
- After changes, bot **automatically generates a new summary card** with updated info
- Bot sends a **brief introductory message** before the summary card (e.g., "¡Perfecto! Revisa tu información antes de confirmar:")
- **Buttons are inside the card**: "Confirmar y enviar" + "Quiero cambiar algo"
- **Single click confirms** — no double confirmation dialog (the summary IS the confirmation)
- On click, button shows **spinner + "Generando tu página..."** text while PRD generates
- Success shows as **bot message + success card** inside chat: "¡Listo! Estamos trabajando en tu página web" with check icon, positive colors
- Success card includes a **"Ver estado en dashboard" button** linking to `/dashboard/landing`
- After confirmation, **chat is marked as completed** — cannot be restarted
- If creator navigates to `/dashboard/chat` after completing, they are **redirected to `/dashboard/landing`**
- The existing **"My Page" sidebar section** is the entry point — no new sidebar item needed
- My Page content is **state-aware** and shows different views based on creator status
- **2 states only in v1.2**: "En proceso" (request submitted) and "Sin solicitud" (no chat completed)
- **"En proceso" state**: Large card showing school name, submission date, status indicator ("En proceso"), preview/thumbnail of selected template, and message "Estamos trabajando en tu página. Te avisaremos cuando esté lista."
- **"Sin solicitud" state**: Empty state with icon/illustration + "Aún no has creado tu landing page" + "Crear mi landing page" CTA button → links to chat wizard
- **No timeline/stepper** — only current status. Timeline deferred until more states exist (v1.3+)
- Error shown as **friendly bot message** inside chat — no technical jargon. Tarjeta with warning icon: "No pudimos procesar tu solicitud. Tu información está guardada."
- **1 automatic retry** before showing error to creator (transparent — creator doesn't know about it)
- After auto-retry fails, show error with **manual "Intentar de nuevo" button**
- **Maximum 3 manual retries** — after that, show "Estamos teniendo dificultades. Tu info está guardada — intenta más tarde." with "Ir al dashboard" button

### Claude's Discretion
- Navigation structure within My Page (sub-pages vs single dynamic route)
- Exact visual styling of cards (consistent with Phase 11.5 dark premium theme)
- Loading skeleton design for Landing Hub
- Typography and spacing within summary card sections

### Deferred Ideas (OUT OF SCOPE)
- Timeline/stepper showing process stages (Solicitud → En construcción → Lista) — deferred until v1.3+ when more states exist (REVIEW flow)
- "Listo" and "Cambios solicitados" states for Landing Hub — Phase 13+ (REVIEW-01, REVIEW-02)
- Support link/contact in error messages — needs support system first
- Multiple landing page requests per creator — v1.2 supports one request only
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PRD-01 | At chat completion, LLM generates a structured PRD (JSON) validated against Zod schema | `generateObject` from AI SDK v6 confirmed available; `Output.object` with Zod also works; run in dedicated `/api/prd/generate` route |
| PRD-02 | Creator sees a summary of their answers before confirming submission | SummaryCard component rendered inside ChatWizard messages area; read-only grouped sections; bot intro message precedes card |
| PRD-03 | On confirmation, PRD is stored in DB as JSONB (internal — never exposed to creator) | `trpc.landing.requestPage` mutation already exists and accepts `prdData`; `getStatus` already excludes prdData via columns selector |
| PRD-04 | Creator sees confirmation screen: "Estamos trabajando en tu pagina web" | SuccessCard component rendered inside chat; `/a/landing` Landing Hub shows "En proceso" state |
| PRD-05 | If PRD generation fails, creator sees a retry option with friendly error message | ErrorCard component with 1 auto-retry (transparent) + up to 3 manual retries; max-retry state shows "Ir al dashboard" |
| SEC-04 | LLM output validated via Zod schema before any DB write | `generateObject` schema validation runs before `requestPage` mutation is called; safeParse or try/catch around generateObject; PRD never written if Zod throws |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `ai` (Vercel AI SDK) | ^6.0.154 (installed) | `generateObject` for structured PRD output | Already used for `streamText` in chat route; same provider config |
| `@ai-sdk/anthropic` | ^3.0.68 (installed) | Anthropic model provider | Already installed and used |
| `zod` | ^3.23.0 (installed) | PRD schema definition + validation | Already used throughout codebase |
| `@trpc/react-query` | ^10.45.0 (installed) | `trpc.landing.requestPage.useMutation()` | Already used for all mutations |
| `framer-motion` | ^12.31.0 (installed) | Card entrance animations (consistent with other chat components) | Already used in `chat-message.tsx`, `onboarding-checklist.tsx` |
| `lucide-react` | ^0.468.0 (installed) | CheckCircle2, AlertTriangle, Loader2, Globe, ArrowRight icons | Already used everywhere |
| `sonner` | ^2.0.7 (installed) | Toast on unexpected errors | Already used in `chat-wizard.tsx` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `next/navigation` `redirect()` | Next.js built-in | Redirect `/a/landing/chat` → `/a/landing` when status=pending | RSC page guard |
| `next/navigation` `useRouter()` | Next.js built-in | Client-side navigation to `/a/landing` after success | In success card button |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `generateObject` | `generateText + Output.object` | Both work in AI SDK v6. `generateObject` is more explicit for schema-only use cases, no streaming needed. Recommendation: use `generateObject` — cleaner for non-streaming structured output |
| Dedicated `/api/prd/generate` route | Inline Server Action | API route allows `maxDuration = 60` and reuse of existing auth pattern. Server Actions don't support custom timeout on Vercel |
| Separate `/api/prd/generate` route | Reuse `/api/chat` with mode param | Separation of concerns: PRD generation is not streaming and has different error handling. Dedicated route is cleaner |

**No new packages needed.** Everything required is already installed.

---

## Architecture Patterns

### Recommended Project Structure

New files in Phase 12:

```
app/
├── api/
│   └── prd/
│       └── generate/
│           └── route.ts          # POST: generateObject → prdData JSON
├── (dashboard)/a/
│   └── landing/
│       └── page.tsx              # Landing Hub (replaces current redirect-to-templates)
│
components/
└── chat/
    ├── prd-summary-card.tsx      # Summary card rendered inside chat
    ├── prd-success-card.tsx      # Success card after confirm
    └── prd-error-card.tsx        # Error card with retry button
```

Modifications:

```
app/(dashboard)/a/landing/chat/page.tsx   # Add: redirect to /a/landing if status=pending
components/chat/chat-wizard.tsx           # Add: PRD generation flow state machine
app/(dashboard)/dashboard-shell.tsx       # Update: NAV_ITEMS myPage → /a/landing
```

### Pattern 1: PRD Generation Flow State Machine (in ChatWizard)

The `ChatWizard` component detects chat completion (already tracks `chatFinished`) and transitions through:

```
idle → generating → summary_shown → confirming → done | error
```

State held in `useState` inside `ChatWizard`. On `chatFinished = true` AND `userTurnCount >= 15` (or bot sends a "¡Perfecto! Revisa tu información" signal), trigger PRD generation automatically.

```typescript
// Source: existing chat-wizard.tsx pattern + new state
type PrdFlowState =
  | { phase: 'idle' }
  | { phase: 'generating' }
  | { phase: 'summary'; prdData: PrdSummary }
  | { phase: 'confirming' }        // spinner shown in summary card
  | { phase: 'done' }
  | { phase: 'error'; retryCount: number; message: string };

const [prdFlow, setPrdFlow] = useState<PrdFlowState>({ phase: 'idle' });
```

### Pattern 2: PRD Generation API Route

```typescript
// app/api/prd/generate/route.ts
// Source: AI SDK v6 generateObject + existing /api/chat auth pattern

import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { prdSchema } from '@/lib/prd/schema';  // new file

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  // Auth (same pattern as /api/chat)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { chatHistory, schoolId, templateId } = await req.json();

  try {
    const { object } = await generateObject({
      model: anthropic('claude-sonnet-4.5'),
      schema: prdSchema,
      system: buildPrdSystemPrompt(),
      prompt: buildPrdPromptFromHistory(chatHistory),
      maxRetries: 1,  // AI SDK internal retry
    });

    // SEC-04: schema already validated by generateObject
    return NextResponse.json({ prdData: object });
  } catch (err) {
    // generateObject throws if schema validation fails
    return NextResponse.json({ error: 'generation_failed' }, { status: 500 });
  }
}
```

### Pattern 3: Landing Hub Page (state-aware RSC)

```typescript
// app/(dashboard)/a/landing/page.tsx
// RSC: fetch status from DB, render appropriate view

export default async function LandingHubPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const school = await db.query.schools.findFirst({ where: eq(schools.creatorId, user.id) });
  if (!school) redirect('/a/school-setup');

  const request = await db.query.landingPageRequests.findFirst({
    where: eq(landingPageRequests.schoolId, school.id),
    columns: { id: true, status: true, templateId: true, createdAt: true },
    orderBy: (lpr, { desc }) => [desc(lpr.createdAt)],
  });

  const status = request?.status ?? 'none';
  // 'none' → empty state, 'draft' → empty state (chat not finished), 
  // 'pending'|'in_progress' → "En proceso" card

  return <LandingHubClient status={status} request={request} schoolName={school.name} />;
}
```

**Recommendation:** Single dynamic route at `/a/landing/page.tsx` (no sub-pages). The status prop drives which view renders. This avoids route complexity and matches the 2-state v1.2 scope.

### Pattern 4: PRD Schema Design

The PRD schema should capture what the system prompt collects across 5 sections. It feeds the 12ity team to build the landing page — not shown to the creator.

```typescript
// lib/prd/schema.ts
import { z } from 'zod';

export const prdSchema = z.object({
  schoolInfo: z.object({
    name: z.string(),
    tagline: z.string(),
    description: z.string(),
    valueProposition: z.string(),
  }),
  visual: z.object({
    primaryColor: z.string(),
    secondaryColor: z.string(),
    heroImageUrl: z.string().nullable(),
    style: z.string(),  // e.g. "professional", "casual", "vibrant"
  }),
  creator: z.object({
    name: z.string(),
    bio: z.string(),
    credentials: z.string().nullable(),
    teachingReason: z.string().nullable(),
  }),
  hero: z.object({
    headline: z.string(),
    subheadline: z.string(),
    ctaText: z.string(),
  }),
  optional: z.object({
    testimonials: z.array(z.object({
      name: z.string(),
      text: z.string(),
    })).nullable(),
    faqItems: z.array(z.object({
      question: z.string(),
      answer: z.string(),
    })).nullable(),
    curriculumHighlights: z.array(z.string()).nullable(),
  }),
  metadata: z.object({
    templateId: z.string(),
    generatedAt: z.string(),
    conversationTurns: z.number(),
  }),
});

export type PrdSummary = z.infer<typeof prdSchema>;
```

**Note:** Use `.nullable()` not `.optional()` — required for reliable structured output with Anthropic (confirmed from AI SDK docs).

### Pattern 5: SummaryCard grouped display

The summary card renders each top-level schema section as a labeled group, using the Phase 11.5 glass system:

```typescript
// components/chat/prd-summary-card.tsx
// Sections: Información básica | Identidad visual | Sobre ti | Hero | Secciones opcionales
// Each section: small header + key-value rows
// Buttons at bottom: "Quiero cambiar algo" (ghost) | "Confirmar y enviar" (glass-btn)
// When confirming: disable both buttons, show Loader2 spinner inside confirm button
```

### Anti-Patterns to Avoid

- **Don't call `requestPage` mutation client-side with raw `generateObject` output**: the PRD is generated server-side in `/api/prd/generate`, returned to client as JSON, then the client calls `trpc.landing.requestPage` with it. This keeps the API key server-only.
- **Don't expose PRD in tRPC**: `getStatus` already uses column selector excluding `prdData`. Don't add prdData to any creator-facing query.
- **Don't use `.optional()` in prdSchema**: Anthropic structured output requires `.nullable()` for optional fields. This is confirmed by AI SDK v6 docs.
- **Don't restart chat after `status = pending`**: The chat page guard (RSC) redirects to `/a/landing` if status is already pending. The `ChatWizard` also marks `chatFinished=true` after success.
- **Don't run PRD generation in the tRPC `requestPage` mutation**: PRD generation is LLM work with `maxDuration=60`. tRPC mutations in Next.js have standard serverless timeouts. Keep it in the dedicated API route.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Structured LLM output | Manual JSON.parse + regex | `generateObject` with Zod schema | Schema validation, retry, type safety built in |
| Retry logic on generation | Custom retry loop | `maxRetries` option in `generateObject` | AI SDK handles backoff; combine with 1 auto-retry before showing error |
| Client-side mutation state | Manual loading/error state | `trpc.landing.requestPage.useMutation()` with `onSuccess`/`onError` | React Query handles loading, error, cache invalidation |
| Status display | Custom DB poll | RSC with `db.query` at render time | No client fetch needed — status changes are infrequent enough for RSC re-render on navigation |

---

## Common Pitfalls

### Pitfall 1: PRD generation triggered multiple times
**What goes wrong:** User clicks "Confirmar" quickly, or component re-renders, causing duplicate generation calls.
**Why it happens:** No guard on the `confirming` state transition.
**How to avoid:** Set `prdFlow` to `{ phase: 'confirming' }` synchronously before the fetch, and disable the confirm button when `prdFlow.phase !== 'summary'`.
**Warning signs:** Duplicate DB insertions, race conditions.

### Pitfall 2: `chatFinished` triggers PRD generation too early
**What goes wrong:** PRD generation fires when `chatFinished` becomes true (after 15 turns), but the bot may not have sent the summary prompt yet.
**Why it happens:** Turn limit and "ready to generate PRD" are separate signals.
**How to avoid:** PRD generation should be explicitly triggered by the user clicking a button OR by detecting the bot's last message containing a specific signal (e.g., `[PRD_READY]` marker). **Recommendation:** Use a bot-side signal marker — the system prompt instructs the LLM to append `[PRD_READY]` in its final message. `ChatWizard` parses `onFinish` to detect this marker and transitions to `generating`.

**Alternatively (simpler):** The summary card is triggered by the user clicking a "Generar resumen" button that appears when `chatFinished`. But CONTEXT.md says "bot automatically generates a new summary card" — so the automatic trigger is correct. Use the `[PRD_READY]` marker approach.

### Pitfall 3: `/a/landing` page doesn't exist yet — sidebar nav breaks
**What goes wrong:** `NAV_ITEMS` points to `/a/landing/templates`. Updating it to `/a/landing` without creating `app/(dashboard)/a/landing/page.tsx` causes a 404.
**Why it happens:** No `page.tsx` exists at `/a/landing` — only child routes.
**How to avoid:** Create the Landing Hub page in the same plan as the nav update. The current sidebar still points to `/a/landing/templates` — Phase 12 changes this.

### Pitfall 4: `generateObject` schema mismatch causes infinite retry loop
**What goes wrong:** AI returns object that fails schema validation → `generateObject` retries internally → all retries fail → throws `NoObjectGeneratedError`.
**Why it happens:** Schema too strict, or `.optional()` fields confuse Anthropic model.
**How to avoid:** Use only `.nullable()` for optional fields. Add `.describe()` to each field for better generation guidance. Keep schema fields to what the system prompt actually collects.

### Pitfall 5: Chat redirect loop on `/a/landing/chat`
**What goes wrong:** Creator goes to `/a/landing/chat` after completing → page redirects to `/a/landing` → creator navigates back → redirect again (correct behavior, but could confuse if landing hub itself has a "Go to chat" link).
**Why it happens:** Page guard checks `status !== 'draft' && status !== null`.
**How to avoid:** The Landing Hub "Sin solicitud" state links to `/a/landing/templates` (start fresh), not `/a/landing/chat` directly (templateId is required). Already the correct flow.

---

## Code Examples

Verified patterns from official sources and existing codebase:

### generateObject with Anthropic (AI SDK v6)
```typescript
// Source: AI SDK v6 dist/index.d.ts confirms generateObject export; docs confirm generateObject API
import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

const { object } = await generateObject({
  model: anthropic('claude-sonnet-4.5'),
  schema: prdSchema,         // Zod schema — validated automatically
  system: systemPrompt,
  prompt: conversationSummary,
  maxRetries: 1,             // 1 internal retry before throwing
});
// object is typed as z.infer<typeof prdSchema> — SEC-04 satisfied
```

### tRPC mutation in chat component
```typescript
// Source: existing components/school/general-tab.tsx pattern
const requestPageMutation = trpc.landing.requestPage.useMutation({
  onSuccess: () => {
    setPrdFlow({ phase: 'done' });
    setChatFinished(true);
  },
  onError: (err) => {
    setPrdFlow({ phase: 'error', retryCount: manualRetryCount, message: err.message });
  },
});

// Call after PRD generation:
requestPageMutation.mutate({ schoolId, prdData: generatedPrdData });
```

### Landing Hub RSC + client split
```typescript
// RSC reads DB → passes status as prop to Client Component
// Pattern: same as chat/page.tsx RSC + ChatWizard split
// Source: existing app/(dashboard)/a/landing/chat/page.tsx

// page.tsx (RSC)
export default async function LandingHubPage() {
  // auth + DB query
  return <LandingHubView status={...} request={...} schoolName={...} />;
}

// landing-hub-view.tsx ('use client')
export function LandingHubView({ status, request, schoolName }) {
  if (status === 'pending' || status === 'in_progress') {
    return <EnProcesoCard ... />;
  }
  return <SinSolicitudCard />;
}
```

### glass-card card pattern (Phase 11.5 design system)
```typescript
// Source: components/dashboard/onboarding-checklist.tsx + globals.css
<div className="glass-card p-6">
  <h3 className="text-sm font-medium" style={{ color: 'var(--content-secondary)' }}>
    Información básica
  </h3>
  <div className="mt-3 space-y-2">
    <div className="flex justify-between">
      <span className="text-xs" style={{ color: 'var(--content-muted)' }}>Nombre</span>
      <span className="text-sm font-medium" style={{ color: 'var(--content-heading)' }}>
        {prd.schoolInfo.name}
      </span>
    </div>
  </div>
</div>
```

### [PRD_READY] marker detection in ChatWizard
```typescript
// In chat-wizard.tsx onFinish handler of useChat (or in messages useEffect)
const lastAssistantMsg = messages.findLast(m => m.role === 'assistant');
const lastText = getMessageText(lastAssistantMsg);

useEffect(() => {
  if (lastText.includes('[PRD_READY]') && prdFlow.phase === 'idle') {
    setPrdFlow({ phase: 'generating' });
    triggerPrdGeneration();  // calls /api/prd/generate
  }
}, [lastText]);
```

System prompt addition:
```
When you have collected all information from all 5 sections and the creator has confirmed they're ready, 
append the marker [PRD_READY] at the very end of your message. This marker triggers automated processing.
Do not include this marker at any other time.
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `generateObject` (legacy API) | `generateObject` still works in AI SDK v6; `Output.object` with `generateText` is the newer pattern | AI SDK v6 | Both work; `generateObject` preferred for pure schema use cases |
| `maxTokens` option | `maxOutputTokens` in AI SDK v6 | AI SDK v6 | Already handled in existing `/api/chat/route.ts` |
| `initialMessages` in `useChat` | `messages` option in `ChatInit` | AI SDK v6 | Already handled in existing `chat-wizard.tsx` |

---

## Open Questions

1. **[PRD_READY] marker vs turn count trigger**
   - What we know: CONTEXT.md says "bot automatically generates a new summary card" after all sections collected; `chatFinished` triggers at 15 turns
   - What's unclear: Should PRD generation fire at turn 15 regardless, or only when the bot signals readiness? The bot may finish early (before 15 turns).
   - Recommendation: Use `[PRD_READY]` marker — allows early finish, avoids generation on partial conversations. System prompt instructs LLM to emit marker when all 5 sections are complete.

2. **`/a/landing` as new hub — existing `/a/landing/templates` and `/a/landing/chat` remain**
   - What we know: Templates and chat routes already exist and work; sidebar nav currently links to `/a/landing/templates`
   - What's unclear: Should `NAV_ITEMS` in `dashboard-shell.tsx` link to `/a/landing` (hub) instead of `/a/landing/templates` directly?
   - Recommendation: Yes — update `NAV_ITEMS` to `/a/landing`. The hub redirects to templates if status=none. This makes "My Page" always show the right state.

3. **Success card `/dashboard/landing` link vs `/a/landing`**
   - What we know: CONTEXT.md mentions `"Ver estado en dashboard" button` linking to `/dashboard/landing`; codebase uses `/a/*` prefix (from quick task 1)
   - What's unclear: CONTEXT.md predates the `/a/*` route rename
   - Recommendation: Use `/a/landing` not `/dashboard/landing`. The success card button and `requestPage` notification `actionUrl` should both use `/a/landing`.

---

## Sources

### Primary (HIGH confidence)
- AI SDK v6 dist/index.d.ts — confirmed `generateObject` export at `^6.0.154`
- Context7 `/vercel/ai` — `generateObject` usage with Zod, `.nullable()` requirement for Anthropic
- Existing codebase: `components/chat/chat-wizard.tsx` — state management patterns, `useChat` hook
- Existing codebase: `packages/api/src/routers/landing.ts` — `requestPage` mutation signature, `getStatus` column exclusion
- Existing codebase: `app/globals.css` — `glass-card`, `glass-btn`, CSS variable system
- Existing codebase: `packages/db/src/schema.ts` — `PrdData = Record<string, unknown>`, schema structure

### Secondary (MEDIUM confidence)
- AI SDK docs (Context7): `generateObject` schema validation behavior, `NoObjectGeneratedError`
- Existing pattern: RSC + client split in `app/(dashboard)/a/landing/chat/page.tsx`

### Tertiary (LOW confidence)
- `[PRD_READY]` marker approach — derived from common LLM signaling patterns; should be validated in implementation

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages already installed, versions verified in package.json
- Architecture: HIGH — patterns derived directly from existing codebase
- PRD schema design: MEDIUM — schema fields inferred from system prompt sections; exact fields may need adjustment after first test generation
- Pitfalls: HIGH — derived from existing code patterns and AI SDK v6 behavior

**Research date:** 2026-04-15
**Valid until:** 2026-05-15 (AI SDK v6 stable; zod stable)
