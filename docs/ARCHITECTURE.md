# ITY - Technical Architecture Document
## Version 1.0 - January 2025

---

## 1. EXECUTIVE SUMMARY

### 1.1 Architecture Overview

ITY is a multi-tenant SaaS platform for online course creators. The architecture is designed for:
- **Simplicity**: Minimal moving parts, easy to maintain
- **Scalability**: Support thousands of custom domains
- **Developer Experience**: Type-safe, fast iteration
- **Cost Efficiency**: Pay-as-you-grow model

### 1.2 Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Project Structure** | Monorepo (Turborepo) | Shared code, coordinated deploys |
| **Frontend** | Next.js 14+ (App Router) | Best React framework, SSR/SSG |
| **Backend** | Next.js API Routes + tRPC | Type-safety end-to-end |
| **Database** | Supabase (PostgreSQL) | Auth + Realtime + Storage included |
| **Hosting** | Cloudflare + Vercel | Unlimited custom domains + great DX |
| **Video Live** | Daily.co | Simple integration, good pricing |
| **Storage** | Cloudflare R2 | No egress fees |
| **i18n** | next-intl | Best for App Router |

---

## 2. SYSTEM ARCHITECTURE

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CREATORS                                 │
│                    (Admin Dashboard)                             │
│              app.ity.com / dashboard.ity.com                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        CLOUDFLARE                                │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    DNS Management                          │  │
│  │   - ity.com (main domain)                                 │  │
│  │   - *.ity.com (subdomains)                                │  │
│  │   - Custom domains (mariayoga.com, etc.)                  │  │
│  │   - Automatic SSL certificates                            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                 Cloudflare Workers                         │  │
│  │   - Domain → School ID mapping                            │  │
│  │   - Request routing                                       │  │
│  │   - Edge caching                                          │  │
│  │   - Rate limiting                                         │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   Cloudflare R2                            │  │
│  │   - Video storage                                         │  │
│  │   - File uploads (PDFs, images)                           │  │
│  │   - No egress fees                                        │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                          VERCEL                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Next.js App                             │  │
│  │                                                           │  │
│  │   /app                                                    │  │
│  │   ├── (marketing)      → ity.com landing                 │  │
│  │   ├── (dashboard)      → Creator admin panel             │  │
│  │   ├── (school)         → Student-facing (multi-tenant)   │  │
│  │   └── api/trpc         → tRPC endpoints                  │  │
│  │                                                           │  │
│  │   Features:                                               │  │
│  │   - Server Components                                     │  │
│  │   - Streaming SSR                                         │  │
│  │   - Edge Runtime where needed                             │  │
│  │   - Preview deployments                                   │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         SUPABASE                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    PostgreSQL                              │  │
│  │   - All application data                                  │  │
│  │   - Row Level Security (RLS)                              │  │
│  │   - Multi-tenant isolation                                │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   Supabase Auth                            │  │
│  │   - Creator authentication                                │  │
│  │   - Student authentication (per school)                   │  │
│  │   - Magic links + OAuth                                   │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                  Supabase Realtime                         │  │
│  │   - Live class chat                                       │  │
│  │   - Notifications                                         │  │
│  │   - Progress sync                                         │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     EXTERNAL SERVICES                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Daily.co   │  │   Stripe    │  │        Resend           │  │
│  │  (Video)    │  │  (Payments) │  │       (Email)           │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│  ┌─────────────┐  ┌─────────────┐                               │
│  │    Mux      │  │   Upstash   │                               │
│  │  (Video     │  │   (Redis    │                               │
│  │  Processing)│  │   + Queue)  │                               │
│  └─────────────┘  └─────────────┘                               │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Request Flow for Custom Domains

```
Student visits: mariayoga.com/courses/yoga-101
                        │
                        ▼
┌─────────────────────────────────────────┐
│           Cloudflare DNS                 │
│   mariayoga.com → Cloudflare Workers    │
└─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────┐
│         Cloudflare Worker                │
│                                         │
│   1. Lookup domain in KV store          │
│      mariayoga.com → school_id: abc123  │
│                                         │
│   2. Add headers:                       │
│      X-School-ID: abc123                │
│      X-School-Domain: mariayoga.com     │
│                                         │
│   3. Forward to Vercel                  │
└─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────┐
│              Vercel                      │
│                                         │
│   Next.js middleware reads headers      │
│   → Sets school context                 │
│   → Renders school-specific content     │
│   → Applies school branding             │
└─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────┐
│              Supabase                    │
│                                         │
│   RLS policies filter by school_id      │
│   → Only returns data for that school   │
└─────────────────────────────────────────┘
```

---

## 3. MONOREPO STRUCTURE

