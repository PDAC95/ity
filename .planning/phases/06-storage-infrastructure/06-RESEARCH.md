# Phase 6: Storage Infrastructure - Research

**Researched:** 2026-04-01
**Domain:** Supabase Storage — bucket setup, RLS policies, signed URL uploads, client-side progress tracking, reusable upload widget
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Widget de upload**
- Interacción: botón + área de drag & drop (click para abrir selector, o arrastrar archivo)
- Forma del preview: circular para avatar, cuadrado con bordes redondeados para logo
- Tamaño visual del widget: ~120px (mediano)
- Indicador de carga: barra de progreso circular (anillo sobre la imagen/área de drop)

**Validación y límites**
- Tipos aceptados: JPG, PNG, WebP (no SVG, no GIF)
- Tamaño máximo: 5 MB
- Dimensiones mínimas: 200x200px
- Errores de validación: inline debajo del widget (texto rojo), no toasts

**Estructura de buckets**
- Un solo bucket ("uploads") con paths por entidad: `/schools/{school_id}/logo` y `/profiles/{user_id}/avatar`
- Naming de archivos: path fijo por entidad (cada upload sobreescribe el anterior en el mismo path)
- Acceso: público (URLs directas sin signed URLs) — logos y avatars son contenido público
- Momento del upload: inmediato al seleccionar archivo (el formulario solo guarda la URL resultante)

**Experiencia post-upload**
- Sin crop ni resize — subir imagen tal cual, CSS maneja el display
- Reemplazo: sobreescribir el path fijo (sin archivos huérfanos, sin cleanup)
- Confirmación: el preview inmediato de la nueva imagen ES la confirmación (sin toasts ni mensajes extra)
- Botón de eliminar: ícono pequeño (X o trash) sobre el preview para volver al placeholder/default

### Claude's Discretion
- Diseño exacto del skeleton/loading state
- Implementación específica de RLS policies
- Estructura interna del Server Action para signed upload URLs
- Placeholder/default cuando no hay imagen (iniciales, ícono genérico, etc.)
- Animaciones de transición entre estados

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SCHOOL-02 | Creador puede subir logo de su escuela (imagen) | Bucket "uploads" at path `/schools/{school_id}/logo`, public bucket, signed upload URL Server Action, client XHR upload with progress, RLS policies |
| PROF-02 | Creador puede subir foto de perfil (avatar) | Bucket "uploads" at path `/profiles/{user_id}/avatar`, shared `ImageUploadWidget` with `shape="circle"`, same Server Action pattern |
</phase_requirements>

---

## Summary

Phase 6 builds the Supabase Storage infrastructure that phases 7 (School Setup form) and 8 (Creator Profile form) will consume. The deliverable is: one bucket, RLS policies, one Server Action that returns a signed upload URL, and one reusable `ImageUploadWidget` client component. No forms are built in this phase — the widget is a standalone primitive that receives a destination path and calls back with the resulting public URL.

The locked decision that shapes everything: the bucket is **public** and uploads happen via the **signed URL pattern** (server creates the signed URL, client uploads directly to Supabase Storage bypassing Next.js serverless). This is the correct architecture for Vercel deployments — Vercel serverless functions have a 4.5 MB body limit and supabase-js `.upload()` routes through the function. With a signed URL, the browser POSTs directly to `storage.supabase.co`.

The most important research finding is that **`supabase-js` does not expose upload progress** — the `upload()` and `uploadToSignedUrl()` methods both use `fetch()` internally, which has no `onprogress` event for request bodies. To implement the required circular progress indicator, the client must use `XMLHttpRequest` to PUT the file directly to the pre-signed URL obtained from the Server Action.

