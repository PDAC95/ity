---
phase: quick-3
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - ity/apps/web/styles/landing.scss
  - ity/apps/web/public/assets/sass/default/_color_variable.scss
  - ity/apps/web/public/assets/sass/default/_typography.scss
autonomous: true
requirements:
  - QUICK-3-blank-screen-fix
must_haves:
  truths:
    - "/a dashboard route renders without a blank white screen"
    - "Landing page at / still renders with correct styles"
    - "No global CSS overrides bleed from landing into dashboard routes"
  artifacts:
    - path: "ity/apps/web/styles/landing.scss"
      provides: "Scoped landing CSS wrapper"
      contains: ".vixan-landing"
    - path: "ity/apps/web/public/assets/sass/default/_typography.scss"
      provides: "Scoped typography — no bare html/body selectors"
    - path: "ity/apps/web/public/assets/sass/default/_color_variable.scss"
      provides: "Scoped CSS variables — no bare :root override"
  key_links:
    - from: "styles/landing.scss"
      to: ".vixan-landing wrapper in LandingPage.tsx"
      via: "SCSS nesting scopes all imports under .vixan-landing"
      pattern: "\\.vixan-landing"
    - from: "_typography.scss html,body"
      to: ".vixan-landing scope"
      via: "& selector replaces html, body inside nested context"
      pattern: "^\\s*&\\s*\\{"
---

<objective>
Scope all landing page CSS under the `.vixan-landing` class so it cannot bleed into other Next.js routes.

Purpose: In Next.js, CSS imported by any client component is globally bundled. The landing page imports bootstrap resets and typography that sets `background-color: white` on `html, body`, making the dark dashboard at `/a` render with white background and invisible text.

Output: Three modified SCSS files where all landing selectors are contained within `.vixan-landing { }` — no global `html`, `body`, or `:root` side-effects.
</objective>

<execution_context>
@C:/Users/patri/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/patri/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@C:/dev/12ity/ity/apps/web/.planning/ROADMAP.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Scope landing.scss — wrap all imports inside .vixan-landing block</name>
  <files>ity/apps/web/styles/landing.scss</files>
  <action>
Rewrite `styles/landing.scss` so every import is nested inside a `.vixan-landing { }` block:

```scss
// Landing page styles — scoped to .vixan-landing wrapper
// Next.js bundles all client component CSS globally, so we scope here
// to prevent landing styles from bleeding into dashboard routes (/a, etc.)

.vixan-landing {
  @import "swiper/css/bundle";
  @import "../public/assets/css/plugins/bootstrap.min.css";
  @import "../public/assets/css/plugins/fontawesome.min.css";
  @import "../public/assets/css/plugins/lightgallery.min.css";
  @import "../public/assets/sass/style.scss";
}
```

This is the primary fix — SCSS nesting means every selector from every imported file gets prefixed with `.vixan-landing`, including the problematic `html, body` and `:root` declarations in the Vixan sass files.

Note: SCSS/sass nesting of `@import` is standard behavior — all selectors within the imported files become children of `.vixan-landing`. The `html, body` rule in `_typography.scss` will become `.vixan-landing html, .vixan-landing body` which only applies inside the wrapper. The `:root` in `_color_variable.scss` will become `.vixan-landing :root` — BUT `:root` inside a non-root selector does not work as expected; handle this in Task 2.
  </action>
  <verify>File saved; confirm it compiles: `cd C:/dev/12ity && npx turbo run build --filter=web 2>&1 | tail -30` OR just check for no import errors in dev mode</verify>
  <done>landing.scss wraps all @import lines inside a single `.vixan-landing { }` block</done>
</task>

<task type="auto">
  <name>Task 2: Fix :root and html/body selectors in Vixan SCSS — use & nesting</name>
  <files>
    ity/apps/web/public/assets/sass/default/_color_variable.scss
    ity/apps/web/public/assets/sass/default/_typography.scss
  </files>
  <action>
