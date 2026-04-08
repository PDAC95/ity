---
phase: 10-template-gallery
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - ity/apps/web/lib/templates/registry.ts
  - ity/apps/web/components/dashboard/sidebar.tsx
  - ity/apps/web/next.config.js
autonomous: true
requirements: [TMPL-05, SEC-01, SEC-02]

must_haves:
  truths:
    - "Sidebar shows 'Mi Pagina Web' as an active link pointing to /dashboard/landing/templates"
    - "Template registry exports TEMPLATES array with 5 templates across 3 categories"
    - "isAllowedPreviewUrl validates URLs against allowlist and rejects unknown origins"
    - "CSP frame-src header is set on the templates page for allowed preview origins"
  artifacts:
    - path: "ity/apps/web/lib/templates/registry.ts"
      provides: "Static template data, types, and URL allowlist"
      exports: ["Template", "TemplateCategory", "TEMPLATES", "ALLOWED_PREVIEW_ORIGINS", "isAllowedPreviewUrl"]
    - path: "ity/apps/web/components/dashboard/sidebar.tsx"
      provides: "Sidebar with 'Mi Pagina Web' active link"
      contains: "/dashboard/landing/templates"
    - path: "ity/apps/web/next.config.js"
      provides: "CSP frame-src header for template preview page"
      contains: "frame-src"
  key_links:
    - from: "ity/apps/web/lib/templates/registry.ts"
      to: "ALLOWED_PREVIEW_ORIGINS"
      via: "isAllowedPreviewUrl function"
      pattern: "isAllowedPreviewUrl"
    - from: "ity/apps/web/next.config.js"
      to: "ity/apps/web/lib/templates/registry.ts"
      via: "Same origins must appear in both CSP and allowlist"
      pattern: "templates\\.12ity\\.com"
---

<objective>
Create the template data registry, update the sidebar, and configure CSP security headers.

Purpose: Provides the data foundation (template metadata + URL allowlist) and security layer (CSP frame-src + sandbox constants) that the gallery UI (Plan 02) will consume. Also activates the "Mi Pagina Web" sidebar link.
Output: registry.ts with 5 templates, sidebar with active link, next.config.js with CSP headers.
</objective>

<execution_context>
@C:/Users/patri/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/patri/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/10-template-gallery/10-CONTEXT.md
@.planning/phases/10-template-gallery/10-RESEARCH.md

@ity/apps/web/components/dashboard/sidebar.tsx
@ity/apps/web/next.config.js
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create template registry with types, data, and URL allowlist</name>
  <files>ity/apps/web/lib/templates/registry.ts</files>
  <action>
Create `ity/apps/web/lib/templates/registry.ts` with:

1. **Types:**
   - `TemplateCategory` union: `'educacion' | 'fitness' | 'negocio'`
   - `Template` interface: `{ id: string; name: string; category: TemplateCategory; thumbnailUrl: string; previewUrl: string; description: string }`

2. **Allowlist (SEC-02):**
   - `ALLOWED_PREVIEW_ORIGINS` const array: `['https://templates.12ity.com', 'https://preview.12ity.com']`
   - In development (`process.env.NODE_ENV === 'development'`), also allow `http://localhost:3001`
   - `isAllowedPreviewUrl(url: string): boolean` — returns true if url starts with any allowed origin

3. **Sandbox attribute constant (SEC-01):**
   - `IFRAME_SANDBOX = 'allow-scripts allow-same-origin'` — prevents parent navigation and form submission

4. **Category labels for filter chips:**
   - `CATEGORY_LABELS` map: `{ educacion: 'Educación', fitness: 'Fitness', negocio: 'Negocio' }`
   - `ALL_CATEGORIES: TemplateCategory[] = ['educacion', 'fitness', 'negocio']`

