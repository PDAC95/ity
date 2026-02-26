'use client';

import { createTRPCReact, type CreateTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@ity/api';

export const trpc: CreateTRPCReact<AppRouter, unknown, null> = createTRPCReact<AppRouter>();
