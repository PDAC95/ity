# Phase 11: AI Chat Wizard - Research

**Researched:** 2026-04-08
**Domain:** LLM streaming chat, Vercel AI SDK, Upstash rate limiting, Next.js App Router SSE
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Chat experience:**
- ChatGPT-style layout: full-width messages, avatar + name, separated by subtle line. No bubbles
- Streaming token-by-token with blinking cursor at the end
- Chat occupies full width — no sidebar or stepper. Progress is implicit in the conversation
- Input field: text + paperclip button for image upload (always visible)
- Multiline textarea: starts as 1 line, auto-grows up to 4-5 lines
- Auto-scroll to latest message. If user scrolls up, auto-scroll pauses until they return to bottom
- Input and send button disabled while Claude is streaming. Re-enabled when response completes
- Automatic welcome message from Claude on page load: greets by name, references school name, explains what they'll do, asks first question

**Conversational flow:**
- Fixed section order: (1) basic info (name, description) → (2) visual identity (colors, logo) → (3) about the creator (bio, photo) → (4) hero content (title, CTA) → (5) optional sections
- One question at a time — Claude asks, waits for answer, then proceeds
- Tone: friendly professional — uses "tú", enthusiastic with moderation, like a web designer helping you
- Pre-fill handling: Claude mentions existing data and asks if the creator wants to keep or change it. E.g., "Tu escuela se llama X, ¿lo mantenemos?"

**Image uploads in chat:**
- Claude requests images at the relevant point in the flow (logo during visual identity, photo during bio, hero image during hero section)
- Uploaded images display as thumbnail in the creator's message. Click to view full size
- All images are optional — creator can say "no tengo" or "después" and Claude continues
- Replacing images is allowed — uploading another image of the same type replaces the previous one, Claude confirms the change

**Limits and edge states:**
- At turn 15: Claude sends a final message with a summary of everything collected. No more input allowed after that
- Rate limiting UX: toast notification with countdown timer ("Espera X segundos"). Input disabled until cooldown passes
- Streaming error: partial message marked as error, "Reintentar" button appears. Clicking re-sends the creator's last message
- Conversation persisted in DB — if creator closes tab and returns to /dashboard/landing/chat, they see their history and can continue

### Claude's Discretion
- Loading skeleton design while chat initializes
- Exact spacing, typography, and color choices for chat UI
- How to handle ambiguous or off-topic creator responses
- Exact wording of system prompt sections
- Cursor/typing indicator animation style

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CHAT-01 | Creator enters a guided chat after selecting a template | Route at `/dashboard/landing/chat` that receives `templateId` from template gallery; page fetches existing draft or creates new context |
| CHAT-02 | Chat pre-fills context from existing school/creator data (name, bio, colors, description) | RSC page fetches creator + school data; passes as props to chat client component; system prompt builder injects this data |
| CHAT-03 | LLM asks structured questions about the school (offerings, audience, sections, images, tone) | System prompt engineering with fixed section order; Vercel AI SDK `streamText` with Anthropic claude-sonnet-4-5 model |
| CHAT-04 | LLM responses stream in real-time (token by token, not full-wait) | Vercel AI SDK `streamText` + `toUIMessageStreamResponse()` in Node.js route handler; `useChat` hook on client |
| CHAT-05 | Creator can upload images during chat (reuse ImageUploadWidget) | ImageUploadWidget already exists at `components/upload/image-upload-widget.tsx`; wrap it to appear in chat input; send uploaded S3 URL as part of message |
| CHAT-06 | Chat enforces a maximum turn count (15) server-side | Count messages in route handler before calling LLM; return terminal message and `X-Chat-Finished: true` header when limit reached |
| CHAT-07 | Per-creator rate limiting on chat endpoint (Upstash Redis) | Upstash `@upstash/ratelimit` already installed and used; add `chatLimiter` to `lib/ratelimit/limiters.ts`; key on `creatorId` (not IP) |
| SEC-03 | User input never interpolated into LLM system prompt (role separation enforced) | User messages sent as `role: "user"` only; system prompt built server-side from trusted DB data only; never concatenate user strings into system prompt |
</phase_requirements>

---

## Summary

