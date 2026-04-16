# Requirements: 12ity v1.2 — Landing Page del Creador

**Defined:** 2026-04-07
**Core Value:** El creador puede solicitar la landing page de su escuela mediante templates + chat guiado con IA, generando un PRD interno para el equipo de 12ity.

## v1.2 Requirements

### Template Gallery (TMPL)

- [x] **TMPL-01**: Creator can browse a gallery of landing page templates with visual thumbnails
- [x] **TMPL-02**: Creator can filter templates by category (multipurpose, yoga, cooking, etc.)
- [x] **TMPL-03**: Creator can preview a template in both desktop (1280px) and mobile (375px) views
- [x] **TMPL-04**: Creator can select a template to start the landing page request flow
- [x] **TMPL-05**: Dashboard sidebar shows "Mi Pagina Web" as active section (replaces placeholder)

### AI Chat Wizard (CHAT)

- [x] **CHAT-01**: Creator enters a guided chat after selecting a template
- [x] **CHAT-02**: Chat pre-fills context from existing school/creator data (name, bio, colors, description)
- [x] **CHAT-03**: LLM asks structured questions about the school (offerings, audience, sections, images, tone)
- [x] **CHAT-04**: LLM responses stream in real-time (token by token, not full-wait)
- [x] **CHAT-05**: Creator can upload images during chat (reuse ImageUploadWidget)
- [x] **CHAT-06**: Chat enforces a maximum turn count (15) server-side
- [x] **CHAT-07**: Per-creator rate limiting on chat endpoint (Upstash Redis)

### PRD Generation (PRD)

- [x] **PRD-01**: At chat completion, LLM generates a structured PRD (JSON) validated against Zod schema
- [ ] **PRD-02**: Creator sees a summary of their answers before confirming submission
- [x] **PRD-03**: On confirmation, PRD is stored in DB as JSONB (internal — never exposed to creator)
- [x] **PRD-04**: Creator sees confirmation screen: "Estamos trabajando en tu pagina web"
- [ ] **PRD-05**: If PRD generation fails, creator sees a retry option with friendly error message

### Notifications (NOTF)

- [ ] **NOTF-01**: Bell icon with unread count badge appears in dashboard header
- [ ] **NOTF-02**: Click bell opens popover with notification list (read/unread distinction)
- [ ] **NOTF-03**: Creator can mark notifications as read (single + mark all)
- [ ] **NOTF-04**: Notifications show relative timestamps ("hace 2 horas")
- [x] **NOTF-05**: In-app notification created on landing page request submission
- [ ] **NOTF-06**: Email notification sent on landing page request submission (via Resend)
- [x] **NOTF-07**: Notification system supports future status-change notifications (ready, revision)

### Security (SEC)

- [x] **SEC-01**: Template preview iframes use `sandbox` attribute (no parent navigation, no form submission)
- [x] **SEC-02**: Template preview URLs validated against server-side allowlist
- [x] **SEC-03**: User input never interpolated into LLM system prompt (role separation enforced)
- [x] **SEC-04**: LLM output validated via Zod schema before any DB write
- [x] **SEC-05**: Notifications scoped to creator via RLS or query-level filtering

## v1.3+ Requirements (Deferred)

### Landing Review Flow

- **REVIEW-01**: Creator can view the finished landing page in their dashboard
- **REVIEW-02**: Creator can approve or request changes to the landing
- **REVIEW-03**: Admin dashboard for 12ity team to manage landing requests

### Automation

- **AUTO-01**: AI agent processes PRD and applies changes to template automatically
- **AUTO-02**: Admin panel for managing templates (add/remove/edit with preview URL)

### Domain

- **DOM-01**: Creator can select a custom domain or buy one through 12ity
- **DOM-02**: DNS/SSL configuration for custom domains

## Out of Scope

| Feature | Reason |
|---------|--------|
| Drag-and-drop visual page builder | Massive scope; template + AI wizard is the v1.2 approach |
| Real-time WebSocket notifications | DB polling sufficient at v1.2 volume; adds infrastructure complexity |
| LLM conversation memory across sessions | Wizard is a one-time linear flow; resumability deferred |
| Browser push notifications | Requires service worker + HTTPS manifest; poor ROI at v1.2 scale |
| Per-notification-type email opt-out | Only 2-3 notification types at v1.2; add when types exceed 5 |
| Showing PRD to creator | Internal technical document; creates confusion and edit requests |
| Student-side features (Cecilia) | Separate milestone (v1.4+) |
| Payments / Stripe checkout | Separate milestone |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| TMPL-01 | Phase 10 | Complete |
| TMPL-02 | Phase 10 | Complete |
| TMPL-03 | Phase 10 | Complete |
| TMPL-04 | Phase 10 | Complete |
| TMPL-05 | Phase 10 | Complete |
| CHAT-01 | Phase 11 | Complete |
| CHAT-02 | Phase 11 | Complete |
| CHAT-03 | Phase 11 | Complete |
| CHAT-04 | Phase 11 | Complete |
| CHAT-05 | Phase 11 | Complete |
| CHAT-06 | Phase 11 | Complete |
| CHAT-07 | Phase 11 | Complete |
| PRD-01 | Phase 12 | Complete |
| PRD-02 | Phase 12 | Pending |
| PRD-03 | Phase 12 | Complete |
| PRD-04 | Phase 12 | Complete |
| PRD-05 | Phase 12 | Pending |
| NOTF-01 | Phase 13 | Pending |
| NOTF-02 | Phase 13 | Pending |
| NOTF-03 | Phase 13 | Pending |
| NOTF-04 | Phase 13 | Pending |
| NOTF-05 | Phase 13 | Complete |
| NOTF-06 | Phase 13 | Pending |
| NOTF-07 | Phase 13 | Complete |
| SEC-01 | Phase 10 | Complete |
| SEC-02 | Phase 10 | Complete |
| SEC-03 | Phase 11 | Complete |
| SEC-04 | Phase 12 | Complete |
| SEC-05 | Phase 13 | Complete |

**Coverage:**
- v1.2 requirements: 26 total
- Mapped to phases: 26
- Unmapped: 0

---
*Requirements defined: 2026-04-07*
*Last updated: 2026-04-07 after v1.2 milestone definition*
