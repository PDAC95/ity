import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  jsonb,
  decimal,
  integer,
  unique,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { AvailableFont, BlockId } from '@ity/config';

// ============================================
// TYPES
// ============================================

export type Branding = {
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  font: AvailableFont;
  favicon?: string;
};

export type StudentDashboardConfig = {
  sections: Array<{
    id: string;
    type: 'announcements' | 'progress' | 'live-classes' | 'activity';
    visible: boolean;
    order: number;
  }>;
  showProgressPercentage: boolean;
  showNextLesson: boolean;
};

export type LessonContent = {
  // For video
  muxAssetId?: string;
  muxPlaybackId?: string;
  duration?: number;
  // For text
  html?: string;
  // For quiz
  questions?: Array<{
    id: string;
    type: 'multiple-choice' | 'true-false' | 'open-ended';
    question: string;
    options?: string[];
    correctAnswer: string | number;
    points: number;
  }>;
  timeLimit?: number;
  // For download
  files?: Array<{
    id: string;
    name: string;
    url: string;
    size: number;
    mimeType: string;
  }>;
};

export type EnrollmentProgress = {
  completedLessons: string[];
  lastLessonId?: string;
  lastAccessedAt?: string;
  quizScores?: Record<string, number>;
};

export type LandingPageData = {
  sections: Array<{
    id: string;
    type: 'hero' | 'about' | 'curriculum' | 'testimonials' | 'faq' | 'cta';
    order: number;
    content: Record<string, unknown>;
  }>;
};

// ============================================
// CREATORS (ITY platform users)
// ============================================
export const creators = pgTable('creators', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  language: varchar('language', { length: 5 }).default('en'),
  emailVerified: boolean('email_verified').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const creatorsRelations = relations(creators, ({ many }) => ({
  schools: many(schools),
}));

// ============================================
// SCHOOLS
// ============================================
export const schools = pgTable(
  'schools',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    creatorId: uuid('creator_id')
      .references(() => creators.id, { onDelete: 'cascade' })
      .notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 100 }).unique().notNull(),
    description: text('description'),
    customDomain: varchar('custom_domain', { length: 255 }).unique(),
    domainVerified: boolean('domain_verified').default(false),
    branding: jsonb('branding').$type<Branding>().default({
      primaryColor: '#6366F1',
      secondaryColor: '#F59E0B',
      font: 'inter',
    }),
    studentDashboardConfig: jsonb('student_dashboard_config').$type<StudentDashboardConfig>(),
    stripeAccountId: varchar('stripe_account_id', { length: 255 }),
    stripeOnboarded: boolean('stripe_onboarded').default(false),
    subscriptionPlan: varchar('subscription_plan', { length: 50 }).default('free'),
    language: varchar('language', { length: 5 }).default('en'),
    timezone: varchar('timezone', { length: 50 }).default('America/New_York'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index('schools_creator_idx').on(table.creatorId),
    index('schools_domain_idx').on(table.customDomain),
  ]
);

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
}));

// ============================================
// COURSES
// ============================================
export const courses = pgTable(
  'courses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    schoolId: uuid('school_id')
      .references(() => schools.id, { onDelete: 'cascade' })
      .notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(),
    description: text('description'),
    shortDescription: varchar('short_description', { length: 500 }),
    thumbnailUrl: varchar('thumbnail_url', { length: 500 }),
    price: decimal('price', { precision: 10, scale: 2 }).default('0'),
    currency: varchar('currency', { length: 3 }).default('USD'),
    isPublished: boolean('is_published').default(false),
    activeBlocks: jsonb('active_blocks').$type<BlockId[]>().default([
      'videos',
      'live',
      'quizzes',
      'downloads',
      'announcements',
      'progress',
    ]),
    landingPageData: jsonb('landing_page_data').$type<LandingPageData>(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index('courses_school_idx').on(table.schoolId),
    unique('courses_school_slug_unique').on(table.schoolId, table.slug),
  ]
);

export const coursesRelations = relations(courses, ({ one, many }) => ({
  school: one(schools, {
    fields: [courses.schoolId],
    references: [schools.id],
  }),
  modules: many(modules),
  enrollments: many(enrollments),
  liveClasses: many(liveClasses),
  payments: many(payments),
}));

// ============================================
// MODULES
// ============================================
export const modules = pgTable(
  'modules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    courseId: uuid('course_id')
      .references(() => courses.id, { onDelete: 'cascade' })
      .notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    order: integer('order').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index('modules_course_idx').on(table.courseId),
    index('modules_order_idx').on(table.courseId, table.order),
  ]
);

export const modulesRelations = relations(modules, ({ one, many }) => ({
  course: one(courses, {
    fields: [modules.courseId],
    references: [courses.id],
  }),
  lessons: many(lessons),
}));

// ============================================
// LESSONS
// ============================================
export const lessons = pgTable(
  'lessons',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    moduleId: uuid('module_id')
      .references(() => modules.id, { onDelete: 'cascade' })
      .notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    type: varchar('type', { length: 50 }).notNull(), // video, text, quiz, download
    content: jsonb('content').$type<LessonContent>(),
    order: integer('order').notNull().default(0),
    isFreePreview: boolean('is_free_preview').default(false),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index('lessons_module_idx').on(table.moduleId),
    index('lessons_order_idx').on(table.moduleId, table.order),
  ]
);

export const lessonsRelations = relations(lessons, ({ one }) => ({
  module: one(modules, {
    fields: [lessons.moduleId],
    references: [modules.id],
  }),
}));