5. **Template data — 5 templates:**
   - `edu-minimal`: name "Educación Minimal", category educacion, thumbnail `/templates/thumbnails/edu-minimal.webp`, previewUrl `https://templates.12ity.com/edu-minimal`
   - `edu-academy`: name "Academia Premium", category educacion, thumbnail `/templates/thumbnails/edu-academy.webp`, previewUrl `https://templates.12ity.com/edu-academy`
   - `fit-energy`: name "Fitness Energy", category fitness, thumbnail `/templates/thumbnails/fit-energy.webp`, previewUrl `https://templates.12ity.com/fit-energy`
   - `fit-wellness`: name "Wellness Studio", category fitness, thumbnail `/templates/thumbnails/fit-wellness.webp`, previewUrl `https://templates.12ity.com/fit-wellness`
   - `biz-professional`: name "Negocio Profesional", category negocio, thumbnail `/templates/thumbnails/biz-professional.webp`, previewUrl `https://templates.12ity.com/biz-professional`

All thumbnails are placeholders — real images will be added later. Use descriptive names so the path convention is clear.

Note: Do NOT use tRPC or DB for templates. This is static data.
  </action>
  <verify>
    <automated>cd ity && npx tsc --noEmit apps/web/lib/templates/registry.ts 2>&1 | head -20</automated>
  </verify>
  <done>registry.ts exports Template type, TEMPLATES array (5 items), ALLOWED_PREVIEW_ORIGINS, isAllowedPreviewUrl, IFRAME_SANDBOX, CATEGORY_LABELS, ALL_CATEGORIES. TypeScript compiles without errors.</done>
</task>

<task type="auto">
  <name>Task 2: Update sidebar and configure CSP headers</name>
  <files>ity/apps/web/components/dashboard/sidebar.tsx, ity/apps/web/next.config.js</files>
  <action>
**Sidebar update (TMPL-05):**

In `ity/apps/web/components/dashboard/sidebar.tsx`:
1. Add `{ href: '/dashboard/landing/templates', label: 'Mi Pagina Web', icon: Globe }` to the `activeItems` array (after 'Mi Perfil')
2. Remove `{ label: 'Dominio', icon: Globe }` from the `lockedItems` array (Globe is now used for the active item; Dominio was a placeholder)
3. `Globe` icon is already imported — no new imports needed

The `isActive` function already handles prefix matching via `pathname.startsWith(href)`, so `/dashboard/landing/templates` will correctly highlight for any sub-route under `/dashboard/landing/`.

**CSP headers (SEC-02 extended):**

In `ity/apps/web/next.config.js`:
1. Add an `async headers()` function to the nextConfig object
2. Return a CSP header for the templates page route:
   - `source: '/dashboard/landing/templates'`
   - Header: `Content-Security-Policy` with value `frame-src 'self' https://templates.12ity.com https://preview.12ity.com;`
3. Keep all existing config (transpilePackages, images) unchanged

The CSP is scoped to the templates page only — not sitewide — to avoid breaking other pages.
  </action>
  <verify>
    <automated>cd ity && npx tsc --noEmit 2>&1 | tail -5 && grep -c "Mi Pagina Web" apps/web/components/dashboard/sidebar.tsx && grep -c "frame-src" apps/web/next.config.js</automated>
  </verify>
  <done>Sidebar shows "Mi Pagina Web" as 4th active item linking to /dashboard/landing/templates. "Dominio" removed from locked items. next.config.js has CSP frame-src header scoped to templates page. TypeScript compiles.</done>
</task>

</tasks>

<verification>
- `npx tsc --noEmit` passes (no type errors)
- `registry.ts` exports 5 templates with valid types
- `sidebar.tsx` contains "Mi Pagina Web" in activeItems with href `/dashboard/landing/templates`
- `sidebar.tsx` no longer has "Dominio" in lockedItems
- `next.config.js` has `headers()` function with `frame-src` for templates page
- `isAllowedPreviewUrl('https://templates.12ity.com/test')` returns true
- `isAllowedPreviewUrl('https://evil.com/test')` returns false
</verification>

<success_criteria>
Template data layer and security configuration are in place. The sidebar navigates to the templates route. CSP restricts iframe sources.
</success_criteria>

<output>
After completion, create `.planning/phases/10-template-gallery/10-P01-SUMMARY.md`
</output>
