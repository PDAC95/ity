# Phase 7: School Setup - Research

**Researched:** 2026-04-01
**Domain:** Next.js App Router forms, tRPC v10 mutations/queries, React Hook Form + Zod, Sonner toasts, unsaved-changes navigation guard
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Diseño del formulario**
- Layout con tabs separados: tab "General" (nombre, descripción, slug) y tab "Marca" (colores)
- Link "Mi Escuela" o equivalente en el sidebar del dashboard (sección propia, no dentro de Settings)
- Nombre de escuela: textarea simple con límite de 60 caracteres y contador visible
- Descripción: textarea simple con límite de caracteres (no rich text)
- Slug se auto-genera a partir del nombre y es editable manualmente después
- Cada tab tiene su propio botón Guardar independiente

**Validación del slug**
- Indicador de disponibilidad inline: icono + texto debajo del campo (✅ "Disponible" verde / ❌ "Ya está en uso" rojo)
- Caracteres válidos: solo a-z, 0-9 y guiones (-). Sin mayúsculas, sin guiones bajos
- Longitud: mínimo 3, máximo 40 caracteres
- Preview inline de la URL completa debajo del campo, actualizándose en tiempo real
- Slug siempre editable (sin restricción de cambio después de guardar por primera vez)
- Validación de disponibilidad con debounce mientras el creador escribe

**Selector de colores**
- Paleta predefinida (~12 colores curados) como atajo rápido + picker libre con input hex
- Dos colores: primario y acento
- Mini preview en vivo mostrando cómo se verían los colores aplicados (botón, encabezado, o card de ejemplo)
- Colores con valores por defecto de 12ity al crear la escuela — siempre hay algo bonito de base
- Warning suave de contraste si la combinación es difícil de leer, pero permite guardar

**Feedback y estados**
- Botón Guardar siempre visible, disabled/gris cuando no hay cambios pendientes
- Spinner en el botón mientras se procesa el guardado
- Toast de éxito en esquina (~3s auto-dismiss) al guardar correctamente
- Toast de error rojo al fallar ("Error al guardar. Inténtalo de nuevo.") — datos se mantienen en el formulario
- Dialog de confirmación al intentar navegar fuera con cambios sin guardar ("Tienes cambios sin guardar. ¿Descartar o quedarte?")
- Warning también aplica al cambiar entre tabs (General → Marca) si hay cambios sin guardar
- Primera visita: formulario con defaults, sin estado especial de bienvenida (el onboarding checklist ya guía)

### Claude's Discretion
- Formato de URL en el preview del slug (subdominio vs path — según arquitectura actual)
- Diseño exacto del loading skeleton
- Espaciado y tipografía exactos
- Colores específicos de la paleta predefinida
- Límite de caracteres de la descripción (razonable, ~300-500)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SCHOOL-01 | Creador puede editar nombre y descripción de su escuela | `schools.update` tRPC mutation exists; needs React Hook Form + `trpc.schools.update.useMutation()` wiring; tab "General" form |
| SCHOOL-03 | Creador puede definir un slug único para su escuela con validación de disponibilidad en tiempo real | Requires new `schools.checkSlug` tRPC query (exclude-own pattern) + debounced `enabled` flag; `schools.updateSlug` mutation (separate from update per STATE.md); slug field in tab "General" |
| SCHOOL-04 | Creador puede elegir colores de marca (primario y secundario) para su escuela | `schools.updateBranding` tRPC mutation exists; needs color picker UI (native `<input type="color">` + hex input + swatch palette); tab "Marca" form |
</phase_requirements>

---

## Summary

Phase 7 builds on a well-established codebase. The database schema already has `schools.slug` as `varchar(100).unique().notNull()`, and the `schools` tRPC router already has `update` and `updateBranding` mutations. What's **missing** is: (1) a `checkSlug` query procedure that checks uniqueness while excluding the current school's own slug, (2) an `updateSlug` mutation (separate procedure as flagged in STATE.md), and (3) all frontend UI — the tabbed settings page, the debounced slug availability indicator, the color picker with palette, and the unsaved-changes navigation guard.

