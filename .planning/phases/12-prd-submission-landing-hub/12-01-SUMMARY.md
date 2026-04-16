---
phase: 12-prd-submission-landing-hub
plan: 01
subsystem: api
tags: [zod, ai-sdk, generateObject, anthropic, prd, structured-output]

# Dependency graph
requires:
  - phase: 11-ai-chat-wizard
    provides: chat API route, system-prompt.ts, AI SDK v6 setup, auth pattern

provides:
  - prdSchema (Zod): 5-section PRD structure with metadata, all nullable fields
  - PrdSummary type from z.infer
  - POST /api/prd/generate: authenticated endpoint producing validated PRD JSON via generateObject
  - [PRD_READY] marker instruction in system prompt for ChatWizard detection

affects:
  - 12-02 (ChatWizard will call /api/prd/generate and detect [PRD_READY] marker)
  - 12-03 (DB write will receive validated PrdData from generate endpoint)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - generateObject with Zod schema for structured LLM output (SEC-04 validation before return)
    - .nullable() (not .optional()) for optional fields — required for reliable Anthropic structured output
    - maxRetries: 1 for transparent AI SDK internal retry

key-files:
  created:
    - ity/apps/web/lib/prd/schema.ts
    - ity/apps/web/app/api/prd/generate/route.ts
  modified:
    - ity/apps/web/lib/chat/system-prompt.ts

key-decisions:
  - "generateObject validates against prdSchema before returning — SEC-04 satisfied at API boundary"
  - "Use .nullable() not .optional() for optional PRD fields — reliable Anthropic structured output"
  - "[PRD_READY] marker in system prompt: emitted only after all 5 sections confirmed, triggers Plan 02 auto-processing"

patterns-established:
  - "PRD generation: chat history serialized as plain text, passed to generateObject extraction prompt"
  - "System prompt [PRD_READY] marker: placed in Spanish bullet list at end of instructions"

requirements-completed: [PRD-01, SEC-04]

# Metrics
duration: 5min
completed: 2026-04-16
---

# Phase 12 Plan 01: PRD Backend — Zod Schema + generateObject API Route Summary

**Zod-validated PRD schema (5 sections + metadata) with POST /api/prd/generate using generateObject and [PRD_READY] marker in system prompt**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-16T13:14:30Z
- **Completed:** 2026-04-16T13:19:30Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created `prdSchema` with schoolInfo, visual, creator, hero, optional, metadata sections using `.nullable()` for optional fields
- Built POST `/api/prd/generate` with auth guard, `generateObject` call, `maxRetries: 1`, and 500 error on validation failure
- Updated `buildSystemPrompt()` with `[PRD_READY]` marker instruction in Spanish — emitted only after all 5 sections confirmed

## Task Commits

Each task was committed atomically:

1. **Task 1: PRD Zod schema + generateObject API route** - `8b8b049` (feat)
2. **Task 2: Update system prompt with [PRD_READY] marker** - `69dbce4` (feat)

**Plan metadata:** (included in final commit)

## Files Created/Modified
- `ity/apps/web/lib/prd/schema.ts` - Zod PRD schema with 5 sections + metadata, exports prdSchema and PrdSummary
- `ity/apps/web/app/api/prd/generate/route.ts` - POST endpoint: auth guard, generateObject with prdSchema, error handling
- `ity/apps/web/lib/chat/system-prompt.ts` - Added [PRD_READY] marker instruction at end of prompt

## Decisions Made
- `generateObject` validates against Zod schema before returning — SEC-04 satisfied at API boundary without extra code
- `.nullable()` instead of `.optional()` for optional fields — Anthropic's structured output works more reliably without optionals
- `[PRD_READY]` marker placed in Spanish bullet list consistent with rest of prompt

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
- `npx tsc` was intercepted by a shell alias; used `./node_modules/.bin/tsc` instead — no impact
- Pre-existing TS error in `landing-hub-view` (stub component) not related to this plan's changes

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `prdSchema` and `/api/prd/generate` ready for Plan 02 ChatWizard to call on `[PRD_READY]` detection
- System prompt updated — ChatWizard can poll assistant messages for `[PRD_READY]` marker
- No blockers

---
*Phase: 12-prd-submission-landing-hub*
*Completed: 2026-04-16*
