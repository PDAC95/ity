import { router, type Context } from './trpc';
import { authRouter } from './routers/auth';
import { schoolsRouter } from './routers/schools';
import { coursesRouter } from './routers/courses';

export const appRouter = router({
  auth: authRouter,
  schools: schoolsRouter,
  courses: coursesRouter,
});

export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * This allows calling tRPC procedures directly from Server Components
 */
export const createCaller = (ctx: Context) => appRouter.createCaller(ctx);
