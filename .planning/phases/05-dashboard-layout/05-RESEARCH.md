# Phase 5: Dashboard Layout - Research

**Researched:** 2026-03-31
**Domain:** Next.js 14 App Router dashboard layout, Tailwind CSS dark mode, React client components
**Confidence:** HIGH

## Summary

The project already has a working dashboard scaffold (sidebar, header, mobile-nav, dashboard-shell, layout). All existing components are light-mode, component-state-driven (no animation library used for mobile nav), and use placeholder nav items (`Schools`, `Settings`, `Help`) that don't match the v1.1 navigation spec. Phase 5 is a **full redesign** of these existing files, not a greenfield build.

The tech stack is Next.js 14 App Router with Tailwind CSS (dark mode via `darkMode: ['class']`), `lucide-react` for icons, `framer-motion` is already installed (available for sidebar animations), and `zustand` is available for state. The `@ity/db` schema gives us `creators` (name, avatarUrl, email) and `schools` (name, slug, branding.logo) — both needed in the layout. There is no `bio` column yet on `creators` (noted as future).

The onboarding checklist is purely client-side state derived from data: it checks whether the creator has a school (query schools table), has an avatar (creators.avatarUrl), has a display name (creators.name non-default), and whether school has a logo (branding.logo). No new DB columns or tRPC procedures are needed for the checklist itself — data is already queryable. The layout's RSC (`layout.tsx`) already fetches the creator from Supabase; it can be extended to also fetch the first school for the sidebar school name display.

**Primary recommendation:** Rewrite existing dashboard components to dark zinc design, add locked nav items with lock icons, add onboarding checklist to dashboard page, and extend the RSC layout to pass school data down. Use `framer-motion` for sidebar slide animation and `AnimatePresence` for overlay fade.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Sidebar:**
- Fondo oscuro (zinc-900/950), íconos + texto, contraste con contenido principal — estilo Linear/Vercel
- Ancho: 240px en desktop
- Parte superior: logo de 12ity + nombre de la escuela del creador
- Links activos arriba, línea divisoria, links bloqueados abajo (lista plana con separador)
- Secciones bloqueadas (Cursos, Alumnos, Métricas, Equipo, Dominio): visibles pero atenuadas con opacidad reducida y candado pequeño. Al clic → "Próximamente"
- Link activo: fondo highlight (zinc-800) + barra vertical de color acento a la izquierda
- Parte inferior: mini perfil del creador (avatar pequeño + nombre) + botón cerrar sesión

**Header:**
- Lado izquierdo: título de sección actual (simple, sin breadcrumb jerárquico)
- Lado derecho: display name del creador + avatar
- Header sticky (fijo al hacer scroll)
- Borde inferior sutil (border-b border-zinc-800) para separar del contenido
- Clic en avatar/nombre: dropdown con opciones (Mi Perfil, Cerrar sesión)
- Avatar fallback: iniciales del nombre con color generado (estilo Slack/Linear)

**Fondo del contenido principal:**
- Fondo oscuro pero más claro que el sidebar (zinc-950 o neutral-900 vs zinc-900 del sidebar)
- Todo el dashboard es dark mode

**Checklist de onboarding:**
- Card prominente con checkboxes, barra de progreso arriba, y links a cada sección
- Solo pasos de fases existentes: cuenta creada, nombre de escuela, logo de escuela, completar perfil
- No incluir pasos futuros bloqueados en el checklist
- Cuando se completan todos los pasos: mensaje de celebración breve ("¡Tu escuela está lista!"), luego el checklist desaparece
- Home del dashboard = solo el checklist por ahora. Cuando se complete, estado vacío limpio

**Comportamiento móvil:**
- Breakpoint: 768px (md de Tailwind). Debajo de md → sidebar oculto, hamburguesa visible
- Sidebar móvil: overlay desde la izquierda con fondo oscuro detrás
- Animación slide suave (~200-300ms), overlay se desvanece
- Se cierra con: tap en overlay, tap en un link, o swipe hacia la izquierda
- Header móvil: hamburguesa a la izquierda, título de sección centrado, solo avatar (sin nombre) a la derecha
- Checklist en móvil: full width, misma estructura que desktop adaptada al espacio

