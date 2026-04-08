---
phase: 11-ai-chat-wizard
plan: 02
type: execute
wave: 2
depends_on: ["11-P01"]
files_modified:
  - apps/web/app/(dashboard)/dashboard/landing/chat/page.tsx
  - apps/web/components/chat/chat-wizard.tsx
  - apps/web/components/chat/chat-message.tsx
  - apps/web/components/chat/chat-input.tsx
  - apps/web/components/chat/image-thumbnail.tsx
autonomous: true
requirements: [CHAT-01, CHAT-02, CHAT-04, CHAT-05, CHAT-06, CHAT-07, SEC-03]

must_haves:
  truths:
    - "Creator lands on /dashboard/landing/chat?templateId=X and sees a welcome message from Claude"
    - "Creator types a message and sees Claude's response stream token-by-token"
    - "Creator can upload images via paperclip button and see thumbnails in their messages"
    - "Input is disabled while Claude is streaming and re-enabled when response completes"
    - "At turn 15 input is permanently locked with a final summary message"
    - "Rate limit triggers a toast with countdown timer and disables input"
    - "Creator can close and reopen the chat page and see their conversation history"
    - "Chat UI uses ChatGPT-style full-width layout with avatar + name, no bubbles"
  artifacts:
    - path: "apps/web/app/(dashboard)/dashboard/landing/chat/page.tsx"
      provides: "RSC page that fetches creator/school/draft data and renders ChatWizard"
    - path: "apps/web/components/chat/chat-wizard.tsx"
      provides: "Main chat client component with useChat hook"
      contains: "use client"
    - path: "apps/web/components/chat/chat-message.tsx"
      provides: "Single message row with avatar, name, and content"
    - path: "apps/web/components/chat/chat-input.tsx"
      provides: "Textarea with paperclip button and send button"
    - path: "apps/web/components/chat/image-thumbnail.tsx"
      provides: "Clickable thumbnail in user messages"
  key_links:
    - from: "apps/web/components/chat/chat-wizard.tsx"
      to: "/api/chat"
      via: "useChat with DefaultChatTransport"
      pattern: "DefaultChatTransport"
    - from: "apps/web/app/(dashboard)/dashboard/landing/chat/page.tsx"
      to: "apps/web/components/chat/chat-wizard.tsx"
      via: "RSC passes initialMessages, creator, school props"
      pattern: "ChatWizard"
    - from: "apps/web/components/chat/chat-input.tsx"
      to: "apps/web/components/upload/image-upload-widget.tsx"
      via: "ImageUploadWidget reuse for chat image uploads"
      pattern: "ImageUploadWidget"
---

<objective>
Build the chat wizard page and all client components: message display, streaming UI, image uploads, turn limit UX, rate limit UX, and conversation persistence.

Purpose: Give the creator a ChatGPT-style conversational interface to describe their landing page to Claude, with streaming responses, image upload support, and all edge cases handled.

Output: Complete chat UI at /dashboard/landing/chat that connects to the /api/chat streaming endpoint from Plan 01.
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
@.planning/phases/11-ai-chat-wizard/11-P01-SUMMARY.md

<interfaces>
<!-- Key types and contracts from Plan 01 and existing codebase -->

From apps/web/app/api/chat/route.ts (created in P01):
```typescript
// POST /api/chat
// Body: { messages: UIMessage[], schoolId: string, templateId: string }
// Returns: SSE stream via toUIMessageStreamResponse()
// 429: { error: 'rate_limited', reset: number } + Retry-After header
// 400: { error: 'turn_limit_reached' }
// Custom header: X-Chat-Finished: true (at turn 15)
```

From ai / @ai-sdk/react packages (installed in P01):
```typescript
// CURRENT API (2025) — do NOT use deprecated handleSubmit/handleInputChange/input
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';

// useChat returns: { messages, sendMessage, status, setMessages }
// status: 'idle' | 'submitted' | 'streaming' | 'error'
// sendMessage({ role: 'user', parts: [{ type: 'text', text }] })
// Use manual useState for input — useChat no longer manages input
```

From packages/db/src/schema.ts:
```typescript
export type ChatMessage = { role: 'user' | 'assistant'; content: string; timestamp: string; };
export type ChatHistory = ChatMessage[];
```

From apps/web/components/upload/image-upload-widget.tsx:
```typescript
export interface ImageUploadWidgetProps {
  shape: 'circle' | 'square';
  path: string;
  currentImageUrl?: string;
  onUploadComplete: (publicUrl: string) => void;
  onRemove?: () => void;
}
```

