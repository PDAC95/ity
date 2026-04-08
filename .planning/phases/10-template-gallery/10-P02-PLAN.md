---
phase: 10-template-gallery
plan: 02
type: execute
wave: 2
depends_on: [10-P01]
files_modified:
  - ity/apps/web/app/(dashboard)/dashboard/landing/templates/page.tsx
  - ity/apps/web/components/landing/template-gallery.tsx
  - ity/apps/web/components/landing/template-card.tsx
  - ity/apps/web/components/landing/template-preview-modal.tsx
autonomous: true
requirements: [TMPL-01, TMPL-02, TMPL-03, TMPL-04]

must_haves:
  truths:
    - "Creator sees a grid of template cards with thumbnails, names, and category badges"
    - "Creator can filter templates by category using chips (Todos/Educación/Fitness/Negocio)"
    - "Creator can open a fullscreen modal with desktop/mobile preview toggle via iframe"
    - "Creator can navigate between templates with prev/next arrows without closing modal"
    - "Creator can select a template and navigate to /dashboard/landing/chat?templateId=X"
    - "Filter chips are sticky below header on scroll"
    - "Empty filter state shows friendly message with link to view all"
  artifacts:
    - path: "ity/apps/web/app/(dashboard)/dashboard/landing/templates/page.tsx"
      provides: "RSC page that imports registry and renders TemplateGallery"
      min_lines: 10
    - path: "ity/apps/web/components/landing/template-gallery.tsx"
      provides: "Client component with filter state, modal state, grid, chips, skeleton, empty state"
      min_lines: 80
    - path: "ity/apps/web/components/landing/template-card.tsx"
      provides: "Card component with thumbnail, name, category badge, hover effects"
      min_lines: 25
    - path: "ity/apps/web/components/landing/template-preview-modal.tsx"
      provides: "Fullscreen modal with iframe preview, mobile/desktop toggle, prev/next, choose button"
      min_lines: 100
  key_links:
    - from: "ity/apps/web/app/(dashboard)/dashboard/landing/templates/page.tsx"
      to: "ity/apps/web/lib/templates/registry.ts"
      via: "import { TEMPLATES } from '@/lib/templates/registry'"
      pattern: "import.*TEMPLATES.*registry"
    - from: "ity/apps/web/components/landing/template-gallery.tsx"
      to: "ity/apps/web/components/landing/template-preview-modal.tsx"
      via: "TemplatePreviewModal rendered conditionally on selectedIndex state"
      pattern: "TemplatePreviewModal"
    - from: "ity/apps/web/components/landing/template-preview-modal.tsx"
      to: "/dashboard/landing/chat"
      via: "router.push with templateId query param"
      pattern: "dashboard/landing/chat\\?templateId"
---

<objective>
Build the template gallery page with filter chips, animated grid, template cards, and fullscreen preview modal with mobile/desktop toggle.

Purpose: This is the primary creator-facing UI for browsing and selecting landing page templates. It connects the static registry (Plan 01) to the chat wizard (Phase 11) via template selection.
Output: Working gallery page at /dashboard/landing/templates with filter, preview, and selection flow.
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
@.planning/phases/10-template-gallery/10-P01-SUMMARY.md

@ity/apps/web/lib/templates/registry.ts
@ity/apps/web/app/(dashboard)/dashboard-shell.tsx

<interfaces>
<!-- From registry.ts (created in Plan 01) -->
export type TemplateCategory = 'educacion' | 'fitness' | 'negocio';

export interface Template {
  id: string;
  name: string;
  category: TemplateCategory;
  thumbnailUrl: string;
  previewUrl: string;
  description: string;
}

