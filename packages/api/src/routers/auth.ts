import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { creators } from '@ity/db';
import { eq } from 'drizzle-orm';

export const authRouter = router({
  // Get current user profile
  me: protectedProcedure.query(async ({ ctx }) => {
    const creator = await ctx.db.query.creators.findFirst({
      where: eq(creators.id, ctx.user.id),
    });

    if (!creator) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Creator profile not found',
      });
    }

    return creator;
  }),

  // Update profile
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).max(255).optional(),
        language: z.enum(['en', 'es', 'fr', 'pt']).optional(),
        avatarUrl: z.string().url().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(creators)
        .set({
          ...input,
          updatedAt: new Date(),
        })
        .where(eq(creators.id, ctx.user.id))
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Creator profile not found',
        });
      }

      return updated;
    }),

  // Check if email exists (for registration)
  checkEmail: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ ctx, input }) => {
      const existing = await ctx.db.query.creators.findFirst({
        where: eq(creators.email, input.email),
      });

      return { exists: !!existing };
    }),
});