// ============================================
// STUDENTS (scoped per school)
// ============================================
export const students = pgTable(
  'students',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    schoolId: uuid('school_id')
      .references(() => schools.id, { onDelete: 'cascade' })
      .notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    name: varchar('name', { length: 255 }),
    avatarUrl: varchar('avatar_url', { length: 500 }),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index('students_school_idx').on(table.schoolId),
    unique('students_school_email_unique').on(table.schoolId, table.email),
  ]
);

export const studentsRelations = relations(students, ({ one, many }) => ({
  school: one(schools, {
    fields: [students.schoolId],
    references: [schools.id],
  }),
  enrollments: many(enrollments),
  payments: many(payments),
}));

// ============================================
// ENROLLMENTS
// ============================================
export const enrollments = pgTable(
  'enrollments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    studentId: uuid('student_id')
      .references(() => students.id, { onDelete: 'cascade' })
      .notNull(),
    courseId: uuid('course_id')
      .references(() => courses.id, { onDelete: 'cascade' })
      .notNull(),
    progress: jsonb('progress').$type<EnrollmentProgress>().default({ completedLessons: [] }),
    completedAt: timestamp('completed_at'),
    enrolledAt: timestamp('enrolled_at').defaultNow(),
  },
  (table) => [
    index('enrollments_student_idx').on(table.studentId),
    index('enrollments_course_idx').on(table.courseId),
    unique('enrollments_student_course_unique').on(table.studentId, table.courseId),
  ]
);

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  student: one(students, {
    fields: [enrollments.studentId],
    references: [students.id],
  }),
  course: one(courses, {
    fields: [enrollments.courseId],
    references: [courses.id],
  }),
}));

// ============================================
// PAYMENTS
// ============================================
export const payments = pgTable(
  'payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    schoolId: uuid('school_id')
      .references(() => schools.id, { onDelete: 'cascade' })
      .notNull(),
    studentId: uuid('student_id').references(() => students.id, { onDelete: 'set null' }),
    courseId: uuid('course_id').references(() => courses.id, { onDelete: 'set null' }),
    stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }).unique(),
    stripeCheckoutSessionId: varchar('stripe_checkout_session_id', { length: 255 }).unique(),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 3 }).default('USD'),
    status: varchar('status', { length: 50 }).notNull(), // pending, completed, failed, refunded
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index('payments_school_idx').on(table.schoolId),
    index('payments_student_idx').on(table.studentId),
    index('payments_status_idx').on(table.status),
  ]
);

export const paymentsRelations = relations(payments, ({ one }) => ({
  school: one(schools, {
    fields: [payments.schoolId],
    references: [schools.id],
  }),
  student: one(students, {
    fields: [payments.studentId],
    references: [students.id],
  }),
  course: one(courses, {
    fields: [payments.courseId],
    references: [courses.id],
  }),
}));

// ============================================
// LIVE CLASSES
// ============================================
export const liveClasses = pgTable(
  'live_classes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    courseId: uuid('course_id')
      .references(() => courses.id, { onDelete: 'cascade' })
      .notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    scheduledAt: timestamp('scheduled_at').notNull(),
    duration: integer('duration').notNull().default(60), // minutes
    roomUrl: varchar('room_url', { length: 500 }),
    recordingUrl: varchar('recording_url', { length: 500 }),
    status: varchar('status', { length: 50 }).default('scheduled'), // scheduled, live, ended, cancelled
    attendees: jsonb('attendees').$type<string[]>().default([]),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index('live_classes_course_idx').on(table.courseId),
    index('live_classes_scheduled_idx').on(table.scheduledAt),
    index('live_classes_status_idx').on(table.status),
  ]
);

export const liveClassesRelations = relations(liveClasses, ({ one }) => ({
  course: one(courses, {
    fields: [liveClasses.courseId],
    references: [courses.id],
  }),
}));

// ============================================
// ANNOUNCEMENTS
// ============================================
export const announcements = pgTable(
  'announcements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    schoolId: uuid('school_id')
      .references(() => schools.id, { onDelete: 'cascade' })
      .notNull(),
    courseId: uuid('course_id').references(() => courses.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    content: text('content').notNull(),
    isPublished: boolean('is_published').default(false),
    publishedAt: timestamp('published_at'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index('announcements_school_idx').on(table.schoolId),
    index('announcements_course_idx').on(table.courseId),
    index('announcements_published_idx').on(table.isPublished),
  ]
);

export const announcementsRelations = relations(announcements, ({ one }) => ({
  school: one(schools, {
    fields: [announcements.schoolId],
    references: [schools.id],
  }),
  course: one(courses, {
    fields: [announcements.courseId],
    references: [courses.id],
  }),
}));

// ============================================
// DOMAIN VERIFICATIONS
// ============================================
export const domainVerifications = pgTable(
  'domain_verifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    schoolId: uuid('school_id')
      .references(() => schools.id, { onDelete: 'cascade' })
      .notNull(),
    domain: varchar('domain', { length: 255 }).unique().notNull(),
    verificationToken: varchar('verification_token', { length: 255 }).notNull(),
    verifiedAt: timestamp('verified_at'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => [index('domain_verifications_school_idx').on(table.schoolId)]
);

export const domainVerificationsRelations = relations(domainVerifications, ({ one }) => ({
  school: one(schools, {
    fields: [domainVerifications.schoolId],
    references: [schools.id],
  }),
}));
