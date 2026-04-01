# Phase 8: Creator Profile - Research

**Researched:** 2026-04-01
**Domain:** Form management, image crop, tRPC mutation, DB migration, two-column layout with live preview
**Confidence:** HIGH

## Summary

Phase 8 adds a Creator Profile page at `/dashboard/profile`. The page follows a two-column layout (form left, live preview right) already established for School Setup. The form manages display name, bio (500 chars), contact email, and six social media networks. Avatar upload reuses the existing `ImageUploadWidget` + `getSignedUploadUrl` pattern from Phase 6 — the path `profiles/{user_id}/avatar` already has server-side ownership validation in `storage.ts`. PROF-02 (avatar upload) is already complete.

The `creators` table currently has `id`, `email`, `name`, `avatar_url`, `language`, `email_verified`, `created_at`, `updated_at`. It does **not** have `bio`, `contact_email`, or `social_links` columns — a Drizzle migration is required. The `auth.updateProfile` tRPC procedure exists but only accepts `name`, `language`, and `avatarUrl`. It must be extended (or a new `creators` router added) to handle the new fields.

Avatar crop is not currently installed in the monorepo. A lightweight crop library (`react-easy-crop`) must be added. The unsaved-changes guard (`useUnsavedChanges`) and dirty-state lift pattern (`onDirtyChange` callback) are already proven and must be reused exactly. The modal-based navigation guard (three-button: Guardar / Descartar / Cancelar) differs from the existing two-button (Descartar / Quedarse) — this is intentional per CONTEXT.md.

**Primary recommendation:** Extend the `creators` table with 3 new columns via Drizzle migration, add a `creators` tRPC router with `get` + `update` procedures, install `react-easy-crop` for circular crop, and build the profile page using all established patterns from School Setup and Storage phases.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Layout y estructura
- Dos columnas: formulario a la izquierda, preview en vivo a la derecha
- Avatar grande centrado arriba del formulario
- Secciones del form en cards separadas (info básica, contacto, redes sociales)
- Preview muestra card de perfil público + header de escuela, switcheable con toggle
- Preview actualiza en tiempo real (cada keystroke)
- Página propia en el sidebar del dashboard + link de acceso desde School Setup

#### Campos y validación
- Display name: texto libre, máximo 50 caracteres
- Bio: textarea, máximo 500 caracteres
- Email de contacto: obligatorio, validación de formato email
- Redes sociales (6): Instagram, X, YouTube, TikTok, LinkedIn, Facebook
- Input de redes: solo username con prefijo visual (ej: instagram.com/ + input)

#### Avatar / Foto de perfil
- Upload de imagen + crop circular antes de guardar
- Fallback sin foto: círculo con iniciales del display name sobre fondo de color
- Botón de eliminar foto (vuelve a iniciales)
- Límite de archivo: 5 MB máximo
- Spinner overlay sobre el avatar durante upload

#### Feedback y estados
- Modal de confirmación al navegar con cambios sin guardar (botones: Guardar / Descartar / Cancelar)
- Spinner sobre avatar durante upload de foto

