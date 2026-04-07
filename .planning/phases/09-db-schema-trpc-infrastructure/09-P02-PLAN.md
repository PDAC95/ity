---
phase: 09-db-schema-trpc-infrastructure
plan: 02
type: execute
wave: 2
depends_on: [01]
files_modified:
  - ity/packages/api/src/routers/landing.ts
  - ity/packages/api/src/routers/notifications.ts
  - ity/packages/api/src/root.ts
autonomous: true
requirements: [NOTF-05, NOTF-07, SEC-05]

must_haves:
  truths:
    - "landing.getStatus returns status, templateId, timestamps — never prdData or chatHistory"
    - "landing.saveDraft upserts a draft request (creates or updates existing draft)"
    - "landing.requestPage transitions draft to pending and stores prdData"
    - "notifications.list returns only current creator's notifications (SEC-05)"
    - "notifications.unreadCount returns count scoped to current creator (SEC-05)"
    - "notifications.markRead marks a single notification as read"
    - "notifications.markAllRead marks all creator's unread notifications as read"
    - "landing.requestPage creates a notification row (NOTF-05 partial)"
    - "notification type is varchar, accepting any string value (NOTF-07 extensibility)"
  artifacts:
    - path: "ity/packages/api/src/routers/landing.ts"
      provides: "landingRouter with getStatus, saveDraft, requestPage"
      exports: ["landingRouter"]
    - path: "ity/packages/api/src/routers/notifications.ts"
      provides: "notificationsRouter with list, unreadCount, markRead, markAllRead"
      exports: ["notificationsRouter"]
    - path: "ity/packages/api/src/root.ts"
      provides: "appRouter with landing + notifications registered"
      contains: "landing: landingRouter"
  key_links:
    - from: "ity/packages/api/src/routers/landing.ts"
      to: "landingPageRequests table"
      via: "import from @ity/db"
      pattern: "import.*landingPageRequests.*from '@ity/db'"
    - from: "ity/packages/api/src/routers/notifications.ts"
      to: "notifications table"
      via: "import from @ity/db"
      pattern: "import.*notifications.*from '@ity/db'"
    - from: "ity/packages/api/src/root.ts"
      to: "landing + notifications routers"
      via: "router registration"
      pattern: "landing: landingRouter"
---

<objective>
Create tRPC routers for landing page requests and notifications, then register them in the app router.

Purpose: Provides the API layer that Phases 10-13 use to manage landing requests and deliver notifications to creators.
Output: Two new router files + updated root.ts.
</objective>

<execution_context>
@C:/Users/patri/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/patri/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/09-db-schema-trpc-infrastructure/09-CONTEXT.md
@.planning/phases/09-db-schema-trpc-infrastructure/09-RESEARCH.md
@.planning/phases/09-db-schema-trpc-infrastructure/09-P01-SUMMARY.md

<interfaces>
<!-- Key types and contracts the executor needs. Extracted from codebase. -->

From ity/packages/api/src/trpc.ts:
```typescript
export type Context = {
  db: DB;
  supabase: SupabaseClient | null;
  user: User | null;      // user.id is the creator's UUID
  schoolId: string | null;
  schoolDomain: string | null;
};

export const router = t.router;
export const protectedProcedure = t.procedure.use(enforceCreatorAuth);
// protectedProcedure guarantees ctx.user is non-null
```

From ity/packages/api/src/root.ts (current):
```typescript
import { router, type Context } from './trpc';
import { authRouter } from './routers/auth';
import { schoolsRouter } from './routers/schools';
import { coursesRouter } from './routers/courses';
import { creatorsRouter } from './routers/creators';

export const appRouter = router({
  auth: authRouter,
  schools: schoolsRouter,
  courses: coursesRouter,
  creators: creatorsRouter,
});

export type AppRouter = typeof appRouter;
export const createCaller = (ctx: Context) => appRouter.createCaller(ctx);
```

From ity/packages/api/src/routers/schools.ts (ownership pattern):
```typescript
// Standard ownership check: verify school belongs to ctx.user.id
const school = await ctx.db.query.schools.findFirst({
  where: and(eq(schools.id, input.schoolId), eq(schools.creatorId, ctx.user.id)),
});
if (!school) throw new TRPCError({ code: 'NOT_FOUND', message: 'School not found' });
```

