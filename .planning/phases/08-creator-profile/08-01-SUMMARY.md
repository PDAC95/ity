---
phase: 08-creator-profile
plan: "01"
subsystem: creator-profile
tags: [profile, trpc, drizzle, avatar, react-easy-crop, live-preview]
dependency_graph:
  requires:
    - 06-storage-infrastructure (getSignedUploadUrl, getPublicStorageUrl)
    - 07-school-setup (schools table for preview header)
  provides:
    - creators tRPC router (get + update procedures)
    - Profile page at /dashboard/profile
    - Avatar upload with circular crop
    - Live preview panel
  affects:
    - ity/packages/db/src/schema.ts (3 new columns on creators)
    - ity/packages/api/src/root.ts (creators router registered)
tech_stack:
  added:
    - react-easy-crop (avatar circular crop)
  patterns:
    - FormProvider + useFormContext for card sub-components
    - useWatch for live preview updates on every keystroke
    - Signed URL upload pattern (same as ImageUploadWidget)
    - canvas toBlob crop helper for JPEG conversion
key_files:
  created:
    - ity/packages/api/src/routers/creators.ts
    - ity/apps/web/lib/validations/profile.ts
    - ity/apps/web/app/(dashboard)/dashboard/profile/page.tsx
    - ity/apps/web/components/profile/profile-form.tsx
    - ity/apps/web/components/profile/basic-info-card.tsx
    - ity/apps/web/components/profile/contact-card.tsx
    - ity/apps/web/components/profile/social-links-card.tsx
    - ity/apps/web/components/profile/profile-preview.tsx
    - ity/apps/web/components/profile/avatar-crop-modal.tsx
    - ity/packages/db/drizzle/0000_greedy_hex.sql
  modified:
    - ity/packages/db/src/schema.ts (added SocialLinks type + 3 columns)
    - ity/packages/api/src/root.ts (registered creatorsRouter)
decisions:
  - "db:push used instead of db:migrate — migration 0000 was an initial snapshot and conflicted with existing DB tables; push correctly applied only the diff (3 new nullable columns)"
  - "FormProvider + useFormContext pattern for card sub-components — avoids prop-drilling register/errors to each card"
  - "avatarUrl managed in local useState (not in react-hook-form) — avatar changes persist immediately via separate mutation, decoupled from main form save"
  - "Mobile preview placed below form (not hidden) — simpler than drawer/sheet; sticky bottom save button works on both viewports"
metrics:
  duration: 6min
  completed: 2026-04-01
  tasks_completed: 2
  files_created: 11
  files_modified: 2
requirements: [PROF-01, PROF-03]
---

# Phase 8 Plan 01: Creator Profile Summary

**One-liner:** Creator profile page with display name, bio, contact email, 6 social links, avatar circular crop upload, and live preview — all persisted via tRPC to 3 new creators table columns.

## What Was Built

Full /dashboard/profile page with:
- Two-column layout (form left, sticky preview right; single column on mobile)
- Avatar section: click to open file picker → AvatarCropModal (react-easy-crop, round shape, zoom slider) → signed URL upload → persist via tRPC
- BasicInfoCard: name (50 char) + bio (500 char) with live character counters
- ContactCard: contact email with Zod email validation
- SocialLinksCard: 6 networks (Instagram, X, YouTube, TikTok, LinkedIn, Facebook) with visual URL prefix pattern
- ProfilePreview: live updates via useWatch on every keystroke; toggles between "Perfil público" card and "Header escuela" bar
- Sticky "Guardar cambios" button; disabled when form is not dirty
- useUnsavedChanges hook wires up beforeunload guard
- Success toast on save, error toast on failure

Backend:
- `bio text`, `contact_email varchar(255)`, `social_links jsonb` columns added to creators table
- Drizzle schema updated with SocialLinks type
- `creatorsRouter` with `get` (query) and `update` (mutation) procedures — strips leading `@` from social handles
- Registered as `creators` in appRouter

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Used db:push instead of db:migrate for schema application**
- **Found during:** Task 1 — DB migration step
- **Issue:** `pnpm db:migrate` failed with `relation "announcements" already exists` because migration 0000 is an initial snapshot covering all tables, and the DB already had them. Running migrate tried to re-create all tables.
- **Fix:** Ran `pnpm db:push` from the `ity/packages/db` directory. Drizzle push computes the diff against the live DB and applies only the missing columns (bio, contact_email, social_links). Confirmed with `[✓] Changes applied`.
- **Files modified:** None — operational fix only
- **Commit:** 965741d

## Self-Check: PASSED

All created files confirmed present on disk. Both task commits verified in git log (965741d, 194d86e).