### Claude's Discretion
- Layout móvil responsive (form arriba + preview abajo, o preview en botón/sheet)
- Posición del botón de guardar (sticky o al final del form)
- Estilo y posición del toast de éxito
- Manejo de errores de servidor (toast + retry o solo toast con datos mantenidos)
- Colores de fondo para iniciales del avatar

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PROF-01 | Creador puede editar su nombre visible y biografía | New `bio` column in `creators` table + `auth.update` tRPC mutation + react-hook-form form with character counter |
| PROF-03 | Creador puede agregar datos de contacto (email de contacto, redes sociales) | New `contact_email` + `social_links` columns in `creators` table + same tRPC mutation + prefix-visual inputs for 6 networks |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-hook-form | ^7.54 | Form state, dirty tracking, validation | Already installed, used in GeneralTab |
| zod + @hookform/resolvers | ^3.23 / ^3.9 | Schema validation | Already installed, proven in school validations |
| sonner | ^2.0.7 | Toast notifications | Already installed, used for all save toasts |
| trpc client | ^10.45 | Data fetching + mutations | Already installed, established pattern |
| react-easy-crop | ^5.x | Circular avatar crop modal | NOT installed — must add |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | ^0.468 | Icons (Loader2, X, Upload, etc.) | Already installed |
| ImageUploadWidget | internal | Upload + progress + remove | Reuse exactly for avatar upload phase before crop |
| useUnsavedChanges | internal | beforeunload guard | Reuse exactly — same hook |
| getAvatarColor / getInitials | internal | Fallback initials avatar | Already in `lib/utils/avatar.ts` |
| framer-motion | ^12.31 | Animations | Already installed; discretionary for preview toggle |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-easy-crop | react-image-crop | react-image-crop is more low-level; react-easy-crop has built-in circular crop + zoom |
| react-easy-crop | cropperjs | cropperjs has jQuery dependency roots; react-easy-crop is React-native |
| Separate `creators` router | Extending `auth` router | Cleaner separation — `auth` router handles Supabase Auth concerns; creator profile data belongs in its own router |

**Installation:**
```bash
pnpm add react-easy-crop --filter @ity/web
```

---

## Architecture Patterns

### Recommended Project Structure
```
packages/
  db/src/schema.ts             # Add bio, contact_email, social_links columns
  api/src/routers/creators.ts  # NEW: get + update procedures
  api/src/root.ts              # Register creators router

apps/web/
  app/(dashboard)/dashboard/profile/
    page.tsx                   # RSC: fetch creator, pass to client shell
  components/profile/
    profile-form.tsx           # Client: two-column layout shell
    basic-info-card.tsx        # Name + bio card
    contact-card.tsx           # Contact email card
    social-links-card.tsx      # 6 social network inputs
    profile-preview.tsx        # Live preview panel (public card + school header toggle)
    avatar-crop-modal.tsx      # react-easy-crop modal dialog
  lib/validations/
    profile.ts                 # Zod schemas for profile form
```

### Pattern 1: DB Migration — Add 3 Columns to `creators`
**What:** Add `bio`, `contact_email`, `social_links` (jsonb) to the `creators` table via Drizzle schema + migration.
**When to use:** Any time new persistent data is needed on an existing table.

Current `creators` table (schema.ts lines 86–95):
```typescript
export const creators = pgTable('creators', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  language: varchar('language', { length: 5 }).default('en'),
  emailVerified: boolean('email_verified').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

New columns to add:
```typescript
  bio: text('bio'),                                        // max enforced in Zod, not DB
  contactEmail: varchar('contact_email', { length: 255 }),
  socialLinks: jsonb('social_links').$type<SocialLinks>(),
```

SocialLinks type (define in schema.ts):
```typescript
export type SocialLinks = {
  instagram?: string;
  x?: string;
  youtube?: string;
  tiktok?: string;
  linkedin?: string;
  facebook?: string;
};
```

Generate migration:
```bash
pnpm db:generate   # runs drizzle-kit generate
pnpm db:migrate    # applies to Supabase
```

### Pattern 2: `creators` tRPC Router
**What:** New router at `packages/api/src/routers/creators.ts` with `get` and `update` procedures.
**When to use:** Profile data that lives in the `creators` table (not Supabase Auth user_metadata).

```typescript
// packages/api/src/routers/creators.ts
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { creators } from '@ity/db';
import { eq } from 'drizzle-orm';