From @ity/db (after Plan 01):
```typescript
export const landingPageRequests = pgTable('landing_page_requests', { ... });
export const notifications = pgTable('notifications', { ... });
export type LandingPageRequestStatus;
export type ChatHistory;
export type PrdData;
export type NotificationType;
export type NotificationMetadata;
```

Import pattern from existing routers:
```typescript
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { schools } from '@ity/db';
import { eq, and } from 'drizzle-orm';
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create landing and notifications tRPC routers</name>
  <files>ity/packages/api/src/routers/landing.ts, ity/packages/api/src/routers/notifications.ts</files>
  <action>
**Create `ity/packages/api/src/routers/landing.ts`:**

```typescript
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { landingPageRequests, notifications, schools } from '@ity/db';
import { eq, and, ne } from 'drizzle-orm';

export const landingRouter = router({
  getStatus: protectedProcedure
    .input(z.object({ schoolId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Verify school ownership
      const school = await ctx.db.query.schools.findFirst({
        where: and(eq(schools.id, input.schoolId), eq(schools.creatorId, ctx.user.id)),
      });
      if (!school) throw new TRPCError({ code: 'NOT_FOUND', message: 'School not found' });

      // Return status fields only — NEVER prdData or chatHistory
      const request = await ctx.db.query.landingPageRequests.findFirst({
        where: eq(landingPageRequests.schoolId, input.schoolId),
        columns: {
          id: true,
          status: true,
          templateId: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: (lpr, { desc }) => [desc(lpr.createdAt)],
      });

      return request ?? null;
    }),

  saveDraft: protectedProcedure
    .input(z.object({
      schoolId: z.string().uuid(),
      templateId: z.string().min(1).max(100),
      chatHistory: z.array(z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
        timestamp: z.string(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify school ownership
      const school = await ctx.db.query.schools.findFirst({
        where: and(eq(schools.id, input.schoolId), eq(schools.creatorId, ctx.user.id)),
      });
      if (!school) throw new TRPCError({ code: 'NOT_FOUND', message: 'School not found' });

      // Check for existing non-completed request
      const existing = await ctx.db.query.landingPageRequests.findFirst({
        where: and(
          eq(landingPageRequests.schoolId, input.schoolId),
          ne(landingPageRequests.status, 'completed'),
        ),
      });

      if (existing && existing.status !== 'draft') {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'A landing page request is already in progress',
        });
      }

      if (existing) {
        // Update existing draft
        await ctx.db.update(landingPageRequests)
          .set({
            chatHistory: input.chatHistory,
            templateId: input.templateId,
            updatedAt: new Date(),
          })
          .where(eq(landingPageRequests.id, existing.id));
        return { id: existing.id };
      }

      // Create new draft
      const [created] = await ctx.db.insert(landingPageRequests)
        .values({
          schoolId: input.schoolId,
          templateId: input.templateId,
          status: 'draft',
          chatHistory: input.chatHistory,
        })
        .returning({ id: landingPageRequests.id });

      return { id: created.id };
    }),

  requestPage: protectedProcedure
    .input(z.object({
      schoolId: z.string().uuid(),
      prdData: z.record(z.unknown()),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify school ownership
      const school = await ctx.db.query.schools.findFirst({
        where: and(eq(schools.id, input.schoolId), eq(schools.creatorId, ctx.user.id)),
      });
      if (!school) throw new TRPCError({ code: 'NOT_FOUND', message: 'School not found' });

      // Find draft request
      const draft = await ctx.db.query.landingPageRequests.findFirst({
        where: and(
          eq(landingPageRequests.schoolId, input.schoolId),
          eq(landingPageRequests.status, 'draft'),
        ),
      });

      if (!draft) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No draft request found for this school',
        });
      }

      // Transition draft -> pending, store PRD
      await ctx.db.update(landingPageRequests)
        .set({
          status: 'pending',
          prdData: input.prdData,
          updatedAt: new Date(),
        })
        .where(eq(landingPageRequests.id, draft.id));

      // Create in-app notification (NOTF-05)
      await ctx.db.insert(notifications).values({
        creatorId: ctx.user.id,
        type: 'landing_submitted',
        title: 'Solicitud de landing page enviada',
        body: `Tu solicitud de landing page para ${school.name} ha sido enviada. Te notificaremos cuando esté lista.`,
        actionUrl: '/dashboard/landing',
        metadata: { requestId: draft.id },
      });

      return { id: draft.id, status: 'pending' as const };
    }),
});
```

**Create `ity/packages/api/src/routers/notifications.ts`:**

```typescript
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { notifications } from '@ity/db';
import { eq, and, sql } from 'drizzle-orm';

export const notificationsRouter = router({
  // Return last 50 notifications for current creator
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.notifications.findMany({
      where: eq(notifications.creatorId, ctx.user.id),
      orderBy: (notifications, { desc }) => [desc(notifications.createdAt)],
      limit: 50,
    });
  }),

  // Lightweight count for bell icon badge
  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const result = await ctx.db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(
        eq(notifications.creatorId, ctx.user.id),
        eq(notifications.isRead, false),
      ));
    return result[0]?.count ?? 0;
  }),

  // Mark single notification as read
  markRead: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(notifications)
        .set({ isRead: true })
        .where(and(
          eq(notifications.id, input.id),
          eq(notifications.creatorId, ctx.user.id), // SEC-05: scoped to creator
        ))
        .returning({ id: notifications.id });

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Notification not found' });
      }

      return { success: true };
    }),

  // Mark all unread as read
  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db
      .update(notifications)
      .set({ isRead: true })
      .where(and(
        eq(notifications.creatorId, ctx.user.id), // SEC-05: scoped to creator
        eq(notifications.isRead, false),
      ));
    return { success: true };
  }),
});
```

Key implementation notes:
- ALL notification queries filter by `ctx.user.id` (SEC-05 query-level scoping)
- `unreadCount` uses `sql<number>` template with `count(*)::int` — avoids importing `count` function (open question from research, this is the safer approach)
- `getStatus` uses Drizzle `columns` selector to explicitly exclude `prdData` and `chatHistory`
- `saveDraft` checks for existing non-completed request before insert (1:1 school->active request enforcement at app layer)
- `requestPage` creates a notification row when transitioning to pending (NOTF-05)
- `type` column is varchar accepting any string (NOTF-07 extensibility)
  </action>
  <verify>
    <automated>cd C:/dev/12ity/ity && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>Both routers compile, use protectedProcedure, scope notifications to ctx.user.id, and requestPage creates a notification on submission.</done>
</task>

<task type="auto">
  <name>Task 2: Register routers in root.ts</name>
  <files>ity/packages/api/src/root.ts</files>
  <action>
Update `ity/packages/api/src/root.ts` to import and register both new routers:

1. Add imports:
```typescript
import { landingRouter } from './routers/landing';
import { notificationsRouter } from './routers/notifications';
```

2. Add to appRouter object:
```typescript
export const appRouter = router({
  auth: authRouter,
  schools: schoolsRouter,
  courses: coursesRouter,
  creators: creatorsRouter,
  landing: landingRouter,
  notifications: notificationsRouter,
});
```

No other changes needed — `AppRouter` type and `createCaller` auto-update from the `appRouter` type.
  </action>
  <verify>
    <automated>cd C:/dev/12ity/ity && npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>root.ts registers both landing and notifications routers. AppRouter type includes new procedures. Full project compiles.</done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` passes for the full project (all routers compile)
2. `landing.getStatus` returns status/templateId/timestamps, NOT prdData/chatHistory
3. `notifications.list` and `unreadCount` both filter by `eq(notifications.creatorId, ctx.user.id)` (SEC-05)
4. `landing.requestPage` inserts a row into `notifications` table (NOTF-05)
5. `notifications.type` is varchar accepting any string value (NOTF-07)
6. Both routers use `protectedProcedure` (authenticated creators only)
7. School ownership verified via `eq(schools.creatorId, ctx.user.id)` before any landing request operation
</verification>

<success_criteria>
- Full TypeScript compilation succeeds with 0 errors
- Both routers accessible via `api.landing.*` and `api.notifications.*`
- Notification queries never return another creator's data
- getStatus never leaks prdData or chatHistory
- requestPage creates notification on draft->pending transition
</success_criteria>

<output>
After completion, create `.planning/phases/09-db-schema-trpc-infrastructure/09-P02-SUMMARY.md`
</output>
