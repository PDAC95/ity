# Phase 9: DB Schema + tRPC Infrastructure - Research

**Researched:** 2026-04-07
**Domain:** Drizzle ORM schema extension + tRPC v10 router authoring
**Confidence:** HIGH

## Summary

Phase 9 adds two new Postgres tables (`landing_page_requests`, `notifications`) and two new tRPC routers (`landing`, `notifications`) into an already-working monorepo stack. The project uses Drizzle ORM 0.38 + drizzle-kit 0.30 with a `db:push` workflow (no migration files per phase — push applies diff only), and tRPC v10.45 with `protectedProcedure` + Zod input validation as the standard router pattern.

All patterns for schema definition (pgTable, jsonb, index, unique, relations) and router authoring (protectedProcedure, query/mutation, Zod, TRPCError) are already established by existing code in `packages/db/src/schema.ts` and `packages/api/src/routers/`. This phase is additive: extend schema.ts, add two new router files, register in root.ts, add env placeholders.

The `nyquist_validation` key is absent from `.planning/config.json` (only has `workflow.research/plan_check/verifier`), so there is no Validation Architecture section required.

**Primary recommendation:** Follow the established file patterns exactly. Schema goes into `packages/db/src/schema.ts`, routers into `packages/api/src/routers/`, registered in `packages/api/src/root.ts`. Do not create separate files for types — define TypeScript types alongside the table they belong to, matching the existing schema.ts convention.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Schema landing_page_requests:**
- 4 states: `draft` -> `pending` -> `in_progress` -> `completed`
  - `draft`: chat en curso, el creador puede retomar donde lo dejo
  - `pending`: PRD enviado, esperando que el equipo 12ity lo procese
  - `in_progress`: equipo trabajando en la landing
  - `completed`: landing lista
- Un solo request activo por escuela (cardinalidad 1:1 school -> active request)
- `templateId` como columna independiente (no dentro de JSONB)
- Dos columnas JSONB separadas: `prd_data` para el PRD final y `chat_history` para la transcripcion del chat
- Solo `templateId` en columna; la URL se resuelve desde el registry en codigo
- El chat parcial se guarda en DB como draft para que el creador pueda retomar

**Schema notifications:**
- Tipos v1.2: solo landing events (`landing_submitted`, `landing_completed`)
- Campos: creatorId, type, title, body, isRead, actionUrl (opcional), metadata (JSONB)
- `actionUrl` permite navegar al creador directamente al recurso relevante
- `metadata` JSONB para datos extra segun tipo (ej: `{ requestId: '...' }`)
- Retencion indefinida en v1.2 (bajo volumen, no se borran)
- Index en `creator_id` para queries eficientes
- RLS o query-level filtering para scoping por creador

**Routers tRPC - landing:**
- `getStatus`: devuelve status, templateId, createdAt, updatedAt. **Nunca** devuelve prdData ni chatHistory
- `saveDraft`: upsert automatico que crea o actualiza el request en estado 'draft' con chatHistory parcial
- `requestPage`: transiciona de draft a pending cuando el creador confirma el PRD

**Routers tRPC - notifications:**
- `list`: devuelve las ultimas 50 notificaciones, sin paginacion
- `unreadCount`: query separado e independiente de `list`
- `markRead`: marca una notificacion como leida
- `markAllRead`: marca todas como leidas

**Variables de entorno:**
- `ANTHROPIC_API_KEY` y `RESEND_API_KEY` se validan solo cuando se usan, no al arrancar la app
- Agregar placeholders al `.env.example`
- Resend: usar dominio de prueba/sandbox para v1.2

### Claude's Discretion

- Estructura exacta del schema Drizzle (tipos, defaults, constraints)
- Estrategia de indices adicionales
- Nombres exactos de procedimientos tRPC y validaciones Zod
- Manejo de errores en routers
- Estructura del JSONB de metadata en notifications

### Deferred Ideas (OUT OF SCOPE)