```
ity/
├── apps/
│   ├── web/                      # Next.js main application
│   │   ├── app/
│   │   │   ├── (marketing)/      # ity.com public pages
│   │   │   │   ├── page.tsx      # Landing page
│   │   │   │   ├── pricing/
│   │   │   │   └── features/
│   │   │   │
│   │   │   ├── (auth)/           # Authentication flows
│   │   │   │   ├── login/
│   │   │   │   ├── register/
│   │   │   │   └── verify/
│   │   │   │
│   │   │   ├── (dashboard)/      # Creator dashboard (app.ity.com)
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx      # Dashboard home
│   │   │   │   ├── schools/
│   │   │   │   │   ├── [schoolId]/
│   │   │   │   │   │   ├── settings/
│   │   │   │   │   │   ├── courses/
│   │   │   │   │   │   ├── students/
│   │   │   │   │   │   └── analytics/
│   │   │   │   │   └── new/
│   │   │   │   └── settings/
│   │   │   │
│   │   │   ├── (school)/         # Student-facing (custom domains)
│   │   │   │   ├── layout.tsx    # School branding wrapper
│   │   │   │   ├── page.tsx      # School landing/course list
│   │   │   │   ├── courses/
│   │   │   │   │   ├── [courseSlug]/
│   │   │   │   │   │   ├── page.tsx       # Course landing
│   │   │   │   │   │   ├── learn/         # Course content
│   │   │   │   │   │   └── checkout/
│   │   │   │   ├── live/
│   │   │   │   │   └── [classId]/
│   │   │   │   └── student/      # Student dashboard
│   │   │   │       ├── page.tsx
│   │   │   │       ├── courses/
│   │   │   │       └── settings/
│   │   │   │
│   │   │   ├── api/
│   │   │   │   ├── trpc/[trpc]/  # tRPC handler
│   │   │   │   ├── webhooks/
│   │   │   │   │   ├── stripe/
│   │   │   │   │   └── daily/
│   │   │   │   └── uploads/
│   │   │   │
│   │   │   └── layout.tsx
│   │   │
│   │   ├── components/
│   │   │   ├── ui/               # shadcn/ui components
│   │   │   ├── dashboard/        # Creator dashboard components
│   │   │   ├── school/           # School/student components
│   │   │   ├── landing-builder/  # Landing page builder
│   │   │   └── video-player/     # Custom video player
│   │   │
│   │   ├── lib/
│   │   │   ├── supabase/
│   │   │   │   ├── client.ts
│   │   │   │   ├── server.ts
│   │   │   │   └── middleware.ts
│   │   │   ├── trpc/
│   │   │   │   ├── client.ts
│   │   │   │   └── server.ts
│   │   │   └── utils/
│   │   │
│   │   ├── hooks/
│   │   ├── stores/               # Zustand stores
│   │   ├── styles/
│   │   ├── locales/              # i18n translations
│   │   │   ├── en.json
│   │   │   ├── es.json
│   │   │   ├── fr.json
│   │   │   └── pt.json
│   │   │
│   │   ├── middleware.ts         # Domain routing, auth
│   │   ├── next.config.js
│   │   ├── tailwind.config.ts
│   │   └── package.json
│   │
│   └── worker/                   # Cloudflare Worker
│       ├── src/
│       │   ├── index.ts          # Main worker
│       │   ├── domain-router.ts  # Domain → School mapping
│       │   └── utils/
│       ├── wrangler.toml
│       └── package.json
│
├── packages/
│   ├── api/                      # tRPC routers
│   │   ├── src/
│   │   │   ├── root.ts           # Root router
│   │   │   ├── trpc.ts           # tRPC setup
│   │   │   └── routers/
│   │   │       ├── auth.ts
│   │   │       ├── schools.ts
│   │   │       ├── courses.ts
│   │   │       ├── lessons.ts
│   │   │       ├── students.ts
│   │   │       ├── enrollments.ts
│   │   │       ├── live-classes.ts
│   │   │       ├── payments.ts
│   │   │       └── analytics.ts
│   │   └── package.json
│   │
│   ├── db/                       # Database schema & client
│   │   ├── src/
│   │   │   ├── schema.ts         # Drizzle schema
│   │   │   ├── client.ts         # DB client
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   ├── drizzle.config.ts
│   │   └── package.json
│   │
│   ├── ui/                       # Shared UI components
│   │   ├── src/
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   └── ...
│   │   └── package.json
│   │
│   ├── config/                   # Shared configuration
│   │   ├── src/
│   │   │   ├── env.ts            # Environment validation
│   │   │   ├── constants.ts
│   │   │   └── blocks.ts         # Block definitions
│   │   └── package.json
│   │
│   └── typescript-config/        # Shared TS configs
│       ├── base.json
│       ├── nextjs.json
│       └── package.json
│
├── tooling/
│   ├── eslint/
│   └── prettier/
│
├── turbo.json
├── package.json
├── pnpm-workspace.yaml
└── .env.example
```

---

## 4. TECHNOLOGY STACK DETAILS

### 4.1 Frontend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 14.x | React framework with App Router |
| **React** | 18.x | UI library |
| **TypeScript** | 5.x | Type safety |
| **Tailwind CSS** | 3.x | Utility-first CSS |
| **shadcn/ui** | latest | UI component library |
| **next-intl** | 3.x | Internationalization |
| **Zustand** | 4.x | State management |
| **React Hook Form** | 7.x | Form handling |
| **Zod** | 3.x | Schema validation |
| **TipTap** | 2.x | Rich text editor (landing builder) |
| **Framer Motion** | 10.x | Animations |

### 4.2 Backend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **tRPC** | 11.x | Type-safe API |
| **Drizzle ORM** | 0.29.x | Database ORM |
| **Supabase JS** | 2.x | Supabase client |
| **Stripe** | 14.x | Payments |
| **Resend** | 2.x | Transactional email |
| **Upstash** | latest | Redis + Queue |

### 4.3 Infrastructure

| Service | Purpose | Tier |
|---------|---------|------|
| **Vercel** | App hosting | Pro ($20/mo) |
| **Supabase** | Database + Auth | Pro ($25/mo) |
| **Cloudflare** | DNS + Workers + R2 | Pro ($20/mo) |
| **Daily.co** | Video conferencing | Scale (pay-per-use) |
| **Mux** | Video processing | pay-per-use |
| **Upstash** | Redis + Queues | pay-per-use |
| **Resend** | Email | pay-per-use |

**Estimated Monthly Cost (at 100 creators):** ~$150-200/mo

---

## 5. DATABASE SCHEMA

### 5.1 Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│  creators   │       │   schools   │       │   courses   │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id          │──┐    │ id          │──┐    │ id          │
│ email       │  │    │ creator_id  │◄─┘    │ school_id   │◄─┐
│ name        │  └───►│ name        │       │ title       │  │
│ password    │       │ domain      │───┐   │ description │  │
│ language    │       │ branding    │   │   │ price       │  │
│ created_at  │       │ stripe_id   │   │   │ blocks      │  │
└─────────────┘       │ plan        │   │   │ landing     │  │
                      └─────────────┘   │   │ published   │  │
                                        │   └─────────────┘  │
                                        │          │         │