**Primary recommendation:** Server Action returns `{ signedUrl, token, path }` → client validates file client-side → client uses XHR PUT to `signedUrl` with progress callback → on complete, call `supabase.storage.from('uploads').getPublicUrl(path)` → pass public URL to parent via callback prop.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | ^2.45.0 (already installed) | Storage client — `createSignedUploadUrl`, `getPublicUrl` | Already in project, official Supabase SDK |
| `@supabase/ssr` | ^0.5.0 (already installed) | Server-side Supabase client for Server Actions | Already in project, cookie-aware auth |
| Next.js Server Actions | 14.2 (already used) | Create signed upload URL server-side with auth check | Avoids exposing service key to client |
| `lucide-react` | ^0.468.0 (already installed) | Upload icon, trash/X icon, image placeholder | Already in project |
| Tailwind CSS | ^3.4.0 (already installed) | Circular shape variants, progress ring via SVG | Already in project |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Native `XMLHttpRequest` | Browser API (no install) | Upload directly to signed URL with progress events | Required — `fetch` cannot report upload progress |
| Native `FileReader` | Browser API (no install) | Read image dimensions for min-size validation | Required for 200x200px dimension check |
| `zod` | ^3.23.0 (already installed) | Validate Server Action inputs (path, filename) | Already in project |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| XHR direct to signed URL | `axios` with `onUploadProgress` | Axios adds 14 KB; XHR is zero-cost and sufficient for this use case |
| Native XHR progress | Supabase `uploadToSignedUrl()` | `uploadToSignedUrl` wraps `fetch` — no progress events possible |
| Single public bucket | Private bucket + `createSignedUrl` for reads | Private bucket requires signed read URLs (adds complexity) — public bucket is correct for logos/avatars |

**Installation:** No new dependencies required. All needed libraries are already in `apps/web/package.json`.

---

## Architecture Patterns

### Recommended File Structure

```
apps/web/
├── app/
│   └── actions/
│       └── storage.ts          # Server Action: getSignedUploadUrl(path)
├── components/
│   └── upload/
│       ├── ImageUploadWidget.tsx   # Reusable widget — shape, path, onUpload props
│       └── index.ts                # re-export
└── lib/
    └── supabase/
        ├── client.ts           # (existing) browser client
        └── server.ts           # (existing) server client
```

Supabase Storage bucket and RLS policies are infrastructure configured directly in the Supabase dashboard or via SQL migration (not in app code). This phase documents the required SQL.

### Pattern 1: Signed URL Upload (Server Action + XHR)

**What:** Server Action creates a signed upload URL authenticated as the current user. Client uses XHR to PUT the file directly to Supabase Storage. On success, client retrieves the public URL.

**When to use:** Any time a browser must upload a file to Supabase Storage with progress feedback, bypassing Vercel's 4.5 MB serverless body limit.

**Server Action:**
```typescript
// app/actions/storage.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const inputSchema = z.object({
  path: z.string().min(1).max(500),
});

export async function getSignedUploadUrl(rawPath: string) {
  const { path } = inputSchema.parse({ path: rawPath });

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: 'Unauthorized' };
  }

  // Security: enforce caller can only write to their own path prefixes
  const allowedPrefixes = [
    `profiles/${user.id}/`,
    // schools/{school_id}/ — verified via ownership check below
  ];

  // For school logos, verify the school belongs to this creator
  if (path.startsWith('schools/')) {
    const schoolId = path.split('/')[1];
    const { data: school } = await supabase
      .from('schools')
      .select('id')
      .eq('id', schoolId)
      .eq('creator_id', user.id)
      .single();

    if (!school) {
      return { data: null, error: 'Unauthorized: school not owned by creator' };
    }
  } else if (!allowedPrefixes.some((prefix) => path.startsWith(prefix))) {
    return { data: null, error: 'Unauthorized: invalid path prefix' };
  }

  const { data, error } = await supabase.storage
    .from('uploads')
    .createSignedUploadUrl(path, { upsert: true });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}
```

**Client XHR Upload with Progress:**
```typescript
// Inside ImageUploadWidget.tsx — the upload function
async function uploadWithProgress(
  signedUrl: string,
  file: File,
  onProgress: (pct: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Network error')));
    xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));

    xhr.open('PUT', signedUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
}
```

**Note:** The signed URL from `createSignedUploadUrl` contains the token as a query parameter. It is a direct PUT endpoint to Supabase Storage — no additional auth headers required.

### Pattern 2: Client-Side Validation Before Upload

**What:** Validate file type, size, and dimensions before calling the Server Action. Show inline errors below widget.

**When to use:** Before any upload attempt — blocks invalid files at the client to avoid wasted requests.

```typescript
// Source: validated against Supabase docs and MDN FileReader API
type ValidationResult = { valid: true } | { valid: false; error: string };

async function validateImageFile(file: File): Promise<ValidationResult> {
  // Type check
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Solo se aceptan JPG, PNG o WebP' };
  }

  // Size check (5 MB)
  if (file.size > 5 * 1024 * 1024) {
    return { valid: false, error: 'El archivo debe ser menor a 5 MB' };
  }

  // Dimension check (200×200 minimum)
  const dimensions = await getImageDimensions(file);
  if (dimensions.width < 200 || dimensions.height < 200) {
    return { valid: false, error: 'La imagen debe ser al menos 200×200 px' };
  }

  return { valid: true };
}

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = reject;
    img.src = url;
  });
}
```

