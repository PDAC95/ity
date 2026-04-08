# Phase 10: Template Gallery - Research

**Researched:** 2026-04-08
**Domain:** Next.js App Router, static data registry, iframe security, Framer Motion filtering animation
**Confidence:** HIGH

## Summary

Phase 10 is a UI-heavy, zero-backend phase. The template registry is a static TypeScript file (no DB, no tRPC), the gallery page is a new RSC page under `(dashboard)/dashboard/landing/templates/`, and the modal is a client component. The codebase already has framer-motion 12.x installed and used, shadcn/ui patterns via `cn()`, and lucide-react icons — all needed tools are in place.

The two non-trivial technical challenges are: (1) iframe scaling to simulate 375px mobile / 1280px desktop inside a fixed modal, and (2) iframe sandbox + CSP configuration in next.config.js. Both have standard solutions. Navigation between templates with prev/next arrows (without closing modal) is state management only — no library needed.

The sidebar update requires modifying the `lockedItems` array in `sidebar.tsx` to add "Mi Pagina Web" as an active link pointing to `/dashboard/landing/templates`.

**Primary recommendation:** Build registry as `apps/web/lib/templates/registry.ts`, gallery page at `apps/web/app/(dashboard)/dashboard/landing/templates/page.tsx`, modal as a client component `apps/web/components/landing/template-preview-modal.tsx`. Use framer-motion's `AnimatePresence` + `layout` prop for filter animation. Use CSS `transform: scale()` for iframe viewport simulation.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Gallery layout:**
- Grid responsive: 2 columnas en mobile, 3 en desktop
- Página con título + subtítulo (ej: "Elige tu template" + "Personaliza tu página con IA después")
- Título y subtítulo arriba de los chips de filtro

**Template cards:**
- Thumbnail estático (screenshot PNG/WebP), no mini-iframe
- Información en card: thumbnail + nombre + badge de categoría
- Hover: elevación sutil (sombra que crece + ligero scale up ~1.02)
- Click en card abre modal de preview

**Category filtering:**
- Categorías por nicho: Educación, Fitness, Negocio (+ "Todos" como default)
- Selección única — un chip activo a la vez, "Todos" es default
- Chips sticky debajo del header al hacer scroll
- Sin contadores en los chips (solo nombre de categoría)
- Animación fade/layout al filtrar (templates hacen fade out/in, reorganización suave)

**Preview modal:**
- Modal fullscreen con overlay oscuro
- Header del modal: nombre del template + categoría a la izquierda, toggle mobile/desktop al centro, X para cerrar a la derecha
- Toggle con iconos phone/laptop, transición suave al redimensionar iframe
- Default: vista desktop al abrir
- Iframe scrolleable — el creador puede hacer scroll para ver toda la landing
- Navegación entre templates con flechas prev/next sin cerrar el modal
- Cerrar modal: Escape + click fuera del overlay + botón X
- Botón "Elegir este template": primario, sticky fijo al fondo del modal, siempre visible

**Loading states:**
- Galería: skeleton cards pulsantes en el mismo grid layout
- Iframe en modal: área gris con spinner pequeño al centro mientras carga
- Botón "Elegir" visible durante loading del iframe

**Empty/error states:**
- Filtro sin resultados: mensaje amigable "No hay templates en [categoría] aún" + link/botón para ver todos
- Iframe falla: mensaje "No se pudo cargar el preview" + botón "Reintentar", botón "Elegir" sigue disponible