### Claude's Discretion
- Acciones rápidas en el header (notificaciones, buscar) — decidir si agregar algo o dejarlo limpio
- Espaciado exacto y tipografía
- Diseño del skeleton de carga
- Animaciones de micro-interacción del sidebar
- Implementación exacta del gesto swipe

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DASH-01 | Creador ve sidebar con navegación a todas las secciones del dashboard | Existing `sidebar.tsx` is rewritten: active links (School Setup, Mi Perfil) + locked placeholders (Cursos, Alumnos, Métricas, Equipo, Dominio) |
| DASH-02 | Creador ve header con su nombre y avatar | Existing `header.tsx` already passes userName/userEmail; extend to show avatar from `creators.avatarUrl` fetched in RSC layout |
| DASH-03 | Dashboard es responsive — sidebar colapsable en móvil con menú hamburguesa | Existing `mobile-nav.tsx` + `DashboardShell` state management extended with framer-motion slide animation |
| DASH-04 | Dashboard home muestra checklist de onboarding con pasos pendientes | New `OnboardingChecklist` client component in dashboard page; reads creator + school data passed from RSC |
| DASH-05 | Secciones futuras muestran placeholder "Próximamente" | New route groups or a single catch-all page under `/dashboard/coming-soon` with locked nav items pointing to it |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | ^14.2.0 | RSC layout, routing, page components | Already in use |
| Tailwind CSS | ^3.4.0 | Utility-first styling, dark zinc palette | Already in use |
| lucide-react | ^0.468.0 | Icons (Home, Lock, User, LogOut, Menu, X, Check, etc.) | Already in use |
| framer-motion | ^12.31.0 | Sidebar slide + overlay fade animation | Already installed, not yet used in dashboard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zustand | ^5.0.0 | Mobile nav open state (if crossing RSC boundary) | Alternative to useState in DashboardShell — already installed |
| sonner | ^2.0.7 | Toast for "Próximamente" notification | Already in use for other toasts |
| clsx + tailwind-merge | ^2.1.0 / ^2.5.0 | Conditional class composition | Already in use via `@ity/ui` cn() |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| framer-motion slide | CSS transitions only | Simpler but swipe detection requires JS anyway; framer-motion already installed |
| Toast for "Próximamente" | Inline modal/alert | Toast is less disruptive; Sonner already in place |
| useState in DashboardShell | Zustand store | useState is simpler for local toggle; zustand unnecessary unless cross-component needed |

**Installation:** No new packages needed — all dependencies already installed.

---

## Architecture Patterns

### Current File Structure (to be modified)
```
apps/web/
├── app/
│   ├── (dashboard)/
│   │   ├── layout.tsx              # RSC — auth guard + creator fetch (EXTEND: add school fetch)
│   │   ├── dashboard-shell.tsx     # 'use client' — mobile nav state (REWRITE: dark theme)
│   │   └── dashboard/
│   │       └── page.tsx            # RSC — dashboard home (REWRITE: onboarding checklist)
├── components/
│   └── dashboard/
│       ├── sidebar.tsx             # 'use client' (REWRITE: dark zinc, locked items)
│       ├── header.tsx              # 'use client' (REWRITE: dark theme, section title)
│       └── mobile-nav.tsx          # 'use client' (REWRITE: dark theme + framer-motion)
```

### New Files to Add
```
apps/web/
├── app/
│   └── (dashboard)/
│       └── coming-soon/
│           └── page.tsx            # "Próximamente" page for locked nav items
├── components/
│   └── dashboard/
│       └── onboarding-checklist.tsx  # Client component for checklist card
```

### Pattern 1: RSC Layout Extending Creator Data to Shell
**What:** The RSC layout fetches creator + first school, passes both as props to DashboardShell.
**When to use:** Data needed across sidebar (school name) and header (creator name, avatar).

```typescript
// app/(dashboard)/layout.tsx (extended pattern)
const [creator, school] = await Promise.all([
  supabase.from('creators').select('id, name, avatar_url').eq('id', user.id).single(),
  supabase.from('schools').select('id, name, branding').eq('creator_id', user.id)
    .order('created_at').limit(1).single()
]);

return (
  <DashboardShell
    creator={creator.data}
    school={school.data ?? null}
  >
    {children}
  </DashboardShell>
);
```

