# Project Research Summary

**Project:** 12ity — v1.1 Creator Dashboard
**Domain:** Online School Platform (White-Label SaaS)
**Researched:** 2026-03-31
**Confidence:** HIGH

## Executive Summary

The v1.1 milestone builds the creator-facing admin experience on top of an already-functioning auth layer. The core pattern established by every major competitor (Teachable, Thinkific, Kajabi, Podia) is a fixed left sidebar with separate, distinct sections for school branding and creator profile. This is not a stylistic preference — it reflects the fact that school settings and creator identity are distinct data objects consumed by different downstream surfaces (landing pages vs. instructor cards). The architecture research confirms the existing codebase already contains most of the necessary infrastructure: the `schools` table is fully defined, the schools tRPC router has complete CRUD, and the dashboard shell (layout, sidebar, header) already exists. The delta for v1.1 is primarily new UI pages, two surgical backend additions (a `bio` column on `creators` and an `updateSlug` procedure), and Supabase Storage integration for file uploads.

The recommended implementation approach is: lay the dashboard layout foundation first (it is the permanent frame for everything that follows), then build the Storage infrastructure before any upload UI touches it, then implement school setup (highest complexity due to slug uniqueness and branding), then creator profile (simpler — reuses the same patterns). File uploads must bypass the Next.js serverless function entirely using Supabase signed upload URLs to avoid Vercel's 4.5MB body size limit. The slug must be protected by a database-level UNIQUE constraint — the async availability check is UX only, not a security gate.

The top risks are Storage-related: buckets without RLS policies silently block all uploads, and using `user_metadata` in RLS policies creates a security bypass (it is user-writable). Both are straightforward to prevent with correct initial setup. The second risk cluster is multi-tenant data scoping: every school query must include `creatorId` derived server-side, never from client input. These risks are high-impact but well-documented with clear prevention patterns. One operational gap remains: Supabase Storage bucket creation and RLS policy bootstrapping requires a manual Supabase dashboard step or migration SQL — this must be the first deliverable in the Storage phase to unblock everything else.

## Key Findings

### Recommended Stack

The existing stack (Next.js 14 App Router, tRPC 10, Drizzle ORM 0.38, Supabase, Zod) is fixed and sufficient. Only two UI packages need to be added: `react-colorful` (color picker component — lightweight, zero dependencies) and the `shadcn/ui` CLI for any needed UI primitives. No schema migrations requiring new tables are needed — only a single column addition (`bio text` on `creators`) and a confirmation that the `schools.slug` UNIQUE constraint exists in the Drizzle schema.

**Core technologies:**
- Next.js 14 App Router: routing, layouts, Server Components — Server Component shell + Client Component form pattern for all dashboard pages
- tRPC 10 with `protectedProcedure`: all mutations — `creatorId` scoping enforced at context level, never accepted as client input
- Drizzle ORM + Supabase PostgreSQL: data access — `schools` table fully defined; only `bio` column missing from `creators`
- Supabase Storage: file uploads — signed URL pattern routes uploads directly from browser, bypassing Vercel's 4.5MB serverless limit
- `react-colorful`: hex color picker widget — sufficient for brand color input in v1.1; no additional billing surface
- Zod: input validation — slug normalization and format enforcement must also run server-side in the tRPC mutation, not only in client schema

### Expected Features

All four major competitors ship a fixed sidebar, separate branding vs. profile forms, and a dismissable onboarding checklist. These are non-negotiable for a credible v1.1. The slug and file upload features carry the most implementation complexity and have the most documented failure modes.

**Must have (table stakes):**
- Dashboard sidebar navigation — fixed left sidebar with Home, School Setup, My Profile active; Courses, Students, Analytics, Team, Domain as locked placeholders
- Dashboard home with onboarding checklist — links to each setup section; dismissable; explicit empty states instead of blank metric cards
- School name + slug — required before v1.2 (slug is consumed by public landing page routing); real-time availability check (UX) + DB UNIQUE constraint (enforcement)
- School logo + favicon upload — Supabase Storage signed URL flow; client-side size/type validation before upload initiates
- Brand primary color — hex input + color picker; stored as CSS hex value in DB
- Creator display name + bio — `bio` column must be added to `creators` table; `auth.updateProfile` input schema must include `bio`
- Creator avatar upload — same signed URL flow as logo; reuses Storage infrastructure already built
- Save confirmation toasts + unsaved-changes guard on both School Setup and Creator Profile forms

