import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { schools, type Branding } from '@ity/db';
import { eq, and } from 'drizzle-orm';

export const schoolsRouter = router({
  // List creator's schools
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.schools.findMany({
      where: eq(schools.creatorId, ctx.user.id),
      orderBy: (schools, { desc }) => [desc(schools.createdAt)],
    });
  }),

  // Get school by ID
  get: protectedProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ ctx, input }) => {
    const school = await ctx.db.query.schools.findFirst({
      where: and(eq(schools.id, input.id), eq(schools.creatorId, ctx.user.id)),
    });

    if (!school) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'School not found' });
    }

    return school;
  }),

  // Get school by slug (for public access)
  getBySlug: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const school = await ctx.db.query.schools.findFirst({
        where: and(eq(schools.slug, input.slug), eq(schools.creatorId, ctx.user.id)),
      });

      if (!school) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'School not found' });
      }

      return school;
    }),

  // Create school
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).max(255),
        slug: z
          .string()
          .min(2)
          .max(100)
          .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check slug uniqueness
      const existing = await ctx.db.query.schools.findFirst({
        where: eq(schools.slug, input.slug),
      });

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'This slug is already in use',
        });
      }

      const [school] = await ctx.db
        .insert(schools)
        .values({
          ...input,
          creatorId: ctx.user.id,
        })
        .returning();

      return school;
    }),

  // Update school
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(2).max(255).optional(),
        description: z.string().optional().nullable(),
        language: z.enum(['en', 'es', 'fr', 'pt']).optional(),
        timezone: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const [updated] = await ctx.db
        .update(schools)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(and(eq(schools.id, id), eq(schools.creatorId, ctx.user.id)))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'School not found' });
      }

      return updated;
    }),

  // Update branding
  updateBranding: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        branding: z.object({
          logo: z.string().url().optional(),
          primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
          secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
          font: z.enum(['inter', 'merriweather', 'space-mono']),
          favicon: z.string().url().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, branding } = input as { id: string; branding: Branding };

      const [updated] = await ctx.db
        .update(schools)
        .set({
          branding,
          updatedAt: new Date(),
        })
        .where(and(eq(schools.id, id), eq(schools.creatorId, ctx.user.id)))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'School not found' });
      }

      return updated;
    }),

  // Delete school
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await ctx.db
        .delete(schools)
        .where(and(eq(schools.id, input.id), eq(schools.creatorId, ctx.user.id)))
        .returning();

      if (!deleted) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'School not found' });
      }

      return { success: true };
    }),
});
