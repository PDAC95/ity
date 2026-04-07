# Feature Research

**Domain:** Template gallery + AI chat wizard + notifications for education SaaS (12ity v1.2)
**Researched:** 2026-04-02
**Confidence:** HIGH (industry patterns well-established; specifics verified across multiple sources)

> **Note:** The prior version of this file covered v1.1 (Creator Dashboard + School Setup). That research is superseded by this document. v1.1 features are fully shipped and documented in `.planning/milestones/`.

---

## Scope

This document covers three feature domains added in v1.2: **(1) template gallery**, **(2) AI-guided chat wizard that collects school info and generates an internal PRD**, and **(3) in-app + email notification system**. All features extend the existing creator dashboard (v1.1 complete).

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features creators assume exist. Missing any of these = product feels broken or untrustworthy.

#### Template Gallery

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Visual grid of template cards | Creators expect to see what they're choosing; text-only lists feel like 2010 | LOW | Card layout with screenshot thumbnail; 2–4 columns depending on viewport |
| Desktop + mobile preview toggle | Users know landing pages must be responsive — must verify before picking | MEDIUM | Two layout states in a preview modal; mobile width ~375px |
| Filter by category/type | When gallery has more than 6 templates, scanning without filters is painful | LOW | Pill/chip filters (e.g., "Yoga", "Negocio", "Arte", "Idiomas") — no multi-select needed at v1.2 |
| "Select this template" CTA | Explicit confirmation before committing; must feel non-destructive | LOW | Button in gallery card and in preview modal |
| Selected state indicator | Creator needs to know which template is currently active | LOW | Checkmark overlay or brand-color border ring on selected card |
| Template name and brief description | Helps differentiation; creators read context before choosing | LOW | 1–2 lines below thumbnail; avoid marketing copy |
| Empty/loading state | Gallery must handle fetch delay gracefully | LOW | Skeleton cards during load; fallback message if no templates match filter |

#### AI Chat Wizard

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Step-by-step guided questions | Creators are not copywriters — they need prompting, not a blank form | MEDIUM | One focused question at a time; conversational tone, not interrogation |
| Progress indicator | Without knowing the length, users abandon. "3 of 7 preguntas" reduces anxiety | LOW | Step counter or progress bar at top of chat pane |
| Pre-filled answers from existing profile | School name, description, brand colors already exist in DB — re-asking is friction | MEDIUM | Pull from `schools` and `creators` tables before wizard starts; present as suggestions or pre-answered steps |
| Ability to review answers before submitting | Users realize they made a mistake — a summary screen prevents regret | LOW | Summary card after final question with "Confirmar y enviar" CTA |
| Streaming LLM responses | Creators have learned to expect tokens appearing in real time; full-wait feels broken | MEDIUM | Server-Sent Events or ReadableStream; Vercel AI SDK handles this |
| Clear end state / confirmation | What happens after submission? Ambiguity causes re-submits and support tickets | LOW | Confirmation screen: "El equipo de 12ity revisará tu solicitud — tiempo estimado: 3–5 días hábiles" |
| Wizard is non-blocking | Creator should be able to exit and return; progress preserved or easy to restart | MEDIUM | Save draft state to DB or localStorage; "Continuar donde lo dejé" on re-entry |

#### Notifications

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Bell icon with unread badge | Universal SaaS pattern — creators look for it instinctively in the header | LOW | Bell in header; brand-color dot badge with count; disappears when all read |
| Notification dropdown/popover | Click bell → see notifications without leaving the current page | LOW | Popover anchored to bell; max-height with internal scroll |
| Read vs unread visual distinction | Must distinguish new notifications at a glance | LOW | Unread = bold text + dot indicator; read = muted/gray |
| Mark as read (single + all) | Standard affordance — users expect "mark all read" in every SaaS they use | LOW | Click row → mark read; "Marcar todo como leído" link in popover header |
| Notification type icons | Visual differentiation between system alert, status update, success | LOW | Icon per type (check = completed, clock = in-progress, alert = action needed) |
| Relative timestamp | "Hace 2 horas" style | LOW | `date-fns formatDistanceToNow`; transition to absolute date after 24h |
| Email notification for important events | Creators expect email for landing page status updates, not just in-app | MEDIUM | Triggered via Supabase built-in email (constraint from PROJECT.md); plain-text acceptable at v1.2 |