From apps/web/lib/supabase/server.ts:
```typescript
export async function createClient(): Promise<SupabaseClient>
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create chat page RSC with data fetching and welcome message</name>
  <files>
    apps/web/app/(dashboard)/dashboard/landing/chat/page.tsx
    apps/web/components/chat/chat-message.tsx
    apps/web/components/chat/image-thumbnail.tsx
  </files>
  <action>
1. **Create `apps/web/app/(dashboard)/dashboard/landing/chat/page.tsx`** as an RSC (server component):
   - Read `searchParams.templateId` — if missing, redirect to `/dashboard/landing/templates`.
   - Authenticate via `createClient()` + `supabase.auth.getUser()` — redirect to `/login` if no user.
   - Fetch creator and school from DB (use Supabase client queries or import db from @ity/db — follow whichever pattern the dashboard layout uses):
     - Creator: id, name, bio, avatarUrl
     - School: id, name, description, branding
   - If no school exists, redirect to `/dashboard/school-setup`.
   - Check for existing draft: query `landing_page_requests` by schoolId with status='draft'. If draft exists AND has chatHistory, map it to `UIMessage[]` format for `initialMessages`.
   - If no existing draft, create a welcome message as static text (NOT streamed):
     ```typescript
     const welcomeMessage: UIMessage = {
       id: generateId(), // from 'ai' package
       role: 'assistant',
       parts: [{ type: 'text', text: `¡Hola ${creator.name}! 👋 Voy a ayudarte a crear la landing page de "${school.name}". ...` }],
       createdAt: new Date(),
     };
     ```
     The welcome message should: greet by name, reference school name, briefly explain the process (5 sections), and ask the first question about basic info.
   - Render `<ChatWizard>` client component passing: `initialMessages`, `schoolId`, `templateId`, `creatorName`, `creatorAvatarUrl`, `schoolName`.

2. **Create `apps/web/components/chat/chat-message.tsx`** as a client component:
   - ChatGPT-style layout per user decision: full-width messages, NO bubbles.
   - Each message row: avatar (left side, small circle), name + timestamp header, then content below.
   - For assistant messages: use a bot icon (lucide `Bot` or `Sparkles`) as avatar, name = "12ity".
   - For user messages: use the creator's avatar URL (or `User` icon fallback), name = creator's name.
   - Content renders as text with basic whitespace preservation (`whitespace-pre-wrap`).
   - Messages separated by a subtle horizontal line or `border-b border-gray-100`.
   - Detect image URLs in user messages (pattern: S3/Supabase storage URL) and render them as `<ImageThumbnail>`.
   - While streaming (if message is the last assistant message and status is 'streaming'), show a blinking cursor at the end using Tailwind `animate-pulse` on a `|` character span.

3. **Create `apps/web/components/chat/image-thumbnail.tsx`** as a client component:
   - Renders a small thumbnail (max 200px wide) of an uploaded image URL.
   - On click, opens the full image in a modal or new tab (simplest: `window.open(url, '_blank')`).
   - Rounded corners, subtle border.
  </action>
  <verify>
    <automated>cd C:/dev/12ity && pnpm exec tsc --noEmit --project ity/apps/web/tsconfig.json 2>&1 | head -20</automated>
  </verify>
  <done>
    - Chat page at /dashboard/landing/chat renders with templateId from search params
    - Auth guard redirects unauthenticated users
    - Existing draft chat history loads as initialMessages
    - Welcome message appears for new conversations (static, not streamed)
    - ChatMessage component renders full-width rows with avatar, name, content
    - ImageThumbnail renders clickable thumbnails for uploaded images
  </done>
</task>

<task type="auto">
  <name>Task 2: Create chat wizard with streaming, input, image upload, turn limit UX, and rate limit UX</name>
  <files>
    apps/web/components/chat/chat-wizard.tsx
    apps/web/components/chat/chat-input.tsx
  </files>
  <action>
1. **Create `apps/web/components/chat/chat-wizard.tsx`** as a `'use client'` component:

   **Props:** `initialMessages: UIMessage[]`, `schoolId: string`, `templateId: string`, `creatorName: string`, `creatorAvatarUrl?: string`, `schoolName: string`.

   **useChat setup (CURRENT API — do NOT use deprecated handleSubmit/handleInputChange):**
   ```typescript
   const [input, setInput] = useState('');
   const { messages, sendMessage, status } = useChat({
     initialMessages,
     transport: new DefaultChatTransport({
       api: '/api/chat',
       prepareSendMessagesRequest: ({ messages }) => ({
         body: { messages, schoolId, templateId },
       }),
     }),
     onError: (error) => { /* handle 429 and other errors */ },
   });
   ```

   **Streaming state:**
   - `const isStreaming = status === 'streaming' || status === 'submitted';`
   - Pass `isStreaming` to ChatInput to disable input during streaming.

   **Turn limit UX (CHAT-06):**
   - Track user turn count: `messages.filter(m => m.role === 'user').length`
   - State `chatFinished` — set to true when user turns reach 15 OR when a response includes X-Chat-Finished header.
   - When `chatFinished` is true, render a "Conversación finalizada" banner and hide the input entirely.
   - NOTE: Check response headers for `X-Chat-Finished: true` in the `onResponse` callback of the transport if available, or simply count client-side turns.

   **Rate limit UX (CHAT-07):**
   - In `onError`, check if the error response is 429.
   - Parse the JSON body for `{ error: 'rate_limited', reset }`.
   - Calculate seconds until reset: `Math.ceil((reset - Date.now()) / 1000)`.
   - Show a sonner toast: `toast.error(\`Espera ${seconds} segundos\`)`.
   - Set local state `rateLimitedUntil` to the reset timestamp. Disable input while `Date.now() < rateLimitedUntil`.
   - Use `setInterval` (1s) to update a countdown display and clear when expired.

   **Streaming error + retry:**
   - If `status === 'error'`, show a "Reintentar" button on the last message.
   - Clicking "Reintentar" re-sends the last user message via `sendMessage`.

   **Auto-scroll:**
   - Ref on the messages container (`messagesEndRef`).
   - `useEffect` that scrolls to bottom on new messages — BUT only if user is near the bottom (within 100px).
   - Track `isNearBottom` via scroll event listener. If user scrolls up, pause auto-scroll.

   **Image upload state:**
   - Track `isUploading` separately from streaming state.
   - Track `pendingImageUrl` — when image is uploaded, store the URL.
   - When sending a message with an image, include the URL as text: `[Imagen: ${imageUrl}]` appended to the message text.
   - After send, clear `pendingImageUrl`.

   **Layout:**
   - Full-width container, max-w-3xl centered, flex flex-col h-full.
   - Messages area: flex-1 overflow-y-auto with padding.
   - Loading skeleton (framer-motion fade) shown while chat initializes.
   - Input area: fixed at bottom with border-t.

   **Render:**
   - Map `messages` to `<ChatMessage>` components, passing `creatorName`, `creatorAvatarUrl`, `isStreaming` (for last assistant message cursor).
   - Below messages: `<ChatInput>` component.

2. **Create `apps/web/components/chat/chat-input.tsx`** as a `'use client'` component:

   **Props:** `input: string`, `onInputChange: (value: string) => void`, `onSend: () => void`, `disabled: boolean`, `isUploading: boolean`, `onImageUpload: (url: string) => void`, `pendingImageUrl?: string`, `onRemovePendingImage: () => void`, `schoolId: string`, `userId: string`.

   **Textarea:**
   - Multiline textarea starting at 1 row, auto-grows up to 5 rows.
   - Auto-grow logic in onChange:
     ```
     e.target.style.height = 'auto';
     e.target.style.height = Math.min(e.target.scrollHeight, 5 * 24) + 'px';
     ```
   - Enter sends (without Shift). Shift+Enter adds newline.
   - Disabled when `disabled || isUploading`.
   - Placeholder: "Escribe tu mensaje..."

   **Paperclip button (image upload):**
   - Lucide `Paperclip` icon button on the left side of the input.
   - On click, opens a file input (hidden input with ref, triggered by button click).
   - When file selected, upload using the existing `getSignedUploadUrl` Server Action pattern:
     - Path: `chat/${schoolId}/${Date.now()}-${file.name}`
     - On upload complete, call `onImageUpload(publicUrl)`.
   - While uploading, show a small spinner on the paperclip button.
   - Alternatively, if wiring the full ImageUploadWidget is too complex for inline chat, use a simpler approach: hidden file input + direct XHR upload to signed URL (reuse the `getSignedUploadUrl` action and upload helpers from the existing widget).

   **Pending image preview:**
   - If `pendingImageUrl` is set, show a small preview thumbnail above the textarea with an X button to remove.

   **Send button:**
   - Lucide `SendHorizontal` icon button on the right side.
   - Disabled when `input.trim() === '' && !pendingImageUrl` OR `disabled` OR `isUploading`.
   - On click: calls `onSend()`.

   **Layout:** Horizontal flex row — paperclip | textarea | send — with border rounded-xl, bg-gray-50, padding.
  </action>
  <verify>
    <automated>cd C:/dev/12ity && pnpm exec tsc --noEmit --project ity/apps/web/tsconfig.json 2>&1 | head -20</automated>
  </verify>
  <done>
    - ChatWizard uses useChat with DefaultChatTransport targeting /api/chat
    - Messages stream token-by-token with blinking cursor on last assistant message
    - Input disabled while streaming, re-enabled on completion
    - Rate limit 429 shows toast with countdown in Spanish
    - Turn 15 locks input and shows "Conversación finalizada" banner
    - Streaming error shows "Reintentar" button
    - Auto-scroll pauses when user scrolls up
    - Paperclip button uploads images and shows pending thumbnail
    - Image URLs included in user messages as text
    - Conversation resumes from DB draft on page reload
  </done>
</task>

</tasks>

<verification>
1. TypeScript compiles: `pnpm exec tsc --noEmit --project ity/apps/web/tsconfig.json`
2. Chat page renders at /dashboard/landing/chat?templateId=modern-starter
3. Welcome message shows creator name and school name
4. Streaming works: tokens appear one by one
5. Input disabled during streaming
6. Turn 15 locks input
7. 429 response shows toast countdown
8. Image upload via paperclip works
9. Conversation persists across page reloads (chat history in DB)
</verification>

<success_criteria>
- Complete chat UI at /dashboard/landing/chat with streaming, images, turn limit, rate limit
- ChatGPT-style layout: full-width messages, avatar + name, no bubbles
- All edge cases handled: error retry, auto-scroll, rate limit countdown
- Conversation persisted in DB and resumable
</success_criteria>

<output>
After completion, create `.planning/phases/11-ai-chat-wizard/11-P02-SUMMARY.md`
</output>