export const ALLOWED_PREVIEW_ORIGINS: string[];
export function isAllowedPreviewUrl(url: string): boolean;
export const IFRAME_SANDBOX: string; // 'allow-scripts allow-same-origin'
export const CATEGORY_LABELS: Record<TemplateCategory, string>;
export const ALL_CATEGORIES: TemplateCategory[];
export const TEMPLATES: Template[];
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create template card and gallery page with filter chips</name>
  <files>
    ity/apps/web/app/(dashboard)/dashboard/landing/templates/page.tsx,
    ity/apps/web/components/landing/template-gallery.tsx,
    ity/apps/web/components/landing/template-card.tsx
  </files>
  <action>
**1. Template Card (`ity/apps/web/components/landing/template-card.tsx`):**

No 'use client' needed (used inside client parent). Props: `{ template: Template; onClick: () => void }`.

- Outer div: `group cursor-pointer rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 transition-all duration-200 hover:shadow-lg hover:shadow-black/30 hover:scale-[1.02]`
- Thumbnail container: `aspect-[8/5] overflow-hidden bg-zinc-800`
- `<img>` with `src={template.thumbnailUrl}`, `alt={template.name}`, `loading="lazy"`, `className="w-full h-full object-cover"`
- Below thumbnail: `p-3 flex items-center justify-between`
  - Name: `text-sm font-medium text-zinc-100`
  - Category badge: `text-xs px-2 py-0.5 rounded-full bg-indigo-900/60 text-indigo-300` — display `CATEGORY_LABELS[template.category]`
- On click: calls `onClick` prop (opens modal in parent)

**2. Template Gallery (`ity/apps/web/components/landing/template-gallery.tsx`):**

'use client'. Props: `{ templates: Template[] }`. Import from `framer-motion`: `motion`, `AnimatePresence`.

State:
- `activeFilter: TemplateCategory | 'todos'` — default `'todos'`
- `selectedIndex: number | null` — default `null` (modal closed when null)

Filtering logic:
- `const filtered = activeFilter === 'todos' ? templates : templates.filter(t => t.category === activeFilter)`
- When `activeFilter` changes, if `selectedIndex !== null` and `selectedIndex >= filtered.length`, reset `selectedIndex` to 0

Layout (all user decisions from CONTEXT.md):

a) **Title section:**
   - `<h1>` "Elige tu template" — `text-2xl font-bold text-zinc-100`
   - `<p>` "Personaliza tu página con IA después" — `text-zinc-400 mt-1`

b) **Filter chips (sticky):**
   - Container: `sticky top-0 z-10 bg-zinc-950 py-3 -mx-4 px-4 md:-mx-6 md:px-6 mt-4`
   - Horizontal scroll on mobile: `flex gap-2 overflow-x-auto scrollbar-hide`
   - Chips: "Todos" + ALL_CATEGORIES mapped through CATEGORY_LABELS
   - Active chip: `bg-indigo-600 text-white`
   - Inactive chip: `bg-zinc-800 text-zinc-300 hover:bg-zinc-700`
   - All chips: `px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors`

c) **Grid with animation:**
   - Container: `grid grid-cols-2 md:grid-cols-3 gap-4 mt-6`
   - Wrap each card in `<motion.div>` with: `key={template.id}`, `layout`, `initial={{ opacity: 0, scale: 0.95 }}`, `animate={{ opacity: 1, scale: 1 }}`, `exit={{ opacity: 0, scale: 0.95 }}`, `transition={{ duration: 0.2, ease: 'easeOut' }}`
   - Wrap all motion.divs in `<AnimatePresence mode="popLayout">`

d) **Empty state (filter has no results):**
   - Centered message: "No hay templates en {CATEGORY_LABELS[activeFilter]} aún"
   - Button/link: "Ver todos" — sets activeFilter to 'todos'

e) **Modal rendering:**
   - When `selectedIndex !== null`: render `<TemplatePreviewModal>` with props:
     - `templates={filtered}`
     - `selectedIndex={selectedIndex}`
     - `onChangeIndex={(i) => setSelectedIndex(i)}`
     - `onClose={() => setSelectedIndex(null)}`

Card onClick: `setSelectedIndex(filtered.indexOf(template))` — or use the map index directly.