### Pattern 2: Locked Nav Items with "Próximamente" Route
**What:** Locked sidebar items link to `/dashboard/coming-soon` (or use `onClick` with Sonner toast). A dedicated page avoids broken URL states and is crawlable.
**When to use:** When the locked sections have no route yet.

```typescript
// sidebar.tsx — locked item render
const lockedItems = [
  { label: 'Cursos', icon: BookOpen, href: '/dashboard/coming-soon' },
  { label: 'Alumnos', icon: Users, href: '/dashboard/coming-soon' },
  // ...
];

// Render with opacity + lock icon
<Link href={item.href} className="flex items-center gap-3 px-3 py-2 opacity-40 cursor-default">
  <Lock className="h-3.5 w-3.5 text-zinc-500" />
  <span>{item.label}</span>
</Link>
```

**Alternative:** Use `onClick` with `e.preventDefault()` + `toast('Próximamente')`. Simpler, no extra route needed. Recommended: dedicated `/dashboard/coming-soon` page for DASH-05 (cleaner, no broken URL, shows message in-content area).

### Pattern 3: Avatar Fallback with Deterministic Color
**What:** Generate a background color from the creator's name to make initials avatars distinct across users (Slack/Linear style).
**When to use:** When `creator.avatarUrl` is null.

```typescript
// deterministic color from string
function getAvatarColor(name: string): string {
  const colors = [
    'bg-violet-600', 'bg-blue-600', 'bg-emerald-600',
    'bg-orange-600', 'bg-pink-600', 'bg-indigo-600',
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}
```

### Pattern 4: Section Title in Header from Pathname
**What:** Header reads `usePathname()` and maps it to a human-readable section title.
**When to use:** Header is a client component already, usePathname() is free.

```typescript
const SECTION_TITLES: Record<string, string> = {
  '/dashboard': 'Inicio',
  '/dashboard/school-setup': 'Configuración de Escuela',
  '/dashboard/profile': 'Mi Perfil',
  '/dashboard/coming-soon': 'Próximamente',
};
const title = SECTION_TITLES[pathname] ?? 'Dashboard';
```

### Pattern 5: Onboarding Checklist State from Props
**What:** Dashboard page (RSC) fetches creator + school and passes to `OnboardingChecklist` (client). The client computes which steps are done. No separate tRPC call needed.
**When to use:** All needed data already fetched in layout RSC — pass down as props.

Checklist steps (only v1.1-available steps):
1. Cuenta creada — always `true` (user is authenticated)
2. Nombre de escuela — `true` if `school?.name` exists
3. Logo de escuela — `true` if `school?.branding?.logo` is not null/undefined
4. Completar perfil — `true` if `creator?.avatarUrl` is not null/undefined

### Pattern 6: Framer Motion Sidebar Animation
**What:** `AnimatePresence` + `motion.div` for mobile sidebar slide + overlay fade.
**When to use:** Mobile nav overlay (below md breakpoint).

```typescript
// mobile-nav.tsx
import { motion, AnimatePresence } from 'framer-motion';

<AnimatePresence>
  {open && (
    <>
      <motion.div
        key="overlay"
        className="fixed inset-0 z-40 bg-black/60 md:hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />
      <motion.aside
        key="sidebar"
        className="fixed inset-y-0 left-0 z-50 w-60 bg-zinc-900 md:hidden"
        initial={{ x: '-100%' }}
        animate={{ x: 0 }}
        exit={{ x: '-100%' }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
      >
        {/* nav content */}
      </motion.aside>
    </>
  )}
</AnimatePresence>
```

Note: Removing the `if (!open) return null` pattern from the current `mobile-nav.tsx` is required for `AnimatePresence` exit animations to work.