**Should have (competitive differentiators):**
- Real-time slug availability check with debounce (300–400ms) — reduces submit-fail loops; surfaces conflicts as creator types
- Slug auto-suggestion from school name — client-side: strip accents, lowercase, replace spaces with hyphens
- Accent color field (optional) — stored alongside primary; low effort to include while branding form is being built
- Creator timezone — low effort to capture now; avoids a later migration when live classes (v1.3) arrive

**Defer (v2+):**
- Social links on creator profile — used by v1.2 landing page; premature until landing page exists
- Brand color preview widget showing creator's colors applied — relevant once student-facing pages (v1.2) exist to render them
- Custom domain UI — DNS/SSL provisioning is async multi-step; add locked sidebar placeholder only in v1.1
- Team member management — significant auth complexity; locked sidebar placeholder only
- Logo crop tool — creators have external tools; document recommended dimensions (400x400, under 2MB)
- Slug redirect on change — no live URLs to break until v1.2 landing page ships

### Architecture Approach

The project uses a consistent two-part dashboard page pattern: a Server Component `page.tsx` fetches initial data via a `createServerCaller` helper (zero client roundtrip, no loading spinner), then passes data as props to a Client Component form that handles mutations via tRPC hooks. This helper needs to be written at `apps/web/lib/trpc/server.ts` — it does not yet exist, but `createCaller` is already exported from `packages/api/src/root.ts`. File uploads use Server Actions at `app/actions/storage.ts` to generate signed upload URLs server-side; the binary file never passes through Next.js serverless functions.

