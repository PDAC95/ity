# Pitfalls Research

**Domain:** Creator Dashboard + School Setup (v1.1)
**Researched:** 2026-03-31
**Confidence:** MEDIUM-HIGH — derived from ecosystem research against known stack (Next.js 14 App Router, tRPC, Drizzle, Supabase)

> **Note:** This file supersedes the v1.0 Auth pitfalls file. Auth pitfalls from v1.0 are already resolved and documented in PROJECT.md. This file covers risks introduced by the v1.1 milestone: dashboard layout, school setup, creator profile, and the multi-tenant data model those features imply.

---

## Critical Pitfalls

### Pitfall 1: Supabase Storage — Bucket with No RLS Policies Silently Allows Nothing

**What goes wrong:** Creating a storage bucket and uploading through `supabase.storage.from('logos').upload(...)` fails with a generic error or silent `null` because no RLS INSERT policy exists. Teams assume bucket creation is enough.

**Why it happens:** Supabase Storage requires explicit RLS policies on `storage.objects` for every operation (INSERT, SELECT, UPDATE, DELETE). A bucket with no policies blocks all uploads by default — even from an authenticated user.

**How to avoid:**
- Create at minimum one policy: `(auth.uid() IS NOT NULL)` for authenticated uploads.
- For multi-tenant logo isolation, add a path-prefix check: `(storage.foldername(name))[1] = auth.uid()::text` so each creator can only write to their own folder.
- Test with the anon key (should fail) and with a creator JWT (should succeed) before assuming it works.

**Warning signs:** `upload()` returns `{ data: null, error: null }` or RLS violation error even though the user is authenticated.

**Phase to address:** School Setup phase, before any file upload UI is built.

---

### Pitfall 2: Supabase Storage — File Size and Method Mismatch

**What goes wrong:** Logo and profile photo uploads fail silently or with a confusing 413 error because the default free-tier file size limit is 50 MB but the larger issue is that standard uploads break for files above 6 MB. This is rarely hit for logos, but client-side image selection has no guard and allows users to select any size.

**Why it happens:** No client-side file type/size validation before upload. No server-side guard in the tRPC mutation. Supabase enforces limits at the storage layer, which returns an error that surfaces poorly in the UI.

**How to avoid:**
- Validate file type (MIME: `image/jpeg`, `image/png`, `image/webp`, `image/svg+xml`) and size (≤ 2 MB recommended for logos/avatars) client-side before initiating upload.
- Show a user-friendly error — not a raw Supabase error message — when validation fails.
- Store the public URL in the database only after a successful upload confirmation.

**Warning signs:** Database has a `logo_url` pointing to a path that 404s because upload was interrupted. No loading state shown during upload.

**Phase to address:** School Setup — file upload UI implementation.

---

### Pitfall 3: Supabase Storage — Image Transformation Billing Surprise

**What goes wrong:** Using Supabase's built-in image transform API (`?width=200&height=200`) in production is a paid feature (Pro plan and above). Free plan does not support it. On Pro, there are ~100 free transformation renders per month per unique transform, with billing kicking in after that. Teams enable transforms assuming it is free.

**Why it happens:** The transform option exists in the SDK on all plans and does not fail obviously in development — it silently falls back or returns untransformed images depending on project tier.

**How to avoid:**
- For v1.1 (logo/avatar display), do not use Supabase transforms. Instead, constrain file size on upload (≤ 2 MB) and use Next.js `Image` component with `width` and `height` props — it handles client-side display resizing without egress cost.
- Reserve Supabase transform API for a future milestone where it is explicitly budgeted.
- If transforms are needed later, use a CDN or Cloudflare Images instead.

**Phase to address:** School Setup — logo display implementation. Avoid transforms from day one.

---

### Pitfall 4: School Slug — Race Condition Between Check and Insert

**What goes wrong:** Async slug availability check (e.g., typing in a slug field triggers a tRPC query) shows "available" but the actual `INSERT` fails with a unique constraint violation because another creator claimed the same slug in the interval between check and save.

**Why it happens:** The "check then insert" pattern is never atomic without database-level enforcement. Even with Zod async validation calling a tRPC procedure, the check and the write are separate transactions.

