---
phase: 09-db-schema-trpc-infrastructure
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - ity/packages/db/src/schema.ts
  - ity/.env.example
autonomous: true
requirements: [NOTF-07]
user_setup:
  - service: anthropic
    why: "AI chat wizard in Phase 11"
    env_vars:
      - name: ANTHROPIC_API_KEY
        source: "https://console.anthropic.com -> API Keys"
  - service: resend
    why: "Email notifications in Phase 13"
    env_vars:
      - name: RESEND_API_KEY
        source: "https://resend.com/api-keys"

must_haves:
  truths:
    - "landing_page_requests table exists with schoolId, templateId, status, prdData (JSONB), chatHistory (JSONB), timestamps"
    - "notifications table exists with creatorId, type, title, body, isRead, actionUrl, metadata (JSONB), createdAt"
    - "notifications.type is varchar (not pgEnum) to support future types without migration (NOTF-07)"
    - "ANTHROPIC_API_KEY and RESEND_API_KEY placeholders exist in .env.example"
  artifacts:
    - path: "ity/packages/db/src/schema.ts"
      provides: "landingPageRequests + notifications tables, types, relations"
      contains: "landingPageRequests"
    - path: "ity/.env.example"
      provides: "Env var placeholders for Anthropic and Resend"
      contains: "ANTHROPIC_API_KEY"
  key_links:
    - from: "ity/packages/db/src/schema.ts (landingPageRequests)"
      to: "schools table"
      via: "schoolId FK reference"
      pattern: "references.*schools\\.id"
    - from: "ity/packages/db/src/schema.ts (notifications)"
      to: "creators table"
      via: "creatorId FK reference"
      pattern: "references.*creators\\.id"
---

<objective>
Add `landing_page_requests` and `notifications` tables to the Drizzle schema, with TypeScript types, relations, and indexes. Add env var placeholders to `.env.example`.

Purpose: Provides the database foundation that all v1.2 features (template gallery, chat wizard, PRD submission, notifications) depend on.
Output: Extended schema.ts with 2 new tables, updated .env.example.
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

<interfaces>
<!-- Key types and contracts the executor needs. Extracted from codebase. -->

From ity/packages/db/src/schema.ts (existing pattern):
```typescript
// Tables use pgTable with array syntax for constraints:
export const schools = pgTable('schools', { ... }, (table) => [
  index('schools_creator_idx').on(table.creatorId),
]);

// Relations declared separately:
export const schoolsRelations = relations(schools, ({ one, many }) => ({ ... }));

// Types defined alongside tables:
export type SocialLinks = { ... };

// JSONB columns use .$type<T>():
socialLinks: jsonb('social_links').$type<SocialLinks>(),
```

From ity/packages/db/src/client.ts:
```typescript
import * as schema from './schema';
export const db = drizzle(client, { schema });
// All exports from schema.ts are auto-included in db.query
```

From ity/packages/db/src/index.ts:
```typescript
export * from './schema';
export * from './client';
```

Existing tables referenced by new tables:
- `schools` (line 116): has `id: uuid('id').primaryKey().defaultRandom()`, `creatorId: uuid('creator_id')`
- `creators` (line 95): has `id: uuid('id').primaryKey().defaultRandom()`

Existing relations to update:
- `creatorsRelations` (line 109): currently `({ many }) => ({ schools: many(schools) })`
- `schoolsRelations` (line 148): currently `({ one, many }) => ({ creator: one(...), courses: many(courses), students: many(students), announcements: many(announcements), payments: many(payments), domainVerifications: many(domainVerifications) })`
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add landing_page_requests and notifications tables to schema.ts</name>
  <files>ity/packages/db/src/schema.ts</files>
  <action>
Add the following to schema.ts, placed AFTER the `domainVerificationsRelations` block (end of file):

**Types (add in the TYPES section at top of file, after `LandingPageData`):**

```typescript
export type LandingPageRequestStatus = 'draft' | 'pending' | 'in_progress' | 'completed';

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
};

export type ChatHistory = ChatMessage[];

// PRD structure defined in Phase 12; use Record for now
export type PrdData = Record<string, unknown>;

export type NotificationType = 'landing_submitted' | 'landing_completed';

export type NotificationMetadata = {
  requestId?: string;
  [key: string]: unknown;
};
```