### Pattern 3: Public URL Retrieval

**What:** After a successful upload, derive the public URL from the bucket and path. No network request required.

```typescript
// Source: Supabase docs — getPublicUrl is synchronous, no network call
import { createClient } from '@/lib/supabase/client';

function getPublicUrl(path: string): string {
  const supabase = createClient();
  const { data } = supabase.storage.from('uploads').getPublicUrl(path);
  return data.publicUrl;
}
```

### Pattern 4: ImageUploadWidget Component Contract

**What:** A reusable client component that encapsulates the full upload flow. Parent only needs to know the destination path and receives the resulting public URL.

```typescript
// components/upload/ImageUploadWidget.tsx
interface ImageUploadWidgetProps {
  shape: 'circle' | 'square';  // circle = avatar, square = logo
  path: string;                 // e.g. 'profiles/{user_id}/avatar'
  currentImageUrl?: string;     // existing image to show as initial preview
  onUploadComplete: (publicUrl: string) => void;
  onRemove?: () => void;        // called when X button is clicked
}
```

State machine inside the widget:
- `idle` — shows current image (or placeholder) + drag-and-drop affordance
- `validating` — running client-side validation
- `uploading` — XHR in progress, shows circular progress ring (SVG)
- `error` — shows inline error text below widget, returns to idle affordance
- `success` — shows new image preview (this IS the confirmation per user decision)

### Pattern 5: RLS Policies for Storage

**What:** SQL policies on `storage.objects` that enforce creator isolation. Applied once to the "uploads" bucket.

**Security principle from STATE.md:** Use `auth.uid()` path-prefix scoping — NEVER `user_metadata` (user-writable, bypass-able).

```sql
-- Source: Supabase Storage docs (access-control guide, 2025)
-- Policy: Creator can upload to their own profile path
create policy "Creator can upload own avatar"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'uploads'
  and (storage.foldername(name))[1] = 'profiles'
  and (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy: Creator can update (overwrite) own avatar
create policy "Creator can update own avatar"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'uploads'
  and (storage.foldername(name))[1] = 'profiles'
  and (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy: Creator can delete own avatar
create policy "Creator can delete own avatar"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'uploads'
  and (storage.foldername(name))[1] = 'profiles'
  and (storage.foldername(name))[2] = auth.uid()::text
);

-- School logos: verify via a sub-select (creator must own the school)
-- The path is /schools/{school_id}/logo
create policy "Creator can upload own school logo"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'uploads'
  and (storage.foldername(name))[1] = 'schools'
  and exists (
    select 1 from public.schools
    where id = (storage.foldername(name))[2]::uuid
    and creator_id = auth.uid()
  )
);

create policy "Creator can update own school logo"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'uploads'
  and (storage.foldername(name))[1] = 'schools'
  and exists (
    select 1 from public.schools
    where id = (storage.foldername(name))[2]::uuid
    and creator_id = auth.uid()
  )
);

create policy "Creator can delete own school logo"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'uploads'
  and (storage.foldername(name))[1] = 'schools'
  and exists (
    select 1 from public.schools
    where id = (storage.foldername(name))[2]::uuid
    and creator_id = auth.uid()
  )
);

-- Public read: anyone can read (bucket is public, but explicit policy is belt-and-suspenders)
create policy "Public read access"
on storage.objects
for select
to public
using ( bucket_id = 'uploads' );
```

**Note on upsert:** Supabase Storage upsert requires the caller to satisfy SELECT + INSERT + UPDATE simultaneously. The signed URL approach with `upsert: true` in `createSignedUploadUrl` means the server-side Supabase client (which uses the service role key if needed, or anon key with RLS) creates the URL. The client PUT to the signed URL does NOT re-check RLS on upload — the signed URL itself is the authorization token. However, RLS policies still protect the `DELETE` operation if the creator's token is used directly.

**Important caveat:** Since the bucket is **public**, all files are readable without authentication by URL alone. The RLS policies only govern write operations (INSERT, UPDATE, DELETE). This is the correct trade-off for logos and avatars.

### Anti-Patterns to Avoid