**How to avoid:**
- Enforce uniqueness at the database level: a `UNIQUE` constraint on `schools.slug` in the Drizzle schema. This is the only reliable guard.
- The async availability check is UX-only, not a security gate. Treat the constraint violation error from the INSERT as a first-class error path, not an edge case.
- In the tRPC mutation, catch Drizzle's unique constraint violation (PostgreSQL error code `23505`) and surface it as a user-friendly "slug already taken" error, not a generic 500.
- Validate slug format (lowercase alphanumeric + hyphens, no leading/trailing hyphens, max 63 chars) synchronously with Zod before the async check runs.

**Warning signs:** No `UNIQUE` constraint in the Drizzle migration. The async check is treated as the only guard.

**Phase to address:** School Setup — slug field, schema migration, and tRPC mutation error handling.

---

### Pitfall 5: Multi-Tenant Data Leakage — Missing `schoolId` Filter on Every Query

**What goes wrong:** A tRPC procedure like `school.getCourses` fetches courses without filtering by the authenticated creator's school ID. Returns all courses from all schools.

**Why it happens:** Application-level filtering is opt-in. Every query starts with access to everything and must explicitly narrow. With Drizzle, forgetting `.where(eq(courses.schoolId, ctx.schoolId))` is a single line omission.

**How to avoid:**
- Establish a pattern in tRPC middleware: extract and validate `schoolId` from the authenticated creator record, attach it to the tRPC context, and require every data-access procedure to use it.
- Do not rely on the client to pass `schoolId` as an input parameter — derive it server-side from `ctx.user.id → creator → school`.
- Consider Supabase RLS policies as a backstop (not a replacement). Enable RLS on all school-scoped tables with a policy that enforces `school_id` matches the session's creator school.

**Warning signs:** Any tRPC procedure that accepts `schoolId` as a user-provided input parameter. Any query that does not include a `where` clause scoping to a specific school.

**Phase to address:** Schema design before any dashboard data is fetched. tRPC context middleware setup.

---

### Pitfall 6: Dashboard Sidebar State — Full Page Re-render on Navigation

**What goes wrong:** Clicking sidebar links causes the entire page to re-render, including the sidebar itself (it flashes or re-mounts). Sidebar state (collapsed/expanded, active item) resets on every navigation.

**Why it happens:** The sidebar is not inside a persistent layout. Either the dashboard route group has no `layout.tsx`, or the sidebar is rendered inside individual page components instead of the shared layout.

**How to avoid:**
- Create `app/(dashboard)/layout.tsx` that wraps all dashboard pages. The sidebar lives here. Only the `{children}` slot re-renders on navigation.
- Keep sidebar collapsed/expanded state in a Client Component with `useState` or `useLocalStorage`. Do not store it in URL params or server state.
- On mobile, use a Sheet/Drawer component. Call `setOpenMobile(false)` (or equivalent close handler) in every nav link's `onClick` so the drawer closes after navigation.
- Use `usePathname()` inside the sidebar to highlight the active route — do not track it with separate state.

**Warning signs:** Sidebar is imported inside `page.tsx` files. No `layout.tsx` exists in the dashboard route group.

**Phase to address:** Dashboard layout — first thing to build, foundational for all subsequent features.

---

### Pitfall 7: Brand Color FOUC (Flash of Unstyled Content)

**What goes wrong:** The school's brand color is loaded from the database after hydration. Before the color loads, the UI flashes with the default platform color (12ity's accent), visually exposing the underlying platform for a fraction of a second.

**Why it happens:** If brand colors are fetched client-side (e.g., in a `useEffect` or via a tRPC query), the server-rendered HTML has no color applied. The browser paints the default and then the color snaps in.

**How to avoid:**
- Fetch brand config in a Server Component (the dashboard layout or the school-facing page root) and inject it as CSS variables directly into the server-rendered HTML:
  ```tsx
  // layout.tsx (server component)
  const school = await getSchool(schoolId);
  return (
    <html style={{ '--brand-primary': school.primaryColor }}>
      {children}
    </html>
  );
  ```
- For the creator's own dashboard, this is less critical (creator sees platform UI, not school branding). But for any student-facing pages (v1.2+), this is critical to get right from the start.
- Store colors as CSS-compatible hex values in the database, not named colors or RGB arrays.

**Warning signs:** Brand color is fetched in a `useEffect`. Default color is visible during page load.

**Phase to address:** School Setup (storing colors). Student-facing rendering (applying colors) — critical for v1.2.

---

### Pitfall 8: White-Label Brand Leakage — Platform Identity Visible to Students

**What goes wrong:** Students see "12ity" in the browser tab title, page footer, meta tags, og:image, or error pages even though they are on a creator's school.