### Anti-Patterns to Avoid
- **Fetching creator data twice:** Layout RSC already fetches the user. Don't call `supabase.auth.getUser()` again in the dashboard page — pass creator data down as props.
- **Using `display: none` instead of conditional render for mobile sidebar:** With framer-motion, always let `AnimatePresence` handle mount/unmount for exit animations.
- **Hardcoding dark classes without dark mode class:** Tailwind is configured as `darkMode: ['class']`. The dashboard must have `class="dark"` on the root element or a wrapping div. Current `<html>` has no `dark` class. Simplest fix: add `dark` to the dashboard layout's wrapping div rather than the `<html>`, or use hardcoded `zinc-*` classes directly (no `dark:` prefix needed since dashboard is always dark).
- **Swipe implementation with touch events on the motion.div:** Framer Motion has a `drag` + `dragConstraints` API; don't hand-roll `touchstart/touchend` listeners.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Slide + fade animation | CSS keyframes + JS class toggle | `framer-motion` AnimatePresence | Exit animations require tracking unmount state |
| Dropdown dismiss on outside click | `document.addEventListener('click')` | Existing pattern in `header.tsx` (fixed overlay div trick) is fine | Already proven in codebase |
| Avatar color generation | Complex hash function | Simple `charCodeAt(0) % colors.length` (see Pattern 3) | Sufficient for deterministic visual distinction |
| Swipe to close | Raw touch events | `framer-motion` `onDragEnd` with velocity check | Handles edge cases, cancels on insufficient swipe distance |

---

## Common Pitfalls

### Pitfall 1: Dark Mode — Class vs Media
**What goes wrong:** Dashboard looks unstyled or all-white because `dark:` Tailwind variants require `.dark` class ancestor.
**Why it happens:** `tailwind.config.ts` uses `darkMode: ['class']`, not `'media'`. The `<html>` tag has no `dark` class currently.
**How to avoid:** Either add `className="dark"` to the `<html>` in the root `layout.tsx` (affects entire app — may conflict with auth pages), OR use raw zinc/neutral classes (`bg-zinc-900`, `text-zinc-100`) without `dark:` prefix in dashboard components — since dashboard is always dark, no conditional needed.
**Recommended approach:** Use direct zinc classes without `dark:` prefix in all dashboard components. Auth pages keep their light styles. No conflict.

### Pitfall 2: AnimatePresence Requires Children to Change Keys
**What goes wrong:** Exit animation doesn't play — component just disappears.
**Why it happens:** AnimatePresence needs the `key` prop on direct motion children, and the `open` boolean must toggle the child's presence in JSX (not just `display: none`).
**How to avoid:** Pattern 6 above shows correct structure. Remove `if (!open) return null` anti-pattern from current `mobile-nav.tsx`.

### Pitfall 3: Layout Fetching School but No School Exists Yet
**What goes wrong:** `supabase.from('schools').select(...).single()` throws an error when the creator has no school yet (new user).
**Why it happens:** Supabase `.single()` throws PGRST116 if 0 rows found.
**How to avoid:** Use `.maybeSingle()` instead of `.single()`, or handle the null case explicitly. Pass `school: null` to shell and checklist — checklist shows "Nombre de escuela" as unchecked.

### Pitfall 4: Section Title Mismatch on New Routes
**What goes wrong:** Header shows "Dashboard" for unknown paths as routes are added in later phases.
**Why it happens:** The SECTION_TITLES map is statically defined.
**How to avoid:** Use a fallback gracefully. Document the pattern so future phases add their route title to the map. Or derive title from last path segment as a fallback.

### Pitfall 5: Onboarding Checklist Not Disappearing After Completion
**What goes wrong:** User completes all steps but checklist stays or flashes on every load.
**Why it happens:** Checklist visibility is computed from live DB data — once all steps are done, `allComplete` is always `true`.
**How to avoid:** When `allComplete === true`, show the celebration message ("¡Tu escuela está lista!") for 2-3 seconds then render null (use `useState` + `useEffect` with a timer), or simply show a persistent "completed" empty state. The celebration-then-disappear UX requires `setTimeout` + local state — document this clearly so the plan allocates a task for it.

---

## Code Examples

### Dark Dashboard Shell Structure
```typescript
// dashboard-shell.tsx — always dark, no dark: prefix needed
export function DashboardShell({ creator, school, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="flex h-screen bg-zinc-950">
      {/* Desktop sidebar — hidden on mobile */}
      <aside className="hidden md:flex w-60 flex-shrink-0 flex-col bg-zinc-900">
        <SidebarContent creator={creator} school={school} onClose={() => {}} />
      </aside>
      {/* Mobile nav overlay */}
      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)}
                 creator={creator} school={school} />
      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header creator={creator} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
```