The form stack is already established in this codebase: React Hook Form 7.54 + Zod + `@hookform/resolvers`, `sonner` for toasts (already in `layout.tsx`), and tRPC v10 client mutations via `trpc.schools.X.useMutation()`. All auth pages follow this exact pattern. No new packages are needed.

The two highest-risk implementation details are: (1) the unsaved-changes warning in Next.js App Router — router events are gone in App Router, so the `beforeunload` browser event is the reliable path for browser-close/reload, combined with a tab-change intercept in React state; (2) the slug uniqueness check must use `ne(schools.id, input.currentSchoolId)` in the Drizzle query to avoid false "taken" results for the school's own current slug.

**Primary recommendation:** Build two plans — Plan 07-01 covers the General tab (name, description, slug with availability check, `updateSlug` tRPC procedure) and Plan 07-02 covers the Branding tab (color pickers, palette, live preview, `updateBranding` wiring). Both plans share the tabbed shell and the unsaved-changes guard hook.

---

## Standard Stack

### Core (already installed — no new packages needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-hook-form | ^7.54.0 | Form state, dirty tracking, validation | Already used in all auth forms; `formState.isDirty` drives save-button disabled state |
| @hookform/resolvers | ^3.9.0 | Zod schema integration | Already installed; `zodResolver` pattern established |
| zod | ^3.23.0 | Input validation schemas | Already used project-wide |
| @trpc/react-query | ^10.45.0 | `useMutation`, `useQuery` client hooks | Already wired; `trpc` client exported from `lib/trpc/client.ts` |
| sonner | ^2.0.7 | Toast notifications | `<Toaster position="top-right" />` already in `app/layout.tsx`; use `toast.success()` / `toast.error()` |
| lucide-react | ^0.468.0 | Icons (Check, X, AlertCircle, Loader2) | Already used throughout dashboard |
| tailwindcss | ^3.4.0 | Styling | Project standard; no component library |

### No New Packages Required

All necessary packages are already in `ity/apps/web/package.json`. This phase needs zero `npm install` commands.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native `<input type="color">` + hex input | react-colorful | react-colorful is not installed; native color input + controlled hex text input achieves the requirement with zero new deps |
| Custom unsaved-changes hook | router.events (pages router pattern) | App Router removed router events; `beforeunload` + React state intercept is the correct App Router approach |
| `trpc.schools.update` for slug | Separate `updateSlug` mutation | STATE.md explicitly flags this: uniqueness check must exclude current school's own slug — different logic requires separate procedure |

---

## Architecture Patterns

### Recommended File Structure

```
ity/apps/web/
├── app/(dashboard)/dashboard/
│   └── school-setup/
│       ├── page.tsx                    # RSC — loads school data, passes to client
│       └── coming-soon/ (existing)
├── components/school/
│   ├── school-setup-tabs.tsx           # 'use client' — tab shell + unsaved-changes guard
│   ├── general-tab.tsx                 # 'use client' — name/description/slug form
│   ├── branding-tab.tsx                # 'use client' — color pickers + preview
│   ├── slug-availability-indicator.tsx # 'use client' — debounced check display
│   └── color-picker.tsx                # 'use client' — swatch palette + hex input
├── lib/validations/
│   └── school.ts                       # Zod schemas for both forms
└── hooks/
    └── use-unsaved-changes.ts          # beforeunload + tab-switch guard hook
```

```
ity/packages/api/src/routers/
└── schools.ts   # ADD: checkSlug query + updateSlug mutation
```

### Pattern 1: RSC data load → Client form hydration

The page.tsx is a React Server Component that fetches current school data and passes it as props to the client form components. This matches the established dashboard pattern (see `app/(dashboard)/dashboard/page.tsx`).

```typescript
// app/(dashboard)/dashboard/school-setup/page.tsx
import { createClient } from '@/lib/supabase/server';
import { SchoolSetupTabs } from '@/components/school/school-setup-tabs';

export default async function SchoolSetupPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: school } = await supabase
    .from('schools')
    .select('id, name, description, slug, branding')
    .eq('creator_id', user!.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-2xl py-8 md:py-12">
      <SchoolSetupTabs school={school} />
    </div>
  );
}
```

### Pattern 2: React Hook Form with tRPC mutation

