CREATE TABLE "announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"course_id" uuid,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"is_published" boolean DEFAULT false,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"short_description" varchar(500),
	"thumbnail_url" varchar(500),
	"price" numeric(10, 2) DEFAULT '0',
	"currency" varchar(3) DEFAULT 'USD',
	"is_published" boolean DEFAULT false,
	"active_blocks" jsonb DEFAULT '["videos","live","quizzes","downloads","announcements","progress"]'::jsonb,
	"landing_page_data" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "courses_school_slug_unique" UNIQUE("school_id","slug")
);
--> statement-breakpoint
CREATE TABLE "creators" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"avatar_url" varchar(500),
	"bio" text,
	"contact_email" varchar(255),
	"social_links" jsonb,
	"language" varchar(5) DEFAULT 'en',
	"email_verified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "creators_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "domain_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"domain" varchar(255) NOT NULL,
	"verification_token" varchar(255) NOT NULL,
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "domain_verifications_domain_unique" UNIQUE("domain")
);
--> statement-breakpoint
CREATE TABLE "enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"progress" jsonb DEFAULT '{"completedLessons":[]}'::jsonb,
	"completed_at" timestamp,
	"enrolled_at" timestamp DEFAULT now(),
	CONSTRAINT "enrollments_student_course_unique" UNIQUE("student_id","course_id")
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"module_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"type" varchar(50) NOT NULL,
	"content" jsonb,
	"order" integer DEFAULT 0 NOT NULL,
	"is_free_preview" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "live_classes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"scheduled_at" timestamp NOT NULL,
	"duration" integer DEFAULT 60 NOT NULL,
	"room_url" varchar(500),
	"recording_url" varchar(500),
	"status" varchar(50) DEFAULT 'scheduled',
	"attendees" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "modules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"student_id" uuid,
	"course_id" uuid,
	"stripe_payment_intent_id" varchar(255),
	"stripe_checkout_session_id" varchar(255),
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'USD',
	"status" varchar(50) NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "payments_stripe_payment_intent_id_unique" UNIQUE("stripe_payment_intent_id"),
	CONSTRAINT "payments_stripe_checkout_session_id_unique" UNIQUE("stripe_checkout_session_id")
);
--> statement-breakpoint
CREATE TABLE "schools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"custom_domain" varchar(255),
	"domain_verified" boolean DEFAULT false,
	"branding" jsonb DEFAULT '{"primaryColor":"#6366F1","secondaryColor":"#F59E0B","font":"inter"}'::jsonb,
	"student_dashboard_config" jsonb,
	"stripe_account_id" varchar(255),
	"stripe_onboarded" boolean DEFAULT false,
	"subscription_plan" varchar(50) DEFAULT 'free',
	"language" varchar(5) DEFAULT 'en',
	"timezone" varchar(50) DEFAULT 'America/New_York',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "schools_slug_unique" UNIQUE("slug"),
	CONSTRAINT "schools_custom_domain_unique" UNIQUE("custom_domain")
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255),
	"avatar_url" varchar(500),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "students_school_email_unique" UNIQUE("school_id","email")
);
--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain_verifications" ADD CONSTRAINT "domain_verifications_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_classes" ADD CONSTRAINT "live_classes_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modules" ADD CONSTRAINT "modules_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schools" ADD CONSTRAINT "schools_creator_id_creators_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creators"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "announcements_school_idx" ON "announcements" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "announcements_course_idx" ON "announcements" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "announcements_published_idx" ON "announcements" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "courses_school_idx" ON "courses" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "domain_verifications_school_idx" ON "domain_verifications" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "enrollments_student_idx" ON "enrollments" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "enrollments_course_idx" ON "enrollments" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "lessons_module_idx" ON "lessons" USING btree ("module_id");--> statement-breakpoint
CREATE INDEX "lessons_order_idx" ON "lessons" USING btree ("module_id","order");--> statement-breakpoint
CREATE INDEX "live_classes_course_idx" ON "live_classes" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "live_classes_scheduled_idx" ON "live_classes" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "live_classes_status_idx" ON "live_classes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "modules_course_idx" ON "modules" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "modules_order_idx" ON "modules" USING btree ("course_id","order");--> statement-breakpoint
CREATE INDEX "payments_school_idx" ON "payments" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "payments_student_idx" ON "payments" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "schools_creator_idx" ON "schools" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "schools_domain_idx" ON "schools" USING btree ("custom_domain");--> statement-breakpoint
CREATE INDEX "students_school_idx" ON "students" USING btree ("school_id");