---

### Differentiators (Competitive Advantage)

Features that set 12ity apart from generic template pickers or standard form-based onboarding.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Chat wizard pre-fills from existing school data | Eliminates repeated data entry — school name, description, colors already known; wizard feels intelligent | MEDIUM | Inject existing data as LLM context; surface as pre-answered questions or quick-confirm chips |
| Category-aware template recommendations | After wizard collects "type of school", surface matching templates first | MEDIUM | Simple tag-match sort; no ML needed at v1.2 |
| PRD as structured JSON (internal only) | Team gets a machine-readable spec instead of raw chat transcript — enables v1.3 automation | HIGH | LLM outputs JSON conforming to a defined schema; stored in DB, never shown to creator |
| "Solicitud en proceso" status with ETA | Creators feel anxious in limbo — proactive status ("Tu landing está siendo diseñada, tiempo estimado: 3–5 días") differentiates from silence | LOW | Status field on `landing_page_requests` table; surfaced in dashboard and notification |
| Notification as workflow communication channel | In-app + email together create a feedback loop: submission received → in review → ready; creator is never left wondering | LOW | Three notification types, all triggered server-side; creator sees the whole lifecycle |

---

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Drag-and-drop visual page builder | Feels empowering to customize directly | Massive scope; contradicts current milestone; requires full editor infrastructure. Already listed as Out of Scope in PROJECT.md | Template gallery + AI wizard is the bridge; visual builder is v2+ |
| Real-time WebSocket notifications | Feels modern and "live" | WebSockets in serverless/Vercel require extra infrastructure (Pusher, Ably, Supabase Realtime); polling every 30–60s is sufficient at v1.2 volume | DB polling on page focus and window refocus; upgrade to Realtime in v1.4+ when student notifications justify the cost |
| Complex LLM conversation memory across sessions | Chat that "remembers" previous sessions feels smart | Adds state management complexity, token cost, and debugging surface; v1.2 wizard is a one-time linear flow, not an exploratory assistant | Single-session linear wizard; all answers captured in one JSON at the end of the session |
| Multi-select filters + sort + keyword search in template gallery | More filtering options feel professional | At v1.2 with fewer than 20 templates, over-filtering adds UI complexity with no payoff | Single-select category chips; add search when gallery grows past 30+ templates |
| Browser push notifications | Users expect them on mobile | Requires service worker, HTTPS manifest, opt-in prompt, and a push service; poor return on complexity at v1.2 creator volume | In-app bell + email covers the notification needs entirely at this stage |
| Granular per-notification-type email opt-out | Seems professional | Premature at v1.2 with only 2–3 notification types | Single global email notification toggle in settings; add per-type granularity when types exceed 5 |
| Show PRD to creator | Creator might want to see what was generated | PRD is an internal specification document written in technical language; showing it creates confusion, edit requests, and support burden | Show a friendly summary confirmation screen instead; keep PRD internal |

---

## Feature Dependencies

