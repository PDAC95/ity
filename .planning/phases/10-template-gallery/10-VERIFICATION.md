---
phase: 10-template-gallery
verified: 2026-04-08T00:00:00Z
status: passed
score: 7/7 must-haves verified
re_verification: false
---

# Phase 10: Template Gallery — Verification Report

**Phase Goal:** Creator can browse, filter, and preview templates with mobile/desktop toggle.
**Verified:** 2026-04-08
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Gallery renders 3+ templates with thumbnails | VERIFIED | `TEMPLATES` array in registry.ts has 5 templates; page.tsx passes them to TemplateGallery which renders a grid with `<img>` tags per template |
| 2 | Sidebar shows "Mi Pagina Web" as active link to /dashboard/landing/templates | VERIFIED | sidebar.tsx activeItems line 26: `{ href: '/dashboard/landing/templates', label: 'Mi Pagina Web', icon: Globe }` |
| 3 | Filter chips work (show/hide templates by category) | VERIFIED | template-gallery.tsx: `activeFilter` state, `handleFilterChange`, filtered array, AnimatePresence grid, empty state with "Ver todos" |
| 4 | Mobile/desktop preview toggle renders correctly | VERIFIED | template-preview-modal.tsx: `viewport` state, Monitor/Smartphone toggle, mobile branch uses CSS `transform: scale(${mobileScale})` at 375px, desktop uses `w-full h-full` |
| 5 | isAllowedPreviewUrl validates URLs against allowlist and rejects unknown origins | VERIFIED | registry.ts lines 31-33: `ALLOWED_PREVIEW_ORIGINS.some((origin) => url.startsWith(origin))` |
| 6 | CSP frame-src header is set on the templates page | VERIFIED | next.config.js lines 16-29: `async headers()` returns frame-src CSP scoped to `/dashboard/landing/templates` |
| 7 | Creator can select a template and navigate to /dashboard/landing/chat?templateId=X | VERIFIED | template-preview-modal.tsx line 94: `router.push('/dashboard/landing/chat?templateId=${template!.id}')` |

**Score:** 7/7 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `ity/apps/web/lib/templates/registry.ts` | Types, 5 templates, URL allowlist | VERIFIED | 90 lines; exports Template, TemplateCategory, TEMPLATES (5 items), ALLOWED_PREVIEW_ORIGINS, isAllowedPreviewUrl, IFRAME_SANDBOX, CATEGORY_LABELS, ALL_CATEGORIES |
| `ity/apps/web/components/dashboard/sidebar.tsx` | "Mi Pagina Web" active link | VERIFIED | Line 26 confirms href + label; "Dominio" absent from lockedItems |
| `ity/apps/web/next.config.js` | CSP frame-src for templates route | VERIFIED | async headers() present with correct source and Content-Security-Policy header |
| `ity/apps/web/app/(dashboard)/dashboard/landing/templates/page.tsx` | RSC page importing registry | VERIFIED | 10 lines; imports TEMPLATES and TemplateGallery, returns layout wrapper |
| `ity/apps/web/components/landing/template-gallery.tsx` | Filter state, grid, modal orchestration | VERIFIED | 123 lines; activeFilter state, handleFilterChange, filtered array, AnimatePresence grid, empty state, TemplatePreviewModal rendered conditionally |
| `ity/apps/web/components/landing/template-card.tsx` | Card with thumbnail, name, badge | VERIFIED | 36 lines; thumbnail img, name span, category badge, onClick prop, hover scale |
| `ity/apps/web/components/landing/template-preview-modal.tsx` | Fullscreen modal, viewport toggle, nav | VERIFIED | 281 lines; desktop/mobile toggle, prev/next arrows, keyboard nav, loading spinner, error/retry, "Elegir" footer always visible |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| registry.ts | ALLOWED_PREVIEW_ORIGINS | isAllowedPreviewUrl function | VERIFIED | Function at line 31 calls `ALLOWED_PREVIEW_ORIGINS.some(...)` |
| next.config.js | registry.ts origins | Same origins in CSP and allowlist | VERIFIED | Both contain `https://templates.12ity.com` and `https://preview.12ity.com` |
| page.tsx | registry.ts | `import { TEMPLATES } from '@/lib/templates/registry'` | VERIFIED | Line 1 of page.tsx matches pattern exactly |
| template-gallery.tsx | template-preview-modal.tsx | TemplatePreviewModal rendered on selectedIndex state | VERIFIED | Lines 113-120: conditional render when `selectedIndex !== null` |
| template-preview-modal.tsx | /dashboard/landing/chat | router.push with templateId query param | VERIFIED | Line 94: `router.push('/dashboard/landing/chat?templateId=${template!.id}')` |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| TMPL-01 | P02 | Gallery of templates with visual thumbnails | SATISFIED | TemplateCard renders `<img src={template.thumbnailUrl}>` in 2/3-col grid |
| TMPL-02 | P02 | Filter by category | SATISFIED | Filter chips for todos/educacion/fitness/negocio with active state and AnimatePresence transitions |
| TMPL-03 | P02 | Preview in desktop (1280px) and mobile (375px) views | SATISFIED | Modal viewport toggle: desktop=full width iframe, mobile=375px with CSS scale |
| TMPL-04 | P02 | Select a template to start request flow | SATISFIED | "Elegir este template" button routes to `/dashboard/landing/chat?templateId=X` |
| TMPL-05 | P01 | Sidebar "Mi Pagina Web" active section | SATISFIED | sidebar.tsx activeItems includes the link; isActive uses startsWith for prefix matching |
| SEC-01 | P01 | Iframe sandbox attribute | SATISFIED | IFRAME_SANDBOX = 'allow-scripts allow-same-origin'; used on both desktop and mobile iframes in modal |
| SEC-02 | P01 | Template preview URLs validated against server-side allowlist | SATISFIED | isAllowedPreviewUrl called in modal before rendering iframe; next.config.js CSP restricts frame-src |