┌─────────────┐       ┌─────────────┐   │   ┌──────┴──────┐  │
│  students   │       │ enrollments │   │   │   modules   │  │
├─────────────┤       ├─────────────┤   │   ├─────────────┤  │
│ id          │──┐    │ id          │   │   │ id          │  │
│ school_id   │◄─┼────│ student_id  │◄──┘   │ course_id   │◄─┤
│ email       │  │    │ course_id   │◄──────│ title       │  │
│ name        │  │    │ progress    │       │ order       │  │
│ password    │  │    │ enrolled_at │       └─────────────┘  │
│ created_at  │  │    │ completed   │              │         │
└─────────────┘  │    └─────────────┘       ┌──────┴──────┐  │
                 │                          │   lessons   │  │
                 │    ┌─────────────┐       ├─────────────┤  │
                 │    │  payments   │       │ id          │  │
                 │    ├─────────────┤       │ module_id   │◄─┘
                 │    │ id          │       │ title       │
                 └───►│ student_id  │       │ type        │
                      │ course_id   │       │ content     │
                      │ school_id   │       │ order       │
                      │ amount      │       │ is_free     │
                      │ stripe_id   │       └─────────────┘
                      │ status      │
                      └─────────────┘

┌─────────────┐       ┌─────────────┐
│ live_classes│       │announcements│
├─────────────┤       ├─────────────┤
│ id          │       │ id          │
│ course_id   │       │ school_id   │
│ title       │       │ title       │
│ scheduled   │       │ content     │
│ duration    │       │ published   │
│ room_url    │       │ created_at  │
│ recording   │       └─────────────┘
│ status      │
│ attendees   │
└─────────────┘
```

### 5.2 Drizzle Schema (packages/db/src/schema.ts)

```typescript
import { pgTable, uuid, varchar, text, boolean,
         timestamp, jsonb, decimal, integer, unique } from 'drizzle-orm/pg-core';

