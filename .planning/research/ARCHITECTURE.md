# Architecture Research

**Domain:** Creator Dashboard + School Setup (v1.1)
**Researched:** 2026-03-31
**Confidence:** HIGH — based on direct codebase audit + official documentation

---

## Standard Architecture

### System Overview

```
Browser (Creator)
       │
       ▼
┌──────────────────────────────────────────────────────┐
│  apps/web  (Next.js 14 App Router)                   │
│                                                       │
│  Middleware ──► session refresh (Supabase SSR)        │
│                                                       │
│  Route Groups:                                        │
│  ┌─────────────────────────────────────────────────┐ │
│  │  (auth)/         login, register, reset, etc.  │ │
│  └─────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────┐ │
│  │  (dashboard)/    layout.tsx (auth guard)        │ │
│  │    dashboard/    page.tsx   (overview)          │ │
│  │    dashboard/school/        setup + branding    │ │
│  │    dashboard/profile/       creator profile     │ │
│  │    dashboard/courses/       placeholder         │ │
│  │    dashboard/students/      placeholder         │ │
│  │    dashboard/analytics/     placeholder         │ │
│  └─────────────────────────────────────────────────┘ │
│                                                       │
│  app/api/trpc/[trpc]/route.ts  ──────────────────────│
└──────────────────────────────────────────────────────┘
         │ tRPC (HTTP + server-side caller)
         ▼
┌──────────────────────────────────────────────────────┐
│  packages/api  (tRPC routers)                        │
│                                                       │
│  appRouter                                           │
│    auth.me / auth.updateProfile                      │
│    schools.list / schools.get / schools.create       │
│    schools.update / schools.updateBranding           │
│    schools.updateSlug  (new)                         │
└──────────────────────────────────────────────────────┘
         │ Drizzle ORM
         ▼
┌──────────────────────────────────────────────────────┐
│  packages/db  (Drizzle + PostgreSQL via Supabase)    │
│                                                       │
│  creators   (needs bio column added)                 │
│  schools    (fully defined — slug, branding, etc.)   │
└──────────────────────────────────────────────────────┘
         │ Storage (file uploads)
         ▼
┌──────────────────────────────────────────────────────┐
│  Supabase Storage                                    │
│                                                       │
│  bucket: creator-assets/                             │
│    {creatorId}/avatar.{ext}                          │
│  bucket: school-assets/                              │
│    {schoolId}/logo.{ext}                             │
│    {schoolId}/favicon.{ext}                          │
└──────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Type |
|-----------|---------------|------|
| `(dashboard)/layout.tsx` | Auth guard, creator upsert safety net, pass user to shell | Server Component |
| `(dashboard)/dashboard-shell.tsx` | Sidebar + header layout, mobile nav state | Client Component |
| `components/dashboard/sidebar.tsx` | Navigation links, active state detection | Client Component |
| `components/dashboard/header.tsx` | User menu, sign-out, mobile trigger | Client Component |
| `(dashboard)/dashboard/page.tsx` | Overview stats (school count real, others placeholder) | Server Component |
| `(dashboard)/dashboard/school/page.tsx` | School setup form — name, slug, description, language, timezone | Server Component shell + Client form |
| `(dashboard)/dashboard/school/branding/page.tsx` | Logo/favicon upload, color pickers, font selector | Client Component |
| `(dashboard)/dashboard/profile/page.tsx` | Creator profile form — name, bio, avatar upload | Server Component shell + Client form |
| `packages/api/src/routers/auth.ts` | `me`, `updateProfile` (needs bio field added to input) | tRPC router |
| `packages/api/src/routers/schools.ts` | School CRUD + branding update + slug update (new procedure) | tRPC router |

---

## Recommended Project Structure

```
apps/web/
  app/
    (dashboard)/
      layout.tsx                        ← EXISTS: auth guard + creator upsert
      dashboard-shell.tsx               ← EXISTS: sidebar/header layout
      dashboard/
        page.tsx                        ← EXISTS: overview (update to show real school count)
        school/
          page.tsx                      ← NEW: school setup form
          branding/
            page.tsx                    ← NEW: logo/colors/font
        profile/
          page.tsx                      ← NEW: creator profile
        courses/
          page.tsx                      ← NEW: placeholder
        students/
          page.tsx                      ← NEW: placeholder
        analytics/
          page.tsx                      ← NEW: placeholder
    actions/
      storage.ts                        ← NEW: Server Actions for signed upload URLs
  components/
    dashboard/
      sidebar.tsx                       ← MODIFY: add School, Profile nav items
      header.tsx                        ← EXISTS
      mobile-nav.tsx                    ← EXISTS
      school-setup-form.tsx             ← NEW: Client Component form
      branding-form.tsx                 ← NEW: Client Component form (colors, font)
      profile-form.tsx                  ← NEW: Client Component form
      avatar-upload.tsx                 ← NEW: signed URL upload widget
      logo-upload.tsx                   ← NEW: signed URL upload widget
      color-picker.tsx                  ← NEW: hex input + swatch preview
      placeholder-section.tsx          ← NEW: coming-soon card for deferred sections
  lib/
    trpc/
      server.ts                         ← NEW: server-side caller factory for Server Components