The established pattern in this codebase (auth forms) uses `useForm` + `zodResolver` + manual `onSubmit` handler calling the mutation. For tRPC mutations the pattern is:

```typescript
// 'use client'
// Source: verified from ity/packages/api/src/routers/schools.ts + lib/trpc/client.ts
const updateMutation = trpc.schools.update.useMutation({
  onSuccess: () => {
    toast.success('Cambios guardados');
    form.reset(form.getValues()); // clears isDirty
  },
  onError: () => {
    toast.error('Error al guardar. Inténtalo de nuevo.');
  },
});

const form = useForm<GeneralFormInput>({
  resolver: zodResolver(generalFormSchema),
  defaultValues: {
    name: school?.name ?? '',
    description: school?.description ?? '',
  },
});

const onSubmit = (data: GeneralFormInput) => {
  updateMutation.mutate({ id: school!.id, ...data });
};
```

**Key:** After successful save, call `form.reset(form.getValues())` to mark form as clean (isDirty → false). This enables the save button's disabled-when-clean state.

### Pattern 3: Debounced slug availability check

Use `useState` for the debounced value + `useEffect` with a timeout to implement debouncing without additional libraries. The tRPC `useQuery` `enabled` flag gates the network request.

```typescript
// Source: verified tRPC v10 docs — useQuery accepts enabled from @tanstack/react-query
const [debouncedSlug, setDebouncedSlug] = useState('');
const [rawSlug, setRawSlug] = useState(school?.slug ?? '');

useEffect(() => {
  const timer = setTimeout(() => setDebouncedSlug(rawSlug), 400);
  return () => clearTimeout(timer);
}, [rawSlug]);

const slugCheck = trpc.schools.checkSlug.useQuery(
  { slug: debouncedSlug, currentSchoolId: school?.id },
  {
    enabled: debouncedSlug.length >= 3 && debouncedSlug !== school?.slug,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  }
);
// slugCheck.data.available: boolean
```

When `debouncedSlug === school?.slug`, skip the network call — the current slug is always "available" for its own school.

### Pattern 4: updateSlug tRPC procedure (exclude-own pattern)

```typescript
// ity/packages/api/src/routers/schools.ts — ADD this procedure
// Source: verified from existing schools router pattern + STATE.md architectural decision
checkSlug: protectedProcedure
  .input(z.object({
    slug: z.string().min(3).max(40).regex(/^[a-z0-9-]+$/),
    currentSchoolId: z.string().uuid().optional(),
  }))
  .query(async ({ ctx, input }) => {
    const conditions = [eq(schools.slug, input.slug)];
    if (input.currentSchoolId) {
      conditions.push(ne(schools.id, input.currentSchoolId));
    }
    const existing = await ctx.db.query.schools.findFirst({
      where: and(...conditions),
    });
    return { available: !existing };
  }),

updateSlug: protectedProcedure
  .input(z.object({
    id: z.string().uuid(),
    slug: z.string().min(3).max(40).regex(/^[a-z0-9-]+$/),
  }))
  .mutation(async ({ ctx, input }) => {
    // Re-check uniqueness server-side (exclude own)
    const conflict = await ctx.db.query.schools.findFirst({
      where: and(eq(schools.slug, input.slug), ne(schools.id, input.id)),
    });
    if (conflict) {
      throw new TRPCError({ code: 'CONFLICT', message: 'este slug ya está en uso' });
    }
    const [updated] = await ctx.db
      .update(schools)
      .set({ slug: input.slug, updatedAt: new Date() })
      .where(and(eq(schools.id, input.id), eq(schools.creatorId, ctx.user.id)))
      .returning();
    if (!updated) throw new TRPCError({ code: 'NOT_FOUND' });
    return updated;
  }),
```

The `ne` import comes from `drizzle-orm` — same import used for `eq` and `and` already in the file.

### Pattern 5: Slug auto-generation from name

```typescript
// Pure function — no library needed
function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 40);
}
```

Wire to name field's `onChange`: when name changes AND slug has not been manually edited yet, auto-populate slug field.

### Pattern 6: Unsaved-changes navigation guard (App Router)

Next.js App Router removed `router.events`. The reliable cross-browser approach:

1. `beforeunload` event handles browser close/refresh/URL bar navigation
2. React state intercept handles in-app tab switches

