---
phase: 12-prd-submission-landing-hub
plan: "02"
subsystem: chat-wizard
tags: [prd, chat, state-machine, trpc, cards]
dependency_graph:
  requires: [12-01]
  provides: [PRD summary card, PRD success card, PRD error card, ChatWizard PRD state machine, chat redirect guard]
  affects: [apps/web/components/chat/chat-wizard.tsx, apps/web/app/(dashboard)/a/landing/chat/page.tsx]
tech_stack:
  added: []
  patterns: [state machine with discriminated union, tRPC useMutation onError revert, [PRD_READY] marker detection via useEffect, automatic + manual retry pattern]
key_files:
  created:
    - ity/apps/web/components/chat/prd-summary-card.tsx
    - ity/apps/web/components/chat/prd-success-card.tsx
    - ity/apps/web/components/chat/prd-error-card.tsx
  modified:
    - ity/apps/web/components/chat/chat-wizard.tsx
    - ity/apps/web/app/(dashboard)/a/landing/chat/page.tsx
decisions:
  - "[12-02] PrdFlowState discriminated union with 6 phases — idle/generating/summary/confirming/done/error — gives type-safe access to prdData only in phases where it exists"
  - "[12-02] prdTriggeredRef prevents re-triggering PRD generation on re-renders when [PRD_READY] is present but phase is not idle"
  - "[12-02] findLast replaced with [...messages].reverse().find() — avoids ES2023 lib requirement in tsconfig"
  - "[12-02] onError in requestPageMutation reverts to summary phase so user can retry confirmation without re-generating PRD"
  - "[12-02] Chat page redirect checks for pending/in_progress status using two ne() conditions before the draft check"
metrics:
  duration: "3min"
  completed_at: "2026-04-16T13:23:56Z"
  tasks: 2
  files: 5
---

# Phase 12 Plan 02: Chat-Embedded PRD Flow Summary

**One-liner:** PRD summary card with grouped sections + tRPC confirm mutation + 1 auto-retry + 3 manual retries + [PRD_READY] detection integrated into ChatWizard state machine.

## What Was Built

### Task 1: PRD Card Components (1dd1dfa)

Three 'use client' components with glass-card styling and framer-motion fadeIn animations:

**PrdSummaryCard** — Reads `PrdSummary` and renders all 5 schema sections as grouped key-value rows: Información básica, Identidad visual (with hex swatches), Sobre ti, Hero, Secciones opcionales. Bottom row has ghost "Quiero cambiar algo" button and glass-btn "Confirmar y enviar". When `isConfirming=true`, both buttons disabled and confirm shows Loader2 spinner.

**PrdSuccessCard** — CheckCircle2 in green (#86efac), heading "¡Listo! Estamos trabajando en tu página web", subtitle with schoolName interpolation, Link to /a/landing as glass-btn.

**PrdErrorCard** — AlertTriangle in amber (#fef3c7). Below maxRetries: retry button. At maxRetries: "intenta más tarde" message + Link to /a dashboard.

### Task 2: ChatWizard PRD State Machine + Redirect Guard (a7fe56b)

**PrdFlowState machine added to ChatWizard:**
- `idle` → detects `[PRD_READY]` in last assistant message → `generating`
- `generating` → fetch /api/prd/generate with 1 auto-retry → `summary` or `error`
- `summary` → user clicks confirm → `confirming` (tRPC mutation) → `done` or back to `summary` on error
- `error` → manual retry up to MAX_MANUAL_RETRIES (3), incrementing retryCount

`prdTriggeredRef` prevents duplicate triggers across re-renders. `[PRD_READY]` marker stripped from rendered message text. Input area hidden when PRD flow is active (prdActive check). "Conversación finalizada" lock banner only shown when chatFinished AND prdFlow.phase === 'idle'.

**Chat page redirect guard:** Before loading draft chat history, RSC checks for any non-draft, non-completed request. If found (pending or in_progress), redirects to /a/landing.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] findLast not available in configured TypeScript target**
- **Found during:** Task 2 — TypeScript compilation error TS2550
- **Issue:** `Array.prototype.findLast` requires ES2023 lib target; project uses lower target
- **Fix:** Replaced `messages.findLast(m => m.role === 'assistant')` with `[...messages].reverse().find(m => m.role === 'assistant')` — equivalent behavior, no lib change needed
- **Files modified:** `ity/apps/web/components/chat/chat-wizard.tsx`
- **Commit:** a7fe56b

## Self-Check

Files created:
- ity/apps/web/components/chat/prd-summary-card.tsx
- ity/apps/web/components/chat/prd-success-card.tsx
- ity/apps/web/components/chat/prd-error-card.tsx

Files modified:
- ity/apps/web/components/chat/chat-wizard.tsx
- ity/apps/web/app/(dashboard)/a/landing/chat/page.tsx

Commits: 1dd1dfa (Task 1), a7fe56b (Task 2)

TypeScript: passes with no errors.

## Self-Check: PASSED