**Tables (add after domainVerificationsRelations):**

```typescript
// ============================================
// LANDING PAGE REQUESTS
// ============================================
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

export const landingPageRequestsRelations = relations(landingPageRequests, ({ one }) => ({
  school: one(schools, {
    fields: [landingPageRequests.schoolId],
    references: [schools.id],
  }),
}));

// ============================================
// NOTIFICATIONS
// ============================================
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
    index('notifications_creator_read_idx').on(table.creatorId, table.isRead),
  ]
);

export const notificationsRelations = relations(notifications, ({ one }) => ({
  creator: one(creators, {
    fields: [notifications.creatorId],
    references: [creators.id],
  }),
}));
```

**Update existing relations:**

Update `creatorsRelations` to add `notifications: many(notifications)`:
```typescript
export const creatorsRelations = relations(creators, ({ many }) => ({
  schools: many(schools),
  notifications: many(notifications),
}));
```

Update `schoolsRelations` to add `landingPageRequests: many(landingPageRequests)`:
```typescript
export const schoolsRelations = relations(schools, ({ one, many }) => ({
  creator: one(creators, {
    fields: [schools.creatorId],
    references: [creators.id],
  }),
  courses: many(courses),
  students: many(students),
  announcements: many(announcements),
  payments: many(payments),
  domainVerifications: many(domainVerifications),
  landingPageRequests: many(landingPageRequests),
}));
```

Key decisions per CONTEXT.md (locked):
- `status` is varchar, NOT pgEnum (extensibility for NOTF-07)
- `type` is varchar, NOT pgEnum (same reason)
- `templateId` is a separate column, NOT inside prdData JSONB
- `prdData` and `chatHistory` are separate JSONB columns
- Both JSONB columns use `.$type<T>()` for TypeScript inference
- `isRead` has `.notNull().default(false)` for DB-level default
- Index on `creator_id` for efficient notification queries
- Composite index on `(creator_id, is_read)` for unreadCount query
  </action>
  <verify>
    <automated>cd C:/dev/12ity/ity && npx tsc --noEmit --project packages/db/tsconfig.json 2>&1 | head -20</automated>
  </verify>
  <done>schema.ts compiles with both new tables, types, relations, and indexes. Existing relations updated with inverse references.</done>
</task>

<task type="auto">
  <name>Task 2: Add env var placeholders to .env.example</name>
  <files>ity/.env.example</files>
  <action>
Append the following to the end of `ity/.env.example`:

```bash

# AI Chat (Phase 11 - Chat Wizard)
ANTHROPIC_API_KEY=sk-ant-xxx

# Email Notifications (Phase 13 - Notifications)
RESEND_API_KEY=re_xxx
```

Per CONTEXT.md: these are validated only when used (Phases 11/13), NOT at app startup. This task only adds placeholders.
  </action>
  <verify>
    <automated>grep -c "ANTHROPIC_API_KEY\|RESEND_API_KEY" C:/dev/12ity/ity/.env.example</automated>
  </verify>
  <done>.env.example contains ANTHROPIC_API_KEY and RESEND_API_KEY placeholders with descriptive comments.</done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` passes for the db package (schema compiles)
2. `grep "landingPageRequests\|notifications" ity/packages/db/src/schema.ts` shows both tables defined
3. `grep "ANTHROPIC_API_KEY\|RESEND_API_KEY" ity/.env.example` shows both env vars
4. JSONB columns (`prd_data`, `chat_history`, `metadata`) all use `.$type<T>()`
5. `type` and `status` columns are varchar (not pgEnum)
</verification>

<success_criteria>
- schema.ts compiles with 0 TypeScript errors
- Both new tables export correctly from @ity/db
- Existing creatorsRelations and schoolsRelations include inverse references
- .env.example has both API key placeholders
</success_criteria>

<output>
After completion, create `.planning/phases/09-db-schema-trpc-infrastructure/09-P01-SUMMARY.md`
</output>