**Why it happens:** Default metadata, error boundaries, and fallback UI use platform branding. The `metadata` export in `layout.tsx` is static. Error pages (`error.tsx`, `not-found.tsx`) use platform copy. The `<title>` tag is not overridden per school.

**How to avoid:**
- Use Next.js `generateMetadata()` (async) for all school-facing pages — fetch school name/logo server-side to populate `title`, `description`, and `openGraph.images`.
- Create school-scoped `error.tsx` and `not-found.tsx` files inside the school-facing route group that use neutral copy ("Something went wrong") rather than platform branding.
- Audit all static strings in components for hardcoded "12ity" references before the v1.2 student-facing milestone.
- The favicon (`/favicon.ico`) needs to become dynamic per school in v1.4 (custom domain milestone). For now, use a neutral favicon that does not brand as "12ity."

**Warning signs:** Hardcoded "12ity" in `<title>` tags. Static `metadata` export instead of `generateMetadata`. Platform logo in `not-found.tsx`.

**Phase to address:** v1.1 for dashboard metadata. Critical to resolve before v1.2 student-facing pages.

---

### Pitfall 9: Supabase Storage — Using `user_metadata` in RLS Policies

**What goes wrong:** A storage RLS policy like `auth.jwt() -> 'user_metadata' ->> 'role' = 'creator'` appears to work in development but is a security vulnerability because `user_metadata` is writable by authenticated users via `supabase.auth.updateUser()`.

**Why it happens:** `user_metadata` is user-controlled. A student can set their own `user_metadata.role = 'creator'` and bypass the RLS policy.

**How to avoid:**
- Use `app_metadata` (not `user_metadata`) for role claims in RLS policies. `app_metadata` is server-controlled and cannot be modified by the user.
- For storage path policies, use the authenticated user's `auth.uid()` directly: `(storage.foldername(name))[1] = auth.uid()::text`.
- Set creator role via a server-side admin call (Supabase Admin SDK) during creator provisioning, stored in `app_metadata`.

**Warning signs:** Any RLS policy referencing `auth.jwt() -> 'user_metadata'` or `auth.jwt() ->> 'user_metadata'`.

**Phase to address:** Storage RLS setup — before any file upload feature is deployed.

---

## Technical Debt Patterns

### TD-1: School Settings Form — Optimistic Update Without Query Cancellation

tRPC + React Query optimistic updates on the school settings form (name, description, colors) require cancelling in-flight queries before applying the optimistic state. Skipping `cancelQueries` causes the refetch to overwrite the user's typed changes mid-edit, producing a jarring reset.

**Prevention:** If using optimistic updates (skip for v1.1 — pessimistic is fine), always call `utils.school.get.cancel()` in `onMutate` before setting optimistic data.

---

### TD-2: Slug Not Normalized Before Storage

Slugs input by users may contain uppercase, spaces, or special characters. If normalized only on the client (e.g., `.toLowerCase().replace(/\s+/g, '-')`), a malicious or misconfigured client could store `"My School"` as the slug, breaking URL routing later.

**Prevention:** Normalize the slug server-side in the tRPC mutation before writing to the database. Do not trust client-sent slug format.

---

### TD-3: Logo URL Stored Before Upload Completes

A pattern where the tRPC mutation receives a `logoUrl` input and stores it immediately — without verifying that the file was actually uploaded to Supabase Storage — leads to broken image references. The file upload may fail silently after the mutation succeeded.

**Prevention:** The upload flow must be: (1) upload file to storage, (2) get public URL from Supabase, (3) send URL to tRPC mutation. Never send a speculative URL to the database.

---

### TD-4: No Cleanup of Old Logo/Avatar Files

When a creator re-uploads their logo, the old file remains in Supabase Storage indefinitely. Over time this accumulates storage costs and orphaned files.

**Prevention:** Before or after storing the new URL, delete the old file path from storage. In the tRPC mutation, fetch the current `logoUrl`, extract the path, and call `supabase.storage.from('logos').remove([oldPath])`.

---

## Integration Gotchas

### IG-1: tRPC `protectedProcedure` vs Dashboard Layout Auth Check

The middleware redirects unauthenticated users to `/login`. The dashboard layout may also independently check auth. If both check and redirect, an authenticated user with an expired session gets into a redirect loop. The middleware is the single source of truth — the layout should trust `ctx.user` from tRPC context and not duplicate the redirect logic.

---

### IG-2: Drizzle Schema — `schoolId` Foreign Key Not Set to `CASCADE`