- **Routing the file through Next.js serverless:** `fetch('/api/upload', { body: formData })` — Vercel 4.5 MB limit, no progress, double-bandwidth. Always use signed URL → direct to Supabase.
- **Using `supabase.storage.upload()` client-side with anon key:** Requires INSERT RLS that uses `auth.uid()` from the browser JWT. Works but has no progress. Use signed URL pattern instead.
- **Generating UUIDs for filenames:** The user decided on fixed paths per entity. `path = 'profiles/{user_id}/avatar'` — no UUID suffix, `upsert: true` overwrites the old file.
- **Checking dimensions with `canvas.getContext('2d')`:** Use `Image` object with `onload` + `naturalWidth/naturalHeight` — no canvas required, simpler, works in all browsers.
- **Using `user_metadata` in RLS:** User-writable. Use `auth.uid()` only.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Signed upload URL | Custom token generation | `supabase.storage.from('uploads').createSignedUploadUrl(path, { upsert: true })` | Supabase handles expiry (2h), token signing, and bucket-level permissions |
| Public URL construction | String concatenation with env vars | `supabase.storage.from('uploads').getPublicUrl(path).data.publicUrl` | Handles URL encoding, CDN routing, and project URL changes |
| Upload progress | Custom chunked uploads | XHR `xhr.upload.addEventListener('progress', ...)` | One event listener, no chunking needed for 5 MB files |
| Drag-and-drop file detection | Custom DragEvent handlers | Native `onDragOver`, `onDrop` on a div | HTML5 DragEvent API is sufficient; no library needed |
| Image preview | Canvas manipulation | `URL.createObjectURL(file)` in `<img src>` | Zero-cost, revoke on cleanup, no library |

**Key insight:** The entire phase uses only what's already installed. Zero new npm dependencies. The complexity is in orchestrating four things correctly: (1) server-side signed URL creation with ownership check, (2) client-side XHR with progress, (3) RLS policies that survive upsert, (4) public URL retrieval after upload.

---

## Common Pitfalls

### Pitfall 1: Upsert Fails Silently Due to Missing UPDATE Policy

**What goes wrong:** `createSignedUploadUrl` with `upsert: true` succeeds on the first upload. On the second upload (overwrite), the PUT returns 403 or the file is not overwritten.

**Why it happens:** Supabase Storage upsert requires the authenticated user to have SELECT + INSERT + UPDATE permissions simultaneously. If only INSERT is granted, upsert silently fails or errors.

**How to avoid:** Create all three policies (INSERT, SELECT, UPDATE) for both path prefixes. Test by uploading twice to the same path.

**Warning signs:** First upload works; second upload fails or the old image persists.

### Pitfall 2: Signed Upload URL Bypasses RLS But Deletion Does Not

**What goes wrong:** The creator deletes their avatar via the widget. The delete call uses the browser Supabase client with the user's JWT. If the DELETE RLS policy is missing, the call fails with `403`.

**Why it happens:** The signed URL only authorizes the PUT. All other operations (DELETE, list) still go through normal RLS evaluation.

**How to avoid:** Add DELETE policies for both path prefixes. Test the delete button explicitly.

**Warning signs:** Upload works, delete fails with 403.

### Pitfall 3: XHR PUT to Signed URL Gets CORS Error

**What goes wrong:** The XHR request to `storage.supabase.co` fails with a CORS preflight error in development.

**Why it happens:** Supabase Storage CORS is configured per-project. The `NEXT_PUBLIC_SUPABASE_URL` domain must be in the allowed origins. By default, `*` is allowed for public buckets, but custom configurations can restrict this.

**How to avoid:** Test in the actual browser against the staging Supabase project (`grifirzazwmovtzzxera.supabase.co`). If CORS errors appear, check the Supabase dashboard → Storage → CORS configuration.

**Warning signs:** `Access-Control-Allow-Origin` missing in response headers during XHR.

### Pitfall 4: `createSignedUploadUrl` Requires Service Role or Auth Session

**What goes wrong:** Server Action calls `createSignedUploadUrl` but gets a permissions error even with `upsert: true`.

**Why it happens:** `createSignedUploadUrl` is called on the server-side Supabase client (SSR client), which uses the user's session cookie. The session must be valid and the bucket must exist.

**How to avoid:** Always call `supabase.auth.getUser()` first in the Server Action to confirm a valid session exists before calling storage methods. The SSR client (`createClient()` from `lib/supabase/server.ts`) already handles cookie-based auth correctly.

**Warning signs:** `storage.createSignedUploadUrl` returns an error object when session is expired or missing.

### Pitfall 5: Public Bucket + File Path as Secret

