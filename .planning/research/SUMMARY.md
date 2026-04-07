# Project Research Summary

**Project:** 12ity v1.2 — Landing Page del Creador
**Domain:** AI-assisted onboarding wizard, template gallery, in-app + email notifications for white-label education SaaS
**Researched:** 2026-04-02
**Confidence:** HIGH

## Executive Summary

12ity v1.2 adds three interdependent capabilities on top of the completed v1.1 Creator Dashboard: a template gallery for landing page selection, an AI-guided chat wizard that collects school content and generates an internal PRD, and an in-app + email notification system to keep creators informed throughout the process. The recommended approach is a sequential build order that starts with DB schema and tRPC infrastructure (which unblocks everything downstream), then template gallery (no external dependencies, fastest to validate), then LLM chat wizard, then PRD submission and landing hub, and finally notifications wired into the full flow. This order avoids building UI on top of unverified API contracts and allows each phase to be tested in isolation.

The core technology additions are minimal and deliberate: Vercel AI SDK (`ai` + `@ai-sdk/anthropic`) for streaming chat and structured PRD generation, Resend for transactional email, and DB polling via existing tRPC + React Query for in-app notifications. The existing stack (Next.js 14, tRPC v10, Drizzle, Supabase, Upstash) handles everything else without new infrastructure services. Two new DB tables (`landing_page_requests`, `notifications`) and two new tRPC routers (`landing`, `notifications`) form the data backbone. Template definitions are static TypeScript configuration, not DB-backed, keeping the gallery fast with no loading state.

The highest-risk area is the LLM chat subsystem, which concentrates multiple attack surfaces and failure modes: prompt injection via user input, JSON parsing failures on PRD generation, Vercel serverless timeout on streaming routes, and per-creator API quota exhaustion. All are preventable through well-established patterns — structural prompt isolation, Zod schema validation on all LLM output, Node.js route handler with explicit `maxDuration`, and Upstash Redis rate limiting per creator. A secondary risk is notification correctness: cross-creator data leakage via shared Realtime channels and notification spam from untriggered status changes are both fixable in schema and trigger design before any code ships. None of the identified pitfalls are novel or hard to mitigate.

---

## Key Findings

### Recommended Stack

The project already has a strong foundation; v1.2 adds only three new packages. Vercel AI SDK is the right abstraction for both streaming chat (`streamText` + `useChat`) and structured PRD generation (`generateObject` + Zod schema) — it replaces approximately 200 lines of manual SSE parsing and provides a unified interface across both use cases. Resend is the correct choice for transactional email: Supabase built-in email is auth-only and rate-limited to 3 emails/hour, making it unsuitable for notification emails. In-app notifications require no new package — `refetchInterval` on the existing tRPC query handles polling adequately at v1.2 volumes.

**Core technologies (new additions only):**
- `ai` + `@ai-sdk/anthropic` + `@ai-sdk/react`: Vercel AI SDK — streaming chat and structured PRD generation via Claude; replaces manual SSE handling and provides type-safe `generateObject`
- `resend` + `react-email` + `@react-email/components`: transactional email delivery — required because Supabase built-in SMTP is auth-only and enforces a 3 emails/hour cap
- DB polling via `trpc.notifications.list.useQuery({ refetchInterval: 10_000 })`: in-app notifications — no new package; stateless and Vercel-compatible

**Critical version note:** The `ai` package uses calendar-style versioning; npm shows `ai@6.0.143` as of 2026-04-02. The `^4.3.0` range in initial research is stale. Use `ai@latest` at install time and pin the resolved version.

### Expected Features

**Must have (table stakes):**
- Template gallery: visual card grid, category filter chips, desktop/mobile preview toggle, selected state indicator
- AI chat wizard: streaming responses, 6-9 guided questions, pre-fill from existing school data, progress indicator, summary screen before submit
- Notifications: bell icon with unread badge, popover with read/unread distinction, mark-as-read (single + all), relative timestamps
- PRD JSON generation and DB storage (internal only — never shown to creator)
- "Solicitud recibida" confirmation screen with ETA
- Email notification on wizard submission

**Should have (differentiators):**
- Wizard pre-fills from v1.1 school/creator data — eliminates redundant entry; wizard feels intelligent
- PRD as structured JSONB — enables v1.3 admin automation; schema must be stable in v1.2
- "Solicitud en proceso" status with ETA — differentiates from silence while creator waits
- In-app + email together as a workflow communication channel across the full request lifecycle

**Defer (v1.3+):**
- Category-aware template recommendations based on wizard output
- Status timeline component ("Solicitada → En diseño → En revisión → Lista")
- Wizard draft auto-save to DB on each step
- Notification filtering by type