If a creator's school record is deleted (for any reason), rows in child tables (courses, students, etc.) become orphaned unless the FK is `ON DELETE CASCADE`. Missing this causes referential integrity errors later.

**Prevention:** Set `schoolId` FK columns with `.references(() => schools.id, { onDelete: 'cascade' })` in Drizzle schema from the first migration.

---

### IG-3: Turborepo Build Cache with New `packages/db` Tables

Adding new Drizzle migrations in `packages/db` while the Turborepo cache has stale build artifacts can cause type errors in `packages/api` that disappear on a clean build. The CI pipeline will fail seemingly randomly.

**Prevention:** Run `turbo run build --force` after adding migrations. Add migration changes to Turborepo's `inputs` hash if not already included.

---

### IG-4: File Upload in a tRPC Procedure

tRPC procedures expect JSON bodies. Sending a `multipart/form-data` file upload through a tRPC mutation is not standard and requires workarounds. The correct pattern is: upload directly from the client to Supabase Storage (bypassing tRPC for the binary upload), then call a tRPC mutation with the resulting URL string.

**Prevention:** File upload = direct client-to-Supabase. URL storage = tRPC mutation. Never route binary files through tRPC.

---

## Performance Traps

### PT-1: Dashboard Fetches All Schools on Every Navigation

If the dashboard layout fetches the creator's school on every render (e.g., `useQuery` in the layout with no stale time), every sidebar click triggers a network round-trip to reload school metadata.

**Prevention:** Set a reasonable `staleTime` (e.g., 5 minutes) on school config queries in React Query. School name/logo/colors rarely change mid-session.

---

### PT-2: Sidebar Navigation Config Rebuilt on Every Render

A sidebar that computes its nav items from a list with inline functions (permissions checks, badge counts) rebuilds the entire config object on every render, causing unnecessary re-renders of all nav items.

**Prevention:** `useMemo` for the nav config object. Separate badge count queries from the nav structure.

---

### PT-3: Individual Loading States Per Dashboard Card (Popping Effect)

Fetching data for each dashboard metric card in a separate query causes them to "pop in" one by one as they resolve, which is visually jarring.

**Prevention:** Use `Promise.all` to batch related queries, or wrap related cards in a single `<Suspense>` boundary with a skeleton that covers all cards.

---

## Security Mistakes

### SM-1: Creator Can Access Another Creator's School Data via Direct ID Input

A tRPC mutation that accepts `schoolId` as user input without verifying the authenticated creator owns that school allows a logged-in creator to modify any school's settings by changing the ID.

**Prevention:** Never accept `schoolId` as a user-provided input for write operations. Derive it from `ctx.user.id → creator → school` server-side. For reads with public school slugs, verify the school is either public or owned by the requester.

---

### SM-2: Slug Enumeration Exposes School Existence

A slug availability check endpoint that returns `{ available: false }` confirms a school with that slug exists, even to unauthenticated users. This exposes the creator roster.