export const creatorsRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    const creator = await ctx.db.query.creators.findFirst({
      where: eq(creators.id, ctx.user.id),
    });
    if (!creator) throw new TRPCError({ code: 'NOT_FOUND' });
    return creator;
  }),

  update: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(50).optional(),
      bio: z.string().max(500).optional().nullable(),
      contactEmail: z.string().email().optional().nullable(),
      socialLinks: z.object({
        instagram: z.string().max(100).optional(),
        x: z.string().max(100).optional(),
        youtube: z.string().max(100).optional(),
        tiktok: z.string().max(100).optional(),
        linkedin: z.string().max(100).optional(),
        facebook: z.string().max(100).optional(),
      }).optional().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(creators)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(creators.id, ctx.user.id))
        .returning();
      if (!updated) throw new TRPCError({ code: 'NOT_FOUND' });
      return updated;
    }),
});
```

Register in `root.ts`:
```typescript
import { creatorsRouter } from './routers/creators';
export const appRouter = router({
  auth: authRouter,
  creators: creatorsRouter,   // NEW
  schools: schoolsRouter,
  courses: coursesRouter,
});
```

### Pattern 3: RSC Page → Client Component (same as school-setup)
**What:** RSC fetches data via Supabase client, passes as props to client shell.
**When to use:** All dashboard pages in this project.

```typescript
// app/(dashboard)/dashboard/profile/page.tsx
import { createClient } from '@/lib/supabase/server';
import { ProfileForm } from '@/components/profile/profile-form';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: creator } = await supabase
    .from('creators')
    .select('id, name, bio, avatar_url, contact_email, social_links')
    .eq('id', user!.id)
    .single();

  return (
    <div className="mx-auto max-w-5xl py-8 md:py-12">
      <ProfileForm creator={creator} />
    </div>
  );
}
```

Note: `max-w-5xl` (wider than school-setup's `max-w-2xl`) to accommodate the two-column layout.

### Pattern 4: Dirty State + Navigation Guard (established pattern)
**What:** Each form card lifts `isDirty` via `onDirtyChange` callback. Parent uses `useUnsavedChanges` hook. Navigation guard modal has 3 buttons (Guardar / Descartar / Cancelar) — differs from school-setup's 2-button version.

```typescript
// Three-button modal (new, per CONTEXT.md)
// Guardar    → save current form then navigate
// Descartar  → discard and navigate
// Cancelar   → stay on page
```

The `useUnsavedChanges` hook is at `apps/web/hooks/use-unsaved-changes.ts` — reuse unchanged.

### Pattern 5: Avatar with Circular Crop
**What:** File selected → validate (type, size, 200×200 min) → open crop modal → user crops → upload cropped blob via signed URL → display.

The existing `ImageUploadWidget` does NOT have crop — it uploads directly. For Phase 8, the avatar flow needs a custom sequence:

1. Hidden `<input type="file">` — same validation logic as `ImageUploadWidget`
2. On file select: create `objectURL`, open `AvatarCropModal`
3. `AvatarCropModal` uses `react-easy-crop` to crop + zoom, outputs a circular crop area
4. On confirm: canvas `toBlob()` → upload blob via `getSignedUploadUrl('profiles/{userId}/avatar')` + XHR
5. On success: update `creators.avatar_url` via `trpc.creators.update`

```typescript
// react-easy-crop usage
import Cropper from 'react-easy-crop';

<Cropper
  image={imageSrc}           // objectURL of selected file
  crop={crop}                // { x, y }
  zoom={zoom}                // 1–3
  aspect={1}                 // 1:1 for circle
  cropShape="round"          // circular crop overlay
  showGrid={false}
  onCropChange={setCrop}
  onZoomChange={setZoom}
  onCropComplete={onCropComplete}  // receives croppedAreaPixels
/>
```

Canvas crop helper (standard pattern):
```typescript
async function getCroppedBlob(
  imageSrc: string,
  croppedAreaPixels: { x: number; y: number; width: number; height: number }
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = croppedAreaPixels.width;
  canvas.height = croppedAreaPixels.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(
    image,
    croppedAreaPixels.x, croppedAreaPixels.y,
    croppedAreaPixels.width, croppedAreaPixels.height,
    0, 0, croppedAreaPixels.width, croppedAreaPixels.height
  );
  return new Promise((resolve) => canvas.toBlob(resolve as BlobCallback, 'image/jpeg', 0.92));
}
```

### Pattern 6: Social Links Prefix-Visual Input
**What:** Each social network input shows a read-only prefix and a text input for the username only.

```tsx
// Prefix visual pattern
<div className="flex rounded-lg border border-zinc-700 bg-zinc-800 overflow-hidden">
  <span className="px-3 py-2 text-sm text-zinc-500 bg-zinc-900 border-r border-zinc-700 whitespace-nowrap">
    instagram.com/
  </span>
  <input
    value={value}
    onChange={...}
    placeholder="username"
    className="flex-1 px-3 py-2 text-sm text-zinc-100 bg-transparent focus:outline-none"
  />
