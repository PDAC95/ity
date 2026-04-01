# Roadmap: 12ity

## Milestones

- ✅ **v1.0 Auth & Security** — Phases 1-4 (shipped 2026-03-31)
- 🚧 **v1.1 Creator Dashboard** — Phases 5-8 (in progress)

## Phases

<details>
<summary>✅ v1.0 Auth & Security (Phases 1-4) — SHIPPED 2026-03-31</summary>

- [x] Phase 1: Security Foundation (2/2 plans) — completed 2026-03-04
- [x] Phase 2: Complete Auth Flows (4/4 plans) — completed 2026-03-17
- [x] Phase 3: Rate Limiting (2/2 plans) — completed 2026-03-17
- [x] Phase 4: Session Management (2/2 plans) — completed 2026-03-31

See: `.planning/milestones/v1.0-ROADMAP.md` for full details.

</details>

### 🚧 v1.1 Creator Dashboard (In Progress)

**Milestone Goal:** El creador tiene un dashboard funcional donde configura su escuela y perfil, con la estructura de navegación lista para features futuras.

- [x] **Phase 5: Dashboard Layout** - Sidebar, header, home con onboarding checklist, y placeholders de secciones futuras (completed 2026-03-31)
- [ ] **Phase 6: Storage Infrastructure** - Supabase Storage buckets, RLS policies, Server Actions para signed URLs, y upload widgets reutilizables
- [ ] **Phase 7: School Setup** - Formulario de escuela: nombre, descripción, slug con validación en tiempo real, y colores de marca
- [ ] **Phase 8: Creator Profile** - Formulario de perfil: nombre visible, bio, foto de perfil, y datos de contacto

## Phase Details

### Phase 5: Dashboard Layout
**Goal**: El creador puede navegar por el dashboard y ve la estructura completa de secciones, incluyendo un checklist de onboarding en la pantalla de inicio.
**Depends on**: Phase 4 (v1.0 auth layer)
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04, DASH-05
**Success Criteria** (what must be TRUE):
  1. Creator sees a persistent sidebar with links to School Setup and My Profile (active) plus locked placeholders for Courses, Students, Analytics, Team, and Domain
  2. Creator sees their display name and avatar in the dashboard header on every page
  3. On mobile, the sidebar collapses to a hamburger menu and closes automatically after navigating to a section
  4. Dashboard home shows an onboarding checklist listing pending setup steps with links to each section
  5. Clicking a locked placeholder section shows a "Próximamente" message, not a broken page
**Plans**: 2 plans

Plans:
- [ ] 05-01-PLAN.md — Dashboard route group layout, sidebar, header, mobile nav, and coming-soon page
- [ ] 05-02-PLAN.md — Dashboard home page with onboarding checklist

### Phase 6: Storage Infrastructure
**Goal**: Los uploads de archivos (logo de escuela y avatar del creador) tienen la infraestructura completa — buckets, RLS policies, Server Actions, y widgets reutilizables — lista para ser consumida por fases posteriores.
**Depends on**: Phase 5
**Requirements**: SCHOOL-02, PROF-02
**Success Criteria** (what must be TRUE):
  1. A creator can select an image file in an upload widget and the file is uploaded directly to Supabase Storage (not routed through Next.js serverless functions)
  2. Upload widget validates file type and size on the client before requesting a signed URL, blocking invalid files with an inline error
  3. Upload widget shows a progress indicator while the upload is in flight
  4. A creator cannot access or overwrite another creator's uploaded files (RLS policy enforced at storage level)
**Plans**: 2 plans

Plans:
- [ ] 06-01-PLAN.md — Supabase Storage bucket (SQL migration), RLS policies, and getSignedUploadUrl Server Action
- [ ] 06-02-PLAN.md — Reusable ImageUploadWidget client component with validation, XHR progress, and drag-and-drop

### Phase 7: School Setup
**Goal**: El creador puede configurar completamente su escuela — nombre, descripción, slug único, y colores de marca — con todos los cambios persistidos en base de datos.
**Depends on**: Phase 6
**Requirements**: SCHOOL-01, SCHOOL-03, SCHOOL-04
**Success Criteria** (what must be TRUE):
  1. Creator can edit school name and description and see the saved values when returning to the page
  2. Creator can type a school slug and see a real-time availability indicator (available / taken / invalid format) without submitting the form
  3. Two creators cannot save the same slug — a conflict on submit shows an inline "este slug ya está en uso" error
  4. Creator can pick primary and accent brand colors using a color picker and see the hex values saved
  5. Creator sees a success toast after saving and an unsaved-changes warning before navigating away with edits
**Plans**: TBD

Plans:
- [ ] 07-01: School Setup page — name, description, slug field with real-time availability check, and updateSlug tRPC procedure
- [ ] 07-02: School Branding page — logo upload, favicon upload, and color pickers

### Phase 8: Creator Profile
**Goal**: El creador puede configurar su identidad pública — nombre visible, bio, foto de perfil, y datos de contacto — con los cambios persistidos en base de datos.
**Depends on**: Phase 7
**Requirements**: PROF-01, PROF-03
**Success Criteria** (what must be TRUE):
  1. Creator can edit their display name and bio (up to 500 characters) and see the saved values when returning to the page
  2. Creator can add a contact email and social media links and see them saved when returning to the page
  3. Creator sees a success toast after saving and an unsaved-changes warning before navigating away with edits
**Plans**: TBD

Plans:
- [ ] 08-01: Creator Profile page — display name, bio, contact email, social links, and avatar upload

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Security Foundation | v1.0 | 2/2 | Complete | 2026-03-04 |
| 2. Complete Auth Flows | v1.0 | 4/4 | Complete | 2026-03-17 |
| 3. Rate Limiting | v1.0 | 2/2 | Complete | 2026-03-17 |
| 4. Session Management | v1.0 | 2/2 | Complete | 2026-03-31 |
| 5. Dashboard Layout | 2/2 | Complete   | 2026-03-31 | - |
| 6. Storage Infrastructure | 1/2 | In Progress|  | - |
| 7. School Setup | v1.1 | 0/2 | Not started | - |
| 8. Creator Profile | v1.1 | 0/1 | Not started | - |
