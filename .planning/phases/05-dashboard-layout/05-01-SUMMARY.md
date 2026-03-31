---
phase: 05-dashboard-layout
plan: "01"
subsystem: dashboard-ui
tags: [dashboard, layout, sidebar, navigation, framer-motion, dark-theme]
dependency_graph:
  requires: []
  provides: [dashboard-layout, sidebar-nav, mobile-nav, coming-soon-page]
  affects: [phase-06, phase-07, phase-08]
tech_stack:
  added: [framer-motion-AnimatePresence, avatar-util]
  patterns: [dark-zinc-theme, shared-SidebarContent, RSC-to-client-props, deterministic-avatar-color]
key_files:
  created:
    - apps/web/app/(dashboard)/coming-soon/page.tsx
    - apps/web/lib/utils/avatar.ts
  modified:
    - apps/web/app/(dashboard)/layout.tsx
    - apps/web/app/(dashboard)/dashboard-shell.tsx
    - apps/web/components/dashboard/sidebar.tsx
    - apps/web/components/dashboard/header.tsx
    - apps/web/components/dashboard/mobile-nav.tsx
decisions:
  - "SidebarContent extracted as shared component used by both desktop aside and MobileNav overlay — eliminates duplication"
  - "avatar.ts utility created for DRY deterministic color + initials logic shared across sidebar and header"
  - "maybeSingle() used for school query — avoids PGRST116 error when creator has no school yet"
  - "md breakpoint (768px) used throughout — consistent with CONTEXT.md spec, not old lg (1024px)"
metrics:
  duration: "6min"
  completed_date: "2026-03-31"
  tasks_completed: 2
  files_changed: 7
---

# Phase 5 Plan 01: Dashboard Layout + Dark Zinc Theme Summary

Dark zinc Linear/Vercel-style dashboard shell with dark sidebar, framer-motion mobile nav, and locked navigation structure for future phases.

## What Was Built

### Task 1: RSC Layout Extension + DashboardShell Rewrite

The RSC layout (`layout.tsx`) now fetches creator profile and school data in parallel via `Promise.all()`, passing structured typed props to `DashboardShell`. The `maybeSingle()` call on schools avoids the PGRST116 error for creators without a school yet.

`DashboardShell` was rewritten with exported `CreatorData` and `SchoolData` interfaces (used by all child components), dark `bg-zinc-950` content area, `md` breakpoint desktop sidebar, and properly typed props flowing down to Sidebar, Header, and MobileNav.

### Task 2: Sidebar, Header, Mobile Nav, Coming-Soon

**sidebar.tsx:** Full dark zinc rewrite. `SidebarContent` is exported as the shared implementation used by both the desktop `<aside>` in the shell and the MobileNav overlay. Three active nav items (Inicio, Configurar Escuela, Mi Perfil) use `bg-zinc-800 + indigo left accent bar` via `before:` pseudo-element. Five locked items (Cursos, Alumnos, Metricas, Equipo, Dominio) render as dimmed links with `Lock` icon pointing to `/dashboard/coming-soon`. Bottom section shows creator mini-profile with avatar/initials and a sign-out button.

**header.tsx:** Dark sticky header (`bg-zinc-900 border-zinc-800`) with `SECTION_TITLES` pathname map for dynamic section title. Avatar dropdown shows Mi Perfil link and Cerrar sesion button with red-400 color. Mobile shows hamburger button; desktop shows creator name + avatar.

**mobile-nav.tsx:** `AnimatePresence` wraps conditional `{open && (...)}` JSX (not early return) enabling exit animations. Slide-in from left with overlay fade. Swipe-to-close via `drag="x"` with `onDragEnd` velocity check (`< -80px offset` or `< -300px/s velocity`). Uses shared `SidebarContent`.

**coming-soon/page.tsx:** Simple RSC page with centered dashed-border card, Lock icon, "Proximamente" heading, and description paragraph.

**lib/utils/avatar.ts:** `getAvatarColor()` (deterministic by first char charCode) and `getInitials()` shared across sidebar and header.

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Export SidebarContent separately from Sidebar | Enables MobileNav to reuse exact same nav content without duplication |
| Create lib/utils/avatar.ts | Both sidebar and header needed the same deterministic color + initials logic — DRY |
| Use maybeSingle() for school query | Single school may not exist for new creators; .single() would throw PGRST116 |
| Export CreatorData / SchoolData from dashboard-shell | Type sharing across Sidebar, Header, MobileNav without circular imports |
| md breakpoint (768px) | Matches CONTEXT.md spec — old sidebar used lg (1024px) which was incorrect |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript error in avatar.ts array index return type**
- **Found during:** Task 1 TypeScript verification
- **Issue:** `AVATAR_COLORS[index]` returns `string | undefined` in strict mode; return type declared as `string`
- **Fix:** Added `?? 'bg-indigo-600'` fallback to satisfy strict type narrowing
- **Files modified:** apps/web/lib/utils/avatar.ts
- **Commit:** f86c86a (included in task 2 commit)

## Self-Check: PASSED

All files verified present. Both task commits confirmed in git log.

| Check | Result |
|-------|--------|
| apps/web/app/(dashboard)/layout.tsx | FOUND |
| apps/web/app/(dashboard)/dashboard-shell.tsx | FOUND |
| apps/web/components/dashboard/sidebar.tsx | FOUND |
| apps/web/components/dashboard/header.tsx | FOUND |
| apps/web/components/dashboard/mobile-nav.tsx | FOUND |
| apps/web/app/(dashboard)/coming-soon/page.tsx | FOUND |
| apps/web/lib/utils/avatar.ts | FOUND |
| Commit ecafc81 (Task 1) | FOUND |
| Commit f86c86a (Task 2) | FOUND |