Phase 11 builds a guided AI chat wizard that collects landing page information through a conversational interface. The core streaming infrastructure uses the **Vercel AI SDK** (`ai` + `@ai-sdk/anthropic`) rather than the raw Anthropic SDK, because the AI SDK provides the `useChat` React hook and `streamText` server utility that handle the SSE streaming protocol, reconnection, and client state management out of the box. This is a significant advantage over hand-rolling SSE with the raw Anthropic SDK.

The route handler (`/api/chat/route.ts`) must run on the **Node.js runtime** (not Edge) because Upstash rate limiting and Drizzle ORM (used for chat history persistence via `landing.saveDraft`) require Node.js APIs. The system prompt is built server-side from trusted DB data (school name, creator bio, colors) and user messages are kept strictly in `role: "user"` — never interpolated into the system prompt (SEC-03).

Image uploads in chat reuse the existing `ImageUploadWidget` component which uploads to S3 via presigned URLs. The uploaded public S3 URL is then included in the user's message as a text string (the URL), and Claude processes it as context (not as a vision input — the flow is text-based). The turn limit (15) is enforced server-side by counting messages before calling the LLM.

**Primary recommendation:** Use Vercel AI SDK (`ai` + `@ai-sdk/anthropic`) for streaming — not the raw Anthropic SDK. The `useChat` hook + `streamText` pattern handles all SSE complexity, status tracking, and client state.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `ai` (Vercel AI SDK) | ^4.x (latest) | `streamText`, `useChat`, SSE protocol | Official streaming abstraction for Next.js; handles SSE, reconnection, status |
| `@ai-sdk/anthropic` | latest | Anthropic Claude provider for AI SDK | Official provider; `anthropic('claude-sonnet-4.5')` model selector |
| `@upstash/ratelimit` | ^2.0.8 | Per-creator rate limiting | Already installed; sliding window limiter |
| `@upstash/redis` | ^1.37.0 | Redis backend for rate limiter | Already installed; `Redis.fromEnv()` pattern |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `sonner` | ^2.0.7 | Toast for rate limit countdown | Already installed; used throughout dashboard |
| `lucide-react` | ^0.468.0 | Icons (paperclip, send, user, bot) | Already installed |
| `framer-motion` | ^12.31.0 | Cursor animation, message entry | Already installed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@ai-sdk/anthropic` + `ai` | Raw `@anthropic-ai/sdk` with `toReadableStream()` | AI SDK is 80% less boilerplate; useChat handles reconnect, status, streaming state |
| Vercel AI SDK `useChat` | Custom SSE client with `EventSource` | Custom SSE requires hand-rolling connection management, error recovery, streaming state |
| Upstash per-creator key | IP-based rate limit | Creator ID is more accurate — creators behind shared IPs won't be blocked together |

**Installation:**
```bash
pnpm add ai @ai-sdk/anthropic --filter @ity/web
```

---

## Architecture Patterns

### Recommended Project Structure
```
apps/web/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts           # POST — Node.js runtime, SSE streaming
│   └── (dashboard)/dashboard/landing/
│       └── chat/
│           └── page.tsx           # RSC — fetches creator/school/draft, passes to client
├── components/
│   └── chat/
│       ├── chat-wizard.tsx        # 'use client' — main chat UI component
│       ├── chat-message.tsx       # Single message row (user or assistant)
│       ├── chat-input.tsx         # Textarea + paperclip + send button
│       └── image-thumbnail.tsx   # Thumbnail in user message (click to expand)
└── lib/
    └── chat/
        └── system-prompt.ts       # System prompt builder (server-only)
```

### Pattern 1: SSE Streaming Route Handler
**What:** Next.js App Router POST route using Vercel AI SDK `streamText` with Node.js runtime
**When to use:** This is the ONLY pattern for this phase — no alternatives

```typescript
// Source: Context7 /vercel/ai — streamText Next.js route handler
// app/api/chat/route.ts
export const runtime = 'nodejs'; // REQUIRED: Edge doesn't support Drizzle or Upstash

import { streamText, convertToModelMessages, type UIMessage } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { createClient } from '@/lib/supabase/server';
import { chatLimiter } from '@/lib/ratelimit/limiters';
import { buildSystemPrompt } from '@/lib/chat/system-prompt';