### Claude's Discretion
- Aspect ratio exacto del thumbnail (sugerencia: 16:10 o similar)
- Tipografía y espaciado específico de las cards
- Implementación técnica del iframe scaling para mobile/desktop toggle
- Detalles de la animación de filtrado (duración, easing)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TMPL-01 | Creator can browse a gallery of landing page templates with visual thumbnails | Static registry + grid gallery page with PNG/WebP thumbnails |
| TMPL-02 | Creator can filter templates by category | Client-side JS filter on registry data, chip state, framer-motion AnimatePresence |
| TMPL-03 | Creator can preview template in desktop (1280px) and mobile (375px) views | Iframe with CSS transform: scale() technique, toggle state |
| TMPL-04 | Creator can select a template to start landing page request flow | "Elegir" button navigates to `/dashboard/landing/chat?templateId=X` via next/navigation |
| TMPL-05 | Dashboard sidebar shows "Mi Pagina Web" as active section (replaces placeholder) | Modify sidebar.tsx: move item from lockedItems to activeItems |
| SEC-01 | Template preview iframes use `sandbox` attribute | `sandbox="allow-scripts allow-same-origin"` on iframe element |
| SEC-02 | Template preview URLs validated against server-side allowlist | Allowlist in registry.ts, validated before rendering iframe src |
</phase_requirements>

---

## Standard Stack

### Core (all already installed — no new packages needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| framer-motion | 12.31.0 | Filter animation (AnimatePresence + layout prop) | Already installed in package.json |
| lucide-react | 0.468.0 | Phone/laptop toggle icons, arrows, X button | Already installed |
| next/navigation | 14.2.x | `useRouter` for "Elegir" navigation | Part of Next.js App Router |
| React | 18.3.x | useState for filter, modal, viewport toggle | Already installed |
| cn() from @ity/ui/utils | — | Conditional class merging | Project standard utility |

### No New Packages Required

This phase is fully covered by existing dependencies. framer-motion 12.x is already in `node_modules` (confirmed in glob search). No `npm install` step needed.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| framer-motion AnimatePresence | CSS transition classes | framer-motion already installed, provides layout animation with less code |
| CSS transform: scale() iframe | Real viewport resize | Scale approach is simpler; true resize needs ResizeObserver + complex layout |
| Static registry.ts | tRPC endpoint | Templates are static content — no DB needed, simpler, faster |

---

## Architecture Patterns

### Recommended Project Structure

```
apps/web/
├── lib/
│   └── templates/
│       └── registry.ts            # Static template data + ALLOWED_ORIGINS allowlist
├── app/(dashboard)/dashboard/
│   └── landing/
│       └── templates/
│           └── page.tsx           # RSC: imports registry, renders TemplateGallery
├── components/
│   └── landing/
│       ├── template-gallery.tsx   # 'use client' — grid, filter chips, skeleton, empty state
│       ├── template-card.tsx      # Card with thumbnail, name, category badge, hover effect
│       └── template-preview-modal.tsx  # 'use client' — fullscreen modal, iframe, prev/next
```

### Pattern 1: Static Template Registry

**What:** A plain TypeScript const array with template metadata. No DB, no tRPC.
**When to use:** Content that never changes at runtime and has no per-user variance.

```typescript
// apps/web/lib/templates/registry.ts

export type TemplateCategory = 'educacion' | 'fitness' | 'negocio';

export interface Template {
  id: string;                  // e.g. "edu-minimal"
  name: string;                // e.g. "Educación Minimal"
  category: TemplateCategory;
  thumbnailUrl: string;        // e.g. "/templates/thumbnails/edu-minimal.webp"
  previewUrl: string;          // validated against ALLOWED_PREVIEW_ORIGINS
  description?: string;
}

// SEC-02: server-side allowlist — only these origins can appear in iframe src
export const ALLOWED_PREVIEW_ORIGINS = [
  'https://templates.12ity.com',
  'https://preview.12ity.com',
] as const;

export function isAllowedPreviewUrl(url: string): boolean {
  return ALLOWED_PREVIEW_ORIGINS.some((origin) => url.startsWith(origin));
}

export const TEMPLATES: Template[] = [
  {
    id: 'edu-minimal',
    name: 'Educación Minimal',
    category: 'educacion',
    thumbnailUrl: '/templates/thumbnails/edu-minimal.webp',
    previewUrl: 'https://templates.12ity.com/edu-minimal',
  },
  // 4 more templates...
];
```

