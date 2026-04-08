---
phase: 10-template-gallery
plan: 01
subsystem: ui
tags: [next.js, typescript, csp, iframe, sidebar, templates]

# Dependency graph
requires:
  - phase: 05-dashboard-layout
    provides: Sidebar component structure (SidebarContent, activeItems, lockedItems)
provides:
  - Static template registry with 5 templates, types, URL allowlist, and sandbox constant
  - Sidebar "Mi Pagina Web" active link to /dashboard/landing/templates
  - CSP frame-src header scoped to /dashboard/landing/templates route
affects: [10-template-gallery P02 (gallery UI consumes registry exports)]

# Tech tracking
tech-stack:
  added: []
  patterns: [Static data registry pattern (no tRPC/DB for config data), URL allowlist validation function, CSP scoped to specific route in next.config.js]

key-files:
  created:
    - ity/apps/web/lib/templates/registry.ts
  modified:
    - ity/apps/web/components/dashboard/sidebar.tsx
    - ity/apps/web/next.config.js

key-decisions:
  - "Static registry pattern: templates are pure TypeScript constants, no DB or tRPC — simplest correct approach for read-only config data"
  - "CSP scoped to /dashboard/landing/templates only — avoids breaking other pages with restrictive frame-src"
  - "ALLOWED_PREVIEW_ORIGINS includes localhost:3001 in development only via process.env.NODE_ENV check"
  - "Dominio removed from lockedItems — Globe icon reused for active Mi Pagina Web link"

patterns-established:
  - "URL allowlist pattern: ALLOWED_PREVIEW_ORIGINS array + isAllowedPreviewUrl(url) validator co-located in registry.ts"
  - "SEC-01 iframe safety: IFRAME_SANDBOX constant exported from registry for consistent reuse across UI components"

requirements-completed: [TMPL-05, SEC-01, SEC-02]

# Metrics
duration: 2min
completed: 2026-04-08
---

# Phase 10 Plan 01: Template Registry, Sidebar, and CSP Summary

**Static template registry with 5 templates + URL allowlist, sidebar "Mi Pagina Web" active link, and CSP frame-src header scoped to the templates route**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-04-08T13:45:33Z
- **Completed:** 2026-04-08T13:47:53Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Created `registry.ts` with Template/TemplateCategory types, 5 templates across 3 categories, ALLOWED_PREVIEW_ORIGINS allowlist, isAllowedPreviewUrl validator, IFRAME_SANDBOX constant, and CATEGORY_LABELS
- Added "Mi Pagina Web" as 4th active sidebar item linking to `/dashboard/landing/templates`; removed "Dominio" placeholder from locked items
- Added `async headers()` to next.config.js with CSP `frame-src` scoped only to the templates page route

## Task Commits

1. **Task 1: Create template registry with types, data, and URL allowlist** - `5bcebac` (feat)
2. **Task 2: Update sidebar and configure CSP headers** - `1aa8c5a` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `ity/apps/web/lib/templates/registry.ts` - Static template registry: types, 5 templates, SEC-01/SEC-02 security constants and validator
- `ity/apps/web/components/dashboard/sidebar.tsx` - Added "Mi Pagina Web" to activeItems, removed "Dominio" from lockedItems
- `ity/apps/web/next.config.js` - Added async headers() with CSP frame-src for /dashboard/landing/templates route

## Decisions Made

- Static registry pattern: templates are pure TypeScript constants, no DB or tRPC — simplest correct approach for read-only config data
- CSP scoped to `/dashboard/landing/templates` only — avoids breaking other pages with restrictive frame-src directives
- `ALLOWED_PREVIEW_ORIGINS` includes `http://localhost:3001` in development only via `process.env.NODE_ENV === 'development'` guard
- `Dominio` removed from lockedItems because Globe icon is now used for the active "Mi Pagina Web" link

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

- PostToolUse hook flagged a false positive: "headers() is async in Next.js 16 — add await". Project uses Next.js 14 where `headers()` in `next.config.js` is a config function returning a Promise, not the `next/headers` import. No change was needed.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Plan 02 (gallery UI) can import `TEMPLATES`, `CATEGORY_LABELS`, `ALL_CATEGORIES`, `isAllowedPreviewUrl`, and `IFRAME_SANDBOX` directly from `registry.ts`
- Sidebar link is live — clicking "Mi Pagina Web" will navigate to `/dashboard/landing/templates` (404 until Plan 02 creates the page)
- CSP header is already configured, so the iframe preview in the modal will be restricted to the allowlist on first render

---
*Phase: 10-template-gallery*
*Completed: 2026-04-08*
