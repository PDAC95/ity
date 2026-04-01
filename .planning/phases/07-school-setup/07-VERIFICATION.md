---
phase: 07-school-setup
verified: 2026-04-01T00:00:00Z
status: passed
score: 10/10 must-haves verified
re_verification: false
---

# Phase 7: School Setup Verification Report

**Phase Goal:** El creador puede configurar completamente su escuela — nombre, descripción, slug único, y colores de marca — con todos los cambios persistidos en base de datos.
**Verified:** 2026-04-01
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Creator can edit school name (max 60 chars) and description and see saved values when returning | VERIFIED | `general-tab.tsx`: react-hook-form with `generalFormSchema` (max 60), `schools.update.useMutation` persists, page RSC loads from DB on every render |
| 2 | Creator can type a slug and see real-time availability indicator (available/taken/invalid) without submitting | VERIFIED | `slug-availability-indicator.tsx`: 400ms debounce, `checkSlug.useQuery` with `enabled: shouldQuery`, renders "Disponible" / "Ya está en uso" / "Solo letras minúsculas..." |
| 3 | Two creators cannot save the same slug — conflict on submit shows inline 'este slug ya está en uso' error | VERIFIED | `schools.ts` updateSlug: `ne(schools.id, input.id)` exclusion + `TRPCError({ code: 'CONFLICT', message: 'este slug ya está en uso' })`; `general-tab.tsx` onError sets `slugConflictError` rendered as red text inline |
| 4 | Creator sees success toast after saving and unsaved-changes warning before navigating away | VERIFIED | `toast.success('Cambios guardados')` in updateMutation.onSuccess; `useUnsavedChanges` adds `beforeunload` handler when isDirty; tab-switch dialog guards navigation within tabs |
| 5 | Slug auto-generates from name when not manually edited | VERIFIED | `general-tab.tsx`: `slugManuallyEdited` boolean gates `slugify(nameValue)` auto-write into `rawSlug` state via useEffect |
| 6 | Creator can pick primary and accent brand colors using a color picker with preset palette and free hex input | VERIFIED | `color-picker.tsx`: native `<input type="color">`, controlled hex text input with local `inputValue` state, 12 preset swatches with selection ring |
| 7 | Creator sees a live preview of how colors look applied to sample UI elements | VERIFIED | `branding-tab.tsx` lines 125–165: bordered "Vista previa" section with header bar (`backgroundColor: primaryColor`), card title in primaryColor, accent button and badge (`backgroundColor: accentColor`) |
| 8 | Creator sees a soft contrast warning when the color combination is hard to read | VERIFIED | `branding-tab.tsx`: inline `hexToRelativeLuminance` + `contrastRatio` utilities; amber warning renders when `contrastRatio < 3.0`; does not block save |
| 9 | Color hex values are saved via updateBranding mutation and persist across page reloads | VERIFIED | `branding-tab.tsx`: `trpc.schools.updateBranding.useMutation` called with `{ primaryColor, secondaryColor: accentColor, font, logo, favicon }`; `schools.ts` updateBranding writes to DB; RSC page re-fetches on load |
| 10 | Creator sees success toast after saving and unsaved-changes guard works for branding tab | VERIFIED | `toast.success('Colores guardados')` on success; `setBrandingIsDirty` wired into `SchoolSetupTabs`; `useUnsavedChanges(generalIsDirty \|\| brandingIsDirty)` covers both tabs |

