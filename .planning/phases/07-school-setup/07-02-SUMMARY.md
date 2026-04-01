---
phase: 07-school-setup
plan: 02
subsystem: ui
tags: [trpc, react, color-picker, branding, lucide-react, sonner, next14, school-setup]

# Dependency graph
requires:
  - phase: 07-school-setup
    plan: 01
    provides: SchoolSetupTabs shell with brandingIsDirty callback, updateBranding mutation, useUnsavedChanges hook
provides:
  - ColorPicker component with native picker + hex input + preset swatch palette
  - BrandingTab with live preview, WCAG contrast warning, and updateBranding persistence
  - Branding tab fully wired in SchoolSetupTabs (replaces placeholder)
affects: [future school pages that use brand colors, onboarding checklist branding step]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Local inputValue state in ColorPicker synced via useEffect for partial hex typing safety
    - Clean-reference state pattern: cleanPrimary/cleanAccent updated only on successful save to drive isDirty
    - Inline WCAG luminance utilities (hexToRelativeLuminance + contrastRatio) — no library needed for soft threshold
    - AvailableFont union type aligned between school-setup-tabs.tsx and branding-tab.tsx to fix structural mismatch

key-files:
  created:
    - ity/apps/web/components/school/color-picker.tsx
    - ity/apps/web/components/school/branding-tab.tsx
  modified:
    - ity/apps/web/components/school/school-setup-tabs.tsx

key-decisions:
  - "Clean-reference state pattern: cleanPrimary/cleanAccent track last-saved values, not prop defaults — isDirty resets correctly after save without re-mounting"
  - "AvailableFont narrowed in school-setup-tabs.tsx Branding type to match branding-tab.tsx contract — avoids structural type mismatch across component boundary"
  - "Contrast warning is soft (ratio < 3.0) and never blocks save — accessibility guidance only, per user constraint"
  - "ColorPicker keeps local inputValue for hex text field; only propagates to parent on valid 6-char hex to prevent mid-typing errors"

requirements-completed: [SCHOOL-04]

# Metrics
duration: 3min
completed: 2026-04-01
---

# Phase 7 Plan 02: Branding Tab Summary

**Color picker form (primary + accent) with 12-swatch preset palette, native color wheel, hex text input, live preview card, soft WCAG contrast warning, and persistence via updateBranding tRPC mutation**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-04-01T15:39:14Z
- **Completed:** 2026-04-01T15:41:31Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Created `ColorPicker` component: native `<input type="color">`, controlled hex text input with local state to allow partial typing, and 12-swatch preset palette with selection ring
- Created `BrandingTab`: two ColorPicker instances (primary + accent), WCAG inline contrast warning when ratio < 3.0, live preview card (header bar + course card + accent button + badge), save via `trpc.schools.updateBranding.useMutation` preserving existing font/logo/favicon
- Wired `BrandingTab` into `SchoolSetupTabs` replacing the `Próximamente` placeholder; narrowed `Branding.font` from `string` to `AvailableFont` union to resolve structural type incompatibility

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ColorPicker component and BrandingTab with live preview** - `e32b405` (feat)
2. **Task 2: Wire BrandingTab into SchoolSetupTabs replacing placeholder** - `d865448` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `ity/apps/web/components/school/color-picker.tsx` - Native picker + hex input + preset swatches
- `ity/apps/web/components/school/branding-tab.tsx` - Color pickers, live preview, contrast warning, save mutation
- `ity/apps/web/components/school/school-setup-tabs.tsx` - BrandingTab wired; AvailableFont type aligned

## Decisions Made

- Clean-reference state pattern: `cleanPrimary`/`cleanAccent` are updated only on successful save, driving `isDirty` correctly without needing prop comparison after save
- `AvailableFont` union (`'inter' | 'merriweather' | 'space-mono'`) narrowed in `school-setup-tabs.tsx` to match the branding-tab contract — TypeScript structural type check caught the mismatch
- Contrast warning is advisory only (ratio < 3.0) — never blocks save, per user constraint "warning suave"
- `ColorPicker` keeps `inputValue` local state synced from `value` prop via `useEffect`; only calls `onChange` on valid 6-char hex to avoid mid-typing errors

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed AvailableFont structural type mismatch**
- **Found during:** Task 2 TypeScript verification
- **Issue:** `school-setup-tabs.tsx` declared `Branding.font` as `string`; `branding-tab.tsx` expects `AvailableFont = 'inter' | 'merriweather' | 'space-mono'` — TypeScript refused to assign `School | null` to `BrandingTab`'s prop type
- **Fix:** Added `AvailableFont` type alias and narrowed `Branding.font` in `school-setup-tabs.tsx` to match
- **Files modified:** `ity/apps/web/components/school/school-setup-tabs.tsx`
- **Commit:** d865448 (included in task commit)

## Issues Encountered

None.

## User Setup Required

None.

## Next Phase Readiness

- School Setup phase complete: General tab (name/description/slug) and Branding tab (colors) both functional
- `updateBranding` mutation preserves logo/favicon/font — logo upload in a future plan can proceed without conflicts
- Phase 8 (or next milestone) can read `school.branding.primaryColor` and `school.branding.secondaryColor` to apply brand colors to public-facing school pages

---
*Phase: 07-school-setup*
*Completed: 2026-04-01*

## Self-Check: PASSED

All files exist and all commits verified:
- FOUND: ity/apps/web/components/school/color-picker.tsx
- FOUND: ity/apps/web/components/school/branding-tab.tsx
- FOUND: ity/apps/web/components/school/school-setup-tabs.tsx
- FOUND commit: e32b405
- FOUND commit: d865448
