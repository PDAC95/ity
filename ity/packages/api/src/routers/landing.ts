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
      const inserted = await ctx.db.insert(landingPageRequests)
        .values({
          schoolId: input.schoolId,
          templateId: input.templateId,
          status: 'draft',
          chatHistory: input.chatHistory,
        })
        .returning({ id: landingPageRequests.id });

      const created = inserted[0];
      if (!created) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create draft' });
      }

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