### Active Link with Left Accent Bar
```typescript
// Active state: left border + zinc-800 bg
<Link
  href={item.href}
  className={cn(
    'relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-zinc-800 text-zinc-100 before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-0.5 before:rounded-full before:bg-primary'
      : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
  )}
>
```

### Onboarding Checklist Component Shape
```typescript
// components/dashboard/onboarding-checklist.tsx
'use client';
interface ChecklistProps {
  hasSchool: boolean;
  hasSchoolLogo: boolean;
  hasAvatar: boolean;
}

const steps = [
  { id: 'account', label: 'Cuenta creada', alwaysDone: true },
  { id: 'school', label: 'Nombre de escuela', href: '/dashboard/school-setup' },
  { id: 'logo', label: 'Logo de escuela', href: '/dashboard/school-setup' },
  { id: 'profile', label: 'Completar perfil', href: '/dashboard/profile' },
];
```

### Supabase Layout — Safe School Fetch
```typescript
// layout.tsx
const { data: school } = await supabase
  .from('schools')
  .select('id, name, branding')
  .eq('creator_id', user.id)
  .order('created_at', { ascending: true })
  .limit(1)
  .maybeSingle();  // returns null if no school, no error
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| `if (!open) return null` for mobile nav | `AnimatePresence` + conditional JSX | Exit animations work correctly |
| Light mode dashboard (current codebase) | Dark zinc classes directly (no `dark:` prefix) | Always dark, no class toggle needed |
| `bg-blue-50 text-blue-700` active links | `bg-zinc-800` + left border accent | Linear/Vercel dark aesthetic |

---

## Open Questions

1. **Route paths for School Setup and My Profile**
   - What we know: Phase 6 will be "School Logo Upload" (likely `/dashboard/school-setup`) and Phase 8 will be "Creator Profile" (likely `/dashboard/profile`). These routes don't exist yet.
   - What's unclear: Exact slugs not confirmed yet in planning.
   - Recommendation: Use placeholder hrefs (`/dashboard/school-setup`, `/dashboard/profile`) in sidebar nav now. They'll 404 until those phases are built — but that's acceptable since sidebar is built ahead of those routes.

2. **Should locked nav items be `<button>` or `<Link>`**
   - What we know: CONTEXT says "Al clic → Próximamente". Both approaches work.
   - Recommendation: Use `<Link href="/dashboard/coming-soon">` — gives a real URL, avoids accessibility issues with non-interactive-looking elements, and creates a proper page for DASH-05.

3. **Logo display in sidebar top section**
   - What we know: Sidebar top shows "logo de 12ity + nombre de la escuela del creador". The 12ity logo is presumably a text wordmark or SVG — no logo asset found in codebase yet.
   - Recommendation: Use text "12ity" styled as wordmark for now, same as current "ITY" in existing sidebar. School name below it from `school?.name ?? 'Mi Escuela'`.

---

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection — `sidebar.tsx`, `header.tsx`, `mobile-nav.tsx`, `dashboard-shell.tsx`, `layout.tsx`, `dashboard/page.tsx`, `schema.ts` — current implementation state confirmed
- `package.json` — framer-motion ^12.31.0 confirmed installed, tailwindcss-animate confirmed, lucide-react confirmed
- `tailwind.config.ts` — `darkMode: ['class']` confirmed, zinc colors available via default palette
- `globals.css` — CSS variables for light/dark confirmed; dashboard will bypass these with direct zinc classes

### Secondary (MEDIUM confidence)
- Framer Motion AnimatePresence pattern — standard documented API, consistent across v10+/v12
- Supabase `.maybeSingle()` vs `.single()` — known behavior from Supabase JS v2 docs

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages confirmed in package.json
- Architecture: HIGH — based on existing code structure and confirmed patterns
- Pitfalls: HIGH — dark mode class requirement verified in tailwind.config.ts, AnimatePresence behavior is well-documented

**Research date:** 2026-03-31
**Valid until:** 2026-05-01 (stable stack — Next.js 14, framer-motion v12, Tailwind v3 are stable)
