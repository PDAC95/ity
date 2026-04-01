# Stack Research

**Domain:** Creator Dashboard + School Setup
**Researched:** 2026-03-31
**Confidence:** HIGH

## Context

This is a v1.1 additive milestone. The project already has a working
CSS-variable-based Tailwind theme (shadcn/ui token names), `react-hook-form` +
`zod` + `@hookform/resolvers`, `lucide-react`, `framer-motion`, `sonner`, and
`zustand`. The `packages/ui` package is intentionally thin (only `cn` exported).
The `(dashboard)` route group and its sidebar/header shell components already
exist as custom Tailwind components.

The schema (`packages/db`) already has the `schools.branding` jsonb column
typed as `Branding` (`logo?`, `primaryColor`, `secondaryColor`, `font`,
`favicon?`), plus `schools.slug`, `schools.name`, `schools.description`, and
`creators.avatarUrl`. **No schema migrations are required for this milestone.**

---

## Recommended Stack

### Core Technologies (already present — no changes needed)

| Technology | Version | Purpose | Notes |
|------------|---------|---------|-------|
| Next.js | ^14.2.0 | App Router framework | Use (dashboard) route group already in place |
| tRPC | ^10.45.0 | Type-safe API | Add `school.update`, `creator.updateProfile` mutations |
| Drizzle ORM | (packages/db) | DB access | Schema already supports all v1.1 fields |
| react-hook-form | ^7.54.0 | Form state | Already installed; use for all new forms |
| zod | ^3.23.0 | Schema validation | Already installed; reuse for new mutation inputs |
| @hookform/resolvers | ^3.9.0 | zod → RHF bridge | Already installed |

### New Libraries to Add

