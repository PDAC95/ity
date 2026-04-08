# Roadmap: 12ity

## Milestones

- ✅ **v1.0 Auth & Security** — Phases 1-4 (shipped 2026-03-31)
- ✅ **v1.1 Creator Dashboard** — Phases 5-8 (shipped 2026-04-02)
- 🔄 **v1.2 Landing Page del Creador** — Phases 9-13

## Phases

<details>
<summary>✅ v1.0 Auth & Security (Phases 1-4) — SHIPPED 2026-03-31</summary>

- [x] Phase 1: Security Foundation (2/2 plans) — completed 2026-03-04
- [x] Phase 2: Complete Auth Flows (4/4 plans) — completed 2026-03-17
- [x] Phase 3: Rate Limiting (2/2 plans) — completed 2026-03-17
- [x] Phase 4: Session Management (2/2 plans) — completed 2026-03-31

See: `.planning/milestones/v1.0-ROADMAP.md` for full details.

</details>

<details>
<summary>✅ v1.1 Creator Dashboard (Phases 5-8) — SHIPPED 2026-04-02</summary>

- [x] Phase 5: Dashboard Layout (2/2 plans) — completed 2026-03-31
- [x] Phase 6: Storage Infrastructure (2/2 plans) — completed 2026-04-01
- [x] Phase 7: School Setup (2/2 plans) — completed 2026-04-01
- [x] Phase 8: Creator Profile (1/1 plan) — completed 2026-04-01

See: `.planning/milestones/v1.1-ROADMAP.md` for full details.

</details>

### v1.2 Landing Page del Creador (Phases 9-13)

**Goal:** Paula puede solicitar la landing page de su escuela mediante templates + chat guiado con IA.

**Prerequisites:** v1.1 complete (dashboard, school setup, creator profile, file uploads).

#### Phase 9: DB Schema + tRPC Infrastructure

**Goal:** Database tables and API routers for landing requests and notifications.

**Delivers:**
- `landing_page_requests` table (schoolId, templateId, status, prdData as JSONB)
- `notifications` table (creatorId, type, title, body, isRead, actionUrl, metadata)
- `landing` tRPC router (requestPage, getStatus)
- `notifications` tRPC router (list, markRead, markAllRead, unreadCount)
- Environment variables configured (ANTHROPIC_API_KEY, RESEND_API_KEY)
- RLS/query-level notification scoping

**Requirements:** NOTF-05 (partial), NOTF-07, SEC-05

**Success criteria:**
- [ ] `db:push` succeeds with new tables
- [ ] tRPC routers compile and are accessible from client
- [ ] Notifications query returns only current creator's notifications
- [ ] `prd_data` column is JSONB type (not text)
- [ ] `notifications.creator_id` has DB index

---

#### Phase 10: Template Gallery

**Goal:** Creator can browse, filter, and preview templates with mobile/desktop toggle.

**Delivers:**
- Static template registry (`lib/templates/registry.ts`) with 3-5 initial templates
- Template gallery page (`/dashboard/landing/templates`)
- Template card component with thumbnail, name, category badge
- Category filter chips (horizontal scroll mobile, wrap desktop)
- Preview modal with mobile (375px) / desktop (1280px) toggle via iframe scaling
- "Elegir este template" button navigates to chat with templateId
- Sidebar "Mi Pagina Web" link active (replaces Coming Soon)
- Iframe `sandbox` attribute on all preview iframes
- CSP `frame-src` allowlist for template preview origins

**Requirements:** TMPL-01, TMPL-02, TMPL-03, TMPL-04, TMPL-05, SEC-01, SEC-02

**Success criteria:**
- [ ] Gallery renders 3+ templates with thumbnails
- [ ] Filter chips work (show/hide templates by category)
- [ ] Mobile/desktop preview toggle renders correctly
- [ ] Template selection navigates to `/dashboard/landing/chat?templateId=X`
- [ ] All iframes have `sandbox` attribute
- [ ] Sidebar shows "Mi Pagina Web" link

---

#### Phase 11: AI Chat Wizard

**Goal:** Creator has a guided conversation with Claude that collects all landing page info.

