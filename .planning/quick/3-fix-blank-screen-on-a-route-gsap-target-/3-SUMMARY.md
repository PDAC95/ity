---
phase: quick-3
plan: 01
subsystem: landing-page
tags: [css-scoping, scss, landing-page, dashboard, bug-fix]
dependency_graph:
  requires: [quick-2]
  provides: [scoped-landing-css]
  affects: [ity/apps/web/styles/landing.scss, ity/apps/web/public/assets/sass/default/_color_variable.scss, ity/apps/web/public/assets/sass/default/_typography.scss]
tech_stack:
  added: []
  patterns: [scss-nesting-scope, css-variable-scoping, vixan-landing-wrapper]
key_files:
  modified:
    - ity/apps/web/styles/landing.scss
    - ity/apps/web/public/assets/sass/default/_color_variable.scss
    - ity/apps/web/public/assets/sass/default/_typography.scss
decisions:
  - Nested @import inside .vixan-landing { } block in landing.scss — Dart Sass 1.99 supports @import nesting (deprecated but functional), verified with production build
  - :root replaced with & so CSS variables scope to .vixan-landing element, not document root
  - .dark becomes &.dark so dark theme only activates when .dark is on the .vixan-landing wrapper
metrics:
  duration: ~5min
  completed: 2026-04-14
  tasks: 2
  files_modified: 3
---

# Quick Task 3: Fix Blank Screen on /a Route — CSS Scoping Summary

**One-liner:** Scoped all Vixan landing page CSS under `.vixan-landing` class by nesting `@import` in landing.scss and replacing bare `:root`/`html,body` selectors with `&` in Vixan SCSS source files.

## What Was Done

The `/a` dashboard route was rendering with a blank white screen because Next.js bundles all client component CSS globally. The landing page SCSS imported by `LandingPage.tsx` included `background-color: white` on `html, body` and CSS custom properties on `:root`, which overrode the dashboard's dark theme.

### Fix Strategy

1. Wrapped all `@import` statements in `landing.scss` inside a `.vixan-landing { }` block — SCSS nesting causes every selector from every imported file to be prefixed with `.vixan-landing`
2. Changed `_color_variable.scss`: `:root { }` → `& { }` and `.dark { }` → `&.dark { }` so CSS variables are scoped to the wrapper element, not the document root
3. Changed `_typography.scss`: `html, body { }` → `& { }` in both the base block and the `@media (max-width: 991px)` block

The `<div className="vixan-landing">` wrapper already existed in `LandingPage.tsx` from quick task 2.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Scope landing.scss — wrap all imports inside .vixan-landing block | 4a2b6ef | ity/apps/web/styles/landing.scss |
| 2 | Fix :root and html/body selectors in Vixan SCSS | 46f2c48 | _color_variable.scss, _typography.scss |

## Verification

- `npx next build` passes with zero errors (Dart Sass 1.99 supports `@import` inside nested rules)
- No bare `html`, `body`, or `:root` selectors remain in the Vixan SCSS source files
- `.vixan-landing` wrapper confirmed present in `landing.scss`
- `style.css` in the sass directory is a compiled artifact only (not imported), its bare selectors are irrelevant

## Deviations from Plan

None — plan executed exactly as written. The primary approach (nested `@import`) worked on first attempt with Dart Sass 1.99. No fallback to individual file selector modification was needed.

## Self-Check: PASSED

- `ity/apps/web/styles/landing.scss` — FOUND, contains `.vixan-landing` wrapper
- `ity/apps/web/public/assets/sass/default/_color_variable.scss` — FOUND, uses `& { }` instead of `:root { }`
- `ity/apps/web/public/assets/sass/default/_typography.scss` — FOUND, uses `& { }` instead of `html, body { }`
- Commit 4a2b6ef — FOUND
- Commit 46f2c48 — FOUND
- `npx next build` — PASSED (22/22 pages generated)