export const maxDuration = 60; // Allow up to 60s for streaming

export async function POST(req: Request) {
  // 1. Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  // 2. Per-creator rate limiting (CHAT-07)
  const { success, reset } = await chatLimiter.limit(`chat:${user.id}`);
  if (!success) {
    return new Response(JSON.stringify({ error: 'rate_limited', reset }),
      { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)) } });
  }

  const { messages, schoolId, templateId }: {
    messages: UIMessage[];
    schoolId: string;
    templateId: string;
  } = await req.json();

  // 3. Turn limit enforcement (CHAT-06)
  // Count only user messages (each user msg = 1 turn)
  const userTurnCount = messages.filter(m => m.role === 'user').length;
  if (userTurnCount > 15) {
    return new Response(JSON.stringify({ error: 'turn_limit_reached' }), { status: 400 });
  }

  // 4. Build system prompt from trusted DB data (SEC-03 — never from user input)
  const systemPrompt = await buildSystemPrompt({ userId: user.id, schoolId, templateId });

  // 5. Stream
  const result = streamText({
    model: anthropic('claude-sonnet-4.5'),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    maxTokens: 1024,
    onFinish: async ({ response }) => {
      // Save chat history to DB via tRPC landing.saveDraft (or direct DB call)
      // Runs after streaming completes — does not block response
    },
  });

  return result.toUIMessageStreamResponse();
}
```

### Pattern 2: System Prompt Builder (server-only)
**What:** Function that builds system prompt from DB data — never from user input
**When to use:** Every chat request; enforces SEC-03

```typescript
// Source: Derived from project patterns + phase decisions
// lib/chat/system-prompt.ts
import 'server-only'; // Prevent accidental client import

export async function buildSystemPrompt({
  userId,
  schoolId,
  templateId,
}: {
  userId: string;
  schoolId: string;
  templateId: string;
}): Promise<string> {
  // Fetch from DB — these are trusted, not user-supplied
  const [creator, school] = await Promise.all([
    db.query.creators.findFirst({ where: eq(creators.id, userId) }),
    db.query.schools.findFirst({ where: eq(schools.id, schoolId) }),
  ]);

  // NEVER interpolate user-provided strings here — only DB-sourced data
  return `Eres un asistente de diseño web amigable y profesional...
  
Contexto del creador:
- Nombre: ${creator?.name ?? 'el creador'}
- Bio actual: ${creator?.bio ?? 'no proporcionada'}

Contexto de la escuela:
- Nombre: ${school?.name ?? 'la escuela'}
- Descripción: ${school?.description ?? 'no proporcionada'}
- Color primario: ${school?.branding?.primaryColor ?? '#6366F1'}
- Template seleccionado: ${templateId}

Flujo de secciones (en orden):
1. Información básica (nombre, descripción)
2. Identidad visual (colores, logo)
3. Sobre el creador (bio, foto)
4. Contenido hero (título, CTA)
5. Secciones opcionales

Reglas:
- Una pregunta a la vez
- Usa "tú" siempre
- Si hay datos existentes, menciónalos y pregunta si mantenerlos: "Tu escuela se llama X, ¿lo mantenemos?"
- Las imágenes son opcionales — acepta "no tengo" o "después"`;
}
```

### Pattern 3: useChat Client Hook
**What:** Vercel AI SDK `useChat` hook for managing streaming state client-side
**When to use:** In the `ChatWizard` client component

```typescript
// Source: Context7 /vercel/ai — useChat current API (2025)
'use client';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';

// IMPORTANT: useChat API changed — no longer manages input state internally
// Use useState for input; use sendMessage() instead of handleSubmit
const [input, setInput] = useState('');

const { messages, sendMessage, status } = useChat({
  transport: new DefaultChatTransport({
    api: '/api/chat',
    // Send extra body data with each request
    prepareSendMessagesRequest: ({ messages }) => ({
      body: { messages, schoolId, templateId },
    }),
  }),
  // Restore history from DB on mount
  initialMessages: existingMessages, // ChatHistory from DB mapped to UIMessage[]
});

