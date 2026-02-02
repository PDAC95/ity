import { router } from './trpc';
import { authRouter } from './routers/auth';
import { schoolsRouter } from './routers/schools';
import { coursesRouter } from './routers/courses';

export const appRouter = router({
  auth: authRouter,
  schools: schoolsRouter,
  courses: coursesRouter,
});

export type AppRouter = typeof appRouter;
