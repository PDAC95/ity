# Phase 11: AI Chat Wizard - Context

**Gathered:** 2026-04-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Creator has a guided conversation with Claude that collects all landing page info. Chat streams responses, follows a fixed section order, supports image uploads, and enforces a 15-turn limit. PRD generation and submission are Phase 12.

</domain>

<decisions>
## Implementation Decisions

### Chat experience
- ChatGPT-style layout: full-width messages, avatar + name, separated by subtle line. No bubbles
- Streaming token-by-token with blinking cursor at the end
- Chat occupies full width — no sidebar or stepper. Progress is implicit in the conversation
- Input field: text + paperclip button for image upload (always visible)
- Multiline textarea: starts as 1 line, auto-grows up to 4-5 lines
- Auto-scroll to latest message. If user scrolls up, auto-scroll pauses until they return to bottom
- Input and send button disabled while Claude is streaming. Re-enabled when response completes
- Automatic welcome message from Claude on page load: greets by name, references school name, explains what they'll do, asks first question

### Conversational flow
- Fixed section order: (1) basic info (name, description) → (2) visual identity (colors, logo) → (3) about the creator (bio, photo) → (4) hero content (title, CTA) → (5) optional sections
- One question at a time — Claude asks, waits for answer, then proceeds
- Tone: friendly professional — uses "tú", enthusiastic with moderation, like a web designer helping you
- Pre-fill handling: Claude mentions existing data and asks if the creator wants to keep or change it. E.g., "Tu escuela se llama X, ¿lo mantenemos?"

### Image uploads in chat
- Claude requests images at the relevant point in the flow (logo during visual identity, photo during bio, hero image during hero section)
- Uploaded images display as thumbnail in the creator's message. Click to view full size
- All images are optional — creator can say "no tengo" or "después" and Claude continues
- Replacing images is allowed — uploading another image of the same type replaces the previous one, Claude confirms the change

### Limits and edge states
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

</decisions>

<specifics>
## Specific Ideas

- Welcome message should feel personalized — use the creator's name and school name from existing data
- "Tu escuela se llama X, ¿lo mantenemos?" pattern for pre-filled fields
- Chat should feel like talking to a helpful web designer, not filling out a form
- Toast countdown for rate limit similar to WhatsApp voice message cooldown

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 11-ai-chat-wizard*
*Context gathered: 2026-04-08*