```typescript
// hooks/use-unsaved-changes.ts
// Source: verified approach from community (medium.com/@jonjamesdesigns/...)
'use client';
import { useEffect } from 'react';

export function useUnsavedChanges(isDirty: boolean) {
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = ''; // Required for Chrome
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);
}
```

For the **tab-switch warning** (General → Marca with unsaved changes): manage with a React `useState` confirmation dialog inside `SchoolSetupTabs`. When user clicks the other tab, if `isDirty`, show a custom modal with "Descartar" and "Quedarse" options — do NOT switch tabs until confirmed.

### Pattern 7: Color picker UI (native + hex input)

No library needed. Native `<input type="color">` is fully supported in all modern browsers, synced with a controlled hex text input.

```typescript
// 'use client'
function ColorPickerField({ label, value, onChange }: { label: string; value: string; onChange: (hex: string) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-zinc-300">{label}</label>
      <div className="flex items-center gap-3">
        {/* Native color wheel */}
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-10 cursor-pointer rounded border border-zinc-700 bg-transparent p-0.5"
        />
        {/* Hex text input */}
        <input
          type="text"
          value={value}
          onChange={(e) => {
            const hex = e.target.value;
            if (/^#[0-9A-Fa-f]{6}$/.test(hex)) onChange(hex);
          }}
          maxLength={7}
          className="w-28 rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm font-mono text-zinc-200"
          placeholder="#6366F1"
        />
      </div>
      {/* Preset swatches */}
      <div className="flex flex-wrap gap-2">
        {BRAND_SWATCHES.map((swatch) => (
          <button
            key={swatch}
            type="button"
            onClick={() => onChange(swatch)}
            style={{ backgroundColor: swatch }}
            className="h-7 w-7 rounded-full border-2 border-transparent hover:border-zinc-300 transition-colors"
          />
        ))}
      </div>
    </div>
  );
}
```

The existing schema stores `branding.primaryColor` and `branding.secondaryColor` (verified in `schema.ts`). The `updateBranding` mutation already validates hex format with `/^#[0-9A-Fa-f]{6}$/`.

### Anti-Patterns to Avoid

- **Calling `schools.update` for slug changes:** The `update` mutation does not include slug in its input schema (intentional — per STATE.md, slug needs separate uniqueness logic). Do not add slug to `update`.
- **Checking slug availability without excluding own ID:** Querying `WHERE slug = $1` without `AND id != $currentId` causes false "taken" results for the school's own current slug.
- **`router.events` for navigation guard:** Does not exist in App Router. Use `beforeunload`.
- **Resetting form with `form.reset()` (no args) after save:** This resets to default values (empty), not saved values. Use `form.reset(form.getValues())` to preserve current values while clearing dirty state.
- **Not calling `form.reset()` after save:** If form remains dirty after save, the save button never disables and the unsaved-changes guard keeps triggering.
- **Using `maybeSingle()` vs `single()`:** The school page must use `maybeSingle()` for creator with no school yet (established pattern from Phase 5).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form state + dirty tracking | Custom onChange tracking | `react-hook-form` `formState.isDirty` | Already installed; handles all field states, resets cleanly |
| Input validation | Custom regex checks in handlers | Zod schema + `zodResolver` | Already established pattern; inline error messages from `formState.errors` |
| Toast notifications | Custom toast component | `sonner` `toast.success()` / `toast.error()` | Already in layout.tsx; 4000ms default duration is ~correct (CONTEXT says ~3s, use `{ duration: 3000 }`) |
| Slug format validation | In-component regex | Zod `.regex(/^[a-z0-9-]+$/)` in schema | Reuse server-side schema shape in client validation |
| Debounce utility | `setTimeout` wrapper library | Inline `useEffect` + `clearTimeout` | No `lodash` or `use-debounce` installed; 4-line pattern is sufficient |
| Color contrast check | Custom WCAG algorithm | Inline luminance calculation (simple) | The requirement is a "soft warning" — a basic relative luminance check on two hex values is ~10 lines, no library justified |

**Key insight:** Zero new packages are needed. Every requirement maps to already-installed tooling.

---

## Common Pitfalls

