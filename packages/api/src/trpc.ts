import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { ZodError } from 'zod';
import { db, type DB } from '@ity/db';
import type { SupabaseClient, User } from '@supabase/supabase-js';

// Context type
export type Context = {
  db: DB;
  supabase: SupabaseClient | null;
  user: User | null;
  schoolId: string | null;
  schoolDomain: string | null;
};

// Create context function - to be called from the Next.js API handler
export const createTRPCContext = async (opts: {
  headers: Headers;
  supabase?: SupabaseClient;
  user?: User | null;
}): Promise<Context> => {
  const { headers, supabase = null, user = null } = opts;

  // Get school context from headers (set by Cloudflare Worker or middleware)
  const schoolId = headers.get('x-school-id');
  const schoolDomain = headers.get('x-school-domain');

  return {
    db,
    supabase,
    user,
    schoolId,
    schoolDomain,
  };
};

// Initialize tRPC
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

// Router and procedure helpers
export const router = t.router;
export const publicProcedure = t.procedure;

// Middleware for authenticated creators
const enforceCreatorAuth = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'You must be logged in' });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceCreatorAuth);

// Middleware for authenticated students (within school context)
const enforceStudentAuth = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'You must be logged in' });
  }

  if (!ctx.schoolId) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'School context required' });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      schoolId: ctx.schoolId,
    },
  });
});

export const studentProcedure = t.procedure.use(enforceStudentAuth);
