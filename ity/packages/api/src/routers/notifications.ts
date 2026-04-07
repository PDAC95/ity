import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { notifications } from '@ity/db';
import { eq, and, sql } from 'drizzle-orm';

export const notificationsRouter = router({
  // Return last 50 notifications for current creator
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.notifications.findMany({
      where: eq(notifications.creatorId, ctx.user.id),
      orderBy: (notifications, { desc }) => [desc(notifications.createdAt)],
      limit: 50,
    });
  }),

  // Lightweight count for bell icon badge
  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const result = await ctx.db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(
        eq(notifications.creatorId, ctx.user.id),
        eq(notifications.isRead, false),
      ));
    return result[0]?.count ?? 0;
  }),

  // Mark single notification as read
  markRead: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(notifications)
        .set({ isRead: true })
        .where(and(
          eq(notifications.id, input.id),
          eq(notifications.creatorId, ctx.user.id), // SEC-05: scoped to creator
        ))
        .returning({ id: notifications.id });

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Notification not found' });
      }

      return { success: true };
    }),

  // Mark all unread as read
  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db
      .update(notifications)
      .set({ isRead: true })
      .where(and(
        eq(notifications.creatorId, ctx.user.id), // SEC-05: scoped to creator
        eq(notifications.isRead, false),
      ));
    return { success: true };
  }),
});