None -- discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| NOTF-05 | In-app notification created on landing page request submission | `notifications` table + `landing.requestPage` creates a notification row on status transition to `pending` |
| NOTF-07 | Notification system supports future status-change notifications (ready, revision) | `type` column as `varchar` (not enum) allows new values without migration; `metadata` JSONB handles per-type payload |
| SEC-05 | Notifications scoped to creator via RLS or query-level filtering | `notifications.list` and `unreadCount` use `eq(notifications.creatorId, ctx.user.id)` — query-level scoping consistent with existing router pattern (schools, courses use same approach) |
</phase_requirements>

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| drizzle-orm | ^0.38.0 | Schema definition + query builder | Already in use; all tables defined here |
| drizzle-kit | ^0.30.0 | `db:push` to apply schema diff | Already in use; `db:push` is the project's deploy pattern |
| @trpc/server | ^10.45.0 | Router + procedure definition | Already in use; all API logic lives here |
| zod | ^3.23.0 | Input validation on tRPC procedures | Already in use; every procedure uses it |
| superjson | ^2.2.0 | tRPC transformer (dates, etc.) | Already configured in `trpc.ts` |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| postgres (pg driver) | ^3.4.0 | DB connection underlying drizzle | Already wired in `client.ts` — no changes needed |
| @supabase/supabase-js | ^2.45.0 | Auth context in tRPC | Already in `Context` type — no changes needed |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `varchar` for status | `pgEnum` | pgEnum is type-safer but requires a migration if values change; varchar with Zod enum validation is more flexible for evolving states |
| `varchar` for notification type | `pgEnum` | Same reasoning — NOTF-07 requires extensibility; varchar + Zod literal union wins |
| query-level creator scoping | Supabase RLS | RLS is more robust but requires `supabase` client with user JWT in every DB call; existing routers already use query-level `eq(table.creatorId, ctx.user.id)` — consistent and sufficient at v1.2 volume |

**Installation:** No new packages needed. All dependencies already present in the monorepo.

---

## Architecture Patterns

### Recommended Project Structure

```
packages/db/src/
└── schema.ts              # ADD: landingPageRequests + notifications tables + types + relations

packages/api/src/
├── routers/
│   ├── landing.ts         # NEW: landingRouter (getStatus, saveDraft, requestPage)
│   └── notifications.ts   # NEW: notificationsRouter (list, unreadCount, markRead, markAllRead)
└── root.ts                # MODIFY: register landing + notifications routers

ity/ (monorepo root)
└── .env.example           # MODIFY: add ANTHROPIC_API_KEY + RESEND_API_KEY placeholders
```

### Pattern 1: Table Definition with JSONB + Index

Follows the established schema.ts pattern exactly. All existing tables use array syntax `(table) => [...]` for table-level constraints.

```typescript
// Source: /drizzle-team/drizzle-orm-docs + existing schema.ts convention
import { pgTable, uuid, varchar, text, boolean, timestamp, jsonb, index } from 'drizzle-orm/pg-core';

// TypeScript types defined alongside the table (project convention)
export type LandingPageRequestStatus = 'draft' | 'pending' | 'in_progress' | 'completed';

export type ChatHistory = Array<{
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}>;

// prd_data type will be defined in Phase 12 (PRD-01); use Record<string, unknown> for now
export type PrdData = Record<string, unknown>;

export const landingPageRequests = pgTable(
  'landing_page_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    schoolId: uuid('school_id')
      .references(() => schools.id, { onDelete: 'cascade' })
      .notNull(),
    templateId: varchar('template_id', { length: 100 }).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('draft'),
    prdData: jsonb('prd_data').$type<PrdData>(),
    chatHistory: jsonb('chat_history').$type<ChatHistory>(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index('landing_requests_school_idx').on(table.schoolId),
    index('landing_requests_status_idx').on(table.status),
  ]
);

export type NotificationType = 'landing_submitted' | 'landing_completed';

export type NotificationMetadata = {
  requestId?: string;
  [key: string]: unknown;
};

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    creatorId: uuid('creator_id')
      .references(() => creators.id, { onDelete: 'cascade' })
      .notNull(),
    type: varchar('type', { length: 100 }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    body: text('body').notNull(),
    isRead: boolean('is_read').notNull().default(false),
    actionUrl: varchar('action_url', { length: 500 }),
    metadata: jsonb('metadata').$type<NotificationMetadata>(),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => [
    index('notifications_creator_idx').on(table.creatorId),
    index('notifications_is_read_idx').on(table.creatorId, table.isRead),
  ]
);
```