**Defer (v2+):**
- Drag-and-drop visual page builder — out of scope per PROJECT.md
- Real-time WebSocket notifications — polling is sufficient at v1.2 volume
- LLM conversation memory across sessions

### Architecture Approach

The architecture layers cleanly onto v1.2 without modifying existing components. tRPC handles all standard queries and mutations; a dedicated Next.js Route Handler (`app/api/chat/route.ts`) handles LLM streaming exclusively, since tRPC v10 serializes all responses as JSON and cannot stream. Template data lives as a static TypeScript registry with no DB query, keeping the gallery a pure Server Component. Chat state is session-only (React `useState`); only the final extracted PRD is persisted via tRPC mutation. Notifications are delivered via DB polling on a 10-second interval — simpler, stateless, and Vercel-compatible at v1.2 volume.

**Major components:**
1. `app/api/chat/route.ts` — SSE streaming route handler; Node.js runtime; auth check + Anthropic SDK + Upstash rate limiter per creator
2. `components/landing/chat-wizard.tsx` — Client Component; multi-turn message state; fetch + ReadableStream consumer; triggers PRD mutation on wizard completion
3. `components/landing/template-gallery.tsx` — Client Component; filter state via `useState`; receives TEMPLATES as props from Server Component; no API call
4. `components/notifications/notification-bell.tsx` — Client Component; polls `api.notifications.list` every 10s; unread badge + popover
5. `packages/api/src/routers/landing.ts` + `notifications.ts` — tRPC routers for all non-streaming operations; always scoped to `ctx.user.id`
6. `packages/db/src/schema.ts` (modified) — adds `landing_page_requests` (with `prd_data jsonb`) and `notifications` tables

### Critical Pitfalls

1. **Iframe missing `sandbox` attribute** — any `<iframe>` rendering a template URL without `sandbox` allows script execution, parent frame navigation, and session hijacking. Set `sandbox="allow-scripts allow-same-origin"` on every preview iframe; add CSP `frame-src` allowlist in `next.config.js`. Address before any template preview component ships.

2. **Prompt injection via user input in system prompt** — interpolating raw user messages into the system prompt is OWASP GenAI Top 10 #1 risk. All user input must go in `role: "user"` turns only; never concatenate into the system prompt string. Address at system prompt design time — cannot be retrofitted.

3. **PRD generation assumes valid LLM JSON** — `JSON.parse()` on raw LLM output fails in production when the model wraps output in markdown, omits fields, or truncates at token limit. Use `generateObject` with Zod schema for schema-enforced generation; add retry logic on parse failure.

4. **No per-creator rate limiting on the chat endpoint** — a single creator can exhaust the entire Anthropic API quota. Apply Upstash Redis rate limiter (already in stack) per `creatorId` on the chat route handler before the first message can be sent.

5. **Notification spam from untriggered status changes** — every internal `UPDATE` to `landing_page_requests` fires a creator notification and email without a transition guard. Use a Postgres trigger or Edge Function webhook that compares `OLD.status` vs `NEW.status` and fires only on creator-visible transitions.

---

## Implications for Roadmap

Based on research, the dependency graph and pitfall-to-phase mapping point to a clear 5-phase build order within v1.2.

### Phase 1: DB Schema + tRPC Infrastructure
**Rationale:** Everything downstream depends on the database tables and tRPC routers existing first. Building them first avoids integration blockers and allows each subsequent phase to be tested against real data contracts.
**Delivers:** `landing_page_requests` + `notifications` tables migrated; `landing.ts` + `notifications.ts` tRPC routers registered in `appRouter`; `ANTHROPIC_API_KEY` + `RESEND_API_KEY` added to env config.
**Addresses:** PRD schema stability requirement (must be finalized before v1.3); notification RLS and `user_id` index requirements.
**Avoids:** Building UI against undefined data contracts; PRD column type debt (`jsonb` not `text`); missing `user_id` index on notifications table.

### Phase 2: Template Gallery
**Rationale:** No external API dependencies (Claude, Resend) — purely static data and UI. Can be built, tested, and validated before the LLM integration exists. Unblocks the wizard entry point (`templateId` passed to wizard via URL param).
**Delivers:** Static template registry (`lib/templates/registry.ts`); `TemplateGallery` + `TemplateCard` + `TemplatePreviewModal` client components; `/dashboard/landing/templates/page.tsx`.
**Addresses:** Table stakes gallery features (grid, filter chips, desktop/mobile preview toggle, selected state).
**Avoids:** Iframe sandbox XSS (set `sandbox` attribute in `TemplatePreviewModal` from day one); arbitrary URL rendering (server-side allowlist + CSP `frame-src`).