// ============================================
// CREATORS (ITY platform users)
// ============================================
export const creators = pgTable('creators', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  language: varchar('language', { length: 5 }).default('en'),
  emailVerified: boolean('email_verified').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// SCHOOLS (Multi-tenant: one creator can have many)
// ============================================
export const schools = pgTable('schools', {
  id: uuid('id').primaryKey().defaultRandom(),
  creatorId: uuid('creator_id').references(() => creators.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).unique().notNull(),
  customDomain: varchar('custom_domain', { length: 255 }).unique(),
  domainVerified: boolean('domain_verified').default(false),
  branding: jsonb('branding').$type<{
    logo?: string;
    primaryColor: string;
    secondaryColor: string;
    font: 'inter' | 'merriweather' | 'space-mono';
    favicon?: string;
  }>().default({
    primaryColor: '#6366F1',
    secondaryColor: '#F59E0B',
    font: 'inter'
  }),
  studentDashboardConfig: jsonb('student_dashboard_config').$type<{
    sections: Array<{
      id: string;
      type: 'announcements' | 'progress' | 'live-classes' | 'activity';
      visible: boolean;
      order: number;
    }>;
    showProgressPercentage: boolean;
    showNextLesson: boolean;
  }>(),
  stripeAccountId: varchar('stripe_account_id', { length: 255 }),
  stripeOnboarded: boolean('stripe_onboarded').default(false),
  subscriptionPlan: varchar('subscription_plan', { length: 50 }).default('free'),
  language: varchar('language', { length: 5 }).default('en'),
  timezone: varchar('timezone', { length: 50 }).default('America/New_York'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// COURSES
// ============================================
export const courses = pgTable('courses', {
  id: uuid('id').primaryKey().defaultRandom(),
  schoolId: uuid('school_id').references(() => schools.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull(),
  description: text('description'),
  shortDescription: varchar('short_description', { length: 500 }),
  thumbnailUrl: varchar('thumbnail_url', { length: 500 }),
  price: decimal('price', { precision: 10, scale: 2 }).default('0'),
  currency: varchar('currency', { length: 3 }).default('USD'),
  isPublished: boolean('is_published').default(false),
  activeBlocks: jsonb('active_blocks').$type<string[]>().default([
    'videos', 'live', 'quizzes', 'downloads', 'announcements', 'progress'
  ]),
  landingPageData: jsonb('landing_page_data').$type<{
    sections: Array<{
      id: string;
      type: 'hero' | 'about' | 'curriculum' | 'benefits' | 'testimonials' | 'faq' | 'pricing' | 'guarantee';
      content: Record<string, any>;
      order: number;
    }>;
  }>(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  schoolSlugUnique: unique().on(table.schoolId, table.slug),
}));

// ============================================
// MODULES
// ============================================
export const modules = pgTable('modules', {
  id: uuid('id').primaryKey().defaultRandom(),
  courseId: uuid('course_id').references(() => courses.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  orderIndex: integer('order_index').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// ============================================
// LESSONS
// ============================================
export const lessons = pgTable('lessons', {
  id: uuid('id').primaryKey().defaultRandom(),
  moduleId: uuid('module_id').references(() => modules.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'video', 'text', 'quiz', 'download'
  content: jsonb('content').$type<{
    // For video
    videoUrl?: string;
    videoDuration?: number;
    muxAssetId?: string;
    muxPlaybackId?: string;
    // For text
    richText?: string;
    // For quiz
    questions?: Array<{
      id: string;
      question: string;
      type: 'multiple-choice' | 'true-false' | 'open';
      options?: string[];
      correctAnswer?: string | number;
    }>;
    // For download
    files?: Array<{
      name: string;
      url: string;
      size: number;
    }>;
  }>(),
  orderIndex: integer('order_index').notNull().default(0),
  isFree: boolean('is_free').default(false),
  estimatedMinutes: integer('estimated_minutes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ============================================
// STUDENTS (Per school - not global)
// ============================================
export const students = pgTable('students', {
  id: uuid('id').primaryKey().defaultRandom(),
  schoolId: uuid('school_id').references(() => schools.id).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }),
  passwordHash: varchar('password_hash', { length: 255 }),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  emailVerified: boolean('email_verified').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  lastLoginAt: timestamp('last_login_at'),
}, (table) => ({
  schoolEmailUnique: unique().on(table.schoolId, table.email),
}));

// ============================================
// ENROLLMENTS
// ============================================
export const enrollments = pgTable('enrollments', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id').references(() => students.id).notNull(),
  courseId: uuid('course_id').references(() => courses.id).notNull(),
  enrolledAt: timestamp('enrolled_at').defaultNow(),
  completedAt: timestamp('completed_at'),
  progress: jsonb('progress').$type<{
    [lessonId: string]: {
      viewed: boolean;
      percentage: number;
      completedAt?: string;
      quizScore?: number;
    };
  }>().default({}),
}, (table) => ({
  studentCourseUnique: unique().on(table.studentId, table.courseId),
}));

// ============================================
// LIVE CLASSES
// ============================================
export const liveClasses = pgTable('live_classes', {
  id: uuid('id').primaryKey().defaultRandom(),
  courseId: uuid('course_id').references(() => courses.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  scheduledAt: timestamp('scheduled_at').notNull(),
  durationMinutes: integer('duration_minutes').default(60),
  roomUrl: varchar('room_url', { length: 500 }),
  dailyRoomName: varchar('daily_room_name', { length: 255 }),
  recordingUrl: varchar('recording_url', { length: 500 }),
  status: varchar('status', { length: 50 }).default('scheduled'), // 'scheduled', 'live', 'ended', 'cancelled'
  attendees: jsonb('attendees').$type<Array<{
    studentId: string;
    joinedAt: string;
    leftAt?: string;
  }>>().default([]),
  createdAt: timestamp('created_at').defaultNow(),
});

// ============================================
// ANNOUNCEMENTS
// ============================================
export const announcements = pgTable('announcements', {
  id: uuid('id').primaryKey().defaultRandom(),
  schoolId: uuid('school_id').references(() => schools.id).notNull(),
  courseId: uuid('course_id').references(() => courses.id), // null = all courses
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  isPublished: boolean('is_published').default(false),
  publishAt: timestamp('publish_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ============================================
// PAYMENTS
// ============================================
export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id').references(() => students.id).notNull(),
  courseId: uuid('course_id').references(() => courses.id).notNull(),
  schoolId: uuid('school_id').references(() => schools.id).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('USD'),
  stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }),
  stripeChargeId: varchar('stripe_charge_id', { length: 255 }),
  status: varchar('status', { length: 50 }).default('pending'), // 'pending', 'succeeded', 'failed', 'refunded'
  refundedAt: timestamp('refunded_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ============================================
// DOMAIN VERIFICATIONS
// ============================================
export const domainVerifications = pgTable('domain_verifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  schoolId: uuid('school_id').references(() => schools.id).notNull(),
  domain: varchar('domain', { length: 255 }).notNull(),
  verificationToken: varchar('verification_token', { length: 255 }).notNull(),
  verifiedAt: timestamp('verified_at'),
  createdAt: timestamp('created_at').defaultNow(),
});
```

---

## 6. API DESIGN (tRPC)

### 6.1 Router Structure

```typescript
// packages/api/src/root.ts
import { router } from './trpc';
import { authRouter } from './routers/auth';
import { schoolsRouter } from './routers/schools';
import { coursesRouter } from './routers/courses';
import { modulesRouter } from './routers/modules';
import { lessonsRouter } from './routers/lessons';
import { studentsRouter } from './routers/students';
import { enrollmentsRouter } from './routers/enrollments';
import { liveClassesRouter } from './routers/live-classes';
import { paymentsRouter } from './routers/payments';
import { analyticsRouter } from './routers/analytics';
import { uploadsRouter } from './routers/uploads';

export const appRouter = router({
  auth: authRouter,
  schools: schoolsRouter,
  courses: coursesRouter,
  modules: modulesRouter,
  lessons: lessonsRouter,
  students: studentsRouter,
  enrollments: enrollmentsRouter,
  liveClasses: liveClassesRouter,
  payments: paymentsRouter,
  analytics: analyticsRouter,
  uploads: uploadsRouter,
});

export type AppRouter = typeof appRouter;
```

### 6.2 Key Endpoints

#### Schools Router
```typescript
// packages/api/src/routers/schools.ts

export const schoolsRouter = router({
  // List all schools for current creator
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.schools.findMany({
      where: eq(schools.creatorId, ctx.user.id),
    });
  }),

  // Get single school
  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.query.schools.findFirst({
        where: and(
          eq(schools.id, input.id),
          eq(schools.creatorId, ctx.user.id)
        ),
        with: { courses: true },
      });
    }),

  // Create new school
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(2).max(255),
      slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.insert(schools).values({
        ...input,
        creatorId: ctx.user.id,
      }).returning();
    }),

  // Update branding
  updateBranding: protectedProcedure
    .input(z.object({
      schoolId: z.string().uuid(),
      branding: z.object({
        logo: z.string().optional(),
        primaryColor: z.string(),
        secondaryColor: z.string(),
        font: z.enum(['inter', 'merriweather', 'space-mono']),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.update(schools)
        .set({ branding: input.branding })
        .where(and(
          eq(schools.id, input.schoolId),
          eq(schools.creatorId, ctx.user.id)
        ))
        .returning();
    }),

  // Add custom domain
  addDomain: protectedProcedure
    .input(z.object({
      schoolId: z.string().uuid(),
      domain: z.string().min(4).max(255),
    }))
    .mutation(async ({ ctx, input }) => {
      // 1. Verify ownership
      // 2. Create in Cloudflare
      // 3. Update school
      // 4. Create verification record
    }),

  // Verify domain
  verifyDomain: protectedProcedure
    .input(z.object({ schoolId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Check DNS propagation
      // Update verified status
    }),

  // Connect Stripe
  connectStripe: protectedProcedure
    .input(z.object({ schoolId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Create Stripe Connect account link
    }),
});
```

#### Courses Router
```typescript
// packages/api/src/routers/courses.ts

export const coursesRouter = router({
  // List courses for a school
  list: protectedProcedure
    .input(z.object({ schoolId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.query.courses.findMany({
        where: eq(courses.schoolId, input.schoolId),
        with: {
          modules: {
            with: { lessons: true }
          },
          _count: {
            enrollments: true
          }
        },
        orderBy: desc(courses.createdAt),
      });
    }),

  // Create course
  create: protectedProcedure
    .input(z.object({
      schoolId: z.string().uuid(),
      title: z.string().min(2).max(255),
      slug: z.string().min(2).max(255),
      description: z.string().optional(),
      price: z.number().min(0).optional(),
      activeBlocks: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify school ownership first
      return ctx.db.insert(courses).values(input).returning();
    }),

  // Update landing page
  updateLanding: protectedProcedure
    .input(z.object({
      courseId: z.string().uuid(),
      landingPageData: z.object({
        sections: z.array(z.object({
          id: z.string(),
          type: z.string(),
          content: z.record(z.any()),
          order: z.number(),
        })),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.update(courses)
        .set({ landingPageData: input.landingPageData })
        .where(eq(courses.id, input.courseId))
        .returning();
    }),

  // Publish/unpublish
  togglePublish: protectedProcedure
    .input(z.object({ courseId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const course = await ctx.db.query.courses.findFirst({
        where: eq(courses.id, input.courseId)
      });
      return ctx.db.update(courses)
        .set({ isPublished: !course?.isPublished })
        .where(eq(courses.id, input.courseId))
        .returning();
    }),

  // Student: get public course (for landing page)
  getPublic: publicProcedure
    .input(z.object({
      schoolDomain: z.string(),
      courseSlug: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const school = await ctx.db.query.schools.findFirst({
        where: or(
          eq(schools.customDomain, input.schoolDomain),
          eq(schools.slug, input.schoolDomain)
        ),
      });
      if (!school) throw new TRPCError({ code: 'NOT_FOUND' });

      return ctx.db.query.courses.findFirst({
        where: and(
          eq(courses.schoolId, school.id),
          eq(courses.slug, input.courseSlug),
          eq(courses.isPublished, true)
        ),
        with: {
          modules: {
            with: {
              lessons: {
                columns: {
                  id: true,
                  title: true,
                  type: true,
                  isFree: true,
                  estimatedMinutes: true,
                }
              }
            }
          }
        }
      });
    }),
});
```

---

## 7. AUTHENTICATION FLOW

### 7.1 Creator Authentication

```
┌─────────────────────────────────────────┐
│           Creator Signs Up               │
│                                         │
│   1. Email + Password                   │
│   2. Supabase Auth creates user         │
│   3. Trigger creates creator record     │
│   4. Email verification sent            │
│   5. Redirect to onboarding             │
└─────────────────────────────────────────┘
```

### 7.2 Student Authentication (Per School)

```
┌─────────────────────────────────────────┐
│      Student Purchases Course            │
│                                         │
│   1. Stripe Checkout                    │
│   2. Webhook: payment.succeeded         │
│   3. Create student if not exists       │
│      (scoped to school_id)              │
│   4. Create enrollment                  │
│   5. Send magic link email              │
│   6. Student clicks link → logged in    │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│      Student Returns to School           │
│                                         │
│   1. Visits mariayoga.com/login         │
│   2. Enters email                       │
│   3. Magic link sent                    │
│   4. Clicks link → logged in            │
│   5. Session scoped to school_id        │
└─────────────────────────────────────────┘
```

### 7.3 Session Management

```typescript
// Middleware determines context based on domain

// For ity.com / app.ity.com:
// - Creator session
// - Full platform access

// For custom domains (mariayoga.com):
// - Student session (scoped to school)
// - Only access to that school's content
```

---

## 8. CUSTOM DOMAIN FLOW

### 8.1 Domain Setup Process

```
Creator adds domain in ITY Dashboard
              │
              ▼
┌─────────────────────────────────────────┐
│   1. Validate domain format             │
│   2. Check domain not already in use    │
│   3. Generate verification token        │
│   4. Store in domain_verifications      │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│   Show instructions to creator:         │
│                                         │
│   "Add this DNS record:"                │
│   Type: CNAME                           │
│   Name: @ (or subdomain)                │
│   Value: proxy.ity.com                  │
│                                         │
│   "Or add TXT for verification:"        │
│   Name: _ity-verify                     │
│   Value: {token}                        │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│   Creator configures DNS                │
│   (at their registrar)                  │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│   ITY polls for verification:           │
│                                         │
│   1. Check TXT record exists            │
│   2. Verify token matches               │
│   3. Add domain to Cloudflare           │
│   4. Configure SSL certificate          │
│   5. Add to Workers KV mapping          │
│   6. Mark school.domainVerified = true  │
└─────────────────────────────────────────┘
              │
              ▼
        Domain is live!
```

### 8.2 Cloudflare Worker Logic

```typescript
// apps/worker/src/index.ts

interface Env {
  DOMAIN_MAPPING: KVNamespace;
  VERCEL_URL: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const hostname = url.hostname;

    // Skip for main ITY domains
    if (hostname === 'ity.com' || hostname.endsWith('.ity.com')) {
      return fetch(request);
    }

    // Lookup school for custom domain
    const schoolData = await env.DOMAIN_MAPPING.get(hostname);

    if (!schoolData) {
      return new Response('School not found', { status: 404 });
    }

    const { schoolId, schoolSlug } = JSON.parse(schoolData);

    // Create new request with school context headers
    const modifiedRequest = new Request(env.VERCEL_URL + url.pathname, {
      method: request.method,
      headers: {
        ...Object.fromEntries(request.headers),
        'X-School-ID': schoolId,
        'X-School-Slug': schoolSlug,
        'X-Original-Host': hostname,
      },
      body: request.body,
    });

    const response = await fetch(modifiedRequest);

    // Add CORS headers if needed
    return new Response(response.body, {
      status: response.status,
      headers: {
        ...Object.fromEntries(response.headers),
        'X-Served-By': 'ITY-Worker',
      },
    });
  },
};
```

---

## 9. VIDEO PROCESSING PIPELINE

### 9.1 Upload Flow

```
Creator uploads video
        │
        ▼
┌─────────────────────────────────────────┐
│   1. Frontend: Get presigned URL        │
│      POST /api/uploads/video            │
│      → Returns R2 presigned URL         │
└─────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│   2. Frontend: Direct upload to R2      │
│      PUT {presigned-url}                │
│      → Video stored in R2               │
└─────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│   3. Backend: Trigger processing        │
│      → Send to Mux for processing       │
│      → Mux webhook when ready           │
└─────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│   4. Mux processes video:               │
│      - Multiple resolutions             │
│      - HLS streaming                    │
│      - Thumbnail generation             │
└─────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│   5. Update lesson with Mux IDs         │
│      - muxAssetId                       │
│      - muxPlaybackId                    │
│      - duration                         │
└─────────────────────────────────────────┘
```

### 9.2 Playback

```typescript
// Secure video playback with signed tokens
const getVideoUrl = async (lessonId: string, studentId: string) => {
  const lesson = await db.query.lessons.findFirst({
    where: eq(lessons.id, lessonId)
  });

  // Verify student has access
  const enrollment = await verifyEnrollment(studentId, lesson.courseId);
  if (!enrollment) throw new Error('Not enrolled');

  // Generate signed playback URL
  const signedUrl = await mux.video.playbackIds.generatePlaybackUrl(
    lesson.content.muxPlaybackId,
    {
      expiration: '4h',
      type: 'video',
    }
  );

  return signedUrl;
};
```

---

## 10. LIVE CLASS INTEGRATION

### 10.1 Daily.co Flow

```
Creator schedules live class
        │
        ▼
┌─────────────────────────────────────────┐
│   1. Create Daily.co room               │
│      POST https://api.daily.co/v1/rooms │
│      → Get room URL                     │
└─────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│   2. Store in live_classes table        │
│      - roomUrl                          │
│      - dailyRoomName                    │
│      - scheduledAt                      │
└─────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│   3. Notify enrolled students           │
│      - Email notification               │
│      - In-app notification              │
└─────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│   4. When class starts:                 │
│      - Creator joins as owner           │
│      - Students join as participants    │
│      - Chat enabled                     │
│      - Recording starts (if enabled)    │
└─────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│   5. When class ends:                   │
│      - Daily.co webhook                 │
│      - Save recording URL               │
│      - Update attendance                │
│      - Make recording available         │
└─────────────────────────────────────────┘
```

### 10.2 Daily.co Component

```typescript
// apps/web/components/video-player/LiveRoom.tsx

import { useDaily, DailyVideo } from '@daily-co/daily-react';

export function LiveRoom({ roomUrl, isCreator }: Props) {
  const daily = useDaily();

  useEffect(() => {
    daily?.join({ url: roomUrl });
    return () => { daily?.leave(); };
  }, [roomUrl]);

  return (
    <div className="live-room">
      <div className="video-grid">
        {/* Render participant videos */}
      </div>
      <div className="controls">
        {isCreator && (
          <>
            <MuteButton />
            <VideoToggle />
            <ScreenShare />
            <RecordButton />
            <EndCallButton />
          </>
        )}
      </div>
      <ChatPanel />
    </div>
  );
}
```

---

## 11. INTERNATIONALIZATION (i18n)

### 11.1 Setup

```typescript
// apps/web/i18n.ts
import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`./locales/${locale}.json`)).default,
}));

// apps/web/middleware.ts
import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['en', 'es', 'fr', 'pt'],
  defaultLocale: 'en',
});
```

### 11.2 Translation Structure

```json
// apps/web/locales/en.json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "loading": "Loading...",
    "error": "Something went wrong"
  },
  "auth": {
    "login": "Log in",
    "register": "Create account",
    "forgotPassword": "Forgot password?",
    "email": "Email address",
    "password": "Password"
  },
  "dashboard": {
    "welcome": "Welcome back, {name}",
    "schools": "Your Schools",
    "createSchool": "Create School",
    "courses": "Courses",
    "students": "Students",
    "revenue": "Revenue"
  },
  "school": {
    "settings": "School Settings",
    "branding": "Branding",
    "domain": "Custom Domain",
    "payments": "Payments"
  },
  "course": {
    "create": "Create Course",
    "title": "Course Title",
    "description": "Description",
    "price": "Price",
    "publish": "Publish",
    "unpublish": "Unpublish"
  },
  "student": {
    "dashboard": "My Learning",
    "progress": "Your Progress",
    "continue": "Continue Learning",
    "completed": "Completed",
    "upcomingClasses": "Upcoming Live Classes"
  }
}
```

---

## 12. ENVIRONMENT VARIABLES

```bash
# .env.example

# ===========================================
# APP
# ===========================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=ITY

# ===========================================
# SUPABASE
# ===========================================
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql://...

# ===========================================
# CLOUDFLARE
# ===========================================
CLOUDFLARE_API_TOKEN=xxx
CLOUDFLARE_ZONE_ID=xxx
CLOUDFLARE_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=ity-uploads
R2_PUBLIC_URL=https://cdn.ity.com

# ===========================================
# STRIPE
# ===========================================
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx

# ===========================================
# DAILY.CO
# ===========================================
DAILY_API_KEY=xxx
DAILY_WEBHOOK_SECRET=xxx

# ===========================================
# MUX
# ===========================================
MUX_TOKEN_ID=xxx
MUX_TOKEN_SECRET=xxx
MUX_WEBHOOK_SECRET=xxx

# ===========================================
# RESEND (Email)
# ===========================================
RESEND_API_KEY=re_xxx
EMAIL_FROM=noreply@ity.com

# ===========================================
# UPSTASH (Redis + Queue)
# ===========================================
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx

# ===========================================
# MISC
# ===========================================
JWT_SECRET=xxx
ENCRYPTION_KEY=xxx
```

---

## 13. DEPLOYMENT

### 13.1 Vercel Configuration

```json
// vercel.json
{
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NEXT_PUBLIC_APP_URL": "https://ity.com"
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" }
      ]
    }
  ]
}
```

### 13.2 Turborepo Pipeline

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [".env"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "type-check": {
      "dependsOn": ["^build"]
    },
    "db:push": {
      "cache": false
    },
    "db:generate": {
      "cache": false
    }
  }
}
```

---

## 14. ENVIRONMENTS & CI/CD

### 14.1 Environment Strategy

ITY uses three environments with complete isolation:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ENVIRONMENTS                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   LOCAL (Development)                                                   │
│   ├── localhost:3000                                                   │
│   ├── Supabase Local (Docker) or Dev Project                          │
│   ├── Stripe Test Mode                                                 │
│   └── Local .env.local                                                 │
│                                                                         │
│   STAGING (Testing & QA)                                               │
│   ├── staging.ity.com                                                  │
│   ├── Supabase Staging Project                                         │
│   ├── Stripe Test Mode                                                 │
│   ├── Cloudflare Staging Worker                                        │
│   └── Vercel Preview/Staging                                           │
│                                                                         │
│   PRODUCTION                                                            │
│   ├── ity.com / app.ity.com                                           │
│   ├── Supabase Production Project                                      │
│   ├── Stripe Live Mode                                                 │
│   ├── Cloudflare Production Worker                                     │
│   └── Vercel Production                                                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 14.2 Environment Configuration

#### Services per Environment

| Service | Local | Staging | Production |
|---------|-------|---------|------------|
| **Next.js** | localhost:3000 | staging.ity.com | ity.com |
| **Supabase** | Local Docker / ity-dev | ity-staging | ity-prod |
| **Cloudflare Worker** | Miniflare (local) | ity-worker-staging | ity-worker-prod |
| **Cloudflare R2** | Local MinIO or ity-dev-uploads | ity-staging-uploads | ity-prod-uploads |
| **Cloudflare KV** | Local KV | ity-domains-staging | ity-domains-prod |
| **Stripe** | Test keys (sk_test_) | Test keys (sk_test_) | Live keys (sk_live_) |
| **Daily.co** | Sandbox | Sandbox | Production |
| **Mux** | Dev environment | Dev environment | Production |
| **Resend** | Sandbox (no emails) | Test domain | Production domain |

#### Git Branches Strategy

```
main (production)
  │
  └── develop (staging)
        │
        ├── feature/US-001-monorepo-setup
        ├── feature/US-002-database-schema
        ├── fix/US-015-dashboard-bug
        └── ...
```

| Branch | Environment | Auto-Deploy |
|--------|-------------|-------------|
| `main` | Production | Yes (after approval) |
| `develop` | Staging | Yes (automatic) |
| `feature/*` | Preview (Vercel) | Yes (per PR) |
| `fix/*` | Preview (Vercel) | Yes (per PR) |

### 14.3 CI/CD Pipeline

#### GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ vars.TURBO_TEAM }}

jobs:
  # ==========================================
  # QUALITY CHECKS (All branches)
  # ==========================================
  quality:
    name: Quality Checks
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Type check
        run: pnpm type-check

      - name: Lint
        run: pnpm lint

      - name: Unit tests
        run: pnpm test

  # ==========================================
  # BUILD (All branches)
  # ==========================================
  build:
    name: Build
    needs: quality
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ vars.NEXT_PUBLIC_SUPABASE_URL_STAGING }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY_STAGING }}

  # ==========================================
  # DEPLOY STAGING (develop branch only)
  # ==========================================
  deploy-staging:
    name: Deploy to Staging
    needs: build
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel (Staging)
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          alias-domains: staging.ity.com

      - name: Deploy Cloudflare Worker (Staging)
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          workingDirectory: 'apps/worker'
          command: deploy --env staging

      - name: Run DB Migrations (Staging)
        run: pnpm --filter @ity/db db:push
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL_STAGING }}

  # ==========================================
  # DEPLOY PRODUCTION (main branch only)
  # ==========================================
  deploy-production:
    name: Deploy to Production
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel (Production)
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

      - name: Deploy Cloudflare Worker (Production)
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          workingDirectory: 'apps/worker'
          command: deploy --env production

      - name: Run DB Migrations (Production)
        run: pnpm --filter @ity/db db:push
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL_PRODUCTION }}
```

### 14.4 Environment Files Structure

```
ity/
├── .env.example              # Template with all variables
├── .env.local                # Local development (git ignored)
├── .env.staging              # Staging reference (git ignored)
├── .env.production           # Production reference (git ignored)
├── apps/
│   ├── web/
│   │   ├── .env.local        # App-specific local overrides
│   │   └── .env.example
│   └── worker/
│       ├── .dev.vars         # Cloudflare Worker local vars
│       └── wrangler.toml     # Worker config with env sections
└── packages/
    └── db/
        └── .env.local        # DB connection for migrations