### Pitfall 1: Slug uniqueness check returns false "taken" for own slug
**What goes wrong:** Creator opens school-setup, sees their existing slug marked red "Ya está en uso"
**Why it happens:** `checkSlug` query finds the school's own record
**How to avoid:** Always pass `currentSchoolId` to `checkSlug`; add `ne(schools.id, input.currentSchoolId)` to Drizzle query
**Warning signs:** Slug indicator shows red immediately on page load without user editing anything

### Pitfall 2: Unsaved-changes dialog not firing on Link clicks
**What goes wrong:** User clicks "Inicio" in sidebar, navigates away silently losing unsaved data
**Why it happens:** `beforeunload` only fires on true browser navigation (close/reload/URL bar), NOT on Next.js client-side `<Link>` clicks
**How to avoid:** The tab-switch warning is handled by React state intercept. For sidebar Link clicks, the `beforeunload` event does NOT cover these — this is a known App Router limitation. Accepted mitigation: `beforeunload` handles accidental browser close; the tab-switch guard handles the in-page tab switch. True sidebar navigation guard would require wrapping all Links, which is excessive for v1.
**Warning signs:** User reports losing data when clicking sidebar links (document this as known limitation)

### Pitfall 3: form.reset() wipes form to empty defaults
**What goes wrong:** After save, all fields become empty
**Why it happens:** `form.reset()` with no args resets to `defaultValues` set at `useForm` init time, which may be empty if school loaded asynchronously
**How to avoid:** Use `form.reset(form.getValues())` after successful save mutation to preserve current values while marking clean

### Pitfall 4: Color picker hex input allows partial hex during typing
**What goes wrong:** User types `#6` and the color immediately tries to apply an invalid hex, causing errors
**Why it happens:** `onChange` validates immediately
**How to avoid:** Show raw text value in the input at all times; only call `onChange(hex)` when the value matches `/^#[0-9A-Fa-f]{6}$/`. Keep local `inputValue` state that updates freely; sync to parent only on valid hex.

### Pitfall 5: Tab switch without saving loses data silently
**What goes wrong:** User edits "General" tab, clicks "Marca" tab — form resets to saved values without warning
**Why it happens:** Tab switch re-mounts or re-renders form with original data
**How to avoid:** Intercept tab click in `SchoolSetupTabs` with a React confirmation dialog (`useState<'general'|'branding'>` for activeTab; on tab click, if `generalFormIsDirty || brandingFormIsDirty`, show modal before switching). Each tab form's `isDirty` state must be lifted or passed to the tab shell.

### Pitfall 6: Drizzle `ne` import missing
**What goes wrong:** TypeScript error when adding `ne` to schools router
**Why it happens:** `ne` is not currently imported in `routers/schools.ts` (only `eq` and `and` are imported)
**How to avoid:** Add `ne` to the drizzle-orm import: `import { eq, and, ne } from 'drizzle-orm'`

---

## Code Examples

Verified patterns from codebase and official sources:

### Sonner toast with 3s duration
```typescript
// Source: sonner.emilkowal.ski/toast — verified duration option
toast.success('Cambios guardados', { duration: 3000 });
toast.error('Error al guardar. Inténtalo de nuevo.', { duration: 4000 });
```

### tRPC mutation with optimistic disabled-button pattern
```typescript
// Source: verified from ity/apps/web/app/(auth)/login/page.tsx pattern
const { mutate, isPending } = trpc.schools.update.useMutation({
  onSuccess: () => {
    toast.success('Cambios guardados', { duration: 3000 });
    form.reset(form.getValues()); // clears isDirty
  },
  onError: () => {
    toast.error('Error al guardar. Inténtalo de nuevo.');
  },
});

// Save button:
<button
  type="submit"
  disabled={!form.formState.isDirty || isPending}
  className="..."
>
  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar'}
</button>
```

### Character counter for textarea
```typescript
// No library needed — controlled input pattern
const nameValue = form.watch('name');

<textarea
  {...form.register('name', { maxLength: 60 })}
  maxLength={60}
  className="..."
/>
<span className="text-xs text-zinc-500">{nameValue?.length ?? 0}/60</span>
```