// status: 'idle' | 'submitted' | 'streaming' | 'error'
const isStreaming = status === 'streaming' || status === 'submitted';
```

### Pattern 4: Rate Limiter (per-creator)
**What:** Sliding window rate limiter keyed by creator ID
**When to use:** Add to existing `lib/ratelimit/limiters.ts`

```typescript
// Extend existing lib/ratelimit/limiters.ts
export const chatLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 messages per minute per creator
  prefix: 'rl:chat',
  analytics: false,
});
```

### Pattern 5: Welcome Message (server-initialized)
**What:** The first assistant message is generated by the page RSC and passed as `initialMessages` to `useChat`
**Why:** Avoids an extra round-trip on mount; feels instant

```typescript
// In chat page RSC (page.tsx):
// If no existing draft, generate welcome message text synchronously from creator data
// Pass as initialMessages to ChatWizard client component
const welcomeMessage: UIMessage = {
  id: generateId(),
  role: 'assistant',
  parts: [{ type: 'text', text: `¡Hola ${creator.name}! Voy a ayudarte a crear la landing page de "${school.name}"...` }],
  createdAt: new Date(),
};
```

### Anti-Patterns to Avoid
- **User input in system prompt:** NEVER do `system: \`...${userMessage}...\`` — SEC-03 violation. User input goes in `role: 'user'` only.
- **Edge runtime:** Do NOT use `export const runtime = 'edge'` — Drizzle ORM and Upstash SDK require Node.js APIs.
- **Old useChat API:** Do NOT use `handleSubmit`, `handleInputChange`, or pass `api` directly to `useChat()` — these are deprecated. Use `sendMessage()` + `DefaultChatTransport`.
- **Blocking on save:** Do NOT `await` DB save inside the streaming request — use `onFinish` callback which fires after stream completes without blocking the response.
- **IP-based rate limit for chat:** Use `creatorId` as key, not IP — multiple creators on shared office IPs would incorrectly block each other.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SSE streaming to browser | Custom `TextEncoder` + `ReadableStream` with SSE format | `streamText().toUIMessageStreamResponse()` | AI SDK handles protocol, encoding, reconnect, error events |
| Client streaming state | Custom `EventSource` + state machine | `useChat` from `@ai-sdk/react` | Hook manages status, messages array, error recovery |
| Turn counting | Complex conversation state machine | Count `messages.filter(m => m.role === 'user').length` server-side | Simple and reliable; server is source of truth |
| Rate limit storage | Custom Redis key/counter | `Ratelimit.slidingWindow()` from `@upstash/ratelimit` | Already installed; handles sliding window math |
| Streaming cursor animation | CSS keyframe from scratch | Tailwind `animate-pulse` or framer-motion on `<span>` | Consistent with existing animation library |

**Key insight:** The AI SDK's `useChat` + `streamText` combo eliminates ~200 lines of custom SSE plumbing. Always use it for LLM streaming in this project.

---

## Common Pitfalls

### Pitfall 1: Edge Runtime Incompatibility
**What goes wrong:** Route handler crashes at runtime with "module not found" or "Node.js API not available"
**Why it happens:** Default Next.js route handlers can use Edge runtime; Drizzle and `@upstash/redis` use Node.js APIs
**How to avoid:** Explicitly declare `export const runtime = 'nodejs'` at the top of `app/api/chat/route.ts`
**Warning signs:** Build errors mentioning `crypto`, `net`, or `Buffer` in edge context

### Pitfall 2: Deprecated useChat API
**What goes wrong:** TypeScript errors on `handleSubmit`, `handleInputChange`, `input` from useChat; or `api` prop rejected
**Why it happens:** Vercel AI SDK v4/v5 changed the useChat interface significantly
**How to avoid:** Use `sendMessage()` + manual `useState` for input; use `DefaultChatTransport({ api })` instead of `api` prop directly
**Warning signs:** `Property 'handleSubmit' does not exist` TypeScript errors

### Pitfall 3: Turn Count Off-by-One
**What goes wrong:** User can send 16th message; or Claude gets cut off mid-conversation at turn 14
**Why it happens:** Ambiguity about whether "turn" = user message or round-trip pair; when to check (before or after appending)
**How to avoid:** Count `role === 'user'` messages in the request body BEFORE calling LLM. At count === 15, generate final summary instead of normal response. Return a custom header or field so client locks input.
**Warning signs:** QA finds chat continues past 15 turns