**Note on 1:1 school -> active request:** The unique constraint is enforced at the application layer (check for existing non-completed request in `saveDraft`/`requestPage`), not DB-level unique constraint. This avoids complications if completed requests need to be preserved in history. The router throws `CONFLICT` if a non-completed request already exists for the school.

### Pattern 2: tRPC Router (protectedProcedure + Zod + TRPCError)

Follows the exact pattern from existing routers (schools.ts, creators.ts):

```typescript
// Source: /trpc/trpc + existing routers convention
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { landingPageRequests, notifications } from '@ity/db';
import { eq, and, desc } from 'drizzle-orm';

export const landingRouter = router({
  getStatus: protectedProcedure
    .input(z.object({ schoolId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const req = await ctx.db.query.landingPageRequests.findFirst({
        where: and(
          eq(landingPageRequests.schoolId, input.schoolId),
          // ownership: verify school belongs to ctx.user.id via join or separate check
        ),
        columns: {
          id: true,
          status: true,
          templateId: true,
          createdAt: true,
          updatedAt: true,
          // prdData and chatHistory explicitly excluded
        },
      });
      return req ?? null;
    }),

  saveDraft: protectedProcedure
    .input(z.object({
      schoolId: z.string().uuid(),
      templateId: z.string(),
      chatHistory: z.array(z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
        timestamp: z.string(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      // upsert: insert or update existing draft
    }),

  requestPage: protectedProcedure
    .input(z.object({
      schoolId: z.string().uuid(),
      prdData: z.record(z.unknown()),
    }))
    .mutation(async ({ ctx, input }) => {
      // transition draft -> pending, store prdData
    }),
});
```

### Pattern 3: Drizzle `columns` selector for field exclusion

The `getStatus` procedure must never return `prdData` or `chatHistory`. Drizzle's `findFirst` with `columns` object achieves this:

```typescript
// Source: drizzle-orm docs - partial select
const result = await ctx.db.query.landingPageRequests.findFirst({
  where: eq(landingPageRequests.schoolId, schoolId),
  columns: {
    id: true,
    status: true,
    templateId: true,
    createdAt: true,
    updatedAt: true,
    // prdData: not listed = excluded from result
    // chatHistory: not listed = excluded from result
  },
});
```

### Pattern 4: Drizzle upsert for saveDraft

Drizzle supports `onConflictDoUpdate` for upsert. Since there's no unique constraint on `schoolId` alone (to allow history if needed), `saveDraft` should use `findFirst` + conditional insert/update:

```typescript
const existing = await ctx.db.query.landingPageRequests.findFirst({
  where: and(
    eq(landingPageRequests.schoolId, input.schoolId),
    eq(landingPageRequests.status, 'draft')
  ),
});

if (existing) {
  await ctx.db.update(landingPageRequests)
    .set({ chatHistory: input.chatHistory, templateId: input.templateId, updatedAt: new Date() })
    .where(eq(landingPageRequests.id, existing.id));
  return existing.id;
} else {
  const [created] = await ctx.db.insert(landingPageRequests)
    .values({ ...input, status: 'draft' })
    .returning({ id: landingPageRequests.id });
  return created.id;
}
```

### Pattern 5: Registering routers in root.ts

```typescript
// packages/api/src/root.ts
import { landingRouter } from './routers/landing';
import { notificationsRouter } from './routers/notifications';

export const appRouter = router({
  auth: authRouter,
  schools: schoolsRouter,
  courses: coursesRouter,
  creators: creatorsRouter,
  landing: landingRouter,       // ADD
  notifications: notificationsRouter, // ADD
});
```

### Pattern 6: Ownership verification for landing requests

The `schools` table has `creatorId`. To verify a school belongs to the authenticated creator before operating on its landing request, use a join or two-step query:

```typescript
// Verify school ownership then operate on landing request
const school = await ctx.db.query.schools.findFirst({
  where: and(eq(schools.id, input.schoolId), eq(schools.creatorId, ctx.user.id)),
});
if (!school) throw new TRPCError({ code: 'NOT_FOUND', message: 'School not found' });
```

This is the same pattern used in `schoolsRouter.get` and is the correct approach for authorization.

### Anti-Patterns to Avoid

- **Don't put templateId inside prdData JSONB:** Locked decision — templateId is a separate column for query/filter capability.
- **Don't return prdData or chatHistory from getStatus:** These are internal fields. Use Drizzle `columns` selector to explicitly exclude.
- **Don't use pgEnum for status or type:** Use varchar + Zod enum validation. Enums require a migration step if values are added (NOTF-07 extensibility requirement).
- **Don't validate env vars at module load time:** `ANTHROPIC_API_KEY` and `RESEND_API_KEY` are validated only at use-time (Phases 12-13). This phase only adds placeholders to `.env.example`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Field exclusion in queries | Manual object spread to remove keys | Drizzle `columns: { field: true }` selector | Type-safe, no accidental leakage |
| Upsert logic | Complex transaction with locks | findFirst + conditional insert/update | Simple, no race conditions at v1.2 volume |
| Creator scoping | Custom middleware | `eq(table.creatorId, ctx.user.id)` in every query | Existing project pattern; consistent with all other routers |

---

## Common Pitfalls

### Pitfall 1: Relations not exported from schema.ts

**What goes wrong:** Drizzle relational queries (`ctx.db.query.landingPageRequests.findFirst`) require `relations()` declarations AND the table must be included in the `drizzle()` client schema object.

**Why it happens:** The `client.ts` does `import * as schema from './schema'` — if `landingPageRequests` and `notifications` tables and their relations are exported from `schema.ts`, they're automatically included.

**How to avoid:** Export both the table constant and its relations from `schema.ts`. Also export the new TypeScript types.

**Warning signs:** TypeScript error `Property 'landingPageRequests' does not exist on type 'DrizzleTypeError<...>'` when trying `ctx.db.query.landingPageRequests`.

### Pitfall 2: Forgetting to add schoolsRelations and creatorsRelations inverse entries

**What goes wrong:** Drizzle relational queries from `schools` or `creators` won't be able to include `landingPageRequests` or `notifications` unless the inverse side is added.

**Why it happens:** New tables reference existing ones, but existing `schoolsRelations` and `creatorsRelations` don't know about the new tables yet.

**How to avoid:** Update `schoolsRelations` to add `many(landingPageRequests)`, update `creatorsRelations` to add `many(notifications)`.

**Warning signs:** Drizzle `with: { landingPageRequests: true }` on a school query fails at type-check.

### Pitfall 3: `db:push` confirmation prompts in CI/non-interactive

**What goes wrong:** `drizzle-kit push` can prompt for confirmation when dropping columns or tables. New tables are additive and won't trigger this, but if schema.ts has diverged, it may ask.

**Why it happens:** `db:push` is interactive by default.

**How to avoid:** Run `db:push` locally and confirm visually. For this phase (only adding new tables), no confirmation prompts expected.

### Pitfall 4: JSONB columns without `.$type<T>()` lose TypeScript inference

**What goes wrong:** `jsonb()` without `.$type<>()` types the column as `unknown`, forcing type assertions everywhere.

**Why it happens:** Drizzle cannot infer JSONB structure automatically.

**How to avoid:** Always use `.$type<YourType>()` on JSONB columns. Define the TypeScript type in the same file.

### Pitfall 5: `isRead` default not set at DB level

**What goes wrong:** If `isRead` only has a TypeScript default and not a DB-level default, bulk inserts outside Drizzle won't apply the default.

**How to avoid:** Use `.notNull().default(false)` — Drizzle generates `DEFAULT false NOT NULL` in SQL. Verified in the existing schema pattern (`is_published boolean DEFAULT false`).

---

## Code Examples

Verified patterns from official sources and existing codebase:

### JSONB column with type
```typescript
// Source: /drizzle-team/drizzle-orm-docs
prdData: jsonb('prd_data').$type<PrdData>(),
chatHistory: jsonb('chat_history').$type<ChatHistory>(),
metadata: jsonb('metadata').$type<NotificationMetadata>(),
```

### Index definition (array syntax — matches existing schema.ts)
```typescript
// Source: existing schema.ts (schools, courses, etc.)
(table) => [
  index('notifications_creator_idx').on(table.creatorId),
  index('notifications_is_read_idx').on(table.creatorId, table.isRead),
]
```

### Query-level creator scoping (SEC-05)
```typescript
// Source: existing routers/schools.ts pattern
const results = await ctx.db.query.notifications.findMany({
  where: eq(notifications.creatorId, ctx.user.id),
  orderBy: (notifications, { desc }) => [desc(notifications.createdAt)],
  limit: 50,
});
```

### unreadCount (separate lightweight query)
```typescript
// Source: drizzle-orm select with count
import { count } from 'drizzle-orm';

const [{ value }] = await ctx.db
  .select({ value: count() })
  .from(notifications)
  .where(and(
    eq(notifications.creatorId, ctx.user.id),
    eq(notifications.isRead, false)
  ));
return value;
```

### markAllRead mutation
```typescript
await ctx.db
  .update(notifications)
  .set({ isRead: true })
  .where(and(
    eq(notifications.creatorId, ctx.user.id),
    eq(notifications.isRead, false)
  ));
return { success: true };
```

### .env.example additions
```bash
# AI (Phase 12 - Chat Wizard)
ANTHROPIC_API_KEY=sk-ant-xxx

# Email (Phase 13 - Notifications)
RESEND_API_KEY=re_xxx
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `pgTable(name, cols, (t) => ({ idx: index(...) }))` object syntax | `pgTable(name, cols, (t) => [...])` array syntax | Drizzle ORM ~0.30+ | Existing schema already uses array syntax — match it |
| Separate migration files per change | `db:push` for development diff | Project decision (STATE.md) | No new migration file needed; push handles it |

---

## Open Questions

1. **1:1 school->active request enforcement**
   - What we know: Decision is "un solo request activo por escuela"
   - What's unclear: Whether to enforce with a DB partial unique index (`WHERE status != 'completed'`) or application-layer check only
   - Recommendation: Application-layer check in `saveDraft` and `requestPage` (throw `CONFLICT` if non-completed request exists). Simpler, avoids a DB-specific partial index. Sufficient at v1.2 volume. Revisit if needed in v1.3.

2. **`count()` import path in Drizzle 0.38**
   - What we know: `count` is exported from `drizzle-orm` in recent versions
   - What's unclear: Whether the exact import is `import { count } from 'drizzle-orm'` or `sql\`count(*)\``
   - Recommendation: Use `sql\`count(*)\`` as fallback if `count` import is unavailable — already proven in the codebase via `sql` usage. Verify at implementation time.

---

## Sources

### Primary (HIGH confidence)
- `/drizzle-team/drizzle-orm-docs` — jsonb column definition, index array syntax, unique constraints, columns selector
- `/trpc/trpc` — router/procedure/mutation/query patterns with Zod v10
- `packages/db/src/schema.ts` — authoritative source for project conventions (index naming, relations pattern, JSONB usage)
- `packages/api/src/routers/schools.ts` — authoritative source for router pattern (protectedProcedure, TRPCError, ownership verification)
- `packages/api/src/trpc.ts` — Context shape, protectedProcedure definition
- `packages/api/src/root.ts` — Router registration pattern

### Secondary (MEDIUM confidence)
- `packages/db/drizzle/0000_greedy_hex.sql` — Confirms `db:push` generated SQL format for existing tables (JSONB, uuid, boolean DEFAULT false)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed and in use; no new dependencies
- Architecture: HIGH — patterns directly observed in existing codebase; nothing inferred
- Pitfalls: HIGH — most derived from reading actual code (relations exports, db.query requirement)
- Schema design: HIGH — locked decisions from CONTEXT.md; Drizzle patterns verified via Context7

**Research date:** 2026-04-07
**Valid until:** 2026-05-07 (stable stack, no fast-moving dependencies)
