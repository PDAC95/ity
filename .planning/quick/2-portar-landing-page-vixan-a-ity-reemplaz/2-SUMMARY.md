---
phase: quick-2
plan: 01
subsystem: landing-page
tags: [landing, vixan, gsap, scss, swiper, bootstrap]
dependency-graph:
  requires: []
  provides: [vixan-landing-page, gsap-animations, scoped-scss]
  affects: [app/page.tsx, next.config.js]
tech-stack:
  added: [gsap, sass, swiper, bootstrap, jquery, wowjs, react-countup, react-intersection-observer]
  patterns: [dynamic-import-ssr-false, scoped-scss, umd-plugin-require]
key-files:
  created:
    - ity/apps/web/app/page.tsx
    - ity/apps/web/components/landing/vixan/LandingPage.tsx
    - ity/apps/web/components/landing/vixan/Wrapper.tsx
    - ity/apps/web/components/landing/vixan/HeaderOne.tsx
    - ity/apps/web/components/landing/vixan/FooterOne.tsx
    - ity/apps/web/components/landing/vixan/HeroHomeOne.tsx
    - ity/apps/web/components/landing/vixan/plugins/index.ts
    - ity/apps/web/styles/landing.scss
  modified:
    - ity/apps/web/package.json
    - ity/pnpm-lock.yaml
decisions:
  - "gsap installed from npm (core), premium plugins loaded via require() from public/assets/plugins/"
  - "SCSS imported flat (not nested under .vixan-landing) — route-level isolation via dynamic import sufficient"
  - "Regular <img> tags used instead of next/image — preserves GSAP data-* animation attributes"
  - "Google Fonts loaded via <link> in LandingPage component, not root layout"
metrics:
  duration: 36min
  completed: 2026-04-09
---

# Quick Task 2: Port Vixan Landing Page to ITY Summary

Port Vixan Digital Creative Agency Next.js template as ITY's landing page with GSAP animations, Swiper sliders, and all content adapted for online school platform messaging in Spanish.

## What Was Done

### Task 1: Copy Vixan assets, install dependencies, create scoped SCSS entry (789ffbc)
- Copied 152 images, 7 GSAP plugin JS files, SCSS directory, CSS plugins, fonts from Vixan template to `public/assets/`
- Installed 9 new npm dependencies: sass, swiper, bootstrap, jquery, wowjs, react-countup, react-intersection-observer, @popperjs/core, @types/jquery
- Created `styles/landing.scss` as the scoped SCSS entry point importing swiper CSS, bootstrap, fontawesome, lightgallery, and Vixan's main SCSS

### Task 2: Create all landing page components adapted for ITY (cc44f7a)
- Created 24 files across plugins, utils, common, layout, and section components
- Ported all GSAP animation utilities (animationTitle, buttonAnimation, scrollSmother)
- Created Wrapper with ScrollSmoother, ScrollTrigger, SplitText registration
- Created HeaderOne + MobileMenu with ITY nav: Inicio, Funciones, Casos de Exito, Testimonios, Iniciar Sesion
- Created FooterOne with ITY branding and links to /auth/login, /auth/register
- Created 11 section components with ITY-adapted Spanish content:
  - Hero: "Crea tu Escuela Online con tu Propia Marca"
  - Marquee: "Cursos Online * Marca Propia * Pagos Directos * Sin Comisiones * IA Asistente"
  - Services: 6 platform features (Creador de Cursos, Gestion de Alumnos, Marca Personalizada, Pagos Directos, Analytics, Asistente IA)
  - Portfolio: Creator success stories by category
  - Awards: Platform advantages (Configuracion en Minutos, Crece Sin Limites, 0% Comisiones)
  - Testimonials: Creator testimonials in Spanish
  - FunFact: 500+ Creators, 10K Students, 2K Courses, 15+ Countries
  - Video, Subscribe (CTA to /auth/register), Brand logos

### Task 3: Wire app/page.tsx, fix GSAP imports, verify build (edd4a5e)
- Created `app/page.tsx` with `dynamic(() => import(...), { ssr: false })` for client-only landing
- Installed gsap from npm for core GSAP functionality
- Fixed `plugins/index.ts` to use `require()` for UMD premium plugins (ScrollSmoother, SplitText, etc.)
- Build passes: all routes compile including `/` (148 kB static page)
- Dashboard `/a/*` and auth `/auth/*` routes unaffected

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] GSAP plugins import resolution**
- **Found during:** Task 3 (build)
- **Issue:** Original template used `export { default as X } from '../../public/assets/plugins/...'` but GSAP plugin files are UMD modules (not ES modules), so `export default` doesn't work
- **Fix:** Installed gsap from npm for core module, changed plugins/index.ts to use `require()` for UMD premium plugins and extract from `window` globals
- **Files modified:** plugins/index.ts, package.json
- **Commit:** edd4a5e

**2. [Rule 3 - Blocking] Pre-existing drizzle-orm type error**
- **Found during:** Task 3 (build attempt 1)
- **Issue:** `packages/api/src/routers/auth.ts` imports `eq` from `drizzle-orm` but type resolution failed
- **Fix:** Re-ran `pnpm install` at monorepo root to fix dependency resolution
- **Files modified:** None (dependency resolution only)
- **Commit:** N/A (fixed by pnpm install)

## Decisions Made

1. **gsap from npm + UMD plugins via require()**: The Vixan template shipped custom GSAP premium plugins as UMD bundles in `public/assets/plugins/`. Core gsap installed from npm, premium plugins loaded via `require()` which registers them on `window`.
2. **Flat SCSS import (no .vixan-landing nesting)**: Landing styles imported flat in `landing.scss`. Route-level isolation via `dynamic import with ssr:false` ensures these styles only load on the landing page.
3. **Regular `<img>` tags**: Used instead of `next/image` to preserve GSAP `data-*` animation attributes that drive parallax and scroll effects.
4. **Google Fonts via `<link>` in component**: Inter Tight + Kanit fonts loaded inside LandingPage.tsx to avoid affecting dashboard/auth pages.

## Self-Check: PASSED

All key files verified present. All 3 task commits verified in git history.