</div>
```

Network prefixes:
| Network | Prefix |
|---------|--------|
| Instagram | `instagram.com/` |
| X (Twitter) | `x.com/` |
| YouTube | `youtube.com/@` |
| TikTok | `tiktok.com/@` |
| LinkedIn | `linkedin.com/in/` |
| Facebook | `facebook.com/` |

### Pattern 7: Live Preview Panel
**What:** Right column shows a toggle between two preview modes: "Perfil público" (public profile card) and "Header escuela" (school header). Updates on every keystroke via controlled state.

```tsx
// Toggle state
const [previewMode, setPreviewMode] = useState<'profile' | 'school'>('profile');

// Profile card preview renders: avatar/initials, display name, bio, social links
// School header preview renders: school logo/name, creator avatar + name
```

Preview reads directly from form state (not saved data) — no debounce needed since it's local state.

### Anti-Patterns to Avoid
- **Using `user_metadata` from Supabase Auth for profile fields:** Security bypass — any client can write user_metadata. Always store profile data in the `creators` table (RLS-protected).
- **Uploading full image without crop:** The user expects circular crop before upload per locked decisions.
- **Re-using ImageUploadWidget directly for avatar:** It uploads immediately on file pick, before crop. Need custom avatar flow with crop modal interstitial.
- **Widening the `auth.updateProfile` procedure:** It accepts `avatarUrl` for PROF-02 already complete. Adding new fields to it conflates auth concerns with profile data. Use the new `creators` router instead.
- **Forgetting to register the `creators` router in `root.ts`:** The router won't be callable from the client.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Circular image crop with zoom | Custom canvas-only crop UI | `react-easy-crop` | Handles touch, zoom, drag, aspect ratio, circular mask |
| Form dirty state | Manual `useState` for each field | `react-hook-form` `formState.isDirty` | Handles nested fields, reset, comparison to default values |
| Upload progress | Polling or fetch | XHR `upload.onprogress` | Already proven in `ImageUploadWidget` |
| Toast notifications | Custom toast component | `sonner` | Already installed project-wide |

**Key insight:** The canvas crop helper IS hand-rolled (it's ~20 lines) and that's acceptable — it's a standard, well-understood pattern. The complex parts (interaction, zoom, drag, circular overlay) are what `react-easy-crop` handles.

---

## Common Pitfalls

### Pitfall 1: `creators` Table Missing New Columns on First Render
**What goes wrong:** RSC fetches `bio`, `contact_email`, `social_links` before migration runs — Supabase returns error or null columns.
**Why it happens:** Migration not applied before deploying code that reads new columns.
**How to avoid:** Run migration (`pnpm db:migrate`) as first task, before any code that reads new columns.
**Warning signs:** Supabase query returns error `column "bio" does not exist`.

### Pitfall 2: Avatar Crop Modal Leaves objectURL Unreleased
**What goes wrong:** Memory leak — `URL.createObjectURL` URLs accumulate in memory.
**Why it happens:** `revokeObjectURL` not called after crop confirm/cancel.
**How to avoid:** Call `URL.revokeObjectURL(imageSrc)` in the `useEffect` cleanup of the crop modal, or explicitly on confirm + cancel.

### Pitfall 3: Blob Upload to Supabase Signed URL Fails with CORS
**What goes wrong:** XHR PUT to Supabase signed URL blocked by CORS.
**Why it happens:** `Content-Type` header mismatch — `image/jpeg` must match what was set when generating the signed URL.
**How to avoid:** Set `xhr.setRequestHeader('Content-Type', 'image/jpeg')` explicitly (matching the blob type from `canvas.toBlob`). Already proven in `ImageUploadWidget` — same pattern applies.

### Pitfall 4: Navigation Guard Modal — "Guardar" Path Requires Async Save
**What goes wrong:** User clicks "Guardar" in the navigation guard modal, save fails silently, then navigates away with data lost.
**Why it happens:** The modal triggers save and navigates immediately without awaiting mutation.
**How to avoid:** On "Guardar": call mutation, await success callback, THEN navigate. Keep modal open until save resolves.

### Pitfall 5: Social Links Stored as Usernames but Displayed as Full URLs
**What goes wrong:** UI inconsistency — store `@username` but prefix display expects just `username`.
**Why it happens:** TikTok/YouTube use `@` in their URLs but inputs may pre-fill with `@`.
**How to avoid:** Strip leading `@` on save. Validate in Zod: `z.string().regex(/^[^@]/)` or strip in mutation before storing.

### Pitfall 6: `creators` Router Not in `AppRouter` Type
**What goes wrong:** TypeScript error — `trpc.creators` doesn't exist on client.
**Why it happens:** Router registered in `appRouter` object but TypeScript cache stale, OR forgot to register entirely.
**How to avoid:** Add to `root.ts` before writing client code. Run `tsc --noEmit` to verify.

---

## Code Examples

Verified patterns from existing codebase:

### Existing: Dirty State Lift Pattern
```typescript
// Source: apps/web/components/school/general-tab.tsx
const { formState } = form;