**Prevention:** For v1.1 (slug check for the creator's own school setup), gate the check behind `protectedProcedure`. Unauthenticated slug checks are never needed at this stage.

---

### SM-3: Public Storage Bucket for Logos Enables Hotlinking and Enumeration

Making the logos bucket fully public means the bucket listing URL (if enabled) exposes all tenant logo paths, and any logo URL is permanently accessible even after a creator deletes their account.

**Prevention:** Use a private bucket with per-file signed URLs for private assets. For logos that are intentionally public (e.g., displayed on the school's public landing page), use a public bucket but ensure RLS restricts writes to the owning creator. Disable bucket listing.

---

## UX Pitfalls

### UX-1: No Feedback During Logo Upload

The file upload flow has an async gap: user selects file → upload to Supabase (potentially slow on mobile) → store URL. Without a progress indicator or disabled state on the save button, users click "save" multiple times, causing duplicate uploads.

**Prevention:** Show an upload progress indicator (or at minimum a spinner). Disable the form submit button during upload. Show a preview of the uploaded image before the form is saved.

---

### UX-2: Slug Input Allows Confusing Characters Then Fails at Save

If slug validation only runs on save (not on input), users spend time filling in the rest of the form before discovering their slug contains invalid characters.

**Prevention:** Validate slug format synchronously in real-time (on change), with an inline hint showing the normalized/slugified version as the user types. Show availability check asynchronously with a debounce of ≥ 400ms.

---

### UX-3: Empty Dashboard State Shows Broken Placeholders

Dashboard sections for Courses, Students, and Metrics are placeholders in v1.1. If these render as blank white boxes or throw errors when the data source doesn't exist yet, the dashboard feels broken.

**Prevention:** Each placeholder section must have an explicit "coming soon" or empty state with clear copy — not just a blank area. Use skeleton patterns only for sections that will actually load data. Placeholder sections should render statically without any data fetch.

---

### UX-4: Saving School Settings Doesn't Reflect Changes in Sidebar

After saving a new school name, the sidebar header (which shows the school name) still shows the old name because it reads from a stale React Query cache.

**Prevention:** After a successful school settings mutation, invalidate the `school.get` query: `utils.school.get.invalidate()`. The sidebar's name display should read from the same query key.

---

## "Looks Done But Isn't" Checklist

These are the patterns that look correct in local dev but will silently fail or cause data integrity issues in production.

- [ ] **Slug UNIQUE constraint exists in the Drizzle migration** — not just in Zod validation
- [ ] **Storage RLS INSERT policy exists** — bucket creation alone does not allow uploads
- [ ] **RLS policy uses `auth.uid()` not `user_metadata`** — user_metadata is user-writable
- [ ] **`schoolId` scoping is derived server-side** — never trusted from client input on mutations
- [ ] **Old logo file is deleted from storage when a new one is uploaded** — no orphaned files
- [ ] **Logo URL is stored only after upload confirms success** — not speculatively
- [ ] **File type and size validated client-side before upload begins** — not just at storage layer
- [ ] **Supabase Storage transforms are not used on the Free plan** — they silently fail or incur cost on Pro
- [ ] **Dashboard layout.tsx exists in the route group** — sidebar is not rendered in page.tsx files
- [ ] **Sidebar closes on mobile after navigation** — `setOpenMobile(false)` in nav link onClick
- [ ] **Brand colors fetched server-side for school-facing pages** — no FOUC flash of platform default
- [ ] **Slug normalization runs server-side** — not only in client Zod schema
- [ ] **School settings mutation invalidates React Query cache** — sidebar name updates after save
- [ ] **Placeholder dashboard sections have explicit empty states** — not blank white boxes
- [ ] **generateMetadata() used for school pages** — not static `metadata` export

---

## Sources

- [Supabase Storage Limits](https://supabase.com/docs/guides/storage/uploads/file-limits) — file size limits by plan (verified via search)
- [Supabase Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control) — RLS policy requirements
- [Supabase Storage Image Transformations](https://supabase.com/docs/guides/storage/serving/image-transformations) — Pro plan only, billing implications
- [Multi-Tenant RLS Mistakes (AWS)](https://aws.amazon.com/blogs/database/multi-tenant-data-isolation-with-postgresql-row-level-security/) — data scoping patterns
- [Drizzle ORM RLS Docs](https://orm.drizzle.team/docs/rls) — policy integration with Drizzle
- [Restore Supabase RLS with Drizzle via tRPC middlewares](https://mortadha.dev/blog/restore-supabase-rls-with-drizzle-using-trpc-middlewares/) — role impersonation pattern
- [tRPC + Multi-tenant Context with AsyncLocalStorage](https://discord-questions.trpc.io/m/1220804297760047165) — tenant scoping in context
- [Async Slug Validation with React Hook Form + Zod](https://blog.benorloff.co/async-form-validation-with-zod-react-hook-form) — debounce and race condition patterns
- [shadcn/ui Sidebar Admin Skeleton Best Practices](https://eastondev.com/blog/en/posts/dev/20260327-shadcn-ui-sidebar-layout/) — layout.tsx placement, mobile Sheet close
- [Next.js App Router State Management](https://vercel.com/kb/guide/react-context-state-management-nextjs) — context in RSC, sidebar state placement
- [FOUC in Next.js App Router](https://dev.to/amritapadhy/understanding-fixing-fouc-in-nextjs-app-router-2025-guide-ojk) — CSS variable hydration timing
- [White-Label SaaS Tenant Isolation](https://dev.to/jos_gonalves_fac39f3437/we-built-one-platform-that-powers-30-brands-the-white-label-saas-playbook-445d) — brand leakage patterns
- [Next.js loading.js Streaming Guide](https://dev.to/boopykiki/a-complete-nextjs-streaming-guide-loadingtsx-suspense-and-performance-9g9) — Suspense boundary placement
- [Optimistic Updates with tRPC v11](https://discord-questions.trpc.io/m/1371892793454235840) — query cancellation requirement