No orphaned requirements — all 7 IDs claimed in plan frontmatter are accounted for and satisfied.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| template-preview-modal.tsx | 83-85 | `return null` | Info | Safety guard for undefined template after all hooks; not a stub. All implementation code follows. |

No blockers or warnings found. The `return null` is a legitimate TypeScript strict mode guard clause placed after all hooks have run, per the deviation documented in 10-P02-SUMMARY.md.

---

### Human Verification Required

#### 1. Mobile viewport scaling visual correctness

**Test:** Navigate to /dashboard/landing/templates, click any template card, open the preview modal, toggle to mobile view.
**Expected:** The iframe appears as a narrowed column simulating a 375px device, centered within the modal body. Content is visible and scaled down on larger screens.
**Why human:** CSS transform scaling requires visual inspection; cannot verify render dimensions programmatically.

#### 2. Filter chip animation

**Test:** With the gallery open, click "Fitness", then "Educación", then "Todos".
**Expected:** Template cards animate out/in with a 200ms fade+scale using framer-motion AnimatePresence. No layout jump.
**Why human:** Animation quality and smoothness require visual inspection.

#### 3. Sticky filter chips on scroll

**Test:** On a short viewport, scroll down in the gallery.
**Expected:** The filter chips remain pinned below the dashboard header, not scrolling out of view.
**Why human:** `sticky top-0` behavior depends on ancestor overflow context of the dashboard shell; requires browser verification.

#### 4. Prev/next arrow navigation

**Test:** Open the modal, use ChevronLeft/ChevronRight arrows and ArrowLeft/ArrowRight keyboard keys.
**Expected:** Template changes without closing the modal; loading spinner reappears for each template change.
**Why human:** Requires interactive testing of state transitions.

#### 5. Click-outside-to-close

**Test:** Open the modal, click on the dark overlay (not the modal content area).
**Expected:** Modal closes.
**Why human:** Requires verifying `e.stopPropagation()` on the inner div actually prevents overlay close on modal content clicks.

---

### Gaps Summary

No gaps. All 7 must-have truths are verified, all 7 artifacts exist and are substantive, all 5 key links are wired. Requirements TMPL-01 through TMPL-05, SEC-01, and SEC-02 are all satisfied by the implementation.

Commits documented in summaries are confirmed in git history: `5bcebac` (P01 task 1), `1aa8c5a` (P01 task 2), `77ab1f5` (P02 gallery UI).

---

_Verified: 2026-04-08_
_Verifier: Claude (gsd-verifier)_