**3. Gallery Page (`ity/apps/web/app/(dashboard)/dashboard/landing/templates/page.tsx`):**

RSC (no 'use client'). Simple page:
```
import { TEMPLATES } from '@/lib/templates/registry';
import { TemplateGallery } from '@/components/landing/template-gallery';

export default function TemplatesPage() {
  return (
    <div className="py-8 px-4 md:px-6">
      <TemplateGallery templates={TEMPLATES} />
    </div>
  );
}
```

Use `cn()` from `@ity/ui/utils` for conditional classes throughout.
  </action>
  <verify>
    <automated>cd ity && npx tsc --noEmit 2>&1 | tail -10</automated>
  </verify>
  <done>Gallery page renders at /dashboard/landing/templates. Grid shows 2 columns on mobile, 3 on desktop. Filter chips are sticky and filter templates with fade animation. Empty state shows friendly message. Clicking a card sets selectedIndex (modal integration in Task 2).</done>
</task>

<task type="auto">
  <name>Task 2: Create fullscreen preview modal with viewport toggle and template selection</name>
  <files>ity/apps/web/components/landing/template-preview-modal.tsx</files>
  <action>
Create `ity/apps/web/components/landing/template-preview-modal.tsx` — 'use client'.

Props:
```typescript
interface TemplatePreviewModalProps {
  templates: Template[];
  selectedIndex: number;
  onChangeIndex: (index: number) => void;
  onClose: () => void;
}
```

Import `useRouter` from `next/navigation`, `isAllowedPreviewUrl` and `IFRAME_SANDBOX` and `CATEGORY_LABELS` from `@/lib/templates/registry`, icons from `lucide-react`: `X`, `Monitor`, `Smartphone`, `ChevronLeft`, `ChevronRight`.

**State:**
- `viewport: 'desktop' | 'mobile'` — default `'desktop'` (per user decision)
- `iframeLoaded: boolean` — default `false`, reset to false when template or viewport changes
- `iframeError: boolean` — default `false`, reset to false when template changes

Derived:
- `const template = templates[selectedIndex]`
- `const safeUrl = isAllowedPreviewUrl(template.previewUrl) ? template.previewUrl : null`
- `const hasPrev = selectedIndex > 0`
- `const hasNext = selectedIndex < templates.length - 1`

**Layout (all from CONTEXT.md locked decisions):**

a) **Overlay:** `fixed inset-0 bg-black/80 z-50 flex flex-col` — onClick calls `onClose`
b) **Modal content:** `flex flex-col h-full` — onClick `e.stopPropagation()` to prevent overlay close

c) **Header bar:**
   - Left: template name (`text-lg font-semibold text-zinc-100`) + category badge (same style as card)
   - Center: viewport toggle — two icon buttons (Monitor / Smartphone), active has `bg-zinc-700 text-white`, inactive has `text-zinc-400 hover:text-zinc-200`. Wrap in `flex items-center gap-1 bg-zinc-800 rounded-lg p-1`
   - Right: X button to close — `text-zinc-400 hover:text-zinc-100`
   - Header container: `flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950`

d) **Iframe area (main body, flex-1):**
   - Container: `relative flex-1 overflow-hidden bg-zinc-900 flex items-start justify-center`
   - For **desktop** viewport: iframe with `width: 100%`, `height: 100%`, no scaling, scrolls natively within the flex-1 container
   - For **mobile** viewport: use `useRef` + `useEffect` with `ResizeObserver` (or measure once on mount) to get container width. Calculate `scale = containerWidth / 375` but cap at `scale = 1` (don't upscale). Iframe at `width: 375px`, `height: 100%` of container / scale. Wrapper div: `overflow: hidden`, height = `container height`. The iframe uses `transform: scale(${scale})` + `transformOrigin: top left`.
   - All iframes: `sandbox={IFRAME_SANDBOX}` (SEC-01), `onLoad` sets iframeLoaded=true, `onError` sets iframeError=true
   - If `safeUrl` is null: show error state instead of iframe

e) **Loading state (inside iframe area):**
   - When `!iframeLoaded && !iframeError`: absolute overlay with `bg-zinc-900 flex items-center justify-center`
   - Small spinner (animated `border-2 border-zinc-600 border-t-indigo-500 rounded-full w-8 h-8 animate-spin`)