**`_color_variable.scss`** — The `:root { }` block defines CSS custom properties. When nested inside `.vixan-landing`, `:root` won't behave as expected because `:root` is the document root, not a nestable selector. Convert the `:root` block to use `&` (which will resolve to `.vixan-landing`) and move the SCSS `$variable` declarations above it (they are compile-time, not affected by scope):

Replace:
```scss
:root {
    --body-font-family: "Kanit", sans-serif;
    ...
    --drak-color: #ffffff;
}

.dark {
    --drak-color: #181818;
    ...
}
```

With:
```scss
& {
    --body-font-family: "Kanit", sans-serif;
    --heading-font-family: "Inter Tight", sans-serif;
    --accent-color: #ff6b00;
    --body-color: #454545;
    --heading-color: #101010;
    --primary-color: #101010;
    --cr_banner-color: #f4f4f4;
    --border-color: #c1c1c1;
    --common-color-white: #ffffff;
    --common-color-black: #000000;
    --drak-color: #ffffff;
}

&.dark {
    --drak-color: #181818;
    --cr_banner-color: #181818;
    --accent-color: #ff6b00;
    --body-color: #e0e0e0;
    --heading-color: #ffffff;
    --primary-color: #ffffff;
    --common-color-white: #000000;
    --common-color-black: #ffffff;
}
```

This means CSS vars are defined on `.vixan-landing` element itself, scoping them correctly.

**`_typography.scss`** — Change the bare `html, body { }` blocks to `& { }` so they scope to `.vixan-landing`:

Replace the top block:
```scss
html,
body {
    color: var(--body-color);
    background-color: var(--drak-color);
    ...
}
```
With:
```scss
& {
    color: var(--body-color);
    background-color: var(--drak-color);
    font-family: var(--body-font-family);
    font-size: 18px;
    font-weight: 400;
    line-height: 1.6em;
    overflow-x: hidden;
    scroll-behavior: smooth;
}
```

Replace the `@media screen and (max-width: 991px)` block's inner `body, html` selector:
```scss
@media screen and (max-width: 991px) {
    body,
    html {
        font-size: 16px;
        line-height: 1.6em;
    }
    ...
}
```
With:
```scss
@media screen and (max-width: 991px) {
    & {
        font-size: 16px;
        line-height: 1.6em;
    }
    ...
}
```

Leave all other selectors (`h1-h6`, `p`, `ul`, `a`, `img`, etc.) as-is — they are already relative selectors that will be correctly prefixed by SCSS nesting.
  </action>
  <verify>
After saving both files, start dev server and visit both routes:
1. `http://localhost:3000/a` — dashboard should be visible (dark background, light text, NOT a white blank screen)
2. `http://localhost:3000/` or `http://localhost:3000` — landing page should render with correct Vixan styles (fonts, colors, sections)
  </verify>
  <done>
- `/a` shows dashboard content with dark theme intact
- `/` shows Vixan landing page with correct typography, colors, and layout
- No "GSAP target not found" errors related to CSS (GSAP errors are separate — if they persist after this fix, they are likely just timing warnings, not the cause of the blank screen)
- No global `html`, `body`, or `:root` selectors remain in the Vixan SCSS files
  </done>
</task>

</tasks>

<verification>
After both tasks complete:

```bash
# Check no bare html/body/:root remain in vixan sass
grep -n "^html\|^body\|^:root" C:/dev/12ity/ity/apps/web/public/assets/sass/default/_typography.scss C:/dev/12ity/ity/apps/web/public/assets/sass/default/_color_variable.scss

# Confirm landing.scss uses .vixan-landing wrapper
grep -n "vixan-landing" C:/dev/12ity/ity/apps/web/styles/landing.scss
```

Both commands should return no bare selectors and confirm the wrapper is present.
</verification>

<success_criteria>
- `/a` route renders the dashboard (no blank white screen)
- `/` landing page renders with all Vixan styles intact
- Zero global style bleed from landing into other routes
- All SCSS compiles without errors
</success_criteria>

<output>
After completion, create `.planning/quick/3-fix-blank-screen-on-a-route-gsap-target-/3-SUMMARY.md`
</output>