### Pitfall 4: Welcome Message Causes Double-Streaming
**What goes wrong:** Page loads, chat auto-triggers a POST to get welcome message, AND the page also shows a static welcome — duplicate messages
**Why it happens:** Welcome message generated server-side in RSC but also triggered client-side via `useChat`
**How to avoid:** Generate welcome message text in the RSC page and pass as `initialMessages` to `useChat`. Do NOT use `useChat`'s auto-trigger. The initial message is static text, not streamed.
**Warning signs:** Two "¡Hola!" messages on load

### Pitfall 5: Image Upload Blocks Chat Input
**What goes wrong:** Creator uploads image but chat input stays disabled while upload is in progress, and stream has already finished
**Why it happens:** Upload state and stream status state are conflated
**How to avoid:** Track upload state separately from streaming state. Disable send button when `isStreaming || isUploading`. Re-enable when both are false.
**Warning signs:** Creator can't type after image upload finishes

### Pitfall 6: Chat History Persistence Race Condition
**What goes wrong:** Creator closes tab mid-stream; on return, last assistant message is truncated or missing
**Why it happens:** `onFinish` didn't fire; partial messages not saved
**How to avoid:** Save chat history in `onFinish` callback (fires only on complete responses). On page load, fetch draft from DB. The `initialMessages` to `useChat` should come from DB, not from local state. Accept that truly mid-stream interruptions lose the partial message — this is correct behavior.
**Warning signs:** Inconsistent message count between sessions

### Pitfall 7: Rate Limit 429 Breaks the Stream
**What goes wrong:** 429 response causes `useChat` to throw an error; toast doesn't show; UI freezes
**Why it happens:** `useChat` may not gracefully surface 429 with retry timing
**How to avoid:** Return 429 with a JSON body `{ error: 'rate_limited', reset: timestamp }`. On the client, use `onError` callback in `useChat` to parse the response and show the sonner toast with a countdown. Disable input for the cooldown period using local state.
**Warning signs:** Rate limit triggers but no countdown appears; or chat UI goes blank

---

## Code Examples

Verified patterns from official sources:

### Streaming Route Handler (complete)
```typescript
// Source: Context7 /vercel/ai — streamText + toUIMessageStreamResponse
// app/api/chat/route.ts
import { streamText, convertToModelMessages, type UIMessage } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages, schoolId, templateId } = await req.json();

  const result = streamText({
    model: anthropic('claude-sonnet-4.5'),
    system: await buildSystemPrompt({ userId, schoolId, templateId }),
    messages: await convertToModelMessages(messages),
    onFinish: async ({ response }) => {
      // Save to DB without blocking stream
    },
  });

  return result.toUIMessageStreamResponse();
}
```

### Client useChat (current API — 2025)
```typescript
// Source: Context7 /vercel/ai — "Migrate useChat to manual input state management"
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState } from 'react';

const [input, setInput] = useState('');

const { messages, sendMessage, status } = useChat({
  initialMessages: existingMessages, // from DB via RSC props
  transport: new DefaultChatTransport({
    prepareSendMessagesRequest: ({ messages }) => ({
      body: { messages, schoolId, templateId },
    }),
  }),
  onError: (error) => {
    // Parse 429 response and show toast with countdown
  },
});

// Send a message (text + optional uploaded image URL)
sendMessage({
  role: 'user',
  parts: [
    { type: 'text', text: input },
    // When image uploaded: { type: 'text', text: `[Imagen subida: ${imageUrl}]` }
  ],
});
```