**Note on thumbnails:** Place static PNG/WebP files in `apps/web/public/templates/thumbnails/`. Next.js serves `public/` at `/`. Use standard `<img>` or Next.js `<Image>` with a fixed aspect ratio container (recommended: 8/5 = 1.6, close to 16:10).

### Pattern 2: Gallery Page (RSC + Client Component split)

The page is an RSC that imports registry data (static, no async needed) and passes it to a client component:

```typescript
// apps/web/app/(dashboard)/dashboard/landing/templates/page.tsx
import { TEMPLATES } from '@/lib/templates/registry';
import { TemplateGallery } from '@/components/landing/template-gallery';

export default function TemplatesPage() {
  return (
    <div className="py-8 md:py-12">
      <TemplateGallery templates={TEMPLATES} />
    </div>
  );
}
```

The `TemplateGallery` client component holds filter state, modal state, and selected template index. No tRPC calls needed.

### Pattern 3: Category Filter Chips (sticky)

Chips sticky below the header on scroll. Implementation: `position: sticky; top: 0; z-index: 10` on the chip container. Since the main content area scrolls (`.flex-1.overflow-auto` in `dashboard-shell.tsx`), sticky works within the scrolling container without any JavaScript.

```typescript
// Chip container
<div className="sticky top-0 z-10 bg-zinc-950 py-3 -mx-4 px-4 md:-mx-6 md:px-6">
  {/* chip buttons */}
</div>
```

### Pattern 4: Filter Animation with Framer Motion

```typescript
'use client';
import { motion, AnimatePresence } from 'framer-motion';

// Wrap each card in motion.div with layout + AnimatePresence
<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
  <AnimatePresence mode="popLayout">
    {filtered.map((template) => (
      <motion.div
        key={template.id}
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <TemplateCard template={template} onClick={() => openModal(template)} />
      </motion.div>
    ))}
  </AnimatePresence>
</div>
```

**Note:** `mode="popLayout"` is the correct AnimatePresence mode for grid reflows (items exit before layout shifts). `layout` prop on each item enables smooth repositioning.

### Pattern 5: Iframe Scaling for Mobile/Desktop Toggle (SEC-01 + TMPL-03)

CSS `transform: scale()` is the standard approach to simulate viewport widths inside a smaller container. The iframe is rendered at full target width and then scaled down to fit.

```typescript
// Viewport widths
const DESKTOP_WIDTH = 1280;
const MOBILE_WIDTH = 375;

// In render:
const targetWidth = viewport === 'desktop' ? DESKTOP_WIDTH : MOBILE_WIDTH;
const containerWidth = /* measured from ref */;
const scale = containerWidth / targetWidth;

<div
  className="relative overflow-hidden"
  style={{ height: `${iframeHeight * scale}px` }}
  ref={containerRef}
>
  <iframe
    src={validatedUrl}
    sandbox="allow-scripts allow-same-origin"
    style={{
      width: `${targetWidth}px`,
      height: `${iframeHeight}px`,   // e.g. 900px — tall enough for landing preview
      transform: `scale(${scale})`,
      transformOrigin: 'top left',
      border: 'none',
    }}
    onLoad={() => setIframeLoaded(true)}
    onError={() => setIframeError(true)}
  />
</div>
```

**Claude's discretion area:** The planner should use `iframeHeight = 900` (fixed tall height). The outer container height adjusts via `height * scale` so the scaled iframe fills the space exactly. This avoids needing ResizeObserver for a fixed preview context.

**Note on scrollability:** The user decision says "iframe scrolleable". This means the iframe itself should scroll internally. Do NOT set `overflow: hidden` on the iframe — only on the scaling wrapper. The scaling wrapper shows the scaled-down full page. The scaled iframe is a miniature view; scrolling happens inside it at the target resolution.

**Revised approach for scrollable preview:** Since the user wants the creator to be able to scroll the preview, a better UX is:
- Desktop: iframe at `width: 100%` (fills modal), no scaling, scrolls natively
- Mobile: iframe at `width: 375px`, centered/scaled to fit modal width
- This avoids the complexity of scale + scroll simultaneously

