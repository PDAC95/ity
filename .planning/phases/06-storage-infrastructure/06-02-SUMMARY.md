---
phase: 06-storage-infrastructure
plan: 02
subsystem: ui
tags: [react, supabase, storage, upload, drag-drop, xhr, progress, tailwind]

# Dependency graph
requires:
  - phase: 06-storage-infrastructure
    plan: 01
    provides: getSignedUploadUrl Server Action and getPublicStorageUrl helper

provides:
  - Reusable ImageUploadWidget client component with drag-drop, validation, XHR upload with progress, preview, and delete
  - Barrel export for upload components at apps/web/components/upload/index.ts

affects: [07-school-setup, 08-creator-profile]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "XHR over fetch for upload progress: XMLHttpRequest.upload.progress event gives real-time percent; fetch has no upload progress API"
    - "Discriminated union narrowing: check !result.data (not result.error) to narrow SignedUploadResult so TypeScript trusts result.data is non-null"
    - "Cache-bust preview URL: append ?t=Date.now() to force browser re-fetch after upload overwrite; pass clean URL (no query string) to onUploadComplete"
    - "Object URL cleanup: URL.createObjectURL + img.onload for dimension reading, always revoke in both onload and onerror to avoid memory leaks"

key-files:
  created:
    - apps/web/components/upload/image-upload-widget.tsx
    - apps/web/components/upload/index.ts
  modified: []

key-decisions:
  - "Check !result.data instead of result.error to narrow SignedUploadResult discriminated union — TypeScript requires data to be non-null for property access"
  - "onUploadComplete receives getPublicStorageUrl(path) directly (clean URL) — cache-busted URL stays local for preview only"

patterns-established:
  - "Upload widget pattern: shape prop ('circle' | 'square') controls border-radius; all state local; parent gets URL via callback"
  - "Progress overlay: absolute inset-0 bg-black/50 + SVG CircularProgress; pointer-events-none disables re-click during upload"

requirements-completed: [SCHOOL-02, PROF-02]

# Metrics
duration: 2min
completed: 2026-04-01
---

# Phase 6 Plan 02: ImageUploadWidget Summary

**Reusable ImageUploadWidget with drag-drop, type/size/dimension validation, XHR upload to signed URL with SVG circular progress ring, and shape-based border-radius (circle/square)**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-01T14:22:21Z
- **Completed:** 2026-04-01T14:24:28Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Self-contained upload widget: click or drag-drop, validates type (JPG/PNG/WebP), size (5 MB), and dimensions (200x200 min) with Spanish error messages
- XHR upload to signed URL with real-time circular SVG progress ring (not fetch — fetch has no upload progress)
- Preview displayed after upload; delete button reverts to placeholder and fires onRemove callback
- Barrel export allows `import { ImageUploadWidget } from '@/components/upload'` from any consumer

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ImageUploadWidget client component** - `e034e4d` (feat)
2. **Task 2: Create barrel export for upload components** - `e8181c5` (feat)

**Plan metadata:** (docs commit pending)

## Files Created/Modified
- `apps/web/components/upload/image-upload-widget.tsx` - ImageUploadWidget + CircularProgress + uploadToSignedUrl + getImageDimensions
- `apps/web/components/upload/index.ts` - Barrel re-export for ImageUploadWidget and ImageUploadWidgetProps

## Decisions Made
- Narrowed `SignedUploadResult` discriminated union by checking `!result.data` (not `result.error`) — TypeScript requires the data branch to be asserted non-null before accessing `.signedUrl`
- `onUploadComplete` receives `getPublicStorageUrl(path)` (clean, no query string); the cache-busted preview URL with `?t=Date.now()` is kept local in `imageUrl` state only

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript discriminated union narrowing and undefined return type**
- **Found during:** Task 1 (TypeScript compile check)
- **Issue:** `result.data.signedUrl` flagged as possibly null (TS18047); `publicUrl.split('?')[0]` returned `string | undefined` (TS2345)
- **Fix:** Changed `if (result.error)` to `if (!result.data)` for proper narrowing; replaced `split('?')[0]` with a direct call to `getPublicStorageUrl(path)` for a guaranteed `string`
- **Files modified:** apps/web/components/upload/image-upload-widget.tsx
- **Verification:** TypeScript compiles with zero errors
- **Committed in:** e034e4d (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Correctness fix only — behaviour is identical to plan spec. No scope creep.

## Issues Encountered
- TypeScript discriminated union narrowing requires checking the `data` field (not just the `error` field) to guarantee non-null access. Plan snippet used `result.error` guard which TypeScript doesn't recognise as narrowing `result.data`. Fixed inline.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `ImageUploadWidget` is ready for Phase 7 (school logo upload) and Phase 8 (creator avatar upload)
- Import: `import { ImageUploadWidget } from '@/components/upload'`
- Provide `path`, `shape`, `onUploadComplete`, and optionally `currentImageUrl` / `onRemove`
- SQL migration from Plan 01 must still be applied to the live Supabase project before end-to-end upload testing

---
*Phase: 06-storage-infrastructure*
*Completed: 2026-04-01*