### Multiline Auto-Growing Textarea
```typescript
// Source: Derived from phase decision (no library needed)
// Auto-grow: 1 row default, up to 5 rows
<textarea
  rows={1}
  value={input}
  onChange={(e) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 5 * 24) + 'px';
  }}
  onKeyDown={(e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }}
  disabled={isStreaming}
/>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Passing `api` string directly to useChat | `useChat({ transport: new DefaultChatTransport({ api: '/api/chat' }) })` | AI SDK v5→v6 | `api` prop removed; must wrap in `DefaultChatTransport` |
| `handleSubmit`, `handleInputChange` from useChat | Manual `useState` + `sendMessage({ text })` | AI SDK v5→v6 | Hook no longer manages input; manage with useState |
| `messages[].content` (string) | `messages[].parts` (array of parts) | AI SDK v4 | Parts array enables multimodal; text is `part.type === 'text'` |
| Raw Anthropic SDK `toReadableStream()` | AI SDK `streamText().toUIMessageStreamResponse()` | — | AI SDK handles protocol; don't use raw SDK for UI streaming |

**Deprecated/outdated:**
- `useChat({ api, handleSubmit, handleInputChange, input })`: All deprecated. Use `DefaultChatTransport` + `sendMessage()` + `useState`.
- `messages[].content` as string: Now `messages[].parts` array with typed parts.

---

## Open Questions

1. **Image as vision vs. as URL text**
   - What we know: The ImageUploadWidget uploads to S3 and returns a public URL. The AI SDK supports multimodal messages with `type: 'file'` parts. Claude claude-sonnet-4-5 supports vision.
   - What's unclear: Should images be sent as vision inputs (Claude actually sees them) or as text references (URL in the message)?
   - Recommendation: Send as text URLs in this phase. The chat wizard's job is to collect info for a human 12ity team, not for Claude to process visually. Simpler, no base64 encoding needed, avoids token cost spikes. Phase 12 (PRD generation) can reference the URLs.

2. **Draft save frequency**
   - What we know: `landing.saveDraft` tRPC procedure exists and saves chatHistory to DB. `onFinish` fires after each complete LLM response.
   - What's unclear: Should we save after every assistant turn, or batch?
   - Recommendation: Save after every assistant turn via `onFinish`. Low cost, maximum durability. Use the existing `landing.saveDraft` tRPC procedure via a direct server call (not client-side tRPC) inside `onFinish`.

3. **tRPC from inside route handler**
   - What we know: The project uses `createServerCaller` pattern for RSC. `onFinish` runs server-side.
   - What's unclear: Exact pattern to call tRPC from inside the `onFinish` callback of a route handler.
   - Recommendation: In `onFinish`, call the Drizzle DB directly (same pattern as tRPC routers) rather than going through the tRPC HTTP layer. Import `db` from `@ity/db` directly. Simpler, no HTTP overhead, already used in all routers.

---

## Validation Architecture

> nyquist_validation is NOT in config.json — skip automated test mapping. Config has `workflow.verifier: true` (manual verification only).

---

## Sources

### Primary (HIGH confidence)
- Context7 `/vercel/ai` — `streamText`, `useChat`, `DefaultChatTransport`, `convertToModelMessages`, `toUIMessageStreamResponse`, multimodal messages, `onFinish`, migration guide
- Context7 `/anthropics/anthropic-sdk-typescript` — streaming API, `MessageStream`, `toReadableStream`
- Codebase: `lib/ratelimit/limiters.ts` — existing `Ratelimit.slidingWindow` pattern with `Redis.fromEnv()`
- Codebase: `components/upload/image-upload-widget.tsx` — existing component API and upload pattern
- Codebase: `packages/db/src/schema.ts` — `ChatMessage`, `ChatHistory` types, `landingPageRequests` table schema
- Codebase: `packages/api/src/routers/landing.ts` — `saveDraft` mutation signature

### Secondary (MEDIUM confidence)
- Context7 `/vercel/ai` — `useChat` configuration reference (current API, deprecation warnings confirmed by multiple docs sources)
- Codebase: `app/api/auth/login/route.ts` — rate limiting integration pattern (verified IP vs creator-ID difference)

### Tertiary (LOW confidence)
- None — all claims verified against codebase or Context7 documentation

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Vercel AI SDK confirmed in Context7; packages not yet installed but pattern is clear
- Architecture: HIGH — Route handler pattern, useChat API, system prompt isolation all confirmed
- Pitfalls: HIGH — useChat deprecation confirmed by Context7 migration docs; runtime issue from project pattern knowledge

**Research date:** 2026-04-08
**Valid until:** 2026-05-08 (AI SDK moves fast; re-verify useChat API if >30 days)