The planner should choose the simpler approach: for desktop use natural width, for mobile simulate with `transform: scale()`. This is Claude's discretion territory.

### Pattern 6: Modal Keyboard + Click-Outside Close

```typescript
// Escape key
useEffect(() => {
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };
  document.addEventListener('keydown', onKey);
  return () => document.removeEventListener('keydown', onKey);
}, [onClose]);

// Click outside: overlay div with onClick, modal content with e.stopPropagation()
<div
  className="fixed inset-0 bg-black/80 z-50 flex flex-col"
  onClick={onClose}
>
  <div onClick={(e) => e.stopPropagation()}>
    {/* modal content */}
  </div>
</div>
```

### Pattern 7: Prev/Next Navigation Without Closing Modal

State: `selectedIndex: number` (index into the filtered array). Prev/next mutates index. When filter changes, reset to index 0 if current template is no longer in filtered list.

```typescript
const [selectedIndex, setSelectedIndex] = useState(0);
const currentTemplate = filteredTemplates[selectedIndex];

const goPrev = () => setSelectedIndex((i) => Math.max(0, i - 1));
const goNext = () => setSelectedIndex((i) => Math.min(filteredTemplates.length - 1, i + 1));
```

### Pattern 8: Sidebar Update (TMPL-05)

In `apps/web/components/dashboard/sidebar.tsx`, move "Mi Pagina Web" from `lockedItems` to `activeItems`:

```typescript
const activeItems = [
  { href: '/dashboard', label: 'Inicio', icon: Home },
  { href: '/dashboard/school-setup', label: 'Configurar Escuela', icon: GraduationCap },
  { href: '/dashboard/profile', label: 'Mi Perfil', icon: User },
  { href: '/dashboard/landing/templates', label: 'Mi Pagina Web', icon: Globe },  // ADD
];

// lockedItems: remove 'Dominio' entry (now active) and keep others locked
```

**Note:** `Globe` icon is already imported in sidebar.tsx. No new icon import needed.

### Pattern 9: SEC-02 — URL Allowlist Validation

The allowlist lives in `registry.ts`. Before setting `iframe.src`, validate with `isAllowedPreviewUrl()`. Since templates come from the static registry (not user input), this is a defense-in-depth measure. The validation happens at render time in the modal component:

```typescript
const safeUrl = isAllowedPreviewUrl(template.previewUrl) ? template.previewUrl : null;
// If safeUrl is null, show error state instead of iframe
```

### Pattern 10: CSP frame-src (SEC-02 extended)

`next.config.js` needs a `Content-Security-Policy` header with `frame-src` directive for the template preview origins. Existing `next.config.js` has no CSP headers — this phase adds them.

```javascript
// apps/web/next.config.js
const nextConfig = {
  // ... existing config ...
  async headers() {
    return [
      {
        source: '/dashboard/landing/templates',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-src 'self' https://templates.12ity.com https://preview.12ity.com;",
          },
        ],
      },
    ];
  },
};
```

**Important:** The CSP applies to the page that embeds the iframe (the templates page), not to the iframe itself. Adding it only to `/dashboard/landing/templates` (not sitewide) avoids breaking other pages.

**Note on development/placeholder templates:** During Phase 10, real hosted template URLs may not exist yet. Use placeholder URLs (e.g., `about:blank` or a static HTML page) for the 3-5 initial templates. The allowlist and CSP should still be configured correctly. The planner should add `localhost:3000` or similar to the allowlist for dev testing only (or use a simple public page URL).

### Anti-Patterns to Avoid

