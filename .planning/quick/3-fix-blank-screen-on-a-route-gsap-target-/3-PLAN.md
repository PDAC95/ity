---
phase: quick-3
title: "Fix blank screen on /a route — scope landing CSS"
status: planned
tasks: 2
---

# Quick Task 3: Fix blank screen on /a route

## Problem

The landing page (`/`) imports `@/styles/landing.scss` which includes bootstrap and Vixan typography styles with global `html, body` and `:root` selectors. Next.js bundles ALL client-component CSS into a single global stylesheet, so these styles leak into the dashboard at `/a`, overriding `bg-zinc-950` with `background-color: #ffffff` and making light text invisible.

## Solution

Scope all landing CSS under the `.vixan-landing` wrapper class (already exists in `LandingPage.tsx`).

---

## Task 1: Wrap landing.scss imports in .vixan-landing scope

**Files:**
- `ity/apps/web/styles/landing.scss`

**Action:**
Wrap all `@import` statements inside a `.vixan-landing { ... }` SCSS nesting block:

```scss
.vixan-landing {
  @import "swiper/css/bundle";
  @import "../public/assets/css/plugins/bootstrap.min.css";
  @import "../public/assets/css/plugins/fontawesome.min.css";
  @import "../public/assets/css/plugins/lightgallery.min.css";
  @import "../public/assets/sass/style.scss";
}
```

**Verify:** Build succeeds, no SCSS compilation errors.
**Done:** All landing CSS imports are nested under `.vixan-landing`.

---

## Task 2: Fix global selectors in Vixan SASS files

**Files:**
- `ity/apps/web/public/assets/sass/default/_color_variable.scss`
- `ity/apps/web/public/assets/sass/default/_typography.scss`
- Any other files with bare `html`, `body`, `:root` selectors

**Action:**
1. In `_color_variable.scss`: Change `:root { ... }` to `& { ... }` (will resolve to `.vixan-landing`)
2. In `_typography.scss`: Change `html, body { ... }` to `& { ... }`
3. In `_typography.scss`: Change any other bare element selectors that should be scoped
4. Scan for other files with global selectors and fix them

**Verify:** `/a` dashboard renders correctly (dark bg, visible text). Landing page at `/` still renders correctly.
**Done:** No global selectors leak outside `.vixan-landing` scope.
