---
phase: 10-template-gallery
plan: 02
subsystem: ui
tags: [next.js, react, framer-motion, iframe, templates, gallery]

# Dependency graph
requires:
  - phase: 10-template-gallery
    plan: 01
    provides: Template registry (TEMPLATES, types, URL allowlist, sandbox constant, category labels)
provides:
  - Template gallery page at /dashboard/landing/templates
  - Responsive grid with category filter chips and framer-motion animations
  - Fullscreen preview modal with desktop/mobile viewport toggle
  - Template selection routing to /dashboard/landing/chat?templateId=X
affects: [phase-11 chat wizard (receives templateId query param)]
---

## What shipped

### key-files
created:
  - ity/apps/web/app/(dashboard)/dashboard/landing/templates/page.tsx
  - ity/apps/web/components/landing/template-gallery.tsx
  - ity/apps/web/components/landing/template-card.tsx
  - ity/apps/web/components/landing/template-preview-modal.tsx

### Details

1. **Template Card** — Card component with thumbnail, name, category badge, hover scale+shadow effects
2. **Template Gallery** — Client component with sticky filter chips (Todos/Educación/Fitness/Negocio), responsive grid (2-col mobile, 3-col desktop), framer-motion AnimatePresence for filter transitions, empty state with "Ver todos" link
3. **Preview Modal** — Fullscreen overlay with:
   - Desktop/mobile viewport toggle (mobile simulates 375px with CSS scale)
   - Prev/next arrow navigation between templates
   - Keyboard shortcuts (Escape, ArrowLeft, ArrowRight)
   - Loading spinner and error/retry states
   - "Elegir este template" sticky footer button → routes to `/dashboard/landing/chat?templateId=X`
   - Iframe sandboxed with `allow-scripts allow-same-origin`
4. **Gallery Page** — RSC page importing TEMPLATES from registry and rendering TemplateGallery

### Deviations
- Added early return guard for undefined template (TS strict mode required it) — hooks called unconditionally before the guard

## Self-Check: PASSED
- [x] TypeScript compiles with zero errors (`pnpm turbo type-check --filter=@ity/web`)
- [x] All 4 files created
- [x] Gallery page at correct route
- [x] Filter chips use CATEGORY_LABELS from registry
- [x] Modal uses IFRAME_SANDBOX and isAllowedPreviewUrl from registry
- [x] "Elegir" button routes to /dashboard/landing/chat?templateId=X