**What goes wrong:** Team assumes school logos are "private" because users don't share URLs. But the bucket is public — any URL is accessible to anyone who knows it.

**Why it happens:** Misunderstanding between "access control on writes" (RLS) and "access control on reads" (bucket visibility).

**How to avoid:** This is by design per the user's decision. Logos and avatars ARE public content. Document this explicitly so future phases don't add private content to the "uploads" bucket.

**Warning signs:** N/A — this is an architecture decision, not a bug.

### Pitfall 6: `foldername()` Returns 1-Based Array

**What goes wrong:** RLS policy uses `(storage.foldername(name))[0]` expecting the first segment. This always returns `null`.

**Why it happens:** PostgreSQL arrays are 1-indexed. `foldername()` returns a PostgreSQL array, not a JSON array.

**How to avoid:** Always use `[1]` for the first segment, `[2]` for the second. Example: for path `profiles/user-uuid/avatar`, `(storage.foldername(name))[1] = 'profiles'` and `(storage.foldername(name))[2] = 'user-uuid'`.

**Warning signs:** RLS policy is set but all uploads are rejected with 403.

---

## Code Examples

### Complete Server Action

```typescript
// Source: Supabase docs (storage-from-createsigneduploadurl) + project patterns
// apps/web/app/actions/storage.ts
'use server';

import { createClient } from '@/lib/supabase/server';

export type SignedUploadResult =
  | { data: { signedUrl: string; token: string; path: string }; error: null }
  | { data: null; error: string };

export async function getSignedUploadUrl(path: string): Promise<SignedUploadResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { data: null, error: 'Unauthorized' };

  // Validate path ownership
  if (path.startsWith('profiles/')) {
    const segments = path.split('/');
    if (segments[1] !== user.id) {
      return { data: null, error: 'Unauthorized: path does not match your user ID' };
    }
  } else if (path.startsWith('schools/')) {
    const schoolId = path.split('/')[1];
    if (!schoolId) return { data: null, error: 'Invalid path' };

    const { data: school } = await supabase
      .from('schools')
      .select('id')
      .eq('id', schoolId)
      .eq('creator_id', user.id)
      .single();

    if (!school) return { data: null, error: 'Unauthorized: school not found or not owned by you' };
  } else {
    return { data: null, error: 'Invalid path prefix' };
  }

  const { data, error } = await supabase.storage
    .from('uploads')
    .createSignedUploadUrl(path, { upsert: true });

  if (error || !data) return { data: null, error: error?.message ?? 'Failed to create signed URL' };

  return { data: { signedUrl: data.signedUrl, token: data.token, path }, error: null };
}
```

### Client XHR Upload with Progress

```typescript
// Source: MDN XMLHttpRequest + Supabase Storage signed URL docs
// Used inside ImageUploadWidget.tsx
async function uploadToSignedUrl(
  signedUrl: string,
  file: File,
  onProgress: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
    xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));

    xhr.open('PUT', signedUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.setRequestHeader('Cache-Control', '3600');
    xhr.send(file);
  });
}
```

### Circular Progress Ring (SVG, pure Tailwind)

```typescript
// Source: SVG stroke-dasharray pattern (standard approach)
// Circular ring that overlays the upload area during upload
function CircularProgress({ percent }: { percent: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <svg className="absolute inset-0 m-auto" width="120" height="120" viewBox="0 0 120 120">
      {/* Track */}
      <circle cx="60" cy="60" r={radius} fill="none" stroke="white" strokeOpacity="0.3" strokeWidth="8" />
      {/* Progress */}
      <circle
        cx="60" cy="60" r={radius}
        fill="none"
        stroke="white"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 60 60)"
        style={{ transition: 'stroke-dashoffset 0.15s ease' }}
      />
    </svg>
  );
}
```

### getPublicUrl (synchronous, no network)