**Major components:**
1. `(dashboard)/layout.tsx` (Server Component) — auth guard, creator upsert safety net; foundational for all subsequent pages; must not be duplicated with per-page auth checks
2. `DashboardShell` + `sidebar.tsx` (Client Components) — sidebar/header layout, active route via `usePathname()`, mobile drawer with close-on-navigate; needs School and Profile nav entries added
3. `schools.ts` tRPC router — existing CRUD plus new `updateSlug` procedure (separate from `update` because the uniqueness check must exclude the current school's own slug)
4. `auth.ts` tRPC router — `updateProfile` needs `bio` field added to input schema
5. `app/actions/storage.ts` Server Actions — `createSignedUploadUrl` runs authenticated Supabase server client, returns signed URL to client; binary upload stays client-to-Supabase
6. Upload widgets (`avatar-upload.tsx`, `logo-upload.tsx`) — Client Components; enforce file type + size before requesting signed URL; show upload progress; store URL only after upload confirms

### Critical Pitfalls

1. **Storage RLS policies missing** — A Supabase Storage bucket with no RLS policies silently blocks all uploads (returns `null` or RLS violation error). Must create INSERT policies before building any upload UI. Use `auth.uid()` for path-prefix scoping; never use `user_metadata` (user-writable, security bypass — use `app_metadata` or direct `auth.uid()` path checks).

2. **Slug race condition without DB constraint** — The async availability check is UX-only. Without a `UNIQUE` constraint on `schools.slug` in the Drizzle migration, two creators can claim the same slug in a concurrent submit. The `updateSlug` tRPC mutation must catch PostgreSQL error `23505` and surface a user-friendly "slug already taken" error.

3. **Multi-tenant data leakage** — Every school query must include `eq(schools.creatorId, ctx.user.id)` derived server-side. The existing procedures follow this pattern; all new procedures must match it exactly. Never accept `schoolId` as a mutable write input — derive it from the authenticated creator context.

4. **Dashboard layout.tsx is foundational** — If the sidebar is rendered inside individual `page.tsx` files instead of the shared `(dashboard)/layout.tsx`, every navigation causes a full re-render and sidebar state resets. The layout must exist and wrap all dashboard pages before any page-level work begins.

5. **Logo URL stored before upload completes** — The correct sequence is: (1) upload file to Supabase Storage, (2) get confirmed public URL, (3) call tRPC mutation to persist URL. Sending a speculative URL to the database before upload confirms produces broken image references that are silent and hard to diagnose.

## Implications for Roadmap

Based on research dependencies, the natural phase structure is sequential with a clear infrastructure-first ordering. The dashboard layout must exist before any page content is built. Storage infrastructure must be confirmed before any upload UI is built. School setup (highest complexity, slug-dependent for v1.2) should be built before creator profile (simpler reuse of established patterns).

### Phase 1: Dashboard Layout Foundation

**Rationale:** Every subsequent phase adds a new dashboard page. If the layout is structurally wrong, everything built on top must be restructured. This is also the lowest-risk phase — `dashboard-shell.tsx` already exists; the work is updating sidebar nav entries and verifying the route group structure is correct.
**Delivers:** Working dashboard shell with correct route group layout, updated sidebar navigation (School, Profile entries added; Courses/Students/Analytics/Team/Domain as explicit locked placeholders), dashboard home page with onboarding checklist and explicit empty states replacing blank cards.
**Addresses:** Dashboard sidebar navigation, dashboard home screen, placeholder sections for deferred features.
**Avoids:** Pitfall 6 (sidebar full re-render on navigation), UX-3 (blank/broken placeholder states).

### Phase 2: Supabase Storage Infrastructure

**Rationale:** Logo, favicon, and avatar uploads all depend on Storage being correctly configured before any upload UI is built. Getting RLS policies wrong after upload UI exists requires retracing steps. This phase has no visible UI deliverable but unblocks all three upload features in subsequent phases.
**Delivers:** Supabase Storage buckets (`school-assets` public, `creator-assets` private) created with RLS INSERT policies using `auth.uid()` path-prefix scoping; `app/actions/storage.ts` Server Action with `createSignedUploadUrl`; reusable upload widget components (`avatar-upload.tsx`, `logo-upload.tsx`) with client-side file type/size validation baked in.
**Addresses:** All file upload features (logo, favicon, avatar).
**Avoids:** Pitfall 1 (RLS missing), Pitfall 9 (user_metadata in RLS), Pitfall 2 (no client-side file validation), TD-3 (URL stored before upload completes), IG-4 (binary files routed through tRPC), SM-3 (public bucket enumeration).

### Phase 3: School Setup Form

**Rationale:** School slug is the highest-complexity feature in v1.1 and is consumed by v1.2 public landing page routing — it must ship in v1.1. School branding (logo, colors) depends on Storage infrastructure from Phase 2. This phase also introduces the `createServerCaller` helper and the `updateSlug` tRPC procedure, which are the two new architectural pieces for the whole milestone.
**Delivers:** `/dashboard/school` page (name, description, timezone, language fields); slug field with real-time availability check, auto-suggestion from name, format validation, inline conflict error; `/dashboard/school/branding` page with logo upload, favicon upload, primary and accent color pickers; `createServerCaller` helper at `apps/web/lib/trpc/server.ts`; `schools.updateSlug` tRPC procedure; `bio` column added to `creators` table via Drizzle migration (preparatory for Phase 4 but run here to consolidate migrations).
**Addresses:** School name + slug, logo + favicon upload, brand colors.
**Avoids:** Pitfall 4 (slug race condition without DB constraint), TD-2 (slug not normalized server-side), SM-1 (school data by direct ID input), PT-1 (school queries on every nav — set stale time), UX-2 (slug validated only on save), UX-4 (stale sidebar school name after save).

### Phase 4: Creator Profile Form

**Rationale:** Creator profile fully reuses Storage (Phase 2) and the `createServerCaller` pattern (Phase 3). It is the simplest phase — adding the `bio` field and avatar upload on top of already-proven infrastructure.
**Delivers:** `/dashboard/profile` page with display name, bio (textarea, 500 char limit), avatar upload widget; `auth.updateProfile` tRPC input updated to accept `bio`; timezone field (optional, captured now for v1.3 live classes); unsaved-changes guard on form.
**Addresses:** Creator display name + bio, creator avatar, unsaved-changes guard.
**Avoids:** Pitfall 3 (Supabase transform billing — do not use transforms for display), TD-4 (orphaned old avatar files not cleaned up), UX-1 (no upload progress feedback).

### Phase Ordering Rationale

- Layout first: it is the structural container; building pages before verifying layout correctness means reworking them.
- Storage second: three features across two phases depend on it; building upload UI before RLS is confirmed creates a class of bugs that are hard to distinguish from code errors.
- School before Profile: slug is the highest-risk feature (most failure modes documented), benefits from being built while patterns are fresh, and must ship before v1.2. `createServerCaller` introduced here is reused in Phase 4.
- Profile last: simplest phase, fully reapplies patterns established in Phases 2 and 3.
- The `bio` migration runs during Phase 3 to reduce the number of migration deployment round-trips.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (Storage):** RLS policy SQL syntax for Supabase Storage's `storage.objects` table is non-obvious and has changed across Supabase versions. The specific path-prefix check pattern should be verified against current Supabase docs before implementation — do not copy from older blog posts.
- **Phase 3 (School Setup):** The `createServerCaller` helper for RSC + tRPC in Next.js 14 App Router requires careful context construction; verify against current tRPC 10 docs for exact context shape expected by `createCaller` to avoid hydration mismatches.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Layout):** Next.js App Router route groups and shared layouts are well-documented; the existing `dashboard-shell.tsx` confirms the pattern already works in this codebase.
- **Phase 4 (Profile):** Fully reuses Storage and tRPC patterns established in Phases 2 and 3; no new architectural decisions required.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Based on direct codebase audit; existing packages confirmed; additions are minimal and low-risk |
| Features | MEDIUM-HIGH | Competitor features verified via official help centers and review sites; implementation patterns from Supabase and Next.js official docs |
| Architecture | HIGH | Based on direct codebase audit; existing router procedures and schema reviewed; integration points explicitly mapped with file paths |
| Pitfalls | MEDIUM-HIGH | Derived from known ecosystem patterns against confirmed stack; Supabase Storage RLS behavior verified via official docs |