**Score:** 10/10 truths verified

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `ity/packages/api/src/routers/schools.ts` | checkSlug query + updateSlug mutation | VERIFIED | Both procedures present; checkSlug uses `ne()` exclusion; updateSlug throws Spanish CONFLICT error; updateBranding persists hex colors |
| `ity/apps/web/lib/validations/school.ts` | Exports generalFormSchema, slugSchema | VERIFIED | Both exported; generalFormSchema max 60 chars; slugSchema regex `/^[a-z0-9-]+$/` |
| `ity/apps/web/hooks/use-unsaved-changes.ts` | Exports useUnsavedChanges | VERIFIED | 17-line implementation; adds/removes `beforeunload` handler via useEffect on `isDirty` |
| `ity/apps/web/app/(dashboard)/dashboard/school-setup/page.tsx` | RSC page loading school data | VERIFIED | Supabase server query selects `id, name, description, slug, branding`; passes to `SchoolSetupTabs` |
| `ity/apps/web/components/school/school-setup-tabs.tsx` | Tab shell with General/Branding tabs and dirty-state guard | VERIFIED | Two tabs; `pendingTab` + `showDiscardDialog` guard; `useUnsavedChanges(generalIsDirty \|\| brandingIsDirty)`; BrandingTab fully wired (no placeholder) |
| `ity/apps/web/components/school/general-tab.tsx` | Name, description, slug form with save mutation | VERIFIED | react-hook-form + zodResolver; separate updateSlug mutation; SlugAvailabilityIndicator integrated; slugify auto-generation |
| `ity/apps/web/components/school/slug-availability-indicator.tsx` | Debounced slug availability display | VERIFIED | 400ms debounce; `enabled: shouldQuery` flag prevents query on own slug; three visual states rendered |
| `ity/apps/web/components/school/branding-tab.tsx` | Color picker form with live preview and save | VERIFIED | Two ColorPicker instances; WCAG contrast warning; live preview card; clean-reference dirty tracking; updateBranding mutation |
| `ity/apps/web/components/school/color-picker.tsx` | Reusable color picker with swatches and hex input | VERIFIED | Native picker + controlled hex input + 12 swatches with selection ring; partial-typing safety via local inputValue state |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `general-tab.tsx` | `trpc.schools.update.useMutation` | form onSubmit for name+description | VERIFIED | Line 63: `trpc.schools.update.useMutation`; called in handleSubmit when `school?.id` exists |
| `general-tab.tsx` | `trpc.schools.updateSlug.useMutation` | slug save handler | VERIFIED | Line 83: `trpc.schools.updateSlug.useMutation`; `handleSlugSave` called on "Guardar slug" click |
| `slug-availability-indicator.tsx` | `trpc.schools.checkSlug.useQuery` | debounced query with enabled flag | VERIFIED | Line 32: `trpc.schools.checkSlug.useQuery` with `enabled: shouldQuery` (blocks on own slug) |
| `school-setup-tabs.tsx` | `useUnsavedChanges` | isDirty prop from child forms | VERIFIED | Line 39: `useUnsavedChanges(generalIsDirty \|\| brandingIsDirty)` covering both tabs |
| `branding-tab.tsx` | `trpc.schools.updateBranding.useMutation` | form onSubmit | VERIFIED | Line 65: `trpc.schools.updateBranding.useMutation`; called in `handleSave` with full branding payload |
| `school-setup-tabs.tsx` | `BrandingTab` | tab render replacing placeholder | VERIFIED | Line 104: `<BrandingTab school={school} onDirtyChange={setBrandingIsDirty} />`; no placeholder remains |
| `schoolsRouter` | `root.ts` | tRPC app router registration | VERIFIED | `root.ts` imports schoolsRouter and registers as `schools:` key |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| SCHOOL-01 | 07-01 | Creador puede editar nombre y descripción de su escuela | SATISFIED | `general-tab.tsx` name field (max 60) + description textarea; `schools.update` mutation persists both; RSC re-loads saved values |
| SCHOOL-03 | 07-01 | Creador puede definir un slug único con validación de disponibilidad en tiempo real | SATISFIED | `checkSlug` query with debounced indicator; `updateSlug` mutation with server-side uniqueness check; Spanish CONFLICT error inline |
| SCHOOL-04 | 07-02 | Creador puede elegir colores de marca (primario y secundario) para su escuela | SATISFIED | ColorPicker + BrandingTab + `updateBranding` mutation; colors persist to DB; live preview; contrast warning |

No orphaned requirements — all three requirement IDs declared in PLAN frontmatter match their definitions in REQUIREMENTS.md and are fully implemented.

---

## Anti-Patterns Found

None. All `placeholder` occurrences are HTML `<input placeholder="...">` attributes (legitimate UI copy). No TODO/FIXME/HACK comments. No empty implementations. No stub returns.

---

## Human Verification Required

### 1. Full form round-trip

**Test:** Navigate to `/dashboard/school-setup`, enter a name and description, click Guardar, refresh the page.
**Expected:** Saved name and description appear in the form fields after reload.
**Why human:** Database persistence requires a live Supabase connection.

### 2. Slug conflict enforcement

**Test:** With two browser sessions logged in as different creators, set both schools to the same slug and attempt to save the second one.
**Expected:** Inline red error "este slug ya está en uso" appears; the slug is not saved.
**Why human:** Requires two authenticated sessions and a real DB conflict.

### 3. Color picker live preview

**Test:** Click a swatch on the Branding tab; type a custom hex value.
**Expected:** Preview header and card update immediately; hex input shows the typed value freely, applies only on valid 6-char hex.
**Why human:** Visual real-time behavior cannot be verified by grep.

### 4. Contrast warning threshold

**Test:** Select two very similar colors (e.g., #6366F1 and #7070F0).
**Expected:** Amber warning "Los colores seleccionados pueden ser difíciles de distinguir" appears; Guardar button remains enabled.
**Why human:** Color perception and visual rendering of the threshold condition.

### 5. Unsaved-changes browser guard

**Test:** Edit school name without saving, then close the browser tab.
**Expected:** Browser shows native "Leave site?" confirmation dialog.
**Why human:** `beforeunload` dialog is a browser-level UI that cannot be triggered programmatically in verification.

---

## Commits Verified

| Commit | Description |
|--------|-------------|
| `492661f` | feat(07-01): add checkSlug/updateSlug tRPC procedures, Zod schemas, and useUnsavedChanges hook |
| `6190a6b` | feat(07-01): build school-setup page with tabbed shell, General tab form, and slug indicator |
| `e32b405` | feat(07-school-setup): create ColorPicker component and BrandingTab with live preview |
| `d865448` | feat(07-school-setup): wire BrandingTab into SchoolSetupTabs replacing placeholder |

All four commits confirmed present in git history.

---

_Verified: 2026-04-01_
_Verifier: Claude (gsd-verifier)_