### Phase 3: LLM Chat Wizard
**Rationale:** Highest complexity and risk; builds on Phase 1 (DB) and Phase 2 (template selection provides `templateId`). Must be built with all security controls in place from the first commit — prompt injection, rate limiting, and streaming timeout cannot be retrofitted safely.
**Delivers:** `app/api/chat/route.ts` (Node.js runtime, Upstash rate limiter, Anthropic SDK streaming); `chat-wizard.tsx` (message state, fetch + ReadableStream consumer); `lib/chat/system-prompt.ts`; `/dashboard/landing/chat/page.tsx` (server component passes school context to wizard).
**Addresses:** Streaming responses (table stakes); pre-fill from v1.1 school data (differentiator); 6-9 guided questions with progress indicator.
**Avoids:** tRPC used for streaming (architectural anti-pattern); Edge Runtime on chat route (use Node.js with `maxDuration`); user input interpolated into system prompt; unbounded context window (cap at 10 turns, enforce server-side).

### Phase 4: PRD Submission + Landing Hub
**Rationale:** Depends on wizard completion signal from Phase 3. Connects the wizard output to DB persistence and sets the status tracking foundation that v1.3 admin tooling will build on. PRD schema finalized and frozen here.
**Delivers:** `prd-submission-form.tsx` (summary screen + "Confirmar y enviar"); `api.landing.requestPage.useMutation` wired to wizard completion; `/dashboard/landing/page.tsx` (status-aware hub: gallery entry / pending / done); "Solicitud recibida" confirmation screen with ETA.
**Addresses:** PRD JSON generation with Zod validation; summary screen before submission (table stakes); "Solicitud en proceso" status (differentiator); PRD kept internal.
**Avoids:** `JSON.parse()` on raw LLM output — use `generateObject` + Zod schema; exposing `prd_data` via creator-facing tRPC procedure; silent PRD generation failures.

### Phase 5: Notifications
**Rationale:** Depends on `landing.requestPage` mutation (Phase 4) which triggers the first notification. Notifications are side effects of the complete flow — building them last means all trigger points already exist.
**Delivers:** `notification-bell.tsx` + `notification-item.tsx` in header; `api.notifications.list.useQuery({ refetchInterval: 10_000 })`; Resend email on wizard submission (tRPC mutation side effect); notification inserted on `landing.requestPage`.
**Addresses:** Bell icon + unread badge (table stakes); read/unread distinction; relative timestamps; email notification on submission; notification as workflow communication channel.
**Avoids:** Supabase Auth SMTP for transactional email (use Resend); notification spam via status-transition guard; cross-creator data leakage (DB polling eliminates shared Realtime channel risk entirely).

### Phase Ordering Rationale

- **Schema first:** Both tRPC routers and all UI components depend on the DB tables existing. Running `db:push` before any app code is written prevents integration surprises and locks in the PRD schema before downstream consumers exist.
- **Gallery before wizard:** Template selection is the wizard's entry point (`templateId` is a required input). The gallery has zero external dependencies and provides fast, isolated validation of the static registry pattern.
- **Security controls in Phase 3, not retrofitted:** Prompt injection isolation, rate limiting, and streaming timeout configuration are architectural decisions that cannot be safely added after the chat endpoint is in production use.
- **PRD schema frozen in Phase 4:** The v1.3 admin panel consumes this schema. Finalizing in v1.2 before any downstream consumer exists is the correct sequencing.
- **Notifications last:** All notification trigger points exist after Phase 4. Notifications have no dependency blockers of their own and are purely additive.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (LLM Chat):** Verify `ai@latest` resolved version is compatible with `next@14.2.0` and `@tanstack/react-query@4.36.0` before installing. The `ai` package version note in STACK.md flags a potential semver mismatch (`^4.3.0` vs actual `6.x`). Also verify `maxDuration` config syntax for the current Vercel plan tier before implementing the streaming route.