**Overall confidence:** HIGH

### Gaps to Address

- **Slug UNIQUE constraint status:** Architecture research references `schools.slug` as fully defined but does not confirm whether a `UNIQUE` constraint exists in the current Drizzle migration. Verify `packages/db/src/schema.ts` before assuming the constraint is present — if missing, add it in a migration before the slug form is built.
- **`createServerCaller` exact implementation:** The helper must be written from scratch using `createCaller` from `packages/api/src/root.ts`. Verify tRPC 10 RSC docs for the exact context shape to avoid type mismatch with the existing API context.
- **Supabase project Storage bucket state:** Whether `school-assets` and `creator-assets` buckets already exist is unknown from research alone. Check the Supabase dashboard at the start of Phase 2 to avoid duplicate bucket creation errors.
- **`schools.updateBranding` branding JSONB shape:** The existing procedure accepts a `branding` JSONB field. Confirm the expected keys (`primaryColor`, `accentColor`, `logoUrl`, `faviconUrl`) before building the branding form to avoid a schema shape mismatch.

## Sources

### Primary (HIGH confidence)
- Direct codebase audit — `packages/db/src/schema.ts`, `packages/api/src/routers/schools.ts`, `packages/api/src/routers/auth.ts`, `apps/web/app/(dashboard)/` — all architecture findings
- Supabase Storage createSignedUploadUrl: https://supabase.com/docs/reference/javascript/storage-from-createsigneduploadurl
- Supabase Storage Access Control: https://supabase.com/docs/guides/storage/security/access-control
- tRPC with Next.js App Router + RSC: https://trpc.io/docs/client/tanstack-react-query/server-components
- Next.js App Router layouts: https://nextjs.org/docs/app/getting-started/layouts-and-pages

### Secondary (MEDIUM confidence)
- Teachable Help — Settings: https://support.teachable.com/en/articles/11682403-settings
- Thinkific Features Breakdown 2026 (SchoolMaker): https://www.schoolmaker.com/blog/thinkific-features
- Kajabi — Customize Site Brand Settings (official): https://help.kajabi.com/hc/en-us/articles/360037850453-How-to-Customize-Site-Brand-Settings
- Podia Dashboard Navigation (official): https://help.podia.com/en/articles/11370401-navigating-the-podia-dashboard
- Bypass Vercel 4.5MB limit with Supabase direct upload: https://medium.com/@jpnreddy25/how-to-bypass-vercels-4-5mb-body-size-limit-for-serverless-functions-using-supabase-09610d8ca387
- Async Slug Validation with React Hook Form + Zod: https://blog.benorloff.co/async-form-validation-with-zod-react-hook-form
- shadcn/ui Sidebar Admin Skeleton Best Practices: https://eastondev.com/blog/en/posts/dev/20260327-shadcn-ui-sidebar-layout/
- FOUC in Next.js App Router: https://dev.to/amritapadhy/understanding-fixing-fouc-in-nextjs-app-router-2025-guide-ojk
- Supabase Storage Image Transformations billing: https://supabase.com/docs/guides/storage/serving/image-transformations

### Tertiary (LOW confidence)
- White-Label SaaS Tenant Isolation: https://dev.to/jos_gonalves_fac39f3437/we-built-one-platform-that-powers-30-brands-the-white-label-saas-playbook-445d — brand leakage patterns (inference, not specific to this stack)

---
*Research completed: 2026-03-31*
*Ready for roadmap: yes*