```

### 14.5 Environment Variables by Environment

```bash
# ================================================
# .env.local (LOCAL DEVELOPMENT)
# ================================================
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_ENV=local

# Supabase Local (Docker) or Dev Project
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...local
SUPABASE_SERVICE_ROLE_KEY=eyJ...local
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres

# Stripe Test Mode
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_test_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx

# Cloudflare (Dev bucket)
R2_BUCKET_NAME=ity-dev-uploads
R2_PUBLIC_URL=http://localhost:9000/ity-dev-uploads

# Feature Flags
ENABLE_DEBUG=true
ENABLE_MOCK_PAYMENTS=true
```

```bash
# ================================================
# STAGING ENVIRONMENT (Vercel + GitHub Secrets)
# ================================================
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://staging.ity.com
NEXT_PUBLIC_APP_ENV=staging

# Supabase Staging Project
NEXT_PUBLIC_SUPABASE_URL=https://xxx-staging.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...staging
SUPABASE_SERVICE_ROLE_KEY=eyJ...staging
DATABASE_URL=postgresql://postgres:xxx@db.xxx-staging.supabase.co:5432/postgres

# Stripe Test Mode (same as local)
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_staging_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx

# Cloudflare Staging
R2_BUCKET_NAME=ity-staging-uploads
R2_PUBLIC_URL=https://staging-cdn.ity.com

