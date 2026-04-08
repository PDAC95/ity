---
phase: 11-ai-chat-wizard
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - apps/web/lib/chat/system-prompt.ts
  - apps/web/lib/ratelimit/limiters.ts
  - apps/web/app/api/chat/route.ts
autonomous: true
requirements: [CHAT-02, CHAT-03, CHAT-04, CHAT-06, CHAT-07, SEC-03]
user_setup:
  - service: Anthropic
    why: "LLM provider for chat wizard"
    env_vars:
      - name: ANTHROPIC_API_KEY
        source: "Anthropic Console -> API Keys (already in .env.example from Phase 9)"

must_haves:
  truths:
    - "POST /api/chat returns SSE stream of LLM tokens"
    - "System prompt includes school name, description, colors, creator name, and bio from DB"
    - "User messages are never interpolated into system prompt"
    - "Rate limiter returns 429 after 10 requests/minute per creator"
    - "Chat stops accepting requests after 15 user turns"
  artifacts:
    - path: "apps/web/lib/chat/system-prompt.ts"
      provides: "System prompt builder from trusted DB data"
      contains: "server-only"
    - path: "apps/web/app/api/chat/route.ts"
      provides: "SSE streaming route handler"
      exports: ["POST"]
    - path: "apps/web/lib/ratelimit/limiters.ts"
      provides: "chatLimiter rate limiter"
      contains: "chatLimiter"
  key_links:
    - from: "apps/web/app/api/chat/route.ts"
      to: "apps/web/lib/chat/system-prompt.ts"
      via: "buildSystemPrompt()"
      pattern: "buildSystemPrompt"
    - from: "apps/web/app/api/chat/route.ts"
      to: "apps/web/lib/ratelimit/limiters.ts"
      via: "chatLimiter.limit()"
      pattern: "chatLimiter"
    - from: "apps/web/lib/chat/system-prompt.ts"
      to: "packages/db"
      via: "Drizzle query for creator + school"
      pattern: "db\\.query\\.(creators|schools)"
---

<objective>
Install Vercel AI SDK, create the streaming chat route handler, system prompt builder, and per-creator rate limiter.

Purpose: Provide the backend infrastructure that powers the AI chat wizard — streaming LLM responses, context injection from DB, turn limit enforcement, and rate limiting.

Output: Working POST /api/chat endpoint that streams Claude responses with school/creator context, enforces 15-turn limit and per-creator rate limiting.
</objective>

<execution_context>
@C:/Users/patri/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/patri/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/11-ai-chat-wizard/11-RESEARCH.md

<interfaces>
<!-- Key types and contracts the executor needs. -->

From packages/db/src/schema.ts:
```typescript
export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
};
export type ChatHistory = ChatMessage[];

// creators table columns relevant to system prompt:
// id (uuid), name (varchar), bio (text), avatarUrl (varchar)

// schools table columns relevant to system prompt:
// id (uuid), name (varchar), description (text), branding (jsonb: { primaryColor, secondaryColor, font })
```

From packages/api/src/routers/landing.ts:
```typescript
// saveDraft mutation — accepts { schoolId, templateId, chatHistory: ChatMessage[] }
// Updates existing draft or creates new one
// Uses landing_page_requests table
```

From apps/web/lib/ratelimit/limiters.ts:
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

// Existing pattern — add chatLimiter following same pattern
export const loginLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'),
  prefix: 'rl:login',
  analytics: false,
});
```

From apps/web/lib/supabase/server.ts:
```typescript
export async function createClient(): Promise<SupabaseClient>
// Used in route handlers: const supabase = await createClient();
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Install AI SDK and create system prompt builder + rate limiter</name>
  <files>
    apps/web/lib/chat/system-prompt.ts
    apps/web/lib/ratelimit/limiters.ts
  </files>
  <action>
1. Install Vercel AI SDK packages:
   ```
   pnpm add ai @ai-sdk/anthropic --filter @ity/web
   ```

2. Create `apps/web/lib/chat/system-prompt.ts`:
   - Add `import 'server-only'` at the top to prevent accidental client import (SEC-03).
   - Export `async function buildSystemPrompt({ userId, schoolId, templateId })` that:
     - Imports `db` from `@ity/db` and queries `creators` and `schools` tables in parallel using `db.query.creators.findFirst` and `db.query.schools.findFirst`.
     - Returns a Spanish-language system prompt string that:
       - Establishes Claude as a friendly professional web designer using "tú"
       - Injects creator context: name, bio (from DB — these are trusted data, NOT user input)
       - Injects school context: name, description, branding colors (from DB)
       - Injects the selected templateId
       - Defines the fixed section order: (1) basic info → (2) visual identity → (3) about the creator → (4) hero content → (5) optional sections
       - Instructs one question at a time
       - Instructs pre-fill handling: "Tu escuela se llama X, ¿lo mantenemos?" pattern
       - Instructs images are optional — accept "no tengo" or "después"
       - Instructs tone: friendly professional, enthusiastic with moderation
     - CRITICAL (SEC-03): Only DB-sourced data is interpolated. User-provided strings must NEVER appear in this prompt.