### Slug auto-generation from name (manual edit detection)
```typescript
const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
const nameValue = form.watch('name');

useEffect(() => {
  if (!slugManuallyEdited) {
    form.setValue('slug', slugify(nameValue ?? ''), { shouldDirty: true });
  }
}, [nameValue, slugManuallyEdited]);
```

### Relative luminance contrast warning (soft check)
```typescript
// Simplified WCAG luminance — no library needed
function hexToRelativeLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function contrastRatio(hex1: string, hex2: string): number {
  const l1 = hexToRelativeLuminance(hex1);
  const l2 = hexToRelativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// In branding form: show warning if ratio < 3.0 (soft threshold)
const ratio = contrastRatio(primaryColor, accentColor);
const lowContrast = ratio < 3.0;
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `router.events.on('routeChangeStart')` | `beforeunload` + React state intercept | Next.js App Router (v13+) | Cannot intercept Next.js client-side Link navigation; only browser-level events available |
| Separate slug check API endpoint | `checkSlug` tRPC query with `enabled` flag | Project standard | Type-safe, consistent with rest of API |
| Manual fetch + loading state | `trpc.X.useMutation()` with `isPending` | Already established | isPending auto-tracks; no manual state needed |

---

## Open Questions

1. **Sidebar link navigation guard**
   - What we know: `beforeunload` does not intercept Next.js `<Link>` clicks in App Router
   - What's unclear: Whether to add a context-level navigation guard to intercept all Link clicks
   - Recommendation: Accept as known limitation for v1. Document in plan. The `beforeunload` handler covers accidental browser close; tab-switch modal covers the most likely in-page scenario.

2. **URL format for slug preview**
   - What we know: Context marks this as Claude's Discretion; no public school URL exists yet
   - What's unclear: Whether the future URL will be `{slug}.12ity.com` or `12ity.com/{slug}`
   - Recommendation: Use path format `12ity.com/{slug}` for the preview since subdomain routing isn't yet built. Keep the preview string simple and acknowledge it may change.

3. **School creation vs edit**
   - What we know: `maybeSingle()` returns null when no school exists; dashboard already uses this pattern
   - What's unclear: Should `school-setup` page allow creating a school if none exists (redirect to create flow)?
   - Recommendation: If `school === null`, the setup page should still render with empty defaults and call `schools.create` instead of `schools.update`. Handle this in the form's `onSubmit` by checking `school?.id`.

---

## Sources

### Primary (HIGH confidence)
- `ity/packages/api/src/routers/schools.ts` — existing procedures verified directly
- `ity/packages/db/src/schema.ts` — `schools.slug` unique constraint confirmed
- `ity/packages/api/src/trpc.ts` — context shape and protectedProcedure pattern
- `ity/apps/web/lib/trpc/client.ts` + `server.ts` — both tRPC call patterns
- `ity/apps/web/app/(auth)/login/page.tsx` — react-hook-form + sonner toast pattern
- `ity/apps/web/app/layout.tsx` — Toaster already mounted at root
- `ity/apps/web/package.json` — confirmed all packages present, no installs needed

### Secondary (MEDIUM confidence)
- [tRPC useQuery docs](https://trpc.io/docs/client/react/useQuery) — `enabled` option confirmed as React Query passthrough
- [Sonner toast docs](https://sonner.emilkowal.ski/toast) — `duration` option, `toast.success()` / `toast.error()` API verified
- [Unsaved changes in App Router](https://medium.com/@jonjamesdesigns/how-to-handle-unsaved-page-changes-with-nextjs-app-router-65b74f1148de) — `beforeunload` approach confirmed as community standard

### Tertiary (LOW confidence)
- None — all claims are backed by primary codebase inspection or official docs

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages confirmed installed in package.json, patterns verified in source files
- Architecture: HIGH — directly mirrors established patterns from Phase 5 (RSC + client components) and Phase 6 (upload widget)
- tRPC procedures: HIGH — existing router code verified; new procedures follow exact same pattern
- Unsaved-changes guard: MEDIUM — App Router limitation documented in Next.js GitHub discussions; `beforeunload` approach is community-verified but sidebar Link interception is a known gap

**Research date:** 2026-04-01
**Valid until:** 2026-05-01 (stable libraries; tRPC v10 and RHF v7 are not fast-moving at this point)
