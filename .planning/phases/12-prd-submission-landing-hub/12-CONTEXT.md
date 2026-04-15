# Phase 12: PRD Submission + Landing Hub - Context

**Gathered:** 2026-04-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Chat wizard generates a validated PRD (JSON via `generateObject` + Zod schema), creator reviews and confirms, PRD is stored in DB, and creator sees landing page status in dashboard. The PRD is internal — never exposed via creator-facing tRPC procedures. The existing "My Page" sidebar section is the entry point for the entire landing page flow.

</domain>

<decisions>
## Implementation Decisions

### Summary Screen (within chat)
- Summary appears as a **premium-styled card inside the chat** — not a separate page or modal
- Shows **all fields grouped by section** (info básica, audiencia, estilo, etc.) — complete and transparent
- Card is **read-only** — no inline editing. If the creator wants to change something, they click "Quiero cambiar algo"
- "Quiero cambiar algo" sends a message to the bot, which asks "¿Qué te gustaría cambiar?" — conversational correction flow
- After changes, bot **automatically generates a new summary card** with updated info
- Bot sends a **brief introductory message** before the summary card (e.g., "¡Perfecto! Revisa tu información antes de confirmar:")
- **Buttons are inside the card**: "Confirmar y enviar" + "Quiero cambiar algo"
- **Single click confirms** — no double confirmation dialog (the summary IS the confirmation)
- On click, button shows **spinner + "Generando tu página..."** text while PRD generates

### Confirmation & Post-Confirmation
- Success shows as **bot message + success card** inside chat: "¡Listo! Estamos trabajando en tu página web" with check icon, positive colors
- Success card includes a **"Ver estado en dashboard" button** linking to `/dashboard/landing`
- After confirmation, **chat is marked as completed** — cannot be restarted
- If creator navigates to `/dashboard/chat` after completing, they are **redirected to `/dashboard/landing`**

### Landing Hub (/dashboard/landing via "My Page")
- The existing **"My Page" sidebar section** is the entry point — no new sidebar item needed
- My Page content is **state-aware** and shows different views based on creator status
- **2 states only in v1.2**: "En proceso" (request submitted) and "Sin solicitud" (no chat completed)
- **"En proceso" state**: Large card showing school name, submission date, status indicator ("En proceso"), preview/thumbnail of selected template, and message "Estamos trabajando en tu página. Te avisaremos cuando esté lista."
- **"Sin solicitud" state**: Empty state with icon/illustration + "Aún no has creado tu landing page" + "Crear mi landing page" CTA button → links to chat wizard
- **No timeline/stepper** — only current status. Timeline deferred until more states exist (v1.3+)
- Navigation structure within My Page (sub-pages vs dynamic content): Claude's discretion

### Error Handling & Retry
- Error shown as **friendly bot message** inside chat — no technical jargon. Tarjeta with warning icon: "No pudimos procesar tu solicitud. Tu información está guardada."
- **1 automatic retry** before showing error to creator (transparent — creator doesn't know about it)
- After auto-retry fails, show error with **manual "Intentar de nuevo" button**
- **Maximum 3 manual retries** — after that, show "Estamos teniendo dificultades. Tu info está guardada — intenta más tarde." with "Ir al dashboard" button
- No support link for now — no support system exists yet

### Claude's Discretion
- Navigation structure within My Page (sub-pages vs single dynamic route)
- Exact visual styling of cards (consistent with Phase 11.5 dark premium theme)
- Loading skeleton design for Landing Hub
- Typography and spacing within summary card sections

</decisions>

<specifics>
## Specific Ideas

- The "My Page" section is the natural home for the entire landing flow: template selection → chat wizard → landing status
- Summary card should feel premium — distinct from regular bot messages, with sections, borders, and differentiated background (consistent with Phase 11.5 glass UI)
- Success card should feel celebratory but not over-the-top — positive colors, check icon, clear next step
- Error messages should reassure: "Tu información está guardada" is key — creator should never fear losing their work

</specifics>

<deferred>
## Deferred Ideas

- Timeline/stepper showing process stages (Solicitud → En construcción → Lista) — deferred until v1.3+ when more states exist (REVIEW flow)
- "Listo" and "Cambios solicitados" states for Landing Hub — Phase 13+ (REVIEW-01, REVIEW-02)
- Support link/contact in error messages — needs support system first
- Multiple landing page requests per creator — v1.2 supports one request only

</deferred>

---

*Phase: 12-prd-submission-landing-hub*
*Context gathered: 2026-04-15*