# Feature Flags
ENABLE_DEBUG=true
ENABLE_MOCK_PAYMENTS=false
```

```bash
# ================================================
# PRODUCTION ENVIRONMENT (Vercel + GitHub Secrets)
# ================================================
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://ity.com
NEXT_PUBLIC_APP_ENV=production

# Supabase Production Project
NEXT_PUBLIC_SUPABASE_URL=https://xxx-prod.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...prod
SUPABASE_SERVICE_ROLE_KEY=eyJ...prod
DATABASE_URL=postgresql://postgres:xxx@db.xxx-prod.supabase.co:5432/postgres

# Stripe LIVE Mode
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_prod_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx

# Cloudflare Production
R2_BUCKET_NAME=ity-prod-uploads
R2_PUBLIC_URL=https://cdn.ity.com

# Feature Flags
ENABLE_DEBUG=false
ENABLE_MOCK_PAYMENTS=false
```

### 14.6 Cloudflare Worker Environments

```toml
# apps/worker/wrangler.toml

name = "ity-domain-router"
main = "src/index.ts"
compatibility_date = "2024-01-01"

# ==========================================
# STAGING ENVIRONMENT
# ==========================================
[env.staging]
name = "ity-domain-router-staging"
vars = { VERCEL_URL = "https://staging.ity.com" }