**Delivers:**
- Chat route handler (`/api/chat/route.ts`) — Node.js runtime, SSE streaming
- System prompt builder (`lib/chat/system-prompt.ts`) — injects school/creator context + template sections
- Chat wizard client component — message bubbles, streaming display, input field
- Pre-fill from existing school data (name, description, colors, bio)
- Image upload support in chat (reuse ImageUploadWidget)
- Maximum 15 turns enforced server-side
- Per-creator rate limiting (Upstash Redis) on chat endpoint
- Prompt injection prevention (user input in role:user only, never in system prompt)

**Requirements:** CHAT-01, CHAT-02, CHAT-03, CHAT-04, CHAT-05, CHAT-06, CHAT-07, SEC-03

**Plans:** 2/2 plans complete

Plans:
- [ ] 11-P01-PLAN.md — Backend: AI SDK install, system prompt builder, chat route handler, rate limiter
- [ ] 11-P02-PLAN.md — Frontend: Chat page RSC, chat wizard, message components, image upload, UX edge cases

**Success criteria:**
- [ ] Chat streams LLM responses token-by-token
- [ ] System prompt includes school name, description, colors, creator bio
- [ ] Chat stops at 15 turns with graceful message
- [ ] Rate limiter triggers on rapid requests (429 response)
- [ ] User messages are in role:user, never interpolated into system prompt

---

#### Phase 12: PRD Submission + Landing Hub

**Goal:** Chat generates a validated PRD, creator confirms, and sees status in dashboard.

**Delivers:**
- PRD generation via `generateObject` with Zod schema (structured output)
- Summary screen showing all collected info for creator review
- "Confirmar y enviar" button triggers PRD storage + status update
- Confirmation screen: "Estamos trabajando en tu pagina web"
- Landing hub page (`/dashboard/landing`) — status-aware: gallery entry / pending / done
- Retry on PRD generation failure with friendly error
- PRD never exposed via creator-facing tRPC procedures

**Requirements:** PRD-01, PRD-02, PRD-03, PRD-04, PRD-05, SEC-04

**Success criteria:**
- [ ] PRD JSON is validated against Zod schema before DB write
- [ ] Summary screen shows all collected info accurately
- [ ] Creator sees "Estamos trabajando..." after confirmation
- [ ] Landing hub shows correct state based on request status
- [ ] Malformed LLM output triggers retry, not silent failure
- [ ] `getStatus` procedure does not return prdData field

---

#### Phase 13: Notifications

**Goal:** Creator receives in-app + email notifications for landing page events.

**Delivers:**
- Notification bell icon in dashboard header with unread count badge
- Notification popover with list (read/unread, relative timestamps)
- Mark as read (single + all)
- DB polling via tRPC query (refetchInterval: 30s)
- In-app notification on landing request submission
- Email notification via Resend on landing request submission
- Status-transition guard (only fire on creator-visible status changes)

**Requirements:** NOTF-01, NOTF-02, NOTF-03, NOTF-04, NOTF-05, NOTF-06, NOTF-07

**Success criteria:**
- [ ] Bell icon shows correct unread count
- [ ] Popover displays notifications with read/unread distinction
- [ ] Mark all read clears badge
- [ ] Email sent via Resend on request submission
- [ ] No duplicate notifications on internal status updates
- [ ] Empty state: "No tienes notificaciones"

---

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Security Foundation | v1.0 | 2/2 | Complete | 2026-03-04 |
| 2. Complete Auth Flows | v1.0 | 4/4 | Complete | 2026-03-17 |
| 3. Rate Limiting | v1.0 | 2/2 | Complete | 2026-03-17 |
| 4. Session Management | v1.0 | 2/2 | Complete | 2026-03-31 |
| 5. Dashboard Layout | v1.1 | 2/2 | Complete | 2026-03-31 |
| 6. Storage Infrastructure | v1.1 | 2/2 | Complete | 2026-04-01 |
| 7. School Setup | v1.1 | 2/2 | Complete | 2026-04-01 |
| 8. Creator Profile | v1.1 | 1/1 | Complete | 2026-04-01 |
| 9. DB Schema + tRPC Infrastructure | 2/2 | Complete   | 2026-04-07 | — |
| 10. Template Gallery | 2/2 | Complete    | 2026-04-08 | — |
| 11. AI Chat Wizard | 2/2 | Complete    | 2026-04-08 | — |
| 12. PRD Submission + Landing Hub | v1.2 | 0/? | Pending | — |
| 13. Notifications | v1.2 | 0/? | Pending | — |
