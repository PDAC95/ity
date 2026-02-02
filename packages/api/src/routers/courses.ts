import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { courses, schools } from '@ity/db';
import { eq, and } from 'drizzle-orm';

export const coursesRouter = router({
  // List courses for a school
  list: protectedProcedure
    .input(z.object({ schoolId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Verify school ownership
      const school = await ctx.db.query.schools.findFirst({
        where: and(eq(schools.id, input.schoolId), eq(schools.creatorId, ctx.user.id)),
      });

      if (!school) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'School not found' });
      }

      return ctx.db.query.courses.findMany({
        where: eq(courses.schoolId, input.schoolId),
        orderBy: (courses, { desc }) => [desc(courses.createdAt)],
      });
    }),

  // Get course by ID
  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const course = await ctx.db.query.courses.findFirst({
        where: eq(courses.id, input.id),
        with: {
          school: true,
          modules: {
            with: {
              lessons: true,
            },
            orderBy: (modules, { asc }) => [asc(modules.order)],
          },
        },
      });

      if (!course) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Course not found' });
      }

      // Verify ownership
      if (course.school.creatorId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }

      return course;
    }),

  // Create course
  create: protectedProcedure
    .input(
      z.object({
        schoolId: z.string().uuid(),
        title: z.string().min(2).max(255),
        slug: z
          .string()
          .min(2)
          .max(255)
          .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
        description: z.string().optional(),
        shortDescription: z.string().max(500).optional(),
        price: z.string().optional().default('0'),
        currency: z.string().length(3).optional().default('USD'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify school ownership
      const school = await ctx.db.query.schools.findFirst({
        where: and(eq(schools.id, input.schoolId), eq(schools.creatorId, ctx.user.id)),
      });

      if (!school) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'School not found' });
      }

      // Check slug uniqueness within school
      const existing = await ctx.db.query.courses.findFirst({
        where: and(eq(courses.schoolId, input.schoolId), eq(courses.slug, input.slug)),
      });

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'A course with this slug already exists in this school',
        });
      }

      const [course] = await ctx.db.insert(courses).values(input).returning();

      return course;
    }),

  // Update course
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(2).max(255).optional(),
        description: z.string().optional().nullable(),
        shortDescription: z.string().max(500).optional().nullable(),
        thumbnailUrl: z.string().url().optional().nullable(),
        price: z.string().optional(),
        currency: z.string().length(3).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // Get course and verify ownership
      const course = await ctx.db.query.courses.findFirst({
        where: eq(courses.id, id),
        with: { school: true },
      });

      if (!course || course.school.creatorId !== ctx.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Course not found' });
      }

      const [updated] = await ctx.db
        .update(courses)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(courses.id, id))
        .returning();

      return updated;
    }),

  // Publish/unpublish course
  setPublished: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        isPublished: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get course and verify ownership
      const course = await ctx.db.query.courses.findFirst({
        where: eq(courses.id, input.id),
        with: { school: true },
      });

      if (!course || course.school.creatorId !== ctx.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Course not found' });
      }

      const [updated] = await ctx.db
        .update(courses)
        .set({
          isPublished: input.isPublished,
          updatedAt: new Date(),
        })
        .where(eq(courses.id, input.id))
        .returning();

      return updated;
    }),

  // Delete course
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Get course and verify ownership
      const course = await ctx.db.query.courses.findFirst({
        where: eq(courses.id, input.id),
        with: { school: true },
      });

      if (!course || course.school.creatorId !== ctx.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Course not found' });
      }

      await ctx.db.delete(courses).where(eq(courses.id, input.id));

      return { success: true };
    }),
});