packages/
  api/src/routers/
    auth.ts                             ← MODIFY: add bio field to updateProfile input schema
    schools.ts                          ← MODIFY: add updateSlug procedure
  db/src/
    schema.ts                           ← MODIFY: add bio text column to creators table
```

---

## Architectural Patterns

### Pattern 1: Server Component loads, Client Component mutates

Dashboard pages follow a consistent two-part pattern. The `page.tsx` is a Server Component that fetches initial data via a server-side tRPC caller (zero client roundtrip, no loading spinner). It passes the data as props to a Client Component form that handles mutations via the tRPC client hook.

```typescript
// dashboard/school/page.tsx — Server Component
import { createServerCaller } from '@/lib/trpc/server';
import { SchoolSetupForm } from '@/components/dashboard/school-setup-form';

export default async function SchoolPage() {
  const caller = await createServerCaller();
  const schools = await caller.schools.list();
  return <SchoolSetupForm initialData={schools[0] ?? null} />;
}
```

```typescript
// components/dashboard/school-setup-form.tsx — Client Component
'use client';
import { api } from '@/lib/trpc/client';

export function SchoolSetupForm({ initialData }) {
  const createSchool = api.schools.create.useMutation();
  const updateSchool = api.schools.update.useMutation();
  // form submit routes to create or update based on initialData
}
```

The `createServerCaller` helper builds `createTRPCContext` from the Supabase server client and calls `createCaller(ctx)` from `packages/api`. This is the standard pattern for RSC + tRPC; it already exists at the API layer, only the web-side helper is missing.

### Pattern 2: Signed URL file uploads (bypass Vercel 4.5MB limit)

Next.js serverless functions have a hard 4.5MB body size limit. Routing file uploads through API routes or Server Actions fails for anything larger than a small image. Supabase Storage solves this with signed upload URLs: a Server Action generates the signed URL using the authenticated Supabase client, the browser uploads directly to Supabase Storage, then the returned public URL is saved to the database via a tRPC mutation.

```
Creator selects file in upload widget
  → Client calls Server Action: getSignedUploadUrl(path, bucket)
  → Server Action: supabase.storage.from(bucket).createSignedUploadUrl(path)
  → Returns { signedUrl, token, path }
  → Browser: fetch(signedUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
  → Browser: derives publicUrl from Supabase Storage URL pattern
  → Browser: calls tRPC mutation to persist url (e.g. updateProfile or updateBranding)
```

File never passes through the Next.js serverless function. The Server Action only returns a URL string, well within size limits.

### Pattern 3: Creator-scoped school ownership (existing — follow consistently)

Every school query in `schools.ts` uses `and(eq(schools.id, input.id), eq(schools.creatorId, ctx.user.id))`. This is the multi-tenancy enforcement at the application layer. All new procedures must follow this exact pattern without exception. The database is accessed via Drizzle with the Supabase service role connection — Postgres RLS is not enforced for these queries — making the application-layer scope the only line of defense.

**Rule:** Never query schools by ID alone. Always include `creatorId: ctx.user.id` in the WHERE clause.

### Pattern 4: Separate updateSlug procedure

The existing `schools.update` mutation deliberately excludes slug from its input schema. Slug changes have a separate concern (global uniqueness must exclude the current school). A new `updateSlug` procedure handles this:

```typescript
updateSlug: protectedProcedure
  .input(z.object({
    id: z.string().uuid(),
    slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  }))
  .mutation(async ({ ctx, input }) => {
    // Check uniqueness excluding own slug
    const conflict = await ctx.db.query.schools.findFirst({
      where: and(eq(schools.slug, input.slug), ne(schools.id, input.id)),
    });
    if (conflict) throw new TRPCError({ code: 'CONFLICT', message: 'Slug already in use' });
    // Update with creatorId scope
    const [updated] = await ctx.db
      .update(schools)
      .set({ slug: input.slug, updatedAt: new Date() })
      .where(and(eq(schools.id, input.id), eq(schools.creatorId, ctx.user.id)))
      .returning();
    if (!updated) throw new TRPCError({ code: 'NOT_FOUND' });
    return updated;
  })
```

---

## Data Flow

### School Setup CRUD

```
Creator opens /dashboard/school
  → Server Component: createServerCaller().schools.list()
  → If no school: render create flow
  → If school exists: render SchoolSetupForm with current values

Creator submits name/description/language/timezone
  → api.schools.update.useMutation → tRPC protectedProcedure
  → Drizzle UPDATE where id = ? AND creator_id = ?
  → Returns updated school → toast success

Creator changes slug
  → api.schools.updateSlug.useMutation
  → Server checks global uniqueness (excludes current school id)
  → Returns updated or CONFLICT error → inline field error

Creator uploads logo
  → Server Action: createSignedUploadUrl('school-assets', `${schoolId}/logo.png`)
  → Browser PUT directly to Supabase Storage
  → api.schools.updateBranding.useMutation({ branding: { ...current, logo: publicUrl } })
```

### Creator Profile CRUD

```
Creator opens /dashboard/profile
  → Server Component: createServerCaller().auth.me()
  → ProfileForm rendered with current name, bio, avatarUrl

Creator updates name/bio
  → api.auth.updateProfile.useMutation({ name, bio })
  → Drizzle UPDATE creators WHERE id = ctx.user.id

Creator uploads avatar
  → Server Action: createSignedUploadUrl('creator-assets', `${creatorId}/avatar.jpg`)
  → Browser PUT directly to Supabase Storage
  → api.auth.updateProfile.useMutation({ avatarUrl: publicUrl })
```

### Dashboard Overview Stats

```
Creator opens /dashboard
  → Server Component: createServerCaller().schools.list()
  → schools.length shown as real count
  → courses count: 0 (placeholder until router exists)
  → students count: 0 (placeholder until router exists)
  → Render stat cards — no loading state, data is server-fetched
```

---

## Integration Points

### What already exists (use as-is)

| Existing | Location | Notes |
|----------|----------|-------|
| `schools` table | `packages/db/src/schema.ts` | Fully defined: slug, branding JSONB, customDomain, language, timezone, stripeAccountId |
| `schools.*` procedures | `packages/api/src/routers/schools.ts` | list, get, getBySlug, create, update, updateBranding, delete — all creatorId-scoped |
| `auth.me` + `auth.updateProfile` | `packages/api/src/routers/auth.ts` | updateProfile accepts name, language, avatarUrl — bio column is missing from DB and input schema |
| `(dashboard)/layout.tsx` | `apps/web` | Auth guard + creator upsert safety net. Do not modify. |
| `DashboardShell` | `apps/web/app/(dashboard)/dashboard-shell.tsx` | Complete shell with sidebar/header/mobile. |
| `Sidebar`, `Header`, `MobileNav` | `apps/web/components/dashboard/` | Sidebar needs School + Profile nav items. Header and MobileNav are complete. |
| `createCaller` | `packages/api/src/root.ts` | Exported. Requires a Context object. Web layer needs a helper to build that context. |

### What needs to be added or modified

| Change | Target | Reason |
|--------|--------|--------|
| ADD `bio text` column | `creators` table in `schema.ts` + Drizzle migration | Creator profile requires bio. Column is absent from the table. |
| MODIFY `auth.updateProfile` | Add `bio: z.string().max(500).optional().nullable()` to input | bio must be writable via tRPC |
| ADD `schools.updateSlug` procedure | `packages/api/src/routers/schools.ts` | slug is intentionally excluded from `update`; needs separate uniqueness-safe procedure |
| ADD `createServerCaller` helper | `apps/web/lib/trpc/server.ts` | Server Components need a typed caller. Avoids repeating context-building boilerplate in every page. |
| ADD `storage.ts` Server Actions | `apps/web/app/actions/storage.ts` | `createSignedUploadUrl` must run server-side. Server Actions are the right boundary. |
| ADD dashboard pages | `dashboard/school/`, `dashboard/school/branding/`, `dashboard/profile/`, `dashboard/courses/`, `dashboard/students/`, `dashboard/analytics/` | New routes for v1.1 |
| ADD Client Component forms | `school-setup-form.tsx`, `branding-form.tsx`, `profile-form.tsx` | Mutation handlers for each settings area |
| ADD upload widgets | `avatar-upload.tsx`, `logo-upload.tsx` | Signed URL upload flow components |
| MODIFY `sidebar.tsx` | Add School and Profile entries to `navItems` | Currently only Dashboard and Schools (pointing to /dashboard/schools which does not exist yet). Update to match new routes. |

### File Upload Decision: Supabase Storage

Use Supabase Storage. Do not add Vercel Blob.

Rationale:
1. Already on Supabase — no new vendor, no additional credentials, no separate billing surface.
2. Signed upload URL pattern routes browser uploads directly to Supabase, bypassing Vercel's 4.5MB serverless body limit entirely.
3. Supabase Storage supports files up to 5GB — more than sufficient for logos, favicons, and avatar images.
4. Storage bucket policies can be RLS-secured using `auth.uid()` in a future security milestone, consistent with the rest of the Supabase stack.
5. Vercel Blob has no advantage in this context and would require managing a second set of storage credentials.

Storage bucket layout:
```
creator-assets/   (private bucket — avatars are personal)
  {creatorId}/avatar.{ext}

school-assets/    (public bucket — logos and favicons are brand assets, not private data)
  {schoolId}/logo.{ext}
  {schoolId}/favicon.{ext}
```

Client-side file size enforcement before requesting signed URL: logos and favicons capped at 2MB, avatars at 1MB. Enforce in the upload widget component before the Server Action call.

### Multi-Tenant Data Scoping

The existing schema enforces multi-tenancy at the application layer:

- `schools.creatorId` — every school belongs to one creator
- `courses.schoolId` — courses are scoped to a school
- `students.(schoolId, email)` unique constraint — same email can enroll in multiple schools but is a distinct student record per school

For v1.1 (dashboard, school setup, creator profile), no new multi-tenancy concerns arise. The existing scoping pattern is sufficient.

Drizzle uses the Supabase service role connection string. Postgres RLS is not enforced for these queries. Application-layer `creatorId` scoping in tRPC procedures is the sole enforcement mechanism. This is a known deferred security item (SEC-V2-02 in PROJECT.md).

---

## Sources

- Supabase Storage createSignedUploadUrl: https://supabase.com/docs/reference/javascript/storage-from-createsigneduploadurl
- Supabase Storage uploadToSignedUrl: https://supabase.com/docs/reference/javascript/storage-from-uploadtosignedurl
- Bypass Vercel 4.5MB body limit with Supabase direct upload: https://medium.com/@jpnreddy25/how-to-bypass-vercels-4-5mb-body-size-limit-for-serverless-functions-using-supabase-09610d8ca387
- tRPC with Next.js App Router + React Server Components: https://trpc.io/docs/client/tanstack-react-query/server-components
- Next.js App Router layouts and partial rendering: https://nextjs.org/docs/app/getting-started/layouts-and-pages
- Supabase multi-tenant RLS patterns: https://supabase.com/docs/guides/database/postgres/row-level-security
- MakerKit Drizzle + Supabase integration: https://makerkit.dev/docs/next-supabase-turbo/recipes/drizzle-supabase
