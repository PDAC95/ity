---
phase: 12-prd-submission-landing-hub
plan: "03"
subsystem: ui
tags: [next.js, react, drizzle, framer-motion, landing-hub, dashboard]

requires:
  - phase: 12-01
    provides: PRD schema and landing page request DB table
  - phase: 09-db-schema-trpc-infrastructure
    provides: landingPageRequests Drizzle schema and DB client
  - phase: 11.5-ui-refinement
    provides: glass-card / glass-btn CSS classes and CSS variable system

provides:
  - Landing Hub RSC page at /a/landing with state-aware content
  - LandingHubView client component (empty state + en-proceso state)
  - Sidebar nav updated to hub entry point

affects: [phase-12-04, landing-flow-continuation]

tech-stack:
  added: []
  patterns:
    - RSC page fetches DB status → passes to client component as serializable props
    - Draft requests treated as 'none' so empty state is the UX entry point
    - isActive startsWith('/a/landing') covers all landing sub-routes

key-files:
  created:
    - apps/web/app/(dashboard)/a/landing/page.tsx
    - apps/web/components/landing/landing-hub-view.tsx
  modified:
    - apps/web/app/(dashboard)/dashboard-shell.tsx

key-decisions:
  - "Landing Hub page is RSC — fetches school + latest landing request, passes effectiveStatus to client component; draft treated as 'none'"
  - "NAV_ITEMS and QUICK_ACTIONS myPage href changed to /a/landing so sidebar always goes to hub, not templates directly"

patterns-established:
  - "Status normalization at RSC boundary: draft|null → 'none', pending|in_progress → status string passed as prop"

requirements-completed: [PRD-04, PRD-03]

duration: 8min
completed: 2026-04-16
---

# Phase 12 Plan 03: Landing Hub Summary

**State-aware Landing Hub at /a/landing showing empty state (CTA to templates) or 'En proceso' card (school name, template, submission date) based on DB request status**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-16T14:00:00Z
- **Completed:** 2026-04-16T14:08:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- RSC page at /a/landing fetches school + latest landingPageRequest from DB, normalizes status (draft/null → 'none')
- LandingHubView renders two states: 'Sin solicitud' (Globe icon + CTA button to /a/landing/templates) and 'En proceso' (status badge, school name, template name, submitted date, status message)
- Sidebar NAV_ITEMS and QUICK_ACTIONS 'Mi Pagina Web' href updated from /a/landing/templates to /a/landing — hub is now the entry point

## Task Commits

1. **Task 1: Landing Hub page + LandingHubView client component** - `8b8b049` (feat — committed as part of plan 12-01 execution)
2. **Task 2: Update sidebar nav to Landing Hub** - `5d53bc6` (feat)

**Plan metadata:** (see final-commit below)

## Files Created/Modified

- `apps/web/app/(dashboard)/a/landing/page.tsx` — RSC page: auth guard, school query, latest request query, status normalization, renders LandingHubView
- `apps/web/components/landing/landing-hub-view.tsx` — Client component: empty state (Globe icon + Sparkles CTA) and en-proceso state (status badge, school info, framer-motion fadeIn)
- `apps/web/app/(dashboard)/dashboard-shell.tsx` — Updated myPage href in NAV_ITEMS (line 135) and QUICK_ACTIONS (line 147) to /a/landing

## Decisions Made

- Draft requests treated as 'none' so creators still in chat flow see the CTA rather than the en-proceso card — provides cleaner UX until they actually submit the PRD
- isActive uses startsWith('/a/landing') which naturally covers /a/landing, /a/landing/templates, /a/landing/chat — no additional logic needed

## Deviations from Plan

None — plan executed exactly as written. Task 1 files were already committed as part of plan 12-01 execution (commit 8b8b049). Task 2 sidebar update was applied and committed separately (5d53bc6).

## Issues Encountered

Task 1 files (page.tsx + landing-hub-view.tsx) were detected as already committed to git from a previous plan 12-01 execution (commit 8b8b049). Content matched the plan spec exactly. Only Task 2 (dashboard-shell.tsx nav update) required new work.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Landing Hub entry point complete — creators without requests see CTA, creators with pending/in_progress see status card
- PRD submission flow (12-01, 12-02) feeds into this hub as the confirmation screen
- Ready for Phase 12-04 if it exists, or phase completion

---
*Phase: 12-prd-submission-landing-hub*
*Completed: 2026-04-16*