Phases with standard patterns (skip research-phase):
- **Phase 1 (DB Schema):** Drizzle table additions follow established project patterns; all column types (`jsonb`, `uuid`, `boolean`) are already in use.
- **Phase 2 (Template Gallery):** CSS transform iframe scaling is a documented, stable approach; no new packages; Framer Motion already installed.
- **Phase 4 (PRD Submission):** tRPC mutation pattern is identical to existing mutations; `generateObject` + Zod is well-documented in Vercel AI SDK docs.
- **Phase 5 (Notifications):** Resend integration is straightforward; `refetchInterval` polling pattern is already used elsewhere in the project.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | npm versions verified 2026-04-02; official docs consulted for all new packages; one version caveat documented (ai package semver) |
| Features | HIGH | Industry patterns well-established; competitor analysis (Kajabi, Teachable) confirms table stakes; UX behavior specs are specific and actionable |
| Architecture | HIGH | Based on direct codebase audit + official Next.js/tRPC/Anthropic docs; all integration patterns verified; anti-patterns explicitly documented |
| Pitfalls | HIGH (security/iframe/streaming) / MEDIUM (tRPC-SSE integration) | Security pitfalls sourced from OWASP and authoritative vendor docs; tRPC streaming caveat has limited official examples for v10 specifically |

**Overall confidence:** HIGH

### Gaps to Address

- **`ai` package version resolution:** STACK.md explicitly notes that `^4.3.0` may be stale; npm shows `ai@6.0.143` as latest. Use `ai@latest` at install time and pin the resolved version. Verify companion packages (`@ai-sdk/react`, `@ai-sdk/anthropic`) match. Address at Phase 3 kickoff.
- **Vercel plan tier for `maxDuration`:** PITFALLS.md recommends `maxDuration = 300` for Vercel Pro. Confirm the project is on Vercel Pro (not Hobby, which has a hard 10s limit) before implementing the streaming route. Address before Phase 3 development begins.
- **PRD JSON schema field definition:** Research confirms the schema must exist and be stable, but the exact fields are not defined in any research file. The schema must be drafted and agreed upon with the team as part of Phase 3/4 planning.
- **Resend domain verification for `notificaciones@12ity.com`:** STACK.md documents the env var but does not confirm whether the DNS records are already verified. If not, email notifications will fail silently in production. Verify DNS status before Phase 5.

---

## Sources

### Primary (HIGH confidence)
- [ai-sdk.dev/docs](https://ai-sdk.dev/docs) — Vercel AI SDK install, `streamText`, `generateObject`, `useChat`, Next.js App Router integration
- [ai-sdk.dev/providers/ai-sdk-providers/anthropic](https://ai-sdk.dev/providers/ai-sdk-providers/anthropic) — `@ai-sdk/anthropic` package, Claude model names
- [resend.com/docs/send-with-nextjs](https://resend.com/docs/send-with-nextjs) — Resend + Next.js integration
- [platform.claude.com/docs/en/build-with-claude/streaming](https://platform.claude.com/docs/en/build-with-claude/streaming) — Anthropic SDK streaming
- [platform.claude.com/docs/en/api/rate-limits](https://platform.claude.com/docs/en/api/rate-limits) — TPM and RPM limits per tier
- [nextjs.org/docs/app/building-your-application/routing/route-handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers) — Route Handler streaming pattern
- [genai.owasp.org/llmrisk/llm01-prompt-injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/) — OWASP GenAI Top 10 prompt injection classification
- [vercel.com/docs/functions/limitations](https://vercel.com/docs/functions/limitations) — serverless timeout limits by plan
- npm registry — verified versions 2026-04-02: `ai@6.0.143`, `@ai-sdk/anthropic@3.0.65`, `@ai-sdk/react@3.0.145`, `resend@6.10.0`, `react-email@5.2.10`

### Secondary (MEDIUM confidence)
- [knock.app/blog/how-to-add-an-in-app-notification-feed-to-nextjs-15](https://knock.app/blog/how-to-add-an-in-app-notification-feed-to-nextjs-15) — in-app notification patterns
- [makerkit.dev/blog/tutorials/real-time-notifications-supabase-nextjs](https://makerkit.dev/blog/tutorials/real-time-notifications-supabase-nextjs) — per-creator Supabase channel pattern
- [redis.io/blog/context-window-overflow](https://redis.io/blog/context-window-overflow/) — context window management for LLM chat
- [kajabi.com templates](https://templates.kajabi.com/collections/landing-page-templates) — competitor template gallery reference
- [supabase.com/docs/guides/realtime/limits](https://supabase.com/docs/guides/realtime/limits) — Realtime connection caps and channel behavior
- Community: Vercel SSE timeout behavior and Edge Function streaming limits

### Tertiary (LOW confidence)
- [orbix.studio/blogs/ai-driven-ux-patterns-saas-2026](https://www.orbix.studio/blogs/ai-driven-ux-patterns-saas-2026) — AI UX patterns; single source, verify during implementation

---
*Research completed: 2026-04-02*
*Ready for roadmap: yes*