| Library | Version | Purpose | Why Recommended |
|---------|---------|---------|-----------------|
| shadcn/ui (CLI-generated) | latest registry | Button, Input, Textarea, Select, Card, Label, Separator, Avatar, Tooltip, Dialog | CSS variables already configured; components are copied into the repo (no version lock). Consistent with existing token names. Replaces ad-hoc Tailwind markup in forms. |
| react-colorful | ^5.6.1 | Hex color picker for branding `primaryColor` / `secondaryColor` | 2.8 KB gzipped, zero deps, tree-shakeable, mobile-friendly, accessible. Last update was 2022 but the API is stable and the package is widely trusted. Accepts `#hex` strings — matches the Branding type exactly. |
| uploadthing + @uploadthing/react | ^7.x (uploadthing 7.7.4 / @uploadthing/react 7.3.3) | School logo + creator avatar uploads | Handles presigned URL generation on your server, direct-to-storage client uploads (bypasses Vercel's 4.5 MB body limit), built-in drag-and-drop `<UploadButton>` and `<UploadDropzone>` components, fully typed. Preferred over Supabase Storage for this use case (see Alternatives). |

### Development Tools (no changes needed)

| Tool | Purpose | Notes |
|------|---------|-------|
| pnpm dlx shadcn@latest add | Scaffold UI primitives into `packages/ui` or `apps/web/components/ui` | Run once per component. Copy to `packages/ui/src/` if components are shared across apps; keep in `apps/web/components/ui/` if web-only. For v1.1 all dashboard UI is web-only. |

---

## Installation

### 1. shadcn/ui primitive components

Run from `apps/web/` (components land in `components/ui/` by default):

```bash
pnpm dlx shadcn@latest add button input textarea label card separator avatar tooltip dialog select
```

The project already has `components.json` patterns established (CSS variables in
`globals.css`, `tailwind-merge` + `clsx` + `class-variance-authority` in
`package.json`). If `components.json` does not exist yet, initialize first:

```bash
pnpm dlx shadcn@latest init
```

Choose: TypeScript, default style, CSS variables, `components/ui` path.

### 2. react-colorful

```bash
pnpm add react-colorful --filter @ity/web
```

### 3. uploadthing

```bash
pnpm add uploadthing @uploadthing/react --filter @ity/web
```

Add the route handler at `apps/web/app/api/uploadthing/route.ts` and a server
config at `apps/web/lib/uploadthing.ts`. Set `UPLOADTHING_TOKEN` in `.env`.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| UI primitives | shadcn/ui (CLI) | Radix UI directly | More boilerplate; shadcn wraps Radix with the exact token system already configured in this project |
| UI primitives | shadcn/ui (CLI) | Headless UI (Tailwind Labs) | Less component coverage for dashboard needs (no Combobox, Select, Avatar etc. without extra work) |
| UI primitives | shadcn/ui (CLI) | Chakra UI / MUI | Heavy bundles, opinion conflicts with existing Tailwind setup |
| Color picker | react-colorful | react-color | react-color is unmaintained and 13x heavier; react-colorful is the de-facto replacement |
| Color picker | react-colorful | @uiw/react-color | Larger, more complex API; overkill for picking two brand colors |
| Color picker | react-colorful | Custom `<input type="color">` | No preview, no hex text input, inconsistent browser UI; not acceptable for a brand settings form |
| File uploads | uploadthing | Supabase Storage (direct) | Supabase Storage requires manual RLS bucket setup, signed URL generation, and a custom UI. Vercel's 4.5 MB serverless body limit is a real problem for image uploads through tRPC/API routes. uploadthing generates presigned URLs server-side and the browser uploads directly — no body-size issue. Also provides ready-made drag-and-drop components. |
| File uploads | uploadthing | Vercel Blob | Viable alternative but adds another vendor. Project already uses Supabase for everything else. uploadthing can be configured to store in S3/R2/Supabase under the hood if needed. The DX advantage (typed route config, built-in components) is the same. |
| File uploads | uploadthing | `<input type="file">` + base64 in tRPC | Base64 inflates payload ~33%. Combined with Vercel's 4.5 MB limit this would cap usable image size to ~3 MB. Not viable. |
| Form library | react-hook-form (existing) | Formik | Already installed; no change needed |
| Slug validation | tRPC mutation with Drizzle `eq` query | External slug library | Slugification is simple enough (`name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')`) as a utility function; no extra package needed |

---

## What NOT to Add

| Package | Reason |
|---------|--------|
| Radix UI primitives directly | shadcn/ui CLI installs them as transitive deps when needed; avoid double-managing |
| react-color | Unmaintained, heavy (38 KB), superseded by react-colorful |
| @tanstack/react-table | Overkill for v1.1; no data tables needed yet (courses/students are future milestones) |
| react-dropzone standalone | Already included inside @uploadthing/react's UploadDropzone component |
| next-cloudinary / ImageKit SDK | Adds vendor; not needed — uploadthing handles upload + CDN URL |
| Framer Motion for page transitions | Already installed; don't add a second animation library |
| Headless UI | Radix (via shadcn) covers the same primitives with better DX for this codebase |
| zustand slices for school config | Already installed; a single `useSchoolStore` or simple form state with RHF is enough. Avoid premature global state. |
| @radix-ui/react-color-area | Experimental, not production-ready as of 2025 |

---

## Schema Notes (no migrations needed)

The `schools.branding` jsonb column is already typed:

```typescript
export type Branding = {
  logo?: string;         // uploadthing CDN URL after upload
  primaryColor: string;  // hex string e.g. "#6366F1"
  secondaryColor: string;
  font: AvailableFont;
  favicon?: string;
};
```

`creators.avatarUrl` is already a `varchar(500)`.

`schools.slug` is already a unique `varchar(100)`.

The tRPC mutations to add in `packages/api`:
- `school.update` — accepts `{ name, slug, description, branding }`, validates slug uniqueness with a Drizzle `eq` query before update
- `creator.updateProfile` — accepts `{ name, bio?, avatarUrl? }`

Slug uniqueness check pattern (no new package):

```typescript
// In school.update mutation
const existing = await db.query.schools.findFirst({
  where: (s, { eq, and, ne }) => and(
    eq(s.slug, input.slug),
    ne(s.id, ctx.school.id)
  ),
});
if (existing) throw new TRPCError({ code: 'CONFLICT', message: 'SLUG_TAKEN' });
```

---

## Sources

- [uploadthing npm — version 7.7.4](https://www.npmjs.com/package/uploadthing) — MEDIUM confidence (WebSearch)
- [UploadThing v7 launch blog](https://docs.uploadthing.com/blog/v7-launch) — MEDIUM confidence (WebSearch)
- [UploadThing FAQ (Vercel + edge runtime)](https://docs.uploadthing.com/faq) — MEDIUM confidence (WebSearch)
- [react-colorful GitHub — 2.8 KB, zero deps](https://github.com/omgovich/react-colorful) — HIGH confidence (multiple sources agree)
- [shadcn/ui Next.js installation](https://ui.shadcn.com/docs/installation/next) — HIGH confidence (official docs, WebSearch)
- [shadcn/ui Sidebar component (added late 2024)](https://ui.shadcn.com/docs/changelog) — HIGH confidence (official docs)
- [Vercel 4.5 MB body limit + Supabase bypass pattern](https://medium.com/@jpnreddy25/how-to-bypass-vercels-4-5mb-body-size-limit-for-serverless-functions-using-supabase-09610d8ca387) — MEDIUM confidence (WebSearch, corroborated by uploadthing FAQ)
- [Supabase Storage with Next.js](https://supabase.com/docs/guides/storage/security/access-control) — HIGH confidence (official Supabase docs)
- Existing codebase inspection (`apps/web/package.json`, `packages/db/src/schema.ts`, `tailwind.config.ts`, `globals.css`, `components/dashboard/sidebar.tsx`) — HIGH confidence (direct read)