[[env.staging.kv_namespaces]]
binding = "DOMAIN_MAPPING"
id = "kv-staging-id-xxx"

[[env.staging.r2_buckets]]
binding = "UPLOADS"
bucket_name = "ity-staging-uploads"

# ==========================================
# PRODUCTION ENVIRONMENT
# ==========================================
[env.production]
name = "ity-domain-router"
vars = { VERCEL_URL = "https://ity.com" }
routes = [
  { pattern = "*", zone_name = "ity.com" }
]

[[env.production.kv_namespaces]]
binding = "DOMAIN_MAPPING"
id = "kv-prod-id-xxx"

[[env.production.r2_buckets]]
binding = "UPLOADS"
bucket_name = "ity-prod-uploads"
```

### 14.7 Database Migrations Strategy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     DATABASE MIGRATION FLOW                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   1. Developer creates migration locally                                │
│      └── pnpm --filter @ity/db db:generate                             │
│                                                                         │
│   2. Test migration on local DB                                         │
│      └── pnpm --filter @ity/db db:push                                 │
│                                                                         │
│   3. Commit migration files to feature branch                           │
│      └── git add packages/db/drizzle/*                                 │
│                                                                         │
│   4. PR merged to develop → Auto-deploy to Staging                      │
│      └── CI runs: pnpm --filter @ity/db db:push (staging)              │
│                                                                         │
│   5. QA validates on Staging                                            │
│                                                                         │
│   6. PR from develop to main → Deploy to Production                     │
│      └── CI runs: pnpm --filter @ity/db db:push (production)           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 14.8 Vercel Project Configuration

```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "pnpm build",
  "installCommand": "pnpm install",
  "outputDirectory": "apps/web/.next",
  "regions": ["iad1"],
  "git": {
    "deploymentEnabled": {
      "main": true,
      "develop": true
    }
  },
  "env": {
    "TURBO_TOKEN": "@turbo-token",
    "TURBO_TEAM": "@turbo-team"
  }
}
```

#### Vercel Environment Configuration (Dashboard)

| Variable | Development | Preview | Production |
|----------|-------------|---------|------------|
| `NEXT_PUBLIC_APP_ENV` | local | staging | production |
| `NEXT_PUBLIC_SUPABASE_URL` | - | staging URL | prod URL |
| `DATABASE_URL` | - | staging DB | prod DB |
| `STRIPE_SECRET_KEY` | - | sk_test_xxx | sk_live_xxx |

### 14.9 Supabase Projects Setup

```
Supabase Dashboard:
├── ity-dev (optional, for shared dev)
│   └── For local development if not using Docker
│
├── ity-staging
│   ├── Database: Same schema as prod
│   ├── Auth: Test users allowed
│   ├── RLS: Enabled
│   └── Edge Functions: Staging versions
│
└── ity-prod
    ├── Database: Production data
    ├── Auth: Real users only
    ├── RLS: Enabled (strict)
    ├── Backups: Daily automated
    └── Edge Functions: Production versions