- **Don't use a tRPC query for templates.** Templates are static data. A tRPC call adds latency and complexity for content that never changes at runtime.
- **Don't use `<iframe>` without `sandbox`.** Without sandbox, the iframe can navigate the parent window or submit forms.
- **Don't put `transformOrigin` incorrectly.** Always use `top left` for scale-from-corner so the iframe aligns with the container.
- **Don't use `overflow: hidden` on the modal body when iframe should scroll.** The scroll must work inside the iframe.
- **Don't close the modal when changing filter.** Modal state and filter state are independent; filter changes update the available templates list but don't close the modal (though navigating to a template not in filtered list needs handling).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Smooth layout reflow animation | Custom CSS transitions with JS layout tracking | `framer-motion layout` prop | Handles FLIP animation internally; CSS-only approach breaks with dynamic grid |
| Keyboard event cleanup | Manual event listener management without cleanup | `useEffect` with return cleanup | Memory leaks without cleanup |
| Conditional class merging | String concatenation | `cn()` from `@ity/ui/utils` | Project standard, avoids Tailwind conflicts |

---

## Common Pitfalls

### Pitfall 1: Iframe `sandbox` Too Restrictive
**What goes wrong:** `sandbox=""` (empty) blocks all JS including scripts needed for the template to render.
**Why it happens:** Assuming "secure = empty sandbox".
**How to avoid:** Use `sandbox="allow-scripts allow-same-origin"`. This allows scripts but prevents parent navigation (`allow-top-navigation` NOT included) and form submissions (`allow-forms` NOT included).
**Warning signs:** Blank iframe, console errors about blocked content.

### Pitfall 2: Sticky Chips Not Working
**What goes wrong:** `position: sticky` has no effect.
**Why it happens:** Sticky requires a scrolling ancestor with defined height. The dashboard shell's `<main className="flex-1 overflow-auto">` IS the scroll container — sticky works correctly within it.
**How to avoid:** Confirm the chip container is a direct descendant of the scrolling main element. Do NOT set `overflow: hidden` on any ancestor between the chip container and the scroll container.

### Pitfall 3: framer-motion `AnimatePresence` Mode
**What goes wrong:** Items flash or overlap during filter transitions.
**Why it happens:** Default `mode="sync"` causes exit and enter animations to overlap.
**How to avoid:** Use `mode="popLayout"` — exits complete before new items enter and grid reflows.

### Pitfall 4: iframe Scale + Container Height Mismatch
**What goes wrong:** Modal shows empty space below scaled iframe, or iframe overflows container.
**Why it happens:** Container height not adjusted for scale factor.
**How to avoid:** Set container `height = iframe_height * scale`. The iframe renders at full height; the container clips exactly to the scaled visual size.

### Pitfall 5: Prev/Next Index Out of Bounds After Filter Change
**What goes wrong:** After changing filter, `filteredTemplates[selectedIndex]` is undefined.
**Why it happens:** selectedIndex from previous filter is larger than new filtered array length.
**How to avoid:** When filter changes, check if selectedIndex >= filteredTemplates.length and reset to 0. Do this in `useEffect` watching `activeFilter`.

### Pitfall 6: `useRouter` Navigation to Chat Page
**What goes wrong:** Navigation works but templateId is missing from chat page in Phase 11.
**Why it happens:** Passing templateId as query param requires correct URL construction.
**How to avoid:** Use `router.push(`/dashboard/landing/chat?templateId=${template.id}`)`. The chat page (Phase 11) will read this via `useSearchParams()`.

---

## Code Examples

### Skeleton Card (matches grid layout)

```typescript
// In template-gallery.tsx during initial render (if needed)
function SkeletonCard() {
  return (
    <div className="rounded-lg overflow-hidden bg-zinc-800 animate-pulse">
      <div className="aspect-[8/5] bg-zinc-700" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-zinc-700 rounded w-3/4" />
        <div className="h-3 bg-zinc-700 rounded w-1/3" />
      </div>
    </div>
  );
}
```

Note: Since templates are static (no async), the gallery renders immediately. Skeleton is only needed if thumbnails load slowly — can use CSS lazy loading (`loading="lazy"` on `<img>`). The skeleton pattern is simpler to provide via a conditional render when `templates.length === 0` on initial mount.

### "Todos" / Active Filter Chip