```
[v1.1 foundation — already built]
    └── Creator authenticated + school record exists
    └── School data: name, description, slug, brand colors
    └── Creator data: name, bio, avatar, social links
    └── Dashboard header with slot for notification bell

[Template Gallery]
    └──requires──> Creator authenticated + has school (v1.1)
    └──requires──> Templates data in DB or static config file
    └──action produces──> landing_page_requests record (template_id field)
    └──enhances──> AI Chat Wizard (selected template category pre-filters recommendations)

[AI Chat Wizard]
    └──requires──> Creator authenticated + has school (v1.1)
    └──reads──> school.name, school.description, school.primaryColor (v1.1)
    └──reads──> creator.bio, creator.socialLinks (v1.1)
    └──requires──> Template selection (wizard starts after template is chosen OR template choice is step 1 of wizard — design decision)
    └──produces──> PRD JSON record stored in landing_page_requests table
    └──triggers──> [Notification: "Solicitud recibida"]
    └──triggers──> [Email: "Hemos recibido tu solicitud de landing page"]

[PRD JSON record]
    └──requires──> AI Chat Wizard completion
    └──feeds──> v1.3 admin review + automated execution workflow
    └──schema must be stable before v1.3 ships

[In-app Notifications]
    └──requires──> notifications table in DB (new in v1.2)
    └──requires──> Bell icon slot in existing dashboard header (v1.1 header has this space)
    └──triggered by──> Chat wizard submission (v1.2)
    └──triggered by──> Landing page status changes (written by v1.3 admin tools; v1.2 UI must be able to receive and display them)
    └──reads──> creator_id to scope notifications per creator

[Email Notifications]
    └──requires──> Supabase built-in email (constraint — no custom SMTP at v1.2)
    └──triggered by──> Same server-side events as in-app notifications
    └──depends on──> Creator's verified email from Supabase Auth
```

### Dependency Notes

- **Template selection before wizard:** The most logical UX is template gallery first, then wizard — creator picks a visual direction, then the wizard collects content to fill it. This also means `landing_page_requests` captures both `template_id` and wizard output in one record.
- **AI Chat Wizard must read v1.1 data:** School name, description, brand colors, and creator bio should be injected as LLM system context so the wizard does not re-ask for what is already known. This is both a differentiator and a table-stakes expectation.
- **PRD schema must be finalized in v1.2:** The JSON structure produced by the wizard is consumed by v1.3 admin tooling. Breaking changes after v1.3 ships require a migration. Define and document the schema in v1.2.
- **Notification bell exists in v1.1 header:** The bell UI can be added to the existing header component without layout changes; the header already has space reserved.
- **Notifications in v1.2 are one-directional:** Creator receives updates only. No replies, no actions triggered from the notification itself at v1.2.

---

## MVP Definition

### Launch With (v1.2)

Minimum viable set that delivers the milestone goal: Paula can request her landing page, feel guided through the process, and not feel abandoned while waiting.

- [ ] **Template gallery: grid, category filters, desktop/mobile preview** — Core selection experience; without this, creator cannot make a meaningful choice
- [ ] **Template selection state persisted** — Confirmed template_id stored on landing_page_requests; selection is visible on return
- [ ] **AI chat wizard: linear guided questions (6–9 questions)** — Collects school info not already in DB; structured input for PRD generation
- [ ] **Wizard pre-fills from existing school/creator data** — Eliminates re-entry of known data; high value, medium effort
- [ ] **Summary screen before final submission** — Creator reviews all answers; "Confirmar y enviar" as explicit commit action
- [ ] **PRD JSON generation and DB storage (internal)** — Structured output for team; never shown to creator; schema defined here and stable for v1.3
- [ ] **"Solicitud recibida" confirmation screen with ETA** — Prevents "did it work?" anxiety; sets correct expectations
- [ ] **In-app notification on wizard submission** — Bell badge updates immediately after creator submits
- [ ] **Email notification on wizard submission** — Via Supabase built-in; plain-text "Recibimos tu solicitud" with expected timeline
- [ ] **In-app notification displayable for status changes** — v1.3 writes the status update; v1.2 notification UI must be able to receive and render any notification written to the `notifications` table

### Add After Validation (v1.3 candidates)

- [ ] **Category-aware template recommendations** — After wizard collects school type, sort matching templates first. Trigger: wizard flow is stable and team has categorized all templates
- [ ] **Status timeline component in dashboard** — "Solicitada → En diseño → En revisión → Lista" progress indicator. Trigger: team workflow is defined in v1.3 admin panel
- [ ] **Notification filtering by type** — Trigger: notification volume grows past 5 distinct event types in production
- [ ] **Wizard draft auto-save** — Save partial answers to DB on each step. Trigger: user research shows abandonment in the middle of the wizard

