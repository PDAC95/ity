---
phase: 11-ai-chat-wizard
plan: 01
subsystem: chat-backend
tags: [ai-sdk, streaming, rate-limiting, security, server-only]
dependency_graph:
  requires: [packages/db, apps/web/lib/ratelimit, apps/web/lib/supabase]
  provides: [POST /api/chat SSE endpoint, buildSystemPrompt, chatLimiter]
  affects: [apps/web/app/api/chat]
tech_stack:
  added: [ai@6.0.154, @ai-sdk/anthropic@3.0.68]
  patterns: [streamText + toUIMessageStreamResponse, server-only guard, sliding window rate limit]
key_files:
  created:
    - apps/web/lib/chat/system-prompt.ts
    - apps/web/app/api/chat/route.ts
  modified:
    - apps/web/lib/ratelimit/limiters.ts
    - apps/web/package.json
    - packages/db/src/index.ts
    - ity/pnpm-lock.yaml
key_decisions:
  - drizzle-orm re-exported from @ity/db to prevent dual-instance type errors in web app
  - chatLimiter keyed on creator ID (user.id) not IP — consistent with research decision
  - maxOutputTokens (not maxTokens) — AI SDK v6 naming
  - UIMessage.parts (not .content) — AI SDK v6 removed content field
  - claude-sonnet-4.5 (dots not hyphens) for model slug
metrics:
  duration: 6min
  completed: 2026-04-08
  tasks_completed: 2
  files_changed: 6
---

# Phase 11 Plan 01: AI Chat Backend Infrastructure Summary

Installed Vercel AI SDK v6 with Anthropic provider, created SSE streaming chat endpoint with DB-sourced system prompt injection, per-creator rate limiting, and 15-turn enforcement.

## What Was Built

### Task 1: AI SDK + System Prompt Builder + Rate Limiter

- Installed `ai@6.0.154` and `@ai-sdk/anthropic@3.0.68` in `@ity/web`
- Created `apps/web/lib/chat/system-prompt.ts`:
  - `import 'server-only'` prevents client bundling (SEC-03)
  - `buildSystemPrompt({ userId, schoolId, templateId })` queries `creators` and `schools` tables in parallel
  - Returns Spanish-language prompt with creator name/bio and school name/description/colors from DB
  - User-provided content is NEVER interpolated into the prompt
- Added `chatLimiter` to `apps/web/lib/ratelimit/limiters.ts`:
  - Sliding window: 10 requests per 1 minute
  - Prefix: `rl:chat`, keyed on creator ID

### Task 2: Streaming Chat Route Handler

- Created `apps/web/app/api/chat/route.ts`:
  - `export const runtime = 'nodejs'` — required for Drizzle + Upstash
  - `export const maxDuration = 60` — allows streaming up to 60s
  - Supabase auth check → 401 if no user
  - `chatLimiter.limit(chat:${user.id})` → 429 with `Retry-After` header if exceeded
  - User turn count check: >15 → 400 `turn_limit_reached`; at exactly 15 → `X-Chat-Finished: true` header
  - `buildSystemPrompt` called with trusted DB data only
  - `streamText` with `claude-sonnet-4.5`, `convertToModelMessages`, `maxOutputTokens: 1024`
  - `onFinish` saves chat history to DB non-blocking (upsert by schoolId, skips completed requests)
  - Returns `result.toUIMessageStreamResponse()`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Drizzle-orm dual-instance type incompatibility**
- **Found during:** Task 1 TypeScript check
- **Issue:** Web app imported `eq` from `drizzle-orm` directly, creating a second instance incompatible with `@ity/db`'s internal drizzle-orm types — caused TS2322/TS2769 errors
- **Fix:** Re-exported `eq, and, or, ne, sql, desc, asc, inArray, isNull, isNotNull` from `packages/db/src/index.ts` so the web app uses the same resolved instance
- **Files modified:** `packages/db/src/index.ts`

**2. [Rule 1 - Bug] Incorrect AI SDK v6 API usage**
- **Found during:** Task 2 TypeScript check
- **Issue 1:** `maxTokens` is not a valid option in AI SDK v6 — renamed to `maxOutputTokens`
- **Issue 2:** `UIMessage.content` does not exist in AI SDK v6 — messages use `.parts` array
- **Issue 3:** Model slug `claude-sonnet-4-5` should use dots: `claude-sonnet-4.5`
- **Fix:** Updated route handler to use `maxOutputTokens`, extract text from `m.parts`, and corrected model slug
- **Files modified:** `apps/web/app/api/chat/route.ts`

## Commits

| Hash | Message |
|------|---------|
| a4710eb | feat(11-P01): install AI SDK and create system prompt builder + chat rate limiter |
| 6151b63 | feat(11-P01): create streaming chat route with auth, rate limiting, and turn enforcement |

## Self-Check: PASSED

All files created/modified:
- FOUND: ity/apps/web/lib/chat/system-prompt.ts
- FOUND: ity/apps/web/app/api/chat/route.ts
- FOUND: ity/apps/web/lib/ratelimit/limiters.ts

All commits verified:
- FOUND: a4710eb — Task 1
- FOUND: 6151b63 — Task 2
