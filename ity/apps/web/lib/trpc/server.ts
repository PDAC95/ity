import 'server-only';
import { headers } from 'next/headers';
import { cache } from 'react';
import { createCaller, createTRPCContext } from '@ity/api';
import { createClient } from '@/lib/supabase/server';

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a tRPC call from a React Server Component.
 */
const createContext = cache(async () => {
  const heads = new Headers(await headers());
  heads.set('x-trpc-source', 'rsc');

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return createTRPCContext({
    headers: heads,
    user,
  });
});

/**
 * Server-side tRPC caller for React Server Components
 * Usage: const data = await api.schools.list();
 */
export const getApi = async () => {
  const ctx = await createContext();
  return createCaller(ctx);
};