### Future Consideration (v2+)

- [ ] **Visual drag-and-drop page builder** — Out of scope per PROJECT.md; requires full editor infrastructure
- [ ] **Real-time WebSocket notifications** — Supabase Realtime or Pusher; justify only when student-side notifications in v1.4+ require the infrastructure
- [ ] **Granular notification preferences** — Per-type opt-out settings; trigger: 5+ notification types in production
- [ ] **LLM conversation memory across sessions** — Exploratory assistant model instead of linear wizard; trigger: validated user demand for non-linear customization

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Template gallery (grid + thumbnails) | HIGH | LOW | P1 |
| Desktop/mobile preview toggle | HIGH | MEDIUM | P1 |
| Category filter chips | MEDIUM | LOW | P1 |
| Template selection state persisted | HIGH | LOW | P1 |
| AI chat wizard (linear questions) | HIGH | MEDIUM | P1 |
| Pre-fill wizard from existing data | HIGH | MEDIUM | P1 |
| Summary screen before submission | HIGH | LOW | P1 |
| PRD JSON generation + DB storage | HIGH | HIGH | P1 |
| "Solicitud recibida" confirmation screen | HIGH | LOW | P1 |
| Bell icon + unread badge in header | HIGH | LOW | P1 |
| Notification popover with read/unread | HIGH | LOW | P1 |
| Mark single + all as read | MEDIUM | LOW | P1 |
| Email notification on submission | HIGH | MEDIUM | P1 |
| Category-aware template recommendations | MEDIUM | MEDIUM | P2 |
| Wizard draft auto-save | MEDIUM | MEDIUM | P2 |
| Notification filtering by type | LOW | MEDIUM | P3 |
| Drag-and-drop page builder | HIGH (eventually) | VERY HIGH | DEFER |
| Real-time WebSocket notifications | MEDIUM | HIGH | DEFER |

**Priority key:**
- P1: Must have for v1.2 launch
- P2: Add when P1 is stable; v1.3 candidate
- P3: Nice to have; v1.3+ or later
- DEFER: Out of scope for current roadmap window

---

## Competitor Feature Analysis

| Feature | Kajabi | Teachable / Thinkific | 12ity v1.2 Approach |
|---------|--------|-----------------------|---------------------|
| Template gallery | 20+ templates, visual grid, per-product choice | Limited; basic section editor | Gallery with category filters; card thumbnails; desktop+mobile preview |
| Landing page customization | Drag-and-drop page builder (self-service) | Limited block editor | AI chat wizard collects needs; human team builds; avoids builder scope entirely |
| Onboarding for landing setup | Form-based, self-service | Form-based | Conversational AI wizard; lower barrier; guided experience |
| Notifications | In-app + email | Email only | In-app bell + email via Supabase; real-time deferred to v1.4+ |
| White-label | Partial — Kajabi branding visible on lower plans | Partial — platform branding visible | Full white-label; no 12ity branding on student side |
| PRD / team handoff | N/A — fully self-service | N/A | Internal JSON PRD enables human-quality execution by the 12ity team |
| Status updates while waiting | N/A — instant self-service | N/A | "Solicitud en proceso" status + in-app notifications = proactive communication |

---

## UX Behavior Standards

### Template Gallery

- Cards: 280–320px wide, 16:9 or 4:3 thumbnail ratio, template name and category below the image
- Hover state: subtle scale transform (1.02) + elevated shadow
- Selected state: checkmark overlay (top-right corner), brand-color border ring (2–3px)
- Filter chips: horizontal scroll on mobile, wrap on desktop; active chip = filled with brand color
- Preview: modal or drawer with desktop view (full width) and mobile view (375px) toggled by tabs
- "Seleccionar este template" CTA: primary button in modal; smaller secondary button on card hover

### AI Chat Wizard