useEffect(() => {
  onDirtyChange(formState.isDirty);
}, [formState.isDirty, onDirtyChange]);
```

### Existing: tRPC Mutation with Toast
```typescript
// Source: apps/web/components/school/general-tab.tsx
const updateMutation = trpc.schools.update.useMutation({
  onSuccess: () => {
    toast.success('Cambios guardados', { duration: 3000 });
    form.reset(form.getValues());
  },
  onError: () => {
    toast.error('Error al guardar. Inténtalo de nuevo.');
  },
});
```

### Existing: Signed Upload URL + XHR Pattern
```typescript
// Source: apps/web/components/upload/image-upload-widget.tsx
const result = await getSignedUploadUrl(path);  // 'profiles/{userId}/avatar'
if (!result.data) { setError('Error al preparar la subida'); return; }
setProgress(0);
await uploadToSignedUrl(result.data.signedUrl, file, (pct) => setProgress(pct));
const publicUrl = getPublicStorageUrl(path) + '?t=' + Date.now();
onUploadComplete(getPublicStorageUrl(path));
```

### Existing: Avatar Fallback (Initials)
```typescript
// Source: apps/web/components/dashboard/sidebar.tsx
import { getAvatarColor, getInitials } from '@/lib/utils/avatar';
const initials = getInitials(creator.name || creator.email);
const avatarColor = getAvatarColor(creator.name || creator.email);
```

### Existing: useUnsavedChanges (beforeunload guard)
```typescript
// Source: apps/web/hooks/use-unsaved-changes.ts
useUnsavedChanges(isDirty);  // pass boolean — registers beforeunload handler
```

### New: react-easy-crop Crop Complete Handler
```typescript
// getCroppedAreaPixels is provided by onCropComplete callback
const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

const onCropComplete = useCallback((_: unknown, pixels: Area) => {
  setCroppedAreaPixels(pixels);
}, []);

// On confirm:
const blob = await getCroppedBlob(imageSrc, croppedAreaPixels);
// blob is now ready for upload via XHR
```

### New: Profile Form Zod Schema
```typescript
// apps/web/lib/validations/profile.ts
import { z } from 'zod';