f) **Error state:**
   - "No se pudo cargar el preview" message
   - "Reintentar" button that resets iframeError and iframeLoaded to false (forces iframe remount by changing key)
   - Note: "Elegir" button remains available below even during error

g) **Prev/Next arrows:**
   - Left arrow: `absolute left-2 top-1/2 -translate-y-1/2` — `ChevronLeft` icon, visible only if `hasPrev`, onClick calls `onChangeIndex(selectedIndex - 1)`. Reset iframe states on navigation.
   - Right arrow: same on right side with `ChevronRight`, visible only if `hasNext`
   - Style: `bg-zinc-800/80 hover:bg-zinc-700 rounded-full p-2 text-zinc-300`

h) **"Elegir este template" button (sticky footer):**
   - Container: `px-4 py-3 border-t border-zinc-800 bg-zinc-950`
   - Button: `w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-lg transition-colors`
   - Text: "Elegir este template"
   - onClick: `router.push(\`/dashboard/landing/chat?templateId=${template.id}\`)`
   - This button is ALWAYS visible, even during loading or error states (user decision)

i) **Keyboard handling:**
   - `useEffect` with `keydown` listener: Escape → onClose, ArrowLeft → goPrev (if hasPrev), ArrowRight → goNext (if hasNext)
   - Cleanup listener on unmount

**Reset logic:**
- When `selectedIndex` changes: reset `iframeLoaded` to false, `iframeError` to false
- When `viewport` changes: reset `iframeLoaded` to false (iframe reloads due to dimension change)

Use `cn()` from `@ity/ui/utils` for all conditional classes.
  </action>
  <verify>
    <automated>cd ity && npx tsc --noEmit 2>&1 | tail -10</automated>
  </verify>
  <done>Preview modal opens fullscreen with dark overlay. Desktop view shows iframe at full width. Mobile view scales iframe to 375px simulation. Viewport toggle switches with smooth transition. Prev/next arrows navigate templates. Escape/click-outside closes modal. "Elegir este template" navigates to /dashboard/landing/chat?templateId=X. Loading spinner shows while iframe loads. Error state shows retry option. All iframes have sandbox attribute.</done>
</task>

</tasks>

<verification>
- `npx tsc --noEmit` passes with zero errors
- Gallery page accessible at /dashboard/landing/templates
- Grid displays 2 columns on mobile (< 768px), 3 columns on desktop
- Category filter chips filter templates correctly (single selection, "Todos" as default)
- Chips are sticky below header on scroll
- Filter animation: cards fade out/in with layout shift (framer-motion)
- Empty filter state shows "No hay templates en [categoría] aún" + "Ver todos" link
- Clicking a card opens fullscreen modal
- Modal header shows template name + category + viewport toggle + close button
- Desktop/mobile toggle changes iframe dimensions
- Prev/next arrows navigate without closing modal
- Escape key closes modal
- Click outside modal (on overlay) closes modal
- "Elegir este template" button is always visible (sticky footer)
- Clicking "Elegir" navigates to /dashboard/landing/chat?templateId={id}
- Iframe loading shows spinner
- Iframe error shows retry message + "Elegir" still available
- All iframes have `sandbox="allow-scripts allow-same-origin"`
</verification>

<success_criteria>
Creator can browse the template gallery, filter by category, preview templates in desktop and mobile viewports, navigate between templates in the modal, and select a template to proceed to the chat wizard.
</success_criteria>

<output>
After completion, create `.planning/phases/10-template-gallery/10-P02-SUMMARY.md`
</output>