- Message layout: creator messages right-aligned, AI/wizard messages left-aligned (standard chat convention)
- LLM responses stream token by token; no full-wait rendering
- One question per message; never compound ("Tell me your target audience and their main problem")
- Questions: 6–9 total. Suggested flow: school type → target audience → tone/style → key offerings (2–3) → main CTA → differentiator → visual style preference
- Progress indicator: "Pregunta 3 de 8" counter visible above the message area throughout
- Pre-filled suggestions: surface as editable text in a bubble or as quick-reply chips for single-choice answers
- After last question: summary card listing all answers with "Editar" links; "Confirmar y enviar" as the final action
- Post-submit: full-screen confirmation; do not navigate away automatically; creator closes or navigates themselves

### Notifications

- Bell icon: top-right area of existing dashboard header; consistent with v1.1 layout
- Badge: appears only when unread count > 0; shows count up to 9, then "9+"; disappears when count = 0
- Popover: width 320–380px; max-height 480px with internal scroll; opens on bell click, closes on outside click
- Empty state: "No tienes notificaciones" with a muted icon; no blank popover
- Notification row: ~64px tall; icon left (type indicator), text center (title + short description), timestamp right
- Timestamp: relative ("hace 2 horas") for events under 24h; absolute ("3 abr, 14:32") for older events
- Click behavior: marks the notification as read; navigates to relevant dashboard section if the notification has a link
- "Marcar todo como leído" link: visible in popover header only when unread items exist

---

## Sources

- [Eleken: Wizard UI Pattern explained](https://www.eleken.co/blog-posts/wizard-ui-pattern-explained) — MEDIUM confidence (WebSearch verified)
- [MagicBell: Notification System Design](https://www.magicbell.com/blog/notification-system-design) — MEDIUM confidence (WebSearch verified)
- [SuprSend: Ultimate Guide to In-App Notifications](https://www.suprsend.com/post/ultimate-guide-to-saas-in-app-notifications-and-in-app-inboxes---with-implementation-codes) — MEDIUM confidence (WebSearch verified)
- [Equal Design: In-App Notification Best Practices for SaaS](https://www.equal.design/blog/in-app-notifications-best-practices-for-saas) — MEDIUM confidence (WebSearch verified)
- [Knock: In-App Notification Feed for Next.js 15](https://knock.app/blog/how-to-add-an-in-app-notification-feed-to-nextjs-15) — HIGH confidence (official vendor documentation)
- [MakerKit: Real-time Notifications with Supabase + Next.js](https://makerkit.dev/blog/tutorials/real-time-notifications-supabase-nextjs) — MEDIUM confidence (WebSearch verified)
- [Kajabi Template Gallery](https://templates.kajabi.com/collections/landing-page-templates) — HIGH confidence (official product)
- [Kajabi vs Podia comparison](https://kajabi.com/blog/kajabi-vs-podia-which-should-you-choose) — MEDIUM confidence (vendor comparison)
- [AI Chat UI Best Practices (TheFrontKit)](https://thefrontkit.com/blogs/ai-chat-ui-best-practices) — MEDIUM confidence (WebSearch verified)
- [Designing Agentic Workflows — DEV Community](https://dev.to/eabait/designing-agentic-workflows-lessons-from-orchestration-context-and-ux-13j) — MEDIUM confidence (WebSearch verified)
- [SaaSFrame UI Design Pattern Library](https://www.saasframe.io/) — MEDIUM confidence (pattern library, visual reference)
- [UX Magazine: Designing Notifications for Apps](https://uxmag.com/articles/designing-notifications-for-apps) — MEDIUM confidence (WebSearch verified)
- [Userpilot: Notification Types for SaaS](https://userpilot.com/blog/notification-types/) — MEDIUM confidence (WebSearch verified)
- [Orbix: AI-Driven UX Patterns in SaaS 2026](https://www.orbix.studio/blogs/ai-driven-ux-patterns-saas-2026) — LOW confidence (WebSearch only, single source)

---

*Feature research for: 12ity v1.2 — template gallery, AI chat wizard, in-app + email notifications*
*Researched: 2026-04-02*