```

### 14.10 Local Development Setup

```bash
# 1. Clone repository
git clone https://github.com/your-org/ity.git
cd ity

# 2. Install dependencies
pnpm install

# 3. Copy environment template
cp .env.example .env.local

# 4. Start Supabase locally (optional)
pnpm supabase start

# 5. Push schema to local DB
pnpm --filter @ity/db db:push

# 6. Seed development data
pnpm --filter @ity/db db:seed

# 7. Start development server
pnpm dev

# App running at http://localhost:3000
```

### 14.11 Preview Deployments (Pull Requests)

Every PR automatically gets:
- Vercel Preview URL: `ity-git-feature-xxx.vercel.app`
- Uses staging Supabase (shared)
- Uses staging Cloudflare resources
- Stripe test mode

```yaml
# PR Comment Bot adds:
# ✅ Preview: https://ity-git-feature-us-001.vercel.app
# 📊 Bundle size: +2.3kb (0.1%)
# 🧪 Tests: 42 passed
```

### 14.12 Rollback Strategy

```bash
# Vercel - Instant rollback to previous deployment
vercel rollback [deployment-url]

# Cloudflare Worker - Rollback to previous version
wrangler rollback --env production

# Database - Restore from Supabase backup
# (Manual via Supabase Dashboard or CLI)
supabase db restore --project-ref xxx --time "2024-01-15T10:00:00Z"
```

### 14.13 Monitoring & Alerts

| Service | Tool | Purpose |
|---------|------|---------|
| **App Performance** | Vercel Analytics | Core Web Vitals, errors |
| **Database** | Supabase Dashboard | Queries, connections |
| **Worker** | Cloudflare Analytics | Requests, errors, latency |
| **Uptime** | Better Uptime / Checkly | Endpoint monitoring |
| **Errors** | Sentry | Error tracking |
| **Logs** | Vercel Logs / Axiom | Centralized logging |

---

## 15. NEXT STEPS

### Phase 0: Foundation (Weeks 1-4)
- [ ] Setup monorepo with Turborepo
- [ ] Configure GitHub repository with branch protection
- [ ] Setup CI/CD pipeline (GitHub Actions)
- [ ] Create Supabase projects (staging + production)
- [ ] Setup Cloudflare (DNS, Workers, R2) for both environments
- [ ] Configure Vercel project with environment variables
- [ ] Implement database schema
- [ ] Setup authentication (creators)
- [ ] Basic dashboard layout

### Phase 1: MVP Core (Weeks 5-12)
- [ ] School CRUD with branding
- [ ] Course CRUD with modules/lessons
- [ ] Video upload and playback
- [ ] Landing page builder
- [ ] Student authentication
- [ ] Stripe integration (test mode first)
- [ ] Custom domains

### Phase 2: Live & Blocks (Weeks 13-20)
- [ ] Daily.co integration
- [ ] Quizzes
- [ ] Downloads
- [ ] Announcements
- [ ] Progress tracking

### Phase 3: Scale (Weeks 21+)
- [ ] Additional languages
- [ ] Analytics
- [ ] Email automation
- [ ] Mobile app
- [ ] Production hardening

---

**Document Version:** 1.1
**Last Updated:** January 2025
**Author:** Architecture Team
**Changes:** Added Environments & CI/CD section (Section 14)
