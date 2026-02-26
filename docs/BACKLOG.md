# ITY - Product Backlog
## User Stories & Sprint Planning

**Version:** 1.0
**Last Updated:** January 2025
**Product:** ITY (I Teach You)

---

## TABLE OF CONTENTS

1. [Personas](#1-personas)
2. [Épicas](#2-épicas)
3. [User Stories by Epic](#3-user-stories-by-epic)
4. [Sprint Planning](#4-sprint-planning)
5. [Dependencies Map](#5-dependencies-map)
6. [Definition of Done](#6-definition-of-done)

---

## 1. PERSONAS

### P1: Creator (Primary)
- **Role:** Course creator, coach, consultant
- **Goal:** Launch online school quickly with their brand
- **Tech Level:** Non-technical, expects simplicity

### P2: Student
- **Role:** Learner enrolled in courses
- **Goal:** Access content, attend live classes, track progress
- **Tech Level:** Basic, expects intuitive UX

### P3: Admin (Future)
- **Role:** ITY platform administrator
- **Goal:** Manage creators, monitor platform
- **Tech Level:** Technical

---

## 2. ÉPICAS

| ID | Epic | Description | Priority | Sprint Range |
|----|------|-------------|----------|--------------|
| **E01** | Foundation | Infrastructure, auth, base setup | P0 | 1-2 |
| **E02** | School Management | CRUD schools, branding, settings | P0 | 2-3 |
| **E03** | Course Management | CRUD courses, modules, lessons | P0 | 3-4 |
| **E04** | Video Content | Upload, processing, playback | P0 | 4-5 |
| **E05** | Student Experience | Enrollment, dashboard, progress | P0 | 5-6 |
| **E06** | Payments | Stripe Connect, checkout | P0 | 6-7 |
| **E07** | Custom Domains | Domain setup, SSL, routing | P0 | 7-8 |
| **E08** | Landing Builder | Drag & drop page builder | P1 | 8-9 |
| **E09** | Live Classes | Scheduling, video room, chat | P1 | 9-10 |
| **E10** | Quizzes & Downloads | Additional content blocks | P1 | 10-11 |
| **E11** | Announcements | School/course announcements | P2 | 11 |
| **E12** | Analytics | Creator dashboard stats | P2 | 11-12 |

---

## 3. USER STORIES BY EPIC

---

### EPIC E01: FOUNDATION

#### US-001: Monorepo Setup
**As a** developer
**I want** a configured monorepo with Turborepo
**So that** I can develop frontend, backend, and packages in one place

**Acceptance Criteria:**
- GIVEN a fresh clone of the repo
- WHEN I run `pnpm install && pnpm dev`
- THEN all apps start without errors

**Technical Tasks:**
- [ ] Initialize Turborepo with pnpm workspaces
- [ ] Create `apps/web` (Next.js 14)
- [ ] Create `apps/worker` (Cloudflare Worker)
- [ ] Create `packages/db` (Drizzle schema)
- [ ] Create `packages/api` (tRPC routers)
- [ ] Create `packages/ui` (shared components)
- [ ] Create `packages/config` (shared config)
- [ ] Create `packages/typescript-config`
- [ ] Configure ESLint and Prettier
- [ ] Setup turbo.json pipeline

**Story Points:** 3
**Priority:** P0
**Sprint:** 1
**Dependencies:** None

---

#### US-001b: CI/CD Pipeline Setup
**As a** developer
**I want** a complete CI/CD pipeline with GitHub Actions
**So that** code is automatically tested and deployed to staging/production

**Acceptance Criteria:**
- GIVEN a PR is opened
- WHEN code is pushed
- THEN tests run automatically and preview deployment is created
- AND merging to develop deploys to staging
- AND merging to main deploys to production

**Technical Tasks:**
- [ ] Create GitHub repository with branch protection rules
- [ ] Setup branch strategy (main, develop, feature/*)
- [ ] Create `.github/workflows/ci.yml` for CI pipeline
- [ ] Configure quality checks (lint, type-check, test)
- [ ] Setup Vercel project with GitHub integration
- [ ] Configure Vercel environments (preview, staging, production)
- [ ] Setup staging deployment on develop branch
- [ ] Setup production deployment on main branch
- [ ] Configure Turbo Remote Caching
- [ ] Add PR comment bot for preview URLs

**Story Points:** 3
**Priority:** P0
**Sprint:** 1
**Dependencies:** US-001

---

#### US-001c: Environment Configuration
**As a** developer
**I want** separate environments for local, staging, and production
**So that** I can develop and test safely without affecting production

**Acceptance Criteria:**
- GIVEN the three environments
- WHEN I deploy to each
- THEN each uses its own database, storage, and API keys

**Technical Tasks:**
- [ ] Create Supabase projects (ity-staging, ity-prod)
- [ ] Create Cloudflare resources for staging
- [ ] Create Cloudflare resources for production
- [ ] Setup R2 buckets (staging, production)
- [ ] Setup KV namespaces (staging, production)
- [ ] Configure Cloudflare Worker environments in wrangler.toml
- [ ] Create .env.example with all variables documented
- [ ] Setup GitHub Environments (staging, production)
- [ ] Configure GitHub Secrets for each environment
- [ ] Setup Vercel environment variables
- [ ] Document local development setup in README

**Story Points:** 5
**Priority:** P0
**Sprint:** 1
**Dependencies:** US-001, US-001b

---

#### US-002: Database Schema Setup
**As a** developer
**I want** the complete database schema in Supabase
**So that** I can build features on top of it

**Acceptance Criteria:**
- GIVEN the Drizzle schema
- WHEN I run `pnpm db:push`
- THEN all tables are created in Supabase with correct relations

**Technical Tasks:**
- [ ] Create Supabase project
- [ ] Implement `creators` table
- [ ] Implement `schools` table with JSONB branding
- [ ] Implement `courses` table
- [ ] Implement `modules` table
- [ ] Implement `lessons` table with JSONB content
- [ ] Implement `students` table (school-scoped)
- [ ] Implement `enrollments` table
- [ ] Implement `live_classes` table
- [ ] Implement `announcements` table
- [ ] Implement `payments` table
- [ ] Implement `domain_verifications` table
- [ ] Define all relations in Drizzle
- [ ] Create indexes for common queries
- [ ] Setup RLS policies

**Story Points:** 5
**Priority:** P0
**Sprint:** 1
**Dependencies:** US-001

---

#### US-003: Supabase Auth Configuration
**As a** developer
**I want** Supabase Auth configured for creators
**So that** creators can register and login

**Acceptance Criteria:**
- GIVEN a new user
- WHEN they register with email/password
- THEN an account is created and verification email sent

**Technical Tasks:**
- [ ] Configure Supabase Auth settings
- [ ] Setup email templates (verify, reset)
- [ ] Create auth trigger to create `creators` record
- [ ] Configure OAuth providers (Google, optional)
- [ ] Setup password policies

**Story Points:** 2
**Priority:** P0
**Sprint:** 1
**Dependencies:** US-002

---

#### US-004: Next.js App Base Setup
**As a** developer
**I want** the Next.js app configured with all dependencies
**So that** I can start building features

**Acceptance Criteria:**
- GIVEN the `apps/web` folder
- WHEN I run `pnpm dev`
- THEN the app starts with Tailwind, shadcn/ui, and tRPC configured

**Technical Tasks:**
- [ ] Configure Next.js 14 with App Router
- [ ] Setup Tailwind CSS
- [ ] Initialize shadcn/ui with base components
- [ ] Configure next-intl for i18n
- [ ] Setup tRPC client
- [ ] Create Supabase client (browser + server)
- [ ] Setup middleware for auth and routing
- [ ] Create base layout components
- [ ] Configure environment variables

**Story Points:** 3
**Priority:** P0
**Sprint:** 1
**Dependencies:** US-001

---

#### US-005: tRPC Base Setup
**As a** developer
**I want** tRPC configured with context and procedures
**So that** I can create type-safe API endpoints

**Acceptance Criteria:**
- GIVEN the tRPC setup
- WHEN I call a protected procedure without auth
- THEN I get an UNAUTHORIZED error

**Technical Tasks:**
- [ ] Create tRPC context with DB and auth
- [ ] Create `publicProcedure`
- [ ] Create `protectedProcedure` (creator auth)
- [ ] Create `studentProcedure` (student auth)
- [ ] Setup error handling
- [ ] Configure superjson transformer
- [ ] Create root router
- [ ] Setup Next.js API handler

**Story Points:** 2
**Priority:** P0
**Sprint:** 1
**Dependencies:** US-002, US-004

---

#### US-006: Creator Registration
**As a** creator
**I want** to register for an ITY account
**So that** I can start creating my online school

**Acceptance Criteria:**
- GIVEN I'm on the registration page
- WHEN I enter valid email, password, and name
- THEN my account is created and I receive a verification email
- AND I'm redirected to verify email page

**Validation Rules:**
- Email: valid format, unique
- Password: min 8 chars, 1 uppercase, 1 number
- Name: min 2 chars

**Technical Tasks:**
- [ ] Create `/register` page
- [ ] Create registration form with React Hook Form
- [ ] Add Zod validation schema
- [ ] Implement `auth.register` tRPC mutation
- [ ] Send verification email via Supabase
- [ ] Create success/verification pending page
- [ ] Handle duplicate email error

**Story Points:** 3
**Priority:** P0
**Sprint:** 2
**Dependencies:** US-003, US-004, US-005

---

#### US-007: Creator Email Verification
**As a** creator
**I want** to verify my email address
**So that** I can access my account

**Acceptance Criteria:**
- GIVEN I received a verification email
- WHEN I click the verification link
- THEN my email is marked as verified
- AND I'm redirected to onboarding

**Technical Tasks:**
- [ ] Create `/verify` page
- [ ] Handle Supabase verification callback
- [ ] Update creator record with verified status
- [ ] Redirect to onboarding flow
- [ ] Handle expired/invalid tokens

**Story Points:** 2
**Priority:** P0
**Sprint:** 2
**Dependencies:** US-006

---

#### US-008: Creator Login
**As a** creator
**I want** to login to my account
**So that** I can manage my schools

**Acceptance Criteria:**
- GIVEN I have a verified account
- WHEN I enter correct email and password
- THEN I'm logged in and redirected to dashboard

**Technical Tasks:**
- [ ] Create `/login` page
- [ ] Create login form
- [ ] Implement `auth.login` tRPC mutation
- [ ] Handle session with Supabase
- [ ] Store auth state
- [ ] Redirect to dashboard on success
- [ ] Handle invalid credentials error
- [ ] Add "Remember me" option

**Story Points:** 2
**Priority:** P0
**Sprint:** 2
**Dependencies:** US-006

---

#### US-009: Password Reset Flow
**As a** creator
**I want** to reset my password if I forget it
**So that** I can regain access to my account

**Acceptance Criteria:**
- GIVEN I'm on the forgot password page
- WHEN I enter my email
- THEN I receive a password reset email
- AND I can set a new password

**Technical Tasks:**
- [ ] Create `/forgot-password` page
- [ ] Create `/reset-password` page
- [ ] Implement `auth.forgotPassword` mutation
- [ ] Implement `auth.resetPassword` mutation
- [ ] Configure Supabase password reset email
- [ ] Handle token validation
- [ ] Redirect to login after reset

**Story Points:** 2
**Priority:** P1
**Sprint:** 2
**Dependencies:** US-006

---

#### US-010: Creator Dashboard Layout
**As a** creator
**I want** a dashboard layout with navigation
**So that** I can navigate between sections

**Acceptance Criteria:**
- GIVEN I'm logged in
- WHEN I access the dashboard
- THEN I see a sidebar with navigation links
- AND I can switch between sections

**Technical Tasks:**
- [ ] Create dashboard layout component
- [ ] Create sidebar navigation
- [ ] Create header with user menu
- [ ] Create school switcher dropdown
- [ ] Implement responsive mobile navigation
- [ ] Add logout functionality
- [ ] Create loading states

**Story Points:** 3
**Priority:** P0
**Sprint:** 2
**Dependencies:** US-008

---

### EPIC E02: SCHOOL MANAGEMENT

#### US-011: Create New School
**As a** creator
**I want** to create a new school
**So that** I can start building my online academy

**Acceptance Criteria:**
- GIVEN I'm on the dashboard
- WHEN I click "Create School" and fill the form
- THEN a new school is created with default branding
- AND I'm redirected to the school settings

**Technical Tasks:**
- [ ] Create `/schools/new` page
- [ ] Create school creation wizard (3 steps)
- [ ] Step 1: Name and slug
- [ ] Step 2: Basic branding (logo, colors)
- [ ] Step 3: Confirmation
- [ ] Implement `schools.create` mutation
- [ ] Validate slug uniqueness
- [ ] Set default branding values
- [ ] Create school overview page

**Story Points:** 5
**Priority:** P0
**Sprint:** 3
**Dependencies:** US-010

---

#### US-012: School Branding Settings
**As a** creator
**I want** to customize my school's branding
**So that** it reflects my brand identity

**Acceptance Criteria:**
- GIVEN I'm in school settings
- WHEN I update logo, colors, or font
- THEN the changes are saved
- AND I see a live preview

**Technical Tasks:**
- [ ] Create `/schools/[id]/branding` page
- [ ] Create logo uploader component
- [ ] Create color picker component
- [ ] Create font selector (3 options)
- [ ] Create branding preview component
- [ ] Implement `schools.updateBranding` mutation
- [ ] Upload logo to R2 storage
- [ ] Auto-save on changes

**Story Points:** 5
**Priority:** P0
**Sprint:** 3
**Dependencies:** US-011

---

#### US-013: School General Settings
**As a** creator
**I want** to update my school's general settings
**So that** I can configure basic information

**Acceptance Criteria:**
- GIVEN I'm in school settings
- WHEN I update name, description, or timezone
- THEN the changes are saved

**Technical Tasks:**
- [ ] Create `/schools/[id]/settings` page
- [ ] Create settings form
- [ ] Implement `schools.update` mutation
- [ ] Add timezone selector
- [ ] Add language selector (for students)
- [ ] Handle validation errors

**Story Points:** 2
**Priority:** P1
**Sprint:** 3
**Dependencies:** US-011

---

#### US-014: List Creator's Schools
**As a** creator
**I want** to see all my schools
**So that** I can switch between them

**Acceptance Criteria:**
- GIVEN I have multiple schools
- WHEN I go to the dashboard
- THEN I see a list of all my schools with key metrics

**Technical Tasks:**
- [ ] Create schools list page
- [ ] Create school card component
- [ ] Implement `schools.list` query
- [ ] Show student count per school
- [ ] Show course count per school
- [ ] Add quick actions (edit, view)
- [ ] Handle empty state

**Story Points:** 2
**Priority:** P0
**Sprint:** 3
**Dependencies:** US-011

---

#### US-015: School Overview Dashboard
**As a** creator
**I want** to see an overview of my school
**So that** I can understand its performance at a glance

**Acceptance Criteria:**
- GIVEN I select a school
- WHEN I view the overview
- THEN I see key metrics: students, courses, revenue

**Technical Tasks:**
- [ ] Create `/schools/[id]` overview page
- [ ] Create stats cards component
- [ ] Create recent activity list
- [ ] Create upcoming classes widget
- [ ] Implement `schools.getOverview` query
- [ ] Calculate basic metrics

**Story Points:** 3
**Priority:** P1
**Sprint:** 3
**Dependencies:** US-011

---

#### US-016: Student Dashboard Configuration
**As a** creator
**I want** to configure what students see on their dashboard
**So that** I can customize their experience

**Acceptance Criteria:**
- GIVEN I'm in school settings
- WHEN I reorder or hide dashboard sections
- THEN students see the customized layout

**Technical Tasks:**
- [ ] Create dashboard config page
- [ ] Create sortable sections list
- [ ] Create toggle switches for visibility
- [ ] Implement `schools.updateStudentDashboard` mutation
- [ ] Save config to JSONB field
- [ ] Add preview mode

**Story Points:** 3
**Priority:** P2
**Sprint:** 3
**Dependencies:** US-012

---

### EPIC E03: COURSE MANAGEMENT

#### US-017: Create New Course
**As a** creator
**I want** to create a new course
**So that** I can start adding content

**Acceptance Criteria:**
- GIVEN I'm in a school
- WHEN I click "Create Course" and fill the form
- THEN a new course is created
- AND I'm redirected to the course editor

**Technical Tasks:**
- [ ] Create `/schools/[id]/courses/new` page
- [ ] Create course creation form
- [ ] Add title, slug, description fields
- [ ] Add price field with currency selector
- [ ] Add thumbnail uploader
- [ ] Implement `courses.create` mutation
- [ ] Validate slug uniqueness within school
- [ ] Create default empty structure

**Story Points:** 3
**Priority:** P0
**Sprint:** 4
**Dependencies:** US-011

---

#### US-018: Course Content Editor - Modules
**As a** creator
**I want** to organize my course into modules
**So that** content is structured logically

**Acceptance Criteria:**
- GIVEN I'm in the course editor
- WHEN I add, edit, or reorder modules
- THEN the changes are saved
- AND I see the updated structure

**Technical Tasks:**
- [ ] Create course content editor page
- [ ] Create module accordion component
- [ ] Implement add module functionality
- [ ] Implement edit module (inline)
- [ ] Implement delete module with confirmation
- [ ] Implement drag-and-drop reordering
- [ ] Create `modules.create` mutation
- [ ] Create `modules.update` mutation
- [ ] Create `modules.delete` mutation
- [ ] Create `modules.reorder` mutation

**Story Points:** 5
**Priority:** P0
**Sprint:** 4
**Dependencies:** US-017

---

#### US-019: Course Content Editor - Lessons
**As a** creator
**I want** to add lessons to modules
**So that** I can deliver content to students

**Acceptance Criteria:**
- GIVEN I'm in a module
- WHEN I add a lesson
- THEN I can choose the lesson type and add content

**Technical Tasks:**
- [ ] Create add lesson button in module
- [ ] Create lesson type selector (video, text, quiz, download)
- [ ] Create lesson form modal
- [ ] Implement drag-and-drop reordering
- [ ] Create `lessons.create` mutation
- [ ] Create `lessons.update` mutation
- [ ] Create `lessons.delete` mutation
- [ ] Create `lessons.reorder` mutation
- [ ] Add "free preview" toggle

**Story Points:** 5
**Priority:** P0
**Sprint:** 4
**Dependencies:** US-018

---

#### US-020: Course Settings
**As a** creator
**I want** to configure course settings
**So that** I can control pricing and visibility

**Acceptance Criteria:**
- GIVEN I'm in course settings
- WHEN I update price or publish status
- THEN the changes take effect

**Technical Tasks:**
- [ ] Create course settings page
- [ ] Add price editor
- [ ] Add publish/unpublish toggle
- [ ] Add block activation toggles
- [ ] Implement `courses.update` mutation
- [ ] Implement `courses.publish` mutation
- [ ] Show warning before unpublish if has students

**Story Points:** 3
**Priority:** P0
**Sprint:** 4
**Dependencies:** US-017

---

#### US-021: List School Courses
**As a** creator
**I want** to see all courses in my school
**So that** I can manage them

**Acceptance Criteria:**
- GIVEN I'm in a school
- WHEN I go to courses section
- THEN I see all courses with status and metrics

**Technical Tasks:**
- [ ] Create courses list page
- [ ] Create course card component
- [ ] Show published/draft status
- [ ] Show student count
- [ ] Show revenue (if any)
- [ ] Add quick actions (edit, view, duplicate)
- [ ] Implement `courses.list` query
- [ ] Handle empty state

**Story Points:** 2
**Priority:** P0
**Sprint:** 4
**Dependencies:** US-017

---

#### US-022: Duplicate Course
**As a** creator
**I want** to duplicate a course
**So that** I can reuse content structure

**Acceptance Criteria:**
- GIVEN I have a course
- WHEN I click duplicate
- THEN a new draft course is created with all modules and lessons

**Technical Tasks:**
- [ ] Add duplicate button to course card
- [ ] Create duplicate confirmation modal
- [ ] Implement `courses.duplicate` mutation
- [ ] Copy all modules and lessons
- [ ] Reset statistics (students, revenue)
- [ ] Set as draft

**Story Points:** 3
**Priority:** P2
**Sprint:** 4
**Dependencies:** US-019

---

### EPIC E04: VIDEO CONTENT

#### US-023: Video Upload
**As a** creator
**I want** to upload videos for my lessons
**So that** students can watch them

**Acceptance Criteria:**
- GIVEN I'm creating a video lesson
- WHEN I upload a video file
- THEN I see upload progress
- AND the video is processed and ready for playback

**Technical Tasks:**
- [ ] Create video uploader component
- [ ] Get presigned URL from R2
- [ ] Implement chunked upload with progress
- [ ] Send to Mux for processing
- [ ] Handle Mux webhook for completion
- [ ] Store Mux asset/playback IDs in lesson
- [ ] Show processing status
- [ ] Handle upload errors

**Story Points:** 8
**Priority:** P0
**Sprint:** 5
**Dependencies:** US-019

---

#### US-024: Video Player for Creators
**As a** creator
**I want** to preview my uploaded videos
**So that** I can verify the content

**Acceptance Criteria:**
- GIVEN I have an uploaded video
- WHEN I open the lesson
- THEN I can play the video

**Technical Tasks:**
- [ ] Create video player component (Mux Player)
- [ ] Add play/pause, volume, fullscreen controls
- [ ] Show video duration
- [ ] Add thumbnail preview
- [ ] Handle loading states

**Story Points:** 3
**Priority:** P0
**Sprint:** 5
**Dependencies:** US-023

---

#### US-025: Video Player for Students (with Progress)
**As a** student
**I want** to watch course videos with progress tracking
**So that** my progress is saved automatically

**Acceptance Criteria:**
- GIVEN I'm watching a video
- WHEN I pause or close the player
- THEN my position is saved
- AND when I return, it resumes from that point

**Technical Tasks:**
- [ ] Extend video player for student use
- [ ] Track watch percentage
- [ ] Save progress periodically (every 10 seconds)
- [ ] Implement `lessons.updateProgress` mutation
- [ ] Resume from last position
- [ ] Mark lesson complete at 90%
- [ ] Prevent seeking beyond watched point (optional)

**Story Points:** 5
**Priority:** P0
**Sprint:** 5
**Dependencies:** US-024

---

#### US-026: Video Delete
**As a** creator
**I want** to delete videos
**So that** I can remove outdated content

**Acceptance Criteria:**
- GIVEN I have a video lesson
- WHEN I delete it
- THEN the video is removed from storage

**Technical Tasks:**
- [ ] Add delete button to lesson
- [ ] Create confirmation modal
- [ ] Delete from Mux
- [ ] Delete from R2 (if applicable)
- [ ] Update lesson content to null
- [ ] Handle delete errors

**Story Points:** 2
**Priority:** P1
**Sprint:** 5
**Dependencies:** US-023

---

### EPIC E05: STUDENT EXPERIENCE

#### US-027: Public Course Landing Page
**As a** potential student
**I want** to see a course landing page
**So that** I can decide to purchase

**Acceptance Criteria:**
- GIVEN a published course
- WHEN I visit its URL
- THEN I see the landing page with title, description, curriculum, and price

**Technical Tasks:**
- [ ] Create `/courses/[slug]` public page
- [ ] Display course title, description, thumbnail
- [ ] Display curriculum (modules/lessons)
- [ ] Show free lesson indicators
- [ ] Display price and Buy button
- [ ] Apply school branding
- [ ] Handle unpublished courses (404)

**Story Points:** 5
**Priority:** P0
**Sprint:** 5
**Dependencies:** US-020, US-012

---

#### US-028: Student Registration (via Purchase)
**As a** new student
**I want** to create an account when I purchase
**So that** I can access the course

**Acceptance Criteria:**
- GIVEN I complete a purchase
- WHEN payment succeeds
- THEN my student account is created
- AND I receive a magic link to login

**Technical Tasks:**
- [ ] Create student on successful payment webhook
- [ ] Generate magic link token
- [ ] Send welcome email with magic link
- [ ] Create student session on magic link click
- [ ] Handle existing student (same email, same school)

**Story Points:** 5
**Priority:** P0
**Sprint:** 6
**Dependencies:** US-027

---

#### US-029: Student Login (Magic Link)
**As a** student
**I want** to login with a magic link
**So that** I don't need to remember a password

**Acceptance Criteria:**
- GIVEN I'm on the school login page
- WHEN I enter my email
- THEN I receive a magic link
- AND clicking it logs me in

**Technical Tasks:**
- [ ] Create `/login` page for school (custom domain)
- [ ] Create email input form
- [ ] Implement `auth.studentLogin` mutation
- [ ] Generate magic link token
- [ ] Send magic link email
- [ ] Implement `auth.studentVerify` mutation
- [ ] Create student session
- [ ] Redirect to student dashboard

**Story Points:** 3
**Priority:** P0
**Sprint:** 6
**Dependencies:** US-028

---

#### US-030: Student Dashboard
**As a** student
**I want** to see my enrolled courses and progress
**So that** I can continue learning

**Acceptance Criteria:**
- GIVEN I'm logged in as a student
- WHEN I go to the dashboard
- THEN I see my courses with progress indicators

**Technical Tasks:**
- [ ] Create `/student` dashboard page
- [ ] Create enrolled courses list
- [ ] Show progress percentage per course
- [ ] Show "Continue" button with last lesson
- [ ] Show upcoming live classes
- [ ] Show recent announcements
- [ ] Apply school branding
- [ ] Implement `enrollments.myEnrollments` query

**Story Points:** 5
**Priority:** P0
**Sprint:** 6
**Dependencies:** US-029

---

#### US-031: Course Viewer (Student)
**As a** student
**I want** to view course content
**So that** I can learn

**Acceptance Criteria:**
- GIVEN I'm enrolled in a course
- WHEN I open it
- THEN I see all lessons organized by module
- AND I can navigate between lessons

**Technical Tasks:**
- [ ] Create `/courses/[slug]/learn` page
- [ ] Create sidebar with modules/lessons
- [ ] Show completion checkmarks
- [ ] Create lesson content area
- [ ] Handle different lesson types
- [ ] Implement next/previous navigation
- [ ] Mark lesson as complete
- [ ] Lock unpurchased lessons

**Story Points:** 8
**Priority:** P0
**Sprint:** 6
**Dependencies:** US-025, US-030

---

#### US-032: Progress Tracking
**As a** student
**I want** to see my course progress
**So that** I know how much I've completed

**Acceptance Criteria:**
- GIVEN I'm in a course
- WHEN I complete lessons
- THEN my progress percentage updates

**Technical Tasks:**
- [ ] Calculate overall progress (completed/total lessons)
- [ ] Show progress bar in course viewer
- [ ] Show progress on student dashboard
- [ ] Update progress in real-time
- [ ] Implement `enrollments.getProgress` query

**Story Points:** 3
**Priority:** P0
**Sprint:** 6
**Dependencies:** US-031

---

### EPIC E06: PAYMENTS

#### US-033: Stripe Connect Onboarding
**As a** creator
**I want** to connect my Stripe account
**So that** I can receive payments

**Acceptance Criteria:**
- GIVEN I'm in school settings
- WHEN I click "Connect Stripe"
- THEN I'm redirected to Stripe Connect
- AND after completion, my account is connected

**Technical Tasks:**
- [ ] Create Stripe Connect page in settings
- [ ] Implement `payments.connectStripe` mutation
- [ ] Create Stripe Connect Express account
- [ ] Generate account link
- [ ] Handle OAuth callback
- [ ] Store stripe_account_id
- [ ] Show connection status
- [ ] Handle incomplete onboarding

**Story Points:** 5
**Priority:** P0
**Sprint:** 7
**Dependencies:** US-011

---

#### US-034: Course Checkout
**As a** student
**I want** to purchase a course
**So that** I can access the content

**Acceptance Criteria:**
- GIVEN I'm on a course landing page
- WHEN I click "Buy Now"
- THEN I'm redirected to Stripe Checkout
- AND after payment, I'm enrolled

**Technical Tasks:**
- [ ] Create Buy Now button component
- [ ] Implement `payments.createCheckout` mutation
- [ ] Create Stripe Checkout session
- [ ] Set up success/cancel URLs
- [ ] Apply platform fee (if applicable)
- [ ] Redirect to Stripe Checkout
- [ ] Create `/checkout/success` page
- [ ] Create `/checkout/cancel` page

**Story Points:** 5
**Priority:** P0
**Sprint:** 7
**Dependencies:** US-027, US-033

---

#### US-035: Payment Webhook Handler
**As the** system
**I want** to process payment webhooks
**So that** enrollments are created automatically

**Acceptance Criteria:**
- GIVEN Stripe sends a payment webhook
- WHEN payment.succeeded event is received
- THEN student is enrolled in the course

**Technical Tasks:**
- [ ] Create `/api/webhooks/stripe` route
- [ ] Verify webhook signature
- [ ] Handle `checkout.session.completed` event
- [ ] Create or update student record
- [ ] Create enrollment record
- [ ] Create payment record
- [ ] Send confirmation email
- [ ] Handle idempotency

**Story Points:** 5
**Priority:** P0
**Sprint:** 7
**Dependencies:** US-034

---

#### US-036: Payment History (Creator)
**As a** creator
**I want** to see my payment history
**So that** I can track my revenue

**Acceptance Criteria:**
- GIVEN I have received payments
- WHEN I go to payments section
- THEN I see a list of all payments

**Technical Tasks:**
- [ ] Create payments page in dashboard
- [ ] Create payments table component
- [ ] Show date, student, course, amount, status
- [ ] Implement `payments.list` query
- [ ] Add filters (date range, course)
- [ ] Show totals

**Story Points:** 3
**Priority:** P1
**Sprint:** 7
**Dependencies:** US-035

---

### EPIC E07: CUSTOM DOMAINS

#### US-037: Add Custom Domain
**As a** creator
**I want** to add my own domain to my school
**So that** students access my branded URL

**Acceptance Criteria:**
- GIVEN I'm in school domain settings
- WHEN I enter my domain and follow DNS instructions
- THEN my domain is connected to my school

**Technical Tasks:**
- [ ] Create domain settings page
- [ ] Create domain input form
- [ ] Validate domain format
- [ ] Check domain not already in use
- [ ] Generate verification token
- [ ] Create `domainVerifications` record
- [ ] Display DNS instructions (CNAME)
- [ ] Implement `schools.addDomain` mutation

**Story Points:** 3
**Priority:** P0
**Sprint:** 8
**Dependencies:** US-011

---

#### US-038: Domain Verification
**As a** creator
**I want** my domain to be verified automatically
**So that** I know when it's ready

**Acceptance Criteria:**
- GIVEN I configured my DNS
- WHEN the system checks
- THEN my domain is marked as verified

**Technical Tasks:**
- [ ] Create DNS verification check
- [ ] Check TXT or CNAME record
- [ ] Poll every 30 seconds on verification page
- [ ] Update domain_verified status
- [ ] Add domain to Cloudflare via API
- [ ] Configure SSL certificate
- [ ] Update Cloudflare Workers KV
- [ ] Implement `schools.verifyDomain` mutation

**Story Points:** 5
**Priority:** P0
**Sprint:** 8
**Dependencies:** US-037

---

#### US-039: Cloudflare Worker Setup
**As the** system
**I want** a Cloudflare Worker routing custom domains
**So that** requests reach the correct school

**Acceptance Criteria:**
- GIVEN a custom domain is verified
- WHEN a request comes to that domain
- THEN it's routed to Vercel with school context

**Technical Tasks:**
- [ ] Create Cloudflare Worker project
- [ ] Create KV namespace for domain mapping
- [ ] Implement domain lookup logic
- [ ] Add X-School-ID header
- [ ] Forward request to Vercel
- [ ] Handle domain not found (404)
- [ ] Deploy worker
- [ ] Test with real domain

**Story Points:** 5
**Priority:** P0
**Sprint:** 8
**Dependencies:** US-038

---

#### US-040: Remove Custom Domain
**As a** creator
**I want** to remove my custom domain
**So that** I can use a different one

**Acceptance Criteria:**
- GIVEN I have a custom domain
- WHEN I remove it
- THEN it's disconnected from my school

**Technical Tasks:**
- [ ] Add remove button to domain settings
- [ ] Create confirmation modal
- [ ] Remove from Cloudflare
- [ ] Remove from KV namespace
- [ ] Update school record
- [ ] Implement `schools.removeDomain` mutation

**Story Points:** 2
**Priority:** P1
**Sprint:** 8
**Dependencies:** US-038

---

### EPIC E08: LANDING BUILDER

#### US-041: Landing Page Editor
**As a** creator
**I want** to edit my course landing page
**So that** I can customize how it looks

**Acceptance Criteria:**
- GIVEN I'm in course settings
- WHEN I open the landing editor
- THEN I can drag and drop sections

**Technical Tasks:**
- [ ] Create landing builder page
- [ ] Create section components (Hero, About, Curriculum, etc.)
- [ ] Implement drag-and-drop with dnd-kit
- [ ] Create section toolbar (move up/down, delete)
- [ ] Create add section button
- [ ] Save layout to course.landing_page_data
- [ ] Implement `courses.updateLanding` mutation

**Story Points:** 8
**Priority:** P1
**Sprint:** 9
**Dependencies:** US-017

---

#### US-042: Hero Section Editor
**As a** creator
**I want** to edit the hero section
**So that** I can set headline, subheadline, and image

**Acceptance Criteria:**
- GIVEN the hero section
- WHEN I edit its content
- THEN the changes are saved and reflected

**Technical Tasks:**
- [ ] Create Hero section component
- [ ] Create inline text editing
- [ ] Create image/video uploader
- [ ] Create CTA button editor
- [ ] Apply school branding (colors, fonts)
- [ ] Save to section content

**Story Points:** 3
**Priority:** P1
**Sprint:** 9
**Dependencies:** US-041

---

#### US-043: Curriculum Section (Auto-generated)
**As a** creator
**I want** the curriculum section to show my modules/lessons
**So that** students see what's included

**Acceptance Criteria:**
- GIVEN I have modules and lessons
- WHEN I add the curriculum section
- THEN it automatically shows the course structure

**Technical Tasks:**
- [ ] Create Curriculum section component
- [ ] Fetch modules/lessons from course
- [ ] Display expandable module list
- [ ] Show lesson titles and types
- [ ] Indicate free preview lessons
- [ ] Show total duration/lessons count

**Story Points:** 3
**Priority:** P1
**Sprint:** 9
**Dependencies:** US-041

---

#### US-044: Testimonials Section
**As a** creator
**I want** to add testimonials
**So that** I can show social proof

**Acceptance Criteria:**
- GIVEN the testimonials section
- WHEN I add a testimonial
- THEN it appears on the landing page

**Technical Tasks:**
- [ ] Create Testimonials section component
- [ ] Create add testimonial form
- [ ] Fields: name, photo, text, role
- [ ] Allow multiple testimonials
- [ ] Create carousel/grid layout

**Story Points:** 3
**Priority:** P2
**Sprint:** 9
**Dependencies:** US-041

---

#### US-045: FAQ Section
**As a** creator
**I want** to add FAQs
**So that** I can answer common questions

**Acceptance Criteria:**
- GIVEN the FAQ section
- WHEN I add a Q&A
- THEN it appears as an accordion

**Technical Tasks:**
- [ ] Create FAQ section component
- [ ] Create add Q&A form
- [ ] Display as accordion
- [ ] Allow reordering
- [ ] Allow edit/delete

**Story Points:** 2
**Priority:** P2
**Sprint:** 9
**Dependencies:** US-041

---

#### US-046: Landing Page Preview
**As a** creator
**I want** to preview my landing page
**So that** I can see how it looks before publishing

**Acceptance Criteria:**
- GIVEN I'm editing the landing
- WHEN I click preview
- THEN I see a full-page preview

**Technical Tasks:**
- [ ] Create preview mode toggle
- [ ] Render landing in preview mode
- [ ] Add mobile/desktop toggle
- [ ] Hide editor UI in preview
- [ ] Add "Exit Preview" button

**Story Points:** 2
**Priority:** P1
**Sprint:** 9
**Dependencies:** US-041

---

### EPIC E09: LIVE CLASSES

#### US-047: Schedule Live Class
**As a** creator
**I want** to schedule a live class
**So that** students can attend

**Acceptance Criteria:**
- GIVEN I'm in a course
- WHEN I schedule a live class
- THEN it appears on the calendar

**Technical Tasks:**
- [ ] Create live classes section in course
- [ ] Create schedule form (title, date/time, duration)
- [ ] Implement `liveClasses.create` mutation
- [ ] Show upcoming classes list
- [ ] Send notification to enrolled students (optional)

**Story Points:** 3
**Priority:** P1
**Sprint:** 10
**Dependencies:** US-017

---

#### US-048: Start Live Class
**As a** creator
**I want** to start a scheduled live class
**So that** students can join

**Acceptance Criteria:**
- GIVEN I have a scheduled class
- WHEN I click "Start Class"
- THEN a video room is created
- AND I join as the host

**Technical Tasks:**
- [ ] Create "Start Class" button
- [ ] Create Daily.co room via API
- [ ] Store room URL in live_class
- [ ] Update status to 'live'
- [ ] Redirect to live room page
- [ ] Implement `liveClasses.start` mutation

**Story Points:** 5
**Priority:** P1
**Sprint:** 10
**Dependencies:** US-047

---

#### US-049: Live Room (Creator)
**As a** creator
**I want** to host a live class
**So that** I can teach students in real-time

**Acceptance Criteria:**
- GIVEN I started a live class
- WHEN I'm in the room
- THEN I can see my video, students, and chat

**Technical Tasks:**
- [ ] Create live room page
- [ ] Integrate Daily.co React SDK
- [ ] Show local video (creator)
- [ ] Show participant videos
- [ ] Add mute/unmute, camera toggle
- [ ] Add screen share
- [ ] Add end call button
- [ ] Create chat panel

**Story Points:** 8
**Priority:** P1
**Sprint:** 10
**Dependencies:** US-048

---

#### US-050: Join Live Class (Student)
**As a** student
**I want** to join a live class
**So that** I can learn in real-time

**Acceptance Criteria:**
- GIVEN there's an active live class
- WHEN I click "Join"
- THEN I enter the video room

**Technical Tasks:**
- [ ] Show "Join Class" button on student dashboard
- [ ] Generate join token for student
- [ ] Create student live room page
- [ ] Show creator video prominently
- [ ] Show student video (small)
- [ ] Enable chat
- [ ] Implement `liveClasses.getJoinToken` query

**Story Points:** 5
**Priority:** P1
**Sprint:** 10
**Dependencies:** US-049

---

#### US-051: End Live Class
**As a** creator
**I want** to end a live class
**So that** the session is closed properly

**Acceptance Criteria:**
- GIVEN I'm in a live class
- WHEN I click "End Class"
- THEN all participants are disconnected
- AND the recording is saved (if enabled)

**Technical Tasks:**
- [ ] Add "End Class" button
- [ ] Close Daily.co room
- [ ] Update status to 'ended'
- [ ] Save attendee list
- [ ] Trigger recording download (if enabled)
- [ ] Implement `liveClasses.end` mutation

**Story Points:** 3
**Priority:** P1
**Sprint:** 10
**Dependencies:** US-049

---

#### US-052: Live Class Recording
**As a** creator
**I want** to record live classes
**So that** students can watch later

**Acceptance Criteria:**
- GIVEN recording is enabled
- WHEN the class ends
- THEN the recording is saved and available

**Technical Tasks:**
- [ ] Enable recording in Daily.co
- [ ] Handle recording webhook
- [ ] Download recording to R2
- [ ] Store recording URL
- [ ] Make available in course content
- [ ] Show in past classes list

**Story Points:** 5
**Priority:** P2
**Sprint:** 10
**Dependencies:** US-051

---

### EPIC E10: QUIZZES & DOWNLOADS

#### US-053: Create Quiz Lesson
**As a** creator
**I want** to create quiz lessons
**So that** I can test student knowledge

**Acceptance Criteria:**
- GIVEN I'm adding a lesson
- WHEN I select "Quiz" type
- THEN I can add questions

**Technical Tasks:**
- [ ] Create quiz editor component
- [ ] Support multiple choice questions
- [ ] Support true/false questions
- [ ] Support open-ended questions
- [ ] Set correct answers
- [ ] Set time limit (optional)
- [ ] Save to lesson.content

**Story Points:** 5
**Priority:** P1
**Sprint:** 11
**Dependencies:** US-019

---

#### US-054: Take Quiz (Student)
**As a** student
**I want** to take quizzes
**So that** I can test my knowledge

**Acceptance Criteria:**
- GIVEN I open a quiz lesson
- WHEN I answer questions and submit
- THEN I see my score

**Technical Tasks:**
- [ ] Create quiz taking component
- [ ] Display questions one at a time or all
- [ ] Implement timer (if set)
- [ ] Calculate score
- [ ] Save score to progress
- [ ] Show correct answers after submit
- [ ] Implement `enrollments.submitQuiz` mutation

**Story Points:** 5
**Priority:** P1
**Sprint:** 11
**Dependencies:** US-053

---

#### US-055: Create Download Lesson
**As a** creator
**I want** to add downloadable files
**So that** students can access resources

**Acceptance Criteria:**
- GIVEN I'm adding a lesson
- WHEN I select "Download" type
- THEN I can upload files

**Technical Tasks:**
- [ ] Create file uploader component
- [ ] Support multiple files
- [ ] Support PDF, DOC, ZIP, etc.
- [ ] Upload to R2 storage
- [ ] Store file metadata in lesson.content
- [ ] Show file list with sizes

**Story Points:** 3
**Priority:** P1
**Sprint:** 11
**Dependencies:** US-019

---

#### US-056: Download Files (Student)
**As a** student
**I want** to download course files
**So that** I can use them offline

**Acceptance Criteria:**
- GIVEN I open a download lesson
- WHEN I click download
- THEN the file downloads to my device

**Technical Tasks:**
- [ ] Create download lesson viewer
- [ ] Generate signed download URLs
- [ ] Track download count
- [ ] Mark lesson as completed on download
- [ ] Implement `lessons.getDownloadUrl` query

**Story Points:** 2
**Priority:** P1
**Sprint:** 11
**Dependencies:** US-055

---

### EPIC E11: ANNOUNCEMENTS

#### US-057: Create Announcement
**As a** creator
**I want** to post announcements
**So that** I can communicate with students

**Acceptance Criteria:**
- GIVEN I'm in a school
- WHEN I create an announcement
- THEN enrolled students can see it

**Technical Tasks:**
- [ ] Create announcements page
- [ ] Create announcement form
- [ ] Support rich text (Markdown)
- [ ] Option to target specific course or all
- [ ] Schedule publication (optional)
- [ ] Implement `announcements.create` mutation

**Story Points:** 3
**Priority:** P2
**Sprint:** 11
**Dependencies:** US-011

---

#### US-058: View Announcements (Student)
**As a** student
**I want** to see announcements
**So that** I stay informed

**Acceptance Criteria:**
- GIVEN there are announcements
- WHEN I view my dashboard
- THEN I see recent announcements

**Technical Tasks:**
- [ ] Add announcements widget to student dashboard
- [ ] Show unread indicator
- [ ] Create announcements list page
- [ ] Mark as read on view
- [ ] Implement `announcements.list` query

**Story Points:** 2
**Priority:** P2
**Sprint:** 11
**Dependencies:** US-057

---

### EPIC E12: ANALYTICS

#### US-059: Creator Analytics Dashboard
**As a** creator
**I want** to see analytics for my school
**So that** I can understand performance

**Acceptance Criteria:**
- GIVEN I have students
- WHEN I view analytics
- THEN I see key metrics and charts

**Technical Tasks:**
- [ ] Create analytics page
- [ ] Show total students over time
- [ ] Show revenue over time
- [ ] Show course completion rates
- [ ] Show top performing courses
- [ ] Create charts with Recharts
- [ ] Implement `analytics.getSchoolStats` query

**Story Points:** 5
**Priority:** P2
**Sprint:** 12
**Dependencies:** US-011

---

#### US-060: Course Analytics
**As a** creator
**I want** to see analytics per course
**So that** I can improve content

**Acceptance Criteria:**
- GIVEN I have a course with students
- WHEN I view course analytics
- THEN I see engagement metrics

**Technical Tasks:**
- [ ] Create course analytics tab
- [ ] Show enrollment rate
- [ ] Show completion rate
- [ ] Show lesson drop-off points
- [ ] Show quiz average scores
- [ ] Implement `analytics.getCourseStats` query

**Story Points:** 3
**Priority:** P2
**Sprint:** 12
**Dependencies:** US-059

---

## 4. SPRINT PLANNING

### Sprint 1: Foundation (Week 1-2)
| ID | Story | Points | Owner |
|----|-------|--------|-------|
| US-001 | Monorepo Setup | 3 | Dev |
| US-001b | CI/CD Pipeline Setup | 3 | Dev |
| US-001c | Environment Configuration | 5 | Dev |
| US-002 | Database Schema Setup | 5 | Dev |
| US-003 | Supabase Auth Configuration | 2 | Dev |
| US-004 | Next.js App Base Setup | 3 | Dev |
| US-005 | tRPC Base Setup | 2 | Dev |
| **Total** | | **23** | |

### Sprint 2: Auth & Dashboard (Week 3-4)
| ID | Story | Points | Owner |
|----|-------|--------|-------|
| US-006 | Creator Registration | 3 | Dev |
| US-007 | Creator Email Verification | 2 | Dev |
| US-008 | Creator Login | 2 | Dev |
| US-009 | Password Reset Flow | 2 | Dev |
| US-010 | Creator Dashboard Layout | 3 | Dev |
| **Total** | | **12** | |

### Sprint 3: School Management (Week 5-6)
| ID | Story | Points | Owner |
|----|-------|--------|-------|
| US-011 | Create New School | 5 | Dev |
| US-012 | School Branding Settings | 5 | Dev |
| US-013 | School General Settings | 2 | Dev |
| US-014 | List Creator's Schools | 2 | Dev |
| US-015 | School Overview Dashboard | 3 | Dev |
| **Total** | | **17** | |

### Sprint 4: Course Management (Week 7-8)
| ID | Story | Points | Owner |
|----|-------|--------|-------|
| US-017 | Create New Course | 3 | Dev |
| US-018 | Course Content Editor - Modules | 5 | Dev |
| US-019 | Course Content Editor - Lessons | 5 | Dev |
| US-020 | Course Settings | 3 | Dev |
| US-021 | List School Courses | 2 | Dev |
| **Total** | | **18** | |

### Sprint 5: Video & Student Landing (Week 9-10)
| ID | Story | Points | Owner |
|----|-------|--------|-------|
| US-023 | Video Upload | 8 | Dev |
| US-024 | Video Player for Creators | 3 | Dev |
| US-025 | Video Player for Students | 5 | Dev |
| US-027 | Public Course Landing Page | 5 | Dev |
| **Total** | | **21** | |

### Sprint 6: Student Experience (Week 11-12)
| ID | Story | Points | Owner |
|----|-------|--------|-------|
| US-028 | Student Registration (via Purchase) | 5 | Dev |
| US-029 | Student Login (Magic Link) | 3 | Dev |
| US-030 | Student Dashboard | 5 | Dev |
| US-031 | Course Viewer (Student) | 8 | Dev |
| US-032 | Progress Tracking | 3 | Dev |
| **Total** | | **24** | |

### Sprint 7: Payments (Week 13-14)
| ID | Story | Points | Owner |
|----|-------|--------|-------|
| US-033 | Stripe Connect Onboarding | 5 | Dev |
| US-034 | Course Checkout | 5 | Dev |
| US-035 | Payment Webhook Handler | 5 | Dev |
| US-036 | Payment History (Creator) | 3 | Dev |
| **Total** | | **18** | |

### Sprint 8: Custom Domains (Week 15-16)
| ID | Story | Points | Owner |
|----|-------|--------|-------|
| US-037 | Add Custom Domain | 3 | Dev |
| US-038 | Domain Verification | 5 | Dev |
| US-039 | Cloudflare Worker Setup | 5 | Dev |
| US-040 | Remove Custom Domain | 2 | Dev |
| **Total** | | **15** | |

### Sprint 9: Landing Builder (Week 17-18)
| ID | Story | Points | Owner |
|----|-------|--------|-------|
| US-041 | Landing Page Editor | 8 | Dev |
| US-042 | Hero Section Editor | 3 | Dev |
| US-043 | Curriculum Section | 3 | Dev |
| US-044 | Testimonials Section | 3 | Dev |
| US-045 | FAQ Section | 2 | Dev |
| US-046 | Landing Page Preview | 2 | Dev |
| **Total** | | **21** | |

### Sprint 10: Live Classes (Week 19-20)
| ID | Story | Points | Owner |
|----|-------|--------|-------|
| US-047 | Schedule Live Class | 3 | Dev |
| US-048 | Start Live Class | 5 | Dev |
| US-049 | Live Room (Creator) | 8 | Dev |
| US-050 | Join Live Class (Student) | 5 | Dev |
| US-051 | End Live Class | 3 | Dev |
| **Total** | | **24** | |

### Sprint 11: Content Blocks & Announcements (Week 21-22)
| ID | Story | Points | Owner |
|----|-------|--------|-------|
| US-053 | Create Quiz Lesson | 5 | Dev |
| US-054 | Take Quiz (Student) | 5 | Dev |
| US-055 | Create Download Lesson | 3 | Dev |
| US-056 | Download Files (Student) | 2 | Dev |
| US-057 | Create Announcement | 3 | Dev |
| US-058 | View Announcements (Student) | 2 | Dev |
| **Total** | | **20** | |

### Sprint 12: Analytics & Polish (Week 23-24)
| ID | Story | Points | Owner |
|----|-------|--------|-------|
| US-016 | Student Dashboard Configuration | 3 | Dev |
| US-022 | Duplicate Course | 3 | Dev |
| US-026 | Video Delete | 2 | Dev |
| US-052 | Live Class Recording | 5 | Dev |
| US-059 | Creator Analytics Dashboard | 5 | Dev |
| US-060 | Course Analytics | 3 | Dev |
| **Total** | | **21** | |

---

## 5. DEPENDENCIES MAP

```
US-001 (Monorepo)
  ├── US-001b (CI/CD Pipeline)
  │     └── US-001c (Environment Config)
  └── US-002 (DB Schema)
        ├── US-003 (Supabase Auth)
        └── US-005 (tRPC Setup)
              └── US-006 (Registration)
                    ├── US-007 (Email Verify)
                    └── US-008 (Login)
                          └── US-010 (Dashboard Layout)
                                └── US-011 (Create School)
                                      ├── US-012 (Branding)
                                      ├── US-017 (Create Course)
                                      │     ├── US-018 (Modules)
                                      │     │     └── US-019 (Lessons)
                                      │     │           ├── US-023 (Video Upload)
                                      │     │           │     └── US-024 (Video Player)
                                      │     │           │           └── US-025 (Student Player)
                                      │     │           ├── US-053 (Quizzes)
                                      │     │           └── US-055 (Downloads)
                                      │     └── US-020 (Course Settings)
                                      │           └── US-027 (Course Landing)
                                      │                 └── US-034 (Checkout)
                                      │                       └── US-028 (Student Registration)
                                      │                             └── US-029 (Student Login)
                                      │                                   └── US-030 (Student Dashboard)
                                      │                                         └── US-031 (Course Viewer)
                                      ├── US-033 (Stripe Connect)
                                      │     └── US-034 (Checkout)
                                      │           └── US-035 (Webhooks)
                                      └── US-037 (Add Domain)
                                            └── US-038 (Verify Domain)
                                                  └── US-039 (CF Worker)
```

---

## 6. DEFINITION OF DONE

### For Each User Story:
- [ ] Code implemented and reviewed
- [ ] Unit tests passing (where applicable)
- [ ] Integration tested
- [ ] Responsive design verified (mobile + desktop)
- [ ] Accessibility checked (keyboard nav, ARIA)
- [ ] Error handling implemented
- [ ] Loading states implemented
- [ ] Edge cases handled
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Documentation updated (if needed)
- [ ] Deployed to staging

### For Each Sprint:
- [ ] All stories completed
- [ ] Sprint demo done
- [ ] Bugs triaged
- [ ] Backlog refined for next sprint

### For MVP Launch:
- [ ] All P0 epics complete
- [ ] Security review done
- [ ] Performance tested
- [ ] 5+ beta users validated
- [ ] Monitoring in place
- [ ] Backup/restore tested

---

**Document Version:** 1.1
**Last Updated:** January 2025
**Total Story Points:** ~234 (226 + 8 CI/CD)
**Estimated Duration:** 24 weeks (12 sprints x 2 weeks)