```typescript
// Source: Supabase docs — getPublicUrl does not make a network request
import { createClient } from '@/lib/supabase/client';

export function getPublicStorageUrl(path: string): string {
  const supabase = createClient();
  const { data } = supabase.storage.from('uploads').getPublicUrl(path);
  return data.publicUrl;
}
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Upload file to Next.js API route, then API route uploads to Supabase | Server Action returns signed URL, client uploads directly to Supabase via XHR | Bypasses Vercel 4.5 MB body limit; no double-bandwidth |
| `owner` column in storage.objects | `owner_id` column (`owner` is deprecated) | Use `owner_id` in RLS policies going forward |
| `auth.jwt()->>'sub'` in RLS | `auth.uid()::text` (equivalent, cleaner) | Both work; `auth.uid()` is the canonical helper |
| Separate buckets per entity type | Single bucket with path prefixes | Simpler bucket management; RLS differentiates by path |

**Deprecated/outdated:**
- `storage.objects.owner`: Deprecated. Use `owner_id`. (Source: Supabase Storage ownership docs, 2025)
- Using `user_metadata` in RLS policies: Security anti-pattern — user-writable fields. (Source: STATE.md project decision)

---

## Open Questions

1. **Do `school-assets` or `creator-assets` buckets already exist in the staging project?**
   - What we know: STATE.md flagged this concern. CONTEXT.md decided on a single "uploads" bucket.
   - What's unclear: Whether old buckets from earlier experiments exist and need cleanup.
   - Recommendation: Wave 0 task should check via Supabase dashboard or `supabase.storage.listBuckets()` before creating the "uploads" bucket. If old buckets exist, leave them (don't delete) — just create "uploads".

2. **Does the RLS SELECT policy + upsert interaction require `owner_id` to be set?**
   - What we know: Supabase auto-sets `owner_id` when uploads are done via authenticated session. Signed upload URLs may not set `owner_id` automatically (service-key-created resources don't get `owner_id`).
   - What's unclear: Whether `owner_id` is set when using `createSignedUploadUrl` on the SSR client (which uses the user's session, not service key).
   - Recommendation: Use path-prefix RLS (not `owner_id`) as designed above. Path-prefix RLS is deterministic and does not depend on whether `owner_id` was set.

3. **Cache-Control for public CDN caching**
   - What we know: Supabase Storage serves files through a CDN. Default `Cache-Control` is 3600 seconds.
   - What's unclear: Whether a browser can display a newly-uploaded logo immediately if the CDN has cached the old one at the same URL.
   - Recommendation: After upload, force-bust the preview using `getPublicUrl(path) + '?t=' + Date.now()` as the `src` for the immediate preview in the widget. The form that saves the URL to the database should save the clean URL (without cache-bust param).

---

## Sources

### Primary (HIGH confidence)
- Supabase Storage Access Control docs — https://supabase.com/docs/guides/storage/security/access-control — RLS policy SQL syntax, `storage.foldername()`, upsert requirements
- Supabase Storage Helper Functions docs — https://supabase.com/docs/guides/storage/schema/helper-functions — `foldername()` returns 1-based PostgreSQL array
- Supabase Storage Ownership docs — https://supabase.com/docs/guides/storage/security/ownership — `owner_id` vs `owner` deprecation, auto-assignment behavior
- `supabase/supabase-js` source — `packages/core/storage-js/src/lib/types.ts` — `FileOptions` type confirmed: no `onUploadProgress` callback
- `supabase/supabase-js` source — `StorageFileApi.ts` — `uploadToSignedUrl` uses `fetch` internally, no progress events
- Supabase `uploadToSignedUrl` API reference — https://supabase.com/docs/reference/javascript/storage-from-uploadtosignedurl — parameter names, return value, two-step pattern

### Secondary (MEDIUM confidence)
- Supabase Standard Uploads guide — https://supabase.com/docs/guides/storage/uploads/standard-uploads — `upload()` method options, `upsert: true`
- Medium article by Ollie (Feb 2025) — "Signed URL file uploads with NextJs and Supabase" — confirmed two-step pattern (Server Action → client XHR)
- Supabase Buckets fundamentals — https://supabase.com/docs/guides/storage/buckets/fundamentals — public vs private bucket behavior

### Tertiary (LOW confidence — verify if implementing)
- Community discussion re: progress events (GitHub issues/discussions #23, #6879) — confirmed `onUploadProgress` was requested but not implemented in `supabase-js`; XHR workaround is the accepted pattern

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed; confirmed versions in package.json
- Architecture (signed URL pattern): HIGH — verified against Supabase official docs and source code
- RLS policy SQL: HIGH — verified against Supabase access-control docs + helper-functions docs
- Progress tracking (XHR): HIGH — confirmed via source code that `supabase-js` uses `fetch` with no progress; XHR is the only option
- CDN cache-bust (open question): LOW — behavior not tested, recommendation is defensive

**Research date:** 2026-04-01
**Valid until:** 2026-05-01 (Supabase Storage API is stable; supabase-js v2 is stable)
