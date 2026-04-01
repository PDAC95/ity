import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { creators } from '@ity/db';
import { eq } from 'drizzle-orm';

export const creatorsRouter = router({
  // Get current creator's profile
  get: protectedProcedure.query(async ({ ctx }) => {
    const creator = await ctx.db.query.creators.findFirst({
      where: eq(creators.id, ctx.user.id),
    });

    if (!creator) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Creator not found' });
    }

    return creator;
  }),

  // Update current creator's profile
  update: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(50).optional(),
        bio: z.string().max(500).optional().nullable(),
        avatarUrl: z.string().url().optional().nullable(),
        contactEmail: z.string().email().optional().nullable(),
        socialLinks: z
          .object({
            instagram: z.string().max(100).optional(),
            x: z.string().max(100).optional(),
            youtube: z.string().max(100).optional(),
            tiktok: z.string().max(100).optional(),
            linkedin: z.string().max(100).optional(),
            facebook: z.string().max(100).optional(),
          })
          .optional()
          .nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Strip leading '@' from social link values
      const socialLinks = input.socialLinks
        ? Object.fromEntries(
            Object.entries(input.socialLinks).map(([key, val]) => [
              key,
              typeof val === 'string' ? val.replace(/^@/, '') : val,
            ])
          )
        : input.socialLinks;

      const [updated] = await ctx.db
        .update(creators)
        .set({
          ...input,
          ...(input.socialLinks !== undefined ? { socialLinks } : {}),
          updatedAt: new Date(),
        })
        .where(eq(creators.id, ctx.user.id))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Creator not found' });
      }

      return updated;
    }),
});