export const socialLinksSchema = z.object({
  instagram: z.string().max(100).optional().or(z.literal('')),
  x: z.string().max(100).optional().or(z.literal('')),
  youtube: z.string().max(100).optional().or(z.literal('')),
  tiktok: z.string().max(100).optional().or(z.literal('')),
  linkedin: z.string().max(100).optional().or(z.literal('')),
  facebook: z.string().max(100).optional().or(z.literal('')),
});

export const profileFormSchema = z.object({
  name: z.string().min(1, 'Requerido').max(50, 'Máximo 50 caracteres'),
  bio: z.string().max(500, 'Máximo 500 caracteres').optional().or(z.literal('')),
  contactEmail: z.string().email('Email inválido').optional().or(z.literal('')),
  socialLinks: socialLinksSchema.optional(),
});

export type ProfileFormInput = z.infer<typeof profileFormSchema>;
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `auth.updateProfile` for all creator data | Separate `creators` router | Phase 8 | Cleaner separation of auth vs profile concerns |
| Direct upload (no crop) | Upload after crop modal | Phase 8 | Matches user expectation for avatar quality |
| Single-column form | Two-column (form + live preview) | Phase 8 | First page in this app to use this layout |

---

## Open Questions

1. **Should the `creators` tRPC router replace `auth.updateProfile` for `name` and `avatarUrl`?**
   - What we know: `auth.updateProfile` already handles `name` and `avatarUrl` and is used by existing code.
   - What's unclear: Whether to migrate those fields to the new `creators` router or leave them in `auth` and only add new fields to `creators` router.
   - Recommendation: Leave `auth.updateProfile` as-is (existing code depends on it). The new `creators.update` procedure handles `name`, `bio`, `contactEmail`, `socialLinks` for the profile page. `name` will be writable from both — the last write wins, which is fine since they're the same page.

2. **Does the Supabase `uploads` bucket RLS policy cover the `profiles/` path?**
   - What we know: Phase 6 set up the `uploads` bucket with path-based ownership. `storage.ts` validates `profiles/{user_id}/avatar` paths server-side.
   - What's unclear: Whether RLS policies on `storage.objects` also need updating for the new crop-then-upload flow (blob upload uses same signed URL pattern).
   - Recommendation: Signed URL upload bypasses RLS for the upload itself (signed URL is pre-authorized). No RLS change needed — same as Phase 6 avatar pattern.

3. **Where does the School Setup link to Creator Profile live?**
   - What we know: CONTEXT.md says "link de acceso desde School Setup". The sidebar already has `/dashboard/profile` as an active nav item.
   - What's unclear: Which tab in School Setup should show the link (General or Branding).
   - Recommendation: Add a small info link at the bottom of the General tab pointing to `/dashboard/profile`. Low-effort, doesn't affect form functionality.

---

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection: `packages/db/src/schema.ts` — confirmed missing bio/contact/social columns
- Direct codebase inspection: `packages/api/src/routers/auth.ts` — confirmed `updateProfile` scope
- Direct codebase inspection: `apps/web/components/upload/image-upload-widget.tsx` — confirmed upload + XHR pattern
- Direct codebase inspection: `apps/web/components/school/general-tab.tsx` — confirmed dirty state lift pattern
- Direct codebase inspection: `apps/web/hooks/use-unsaved-changes.ts` — confirmed hook API
- Direct codebase inspection: `apps/web/lib/utils/avatar.ts` — confirmed initials/color helpers
- Direct codebase inspection: `apps/web/package.json` — confirmed `react-easy-crop` NOT installed

### Secondary (MEDIUM confidence)
- `react-easy-crop` npm page — confirmed `cropShape="round"`, `aspect={1}`, `onCropComplete` API (training knowledge, standard widely-used library)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified from package.json and existing code
- Architecture: HIGH — follows proven patterns from phases 6 and 7
- DB migration: HIGH — schema inspected directly, columns confirmed absent
- Crop library: MEDIUM — react-easy-crop API from training data; verify with docs before coding
- Pitfalls: HIGH — based on direct code analysis of existing patterns

**Research date:** 2026-04-01
**Valid until:** 2026-05-01 (stable dependencies)
