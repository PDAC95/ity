---
phase: 07-school-setup
plan: 01
subsystem: ui
tags: [trpc, react-hook-form, zod, sonner, lucide-react, next14, school-setup]

# Dependency graph
requires:
  - phase: 05-dashboard-layout
    provides: dashboard RSC page pattern, Supabase client query pattern, component structure
  - phase: 06-storage-infrastructure
    provides: upload patterns; school branding type used in SchoolSetupTabs props
provides:
  - checkSlug query procedure with currentSchoolId exclusion
  - updateSlug mutation with server-side CONFLICT error in Spanish
  - School setup page at /dashboard/school-setup
  - SchoolSetupTabs tabbed shell with dirty-state guard on tab switch
  - GeneralTab with name/description form and separate slug management
  - SlugAvailabilityIndicator with 400ms debounce
  - useUnsavedChanges hook for beforeunload browser guard
  - Zod schemas: generalFormSchema, slugSchema
affects: [07-02-branding, future school pages that need slug or setup context]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Slug auto-generated from school name via slugify() when not manually edited
    - Slug update is a SEPARATE tRPC mutation from name/description update
    - useUnsavedChanges hook wraps beforeunload in useEffect for browser-level guard
    - Tab switch dirty-state guard: pendingTab state + confirmation dialog
    - SlugAvailabilityIndicator: debouncedSlug state + enabled flag prevents query on currentSlug

key-files:
  created:
    - ity/packages/api/src/routers/schools.ts (checkSlug query + updateSlug mutation added)
    - ity/apps/web/lib/validations/school.ts
    - ity/apps/web/hooks/use-unsaved-changes.ts
    - ity/apps/web/app/(dashboard)/dashboard/school-setup/page.tsx
    - ity/apps/web/components/school/school-setup-tabs.tsx
    - ity/apps/web/components/school/general-tab.tsx
    - ity/apps/web/components/school/slug-availability-indicator.tsx
  modified:
    - ity/packages/api/src/routers/schools.ts

key-decisions:
  - "updateSlug is a separate tRPC procedure from update — uniqueness check must exclude current school's own slug using ne()"
  - "Slug field is managed outside react-hook-form with local state to allow independent save flow"
  - "SlugAvailabilityIndicator enabled flag: debouncedSlug !== currentSlug prevents redundant queries on own slug"
  - "Tab discard dialog uses pendingTab state to remember destination after user confirms"
  - "school === null branch in GeneralTab calls create mutation (includes slug) instead of update"

patterns-established:
  - "Dirty-state guard pattern: child form lifts isDirty via onDirtyChange callback to parent tab shell"
  - "Auto-slug pattern: slugManuallyEdited boolean gates whether name changes overwrite slug input"
  - "Separate field save pattern: slug has its own button/mutation, decoupled from main form submission"

requirements-completed: [SCHOOL-01, SCHOOL-03]

# Metrics
duration: 3min
completed: 2026-04-01
---

# Phase 7 Plan 01: School Setup Summary

**School Setup page with tabbed UI, name/description/slug form, real-time slug availability via tRPC checkSlug query, and separate updateSlug mutation with CONFLICT error surfaced inline**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-01T15:12:45Z
- **Completed:** 2026-04-01T15:15:54Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Added checkSlug and updateSlug tRPC procedures to schools router, with ne() exclusion for current school's own slug
- Created generalFormSchema and slugSchema Zod exports plus useUnsavedChanges beforeunload hook
- Built complete school-setup page: RSC loads school data, SchoolSetupTabs handles tab switching with dirty-state guard, GeneralTab manages name/description/slug with real-time slug availability indicator

## Task Commits

Each task was committed atomically:

1. **Task 1: Add checkSlug/updateSlug tRPC procedures, Zod schemas, and useUnsavedChanges hook** - `492661f` (feat)
2. **Task 2: Build school-setup page with tabbed shell, General tab form, and slug indicator** - `6190a6b` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `ity/packages/api/src/routers/schools.ts` - Added ne import, checkSlug query, updateSlug mutation
- `ity/apps/web/lib/validations/school.ts` - generalFormSchema, slugSchema, GeneralFormInput type
- `ity/apps/web/hooks/use-unsaved-changes.ts` - beforeunload guard hook
- `ity/apps/web/app/(dashboard)/dashboard/school-setup/page.tsx` - RSC loading school data via Supabase
- `ity/apps/web/components/school/school-setup-tabs.tsx` - Tabbed shell with dirty-state dialog
- `ity/apps/web/components/school/general-tab.tsx` - Name/description/slug form with separate save buttons
- `ity/apps/web/components/school/slug-availability-indicator.tsx` - Debounced availability query display

## Decisions Made
- updateSlug is a separate tRPC procedure from update — required so the uniqueness check can use ne() to exclude the current school's own slug
- Slug field is managed with local state outside react-hook-form to support independent save button flow
- SlugAvailabilityIndicator enabled flag blocks query when debouncedSlug === currentSlug (own slug always valid)
- Tab switch confirmation dialog uses pendingTab state to store destination while awaiting user choice

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- School-setup page is functional with General tab; Branding tab shows placeholder ready for Plan 07-02 implementation
- SchoolSetupTabs already accepts brandingIsDirty callback so Plan 07-02 can wire in its form without changing the shell
- updateSlug CONFLICT error message is in Spanish ("este slug ya está en uso") per spec

---
*Phase: 07-school-setup*
*Completed: 2026-04-01*