```typescript
const CATEGORIES = ['Todos', 'Educación', 'Fitness', 'Negocio'] as const;

// Active chip: indigo background
// Inactive chip: zinc-800 background, hover:zinc-700
<button
  className={cn(
    'px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
    activeFilter === cat
      ? 'bg-indigo-600 text-white'
      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
  )}
>
  {cat}
</button>
```

### Template Card Hover

```typescript
// Uses Tailwind group + shadow + scale transition
<div className="group cursor-pointer rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 transition-all duration-200 hover:shadow-lg hover:shadow-black/30 hover:scale-[1.02]">
  <div className="aspect-[8/5] overflow-hidden">
    <img
      src={template.thumbnailUrl}
      alt={template.name}
      className="w-full h-full object-cover"
      loading="lazy"
    />
  </div>
  <div className="p-3 flex items-center justify-between">
    <span className="text-sm font-medium text-zinc-100">{template.name}</span>
    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-900/60 text-indigo-300">
      {template.category}
    </span>
  </div>
</div>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Client-only filter with useState | Same — no server action needed for static data | N/A | Templates are static; no change |
| iframe srcdoc for preview | External URL with sandbox | Best practice for real template URLs | Real hosted templates, not inline HTML |
| next/headers for CSP | next.config.js headers() function | Next.js 12+ | Simpler, no middleware needed for static routes |

---

## Open Questions

1. **Real template URLs for initial 3-5 templates**
   - What we know: Templates need `previewUrl` pointing to real hosted landing pages
   - What's unclear: Whether `https://templates.12ity.com` exists or needs to be set up
   - Recommendation: Use placeholder URLs (e.g., public static page or `about:blank`) for Phase 10; real URLs are a deployment concern. The allowlist and sandbox are already in place for when real URLs exist. Add a `localhost:3001` or similar for dev testing.

2. **Thumbnail images for 3-5 templates**
   - What we know: Thumbnails are static PNG/WebP in `public/templates/thumbnails/`
   - What's unclear: Whether real screenshots exist or need to be created
   - Recommendation: Use placeholder images (`/templates/thumbnails/placeholder.webp`) or a simple colored rectangle via a data URL. The image infrastructure (Next.js Image, public dir) is ready.

3. **CSP in development vs production**
   - What we know: CSP frame-src blocks origins not in the allowlist
   - What's unclear: Development testing will need localhost or a real URL in the allowlist
   - Recommendation: Conditionally add `http://localhost:*` to frame-src allowlist when `NODE_ENV === 'development'`. The planner should include this in the next.config.js task.

---

## Validation Architecture

> Skipped — `workflow.nyquist_validation` is not present in `.planning/config.json` (no `nyquist_validation` key found). Treating as disabled.

---

## Sources

### Primary (HIGH confidence)
- Codebase direct read — `sidebar.tsx`, `dashboard-shell.tsx`, `schema.ts`, `next.config.js`, `STACK.md`, `CONVENTIONS.md`, `STRUCTURE.md`
- Phase 10 CONTEXT.md — locked user decisions
- REQUIREMENTS.md — requirement definitions for TMPL-01 through SEC-02

### Secondary (MEDIUM confidence)
- framer-motion AnimatePresence `mode="popLayout"` — confirmed present in framer-motion 12.x (version verified in STACK.md)
- CSS `transform: scale()` iframe technique — well-established browser pattern, no library dependency

### Tertiary (LOW confidence)
- CSP `frame-src` syntax — standard HTTP header spec, but exact Next.js `headers()` return format should be verified against Next.js 14.2 docs if any doubt arises during implementation

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries confirmed present in codebase
- Architecture: HIGH — based on direct codebase read of existing patterns
- Pitfalls: HIGH — derived from codebase structure and standard browser security behaviors
- Iframe scaling technique: MEDIUM — CSS approach well-known but exact values (height, scale math) are Claude's discretion

**Research date:** 2026-04-08
**Valid until:** 2026-05-08 (stable stack, 30 days)
