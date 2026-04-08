---
phase: 11-ai-chat-wizard
plan: 02
subsystem: ui
tags: [ai-sdk, react, streaming, chat, file-upload, useChat, DefaultChatTransport]

requires:
  - phase: 11-P01
    provides: POST /api/chat SSE streaming endpoint, X-Chat-Finished header, 429 rate limit response

provides:
  - /dashboard/landing/chat?templateId=X RSC page with auth + DB data fetching
  - ChatWizard client component with streaming chat UI
  - ChatMessage component (ChatGPT-style full-width layout)
  - ChatInput component (auto-grow textarea, paperclip upload, send button)
  - ImageThumbnail component (clickable image preview)

affects: [landing-page-generation, chat-ui, template-gallery]

tech-stack:
  added: [@ai-sdk/react@3.0.156]
  patterns:
    - useChat with DefaultChatTransport + prepareSendMessagesRequest for custom body
    - UIMessage.parts (not .content) — AI SDK v6 API
    - ChatStatus 'ready' (not 'idle') — AI SDK v6 naming
    - isNearBottomRef pattern for auto-scroll with user override
    - Rate limit countdown via setInterval + rateLimitedUntil timestamp

key-files:
  created:
    - apps/web/app/(dashboard)/dashboard/landing/chat/page.tsx
    - apps/web/components/chat/chat-wizard.tsx
    - apps/web/components/chat/chat-message.tsx
    - apps/web/components/chat/chat-input.tsx
    - apps/web/components/chat/image-thumbnail.tsx
  modified:
    - apps/web/app/actions/storage.ts
    - apps/web/package.json
    - ity/pnpm-lock.yaml

key-decisions:
  - "@ai-sdk/react not installed in P01 — added in P02 for useChat hook"
  - "UIMessage has no createdAt field in AI SDK v6 — removed from all components"
  - "useChat option is `messages` not `initialMessages` — ChatInit interface uses messages"
  - "Storage action extended with chat/ prefix for chat image uploads (ownership via school query)"
  - "Rate limit detection via error.message string matching since onError receives Error not Response"
  - "Turn limit tracked client-side (messages.filter user count) not just from X-Chat-Finished header"

patterns-established:
  - "Chat page RSC: auth + DB fetch + draft history load + pass UIMessage[] to client"
  - "ChatWizard: useState input + useChat messages — no deprecated handleSubmit/handleInputChange"
  - "Image upload: getSignedUploadUrl server action + XHR PUT to S3 presigned URL"

requirements-completed: [CHAT-01, CHAT-02, CHAT-04, CHAT-05, CHAT-06, CHAT-07, SEC-03]

duration: 15min
completed: 2026-04-08
---

# Phase 11 Plan 02: AI Chat Wizard UI Summary

**ChatGPT-style streaming chat wizard at /dashboard/landing/chat using @ai-sdk/react useChat with DefaultChatTransport, S3 image upload, turn-limit UX, and rate-limit countdown**

## Performance

- **Duration:** 15 min
- **Started:** 2026-04-08T17:46:31Z
- **Completed:** 2026-04-08T18:01:31Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Complete chat wizard page at `/dashboard/landing/chat?templateId=X` with Supabase auth guard and DB data fetching
- Streaming chat UI using `@ai-sdk/react` `useChat` with `DefaultChatTransport` targeting `/api/chat`
- ChatGPT-style full-width message layout (avatar + name, no bubbles) with streaming cursor indicator
- Image upload via paperclip button (S3 presigned URL), pending thumbnail preview, inline image display
- Turn 15 permanently locks input with "Conversación finalizada" banner
- Rate limit 429 shows toast + visible countdown timer, auto-re-enables when expired
- Conversation history persists across page reloads via DB draft `chatHistory` mapped to `UIMessage[]`

## Task Commits

1. **Task 1: Chat page RSC, ChatMessage, ImageThumbnail** - `2a731be` (feat)
2. **Task 2: ChatWizard, ChatInput, @ai-sdk/react install, storage extension** - `192b619` (feat)

## Files Created/Modified

- `apps/web/app/(dashboard)/dashboard/landing/chat/page.tsx` - RSC page: auth, DB queries, draft history load, welcome message
- `apps/web/components/chat/chat-wizard.tsx` - Main chat client: useChat, streaming state, turn limit, rate limit UX, auto-scroll
- `apps/web/components/chat/chat-message.tsx` - Full-width message row with bot/user avatar, whitespace-preserved text, streaming cursor
- `apps/web/components/chat/chat-input.tsx` - Auto-grow textarea, paperclip file upload, pending image preview, send button
- `apps/web/components/chat/image-thumbnail.tsx` - Clickable image thumbnail, opens full URL in new tab
- `apps/web/app/actions/storage.ts` - Extended with `chat/` prefix support for chat image uploads
- `apps/web/package.json` + `pnpm-lock.yaml` - Added `@ai-sdk/react@3.0.156`

## Decisions Made

- `@ai-sdk/react` was not installed in P01 (P01 only needed server-side `ai`). Added it in this plan for `useChat`.
- `UIMessage` in AI SDK v6 has no `createdAt` field — the type only has `id`, `role`, `metadata`, `parts`. Timestamps removed from components.
- `useChat` option key is `messages` (matching `ChatInit` interface), not `initialMessages`.
- Rate limit detection in `onError` uses string matching on `error.message` since the callback receives an `Error` object, not a `Response`. The API embeds reset timestamp in the JSON body which the SDK may surface in the error message.
- Storage server action extended rather than creating a new action — reuses the same S3 client, ownership validation, and presigned URL pattern.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed missing @ai-sdk/react package**
- **Found during:** Task 2 (ChatWizard creation)
- **Issue:** `useChat` hook is in `@ai-sdk/react`, not in the base `ai` package. P01 only installed `ai` and `@ai-sdk/anthropic`. Without `@ai-sdk/react`, the import would fail at runtime.
- **Fix:** Ran `pnpm add @ai-sdk/react --filter @ity/web`, installed version 3.0.156 compatible with ai@6.0.154
- **Files modified:** apps/web/package.json, ity/pnpm-lock.yaml
- **Committed in:** 192b619 (Task 2 commit)

**2. [Rule 2 - Missing Critical] Extended storage server action with chat/ prefix**
- **Found during:** Task 2 (ChatInput image upload)
- **Issue:** `getSignedUploadUrl` only allowed `profiles/` and `schools/` path prefixes — would return "Invalid path prefix" error for `chat/` uploads, blocking image functionality
- **Fix:** Added `chat/{school_id}/{filename}` case with same school ownership validation as `schools/` prefix
- **Files modified:** apps/web/app/actions/storage.ts
- **Committed in:** 192b619 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 missing critical)
**Impact on plan:** Both fixes essential for functionality. No scope creep.

## Issues Encountered

- `UIMessage.createdAt` does not exist in AI SDK v6 — the interface only has `id`, `role`, `metadata`, `parts`. Removed timestamp display from ChatMessage. (Rule 1 bug fix in implementation.)
- `useChat` `initialMessages` option does not exist — the correct key is `messages` per `ChatInit` interface. Fixed during TS check.

## Next Phase Readiness

- Chat wizard UI fully functional end-to-end with the /api/chat backend from P01
- All requirements CHAT-01 through CHAT-07 and SEC-03 fulfilled
- Ready for Phase 12 (landing page generation from collected chat data)

---
*Phase: 11-ai-chat-wizard*
*Completed: 2026-04-08*