3. Add `chatLimiter` to `apps/web/lib/ratelimit/limiters.ts`:
   - Follow existing pattern (same redis instance, Ratelimit constructor)
   - Sliding window: 10 requests per 1 minute per creator
   - Prefix: `'rl:chat'`
   - Analytics: false
  </action>
  <verify>
    <automated>cd C:/dev/12ity && pnpm exec tsc --noEmit --project ity/apps/web/tsconfig.json 2>&1 | head -20</automated>
  </verify>
  <done>
    - `server-only` import prevents client bundling of system prompt
    - buildSystemPrompt queries creator + school from DB and returns Spanish prompt string
    - chatLimiter exported with sliding window 10/1m
    - AI SDK packages installed in apps/web
  </done>
</task>

<task type="auto">
  <name>Task 2: Create streaming chat route handler with auth, rate limiting, and turn enforcement</name>
  <files>
    apps/web/app/api/chat/route.ts
  </files>
  <action>
Create `apps/web/app/api/chat/route.ts` as a POST route handler:

1. **Runtime and config:**
   - `export const runtime = 'nodejs'` — REQUIRED because Drizzle and Upstash need Node.js APIs. Do NOT use Edge runtime.
   - `export const maxDuration = 60` — allow up to 60s for streaming responses.

2. **Authentication:**
   - Import `createClient` from `@/lib/supabase/server`
   - Call `supabase.auth.getUser()` — if no user, return 401 Unauthorized.

3. **Rate limiting (CHAT-07):**
   - Import `chatLimiter` from `@/lib/ratelimit/limiters`
   - Call `chatLimiter.limit(\`chat:${user.id}\`)` — key on creator ID (NOT IP, per research decision)
   - If `!success`, return 429 with JSON body `{ error: 'rate_limited', reset: resetTimestamp }` and `Retry-After` header (seconds until reset). Match existing pattern from `api/auth/login/route.ts`.

4. **Parse request body:**
   - Extract `{ messages, schoolId, templateId }` from `req.json()`
   - `messages` typed as `UIMessage[]` from the `ai` package

5. **Turn limit enforcement (CHAT-06):**
   - Count user messages: `messages.filter(m => m.role === 'user').length`
   - If count > 15, return 400 with JSON `{ error: 'turn_limit_reached' }`
   - At exactly turn 15: allow the request but include a `X-Chat-Finished: true` custom header in the streaming response so the client knows to lock input after this response.

6. **Build system prompt (SEC-03):**
   - Import `buildSystemPrompt` from `@/lib/chat/system-prompt`
   - Call with `{ userId: user.id, schoolId, templateId }`

7. **Stream LLM response (CHAT-03, CHAT-04):**
   - Import `streamText`, `convertToModelMessages`, `UIMessage` from `ai`
   - Import `anthropic` from `@ai-sdk/anthropic`
   - Call `streamText` with:
     - `model: anthropic('claude-sonnet-4-5')` — use claude-sonnet-4-5 for quality/cost balance
     - `system: systemPrompt`
     - `messages: convertToModelMessages(messages)` — converts UIMessage[] to model format
     - `maxTokens: 1024`
   - Return `result.toUIMessageStreamResponse()`

8. **Chat history persistence (in onFinish):**
   - In `streamText`'s `onFinish` callback, save the updated chat history to DB.
   - Import `db` from `@ity/db` and `landingPageRequests` table.
   - Convert the messages array to `ChatHistory` format (role + content + timestamp).
   - Use the same upsert logic as the `saveDraft` tRPC procedure: find existing draft by schoolId, update chatHistory. If no draft exists, insert one with status 'draft'.
   - This runs AFTER streaming completes — do NOT await it in the response path (non-blocking).

IMPORTANT: Do NOT interpolate any user message content into the system prompt. All user messages go via the `messages` parameter only (SEC-03).
  </action>
  <verify>
    <automated>cd C:/dev/12ity && pnpm exec tsc --noEmit --project ity/apps/web/tsconfig.json 2>&1 | head -20</automated>
  </verify>
  <done>
    - POST /api/chat exists with runtime 'nodejs' and maxDuration 60
    - Auth check returns 401 for unauthenticated requests
    - Rate limiter returns 429 with Retry-After header when exceeded
    - Turn limit returns 400 at >15 user messages
    - At turn 15, X-Chat-Finished header is set
    - LLM response streams via SSE using streamText + toUIMessageStreamResponse
    - onFinish saves chat history to DB without blocking the response
    - User input is NEVER in the system prompt (SEC-03)
  </done>
</task>

</tasks>

<verification>
1. TypeScript compiles without errors: `pnpm exec tsc --noEmit --project ity/apps/web/tsconfig.json`
2. `ai` and `@ai-sdk/anthropic` appear in apps/web/package.json dependencies
3. `chatLimiter` is exported from limiters.ts
4. system-prompt.ts imports 'server-only'
5. route.ts has `export const runtime = 'nodejs'`
6. route.ts never concatenates user input into system prompt string
</verification>

<success_criteria>
- AI SDK packages installed and importable
- POST /api/chat compiles with streaming, auth, rate limiting, turn enforcement
- System prompt builder queries DB for trusted data only
- Per-creator rate limiter (10/min) added to existing limiters file
</success_criteria>

<output>
After completion, create `.planning/phases/11-ai-chat-wizard/11-P01-SUMMARY.md`
</output>
