---
phase: quick-landing-redirect
plan: 1
subsystem: routing
tags: [next.js, middleware, routing, dashboard]

requires:
  - phase: 11-ai-chat-wizard
    provides: dashboard pages and chat wizard at /dashboard/*
provides:
  - Dashboard routes served at /a/* instead of /dashboard/*
  - Middleware guarding /a/* routes
  - All internal navigation links using /a/* paths
affects: [any future phase adding dashboard routes]

tech-stack:
  added: []
  patterns:
    - "Dashboard routes use /a/* prefix (not /dashboard/*)"

key-files:
  created: []
  modified:
    - ity/apps/web/app/(dashboard)/a/ (renamed from dashboard/)
    - ity/apps/web/middleware.ts
    - ity/apps/web/next.config.js
    - ity/apps/web/lib/auth/redirect.ts
    - ity/apps/web/components/dashboard/sidebar.tsx
    - ity/apps/web/components/dashboard/header.tsx
    - ity/apps/web/components/dashboard/onboarding-checklist.tsx
    - ity/apps/web/components/landing/template-preview-modal.tsx
    - ity/apps/web/app/(auth)/register/page.tsx
    - ity/apps/web/app/(dashboard)/a/landing/chat/page.tsx

key-decisions:
  - "Route prefix /a chosen for short clean URLs matching domain plan: app.ity.com/a/*"

patterns-established:
  - "All dashboard URL paths use /a/* prefix; filesystem imports still use @/components/dashboard/* unchanged"

requirements-completed: []

duration: 2min
completed: 2026-04-09
---

# Quick Task 1: Rename Dashboard Routes to /a/* Summary

**Renamed all dashboard routes from /dashboard/* to /a/* with middleware, redirect allowlist, sidebar, header, onboarding, and chat page references updated**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-09T17:59:05Z
- **Completed:** 2026-04-09T18:01:40Z
- **Tasks:** 1
- **Files modified:** 14

## Accomplishments
- Renamed (dashboard)/dashboard/ directory to (dashboard)/a/ for all 6 page routes
- Updated middleware to protect /a/* and redirect authenticated users from auth pages to /a
- Updated all 12 files containing /dashboard URL path strings to use /a prefix
- Zero remaining '/dashboard URL literals in app/components/lib code (verified via grep)
- TypeScript compiles cleanly

## Task Commits

Each task was committed atomically:

1. **Task 1: Rename dashboard directory and update all path references** - `106963b` (feat)

## Files Created/Modified
- `ity/apps/web/app/(dashboard)/a/` - Dashboard pages directory (renamed from dashboard/)
- `ity/apps/web/middleware.ts` - Auth guard now checks /a/* instead of /dashboard/*
- `ity/apps/web/next.config.js` - CSP header source updated to /a/landing/templates
- `ity/apps/web/lib/auth/redirect.ts` - Allowed prefixes and fallback changed to /a
- `ity/apps/web/components/dashboard/sidebar.tsx` - All nav hrefs and isActive check updated
- `ity/apps/web/components/dashboard/header.tsx` - Section titles keys and profile link updated
- `ity/apps/web/components/dashboard/onboarding-checklist.tsx` - Step hrefs updated
- `ity/apps/web/components/landing/template-preview-modal.tsx` - Choose template redirect updated
- `ity/apps/web/app/(auth)/register/page.tsx` - emailRedirectTo next param updated
- `ity/apps/web/app/(dashboard)/a/landing/chat/page.tsx` - Redirect paths updated

## Decisions Made
- Route prefix /a chosen per plan spec for short clean URLs matching domain architecture (app.ity.com/a/*)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- `git mv` failed with Permission denied on Windows; resolved by using cp -r + rm -rf instead

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All dashboard routes accessible at /a/*
- Landing page login button still correctly points to app.ity.com/login (unchanged)

---
*Phase: quick-landing-redirect*
*Completed: 2026-04-09*
