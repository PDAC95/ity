# Coding Conventions

**Analysis Date:** 2026-02-26

## Naming Patterns

**Files:**
- Page components: PascalCase, e.g. `page.tsx`
- Layout components: PascalCase, e.g. `layout.tsx`
- API routes: lowercase with hyphens, e.g. `route.ts`
- Component files: PascalCase, e.g. `divider.tsx`
- Utility/helper files: camelCase, e.g. `utils.ts`, `client.ts`, `server.ts`
- Schema/validation files: camelCase, e.g. `auth.ts`, `schema.ts`
- Router files: camelCase with descriptive names, e.g. `auth.ts`, `courses.ts`, `schools.ts`

**Functions:**
- Exported functions: camelCase, e.g. `createClient()`, `enforceCreatorAuth()`, `createTRPCContext()`
- React components: PascalCase, e.g. `LoginForm()`, `AuthDivider()`, `ForgotPasswordPage()`
- Middleware/helpers: camelCase, e.g. `onSubmit()`, `updateSession()`

**Variables:**
- Local state: camelCase, e.g. `serverError`, `isSubmitting`, `schoolId`
- Constants: UPPER_SNAKE_CASE for global constants (observed in patterns like `'UNAUTHORIZED'` for error codes)
- Type variables: camelCase, e.g. `user`, `school`, `course`

**Types:**
- Type definitions: PascalCase, e.g. `LoginInput`, `ForgotPasswordInput`, `Context`, `Branding`, `StudentDashboardConfig`
- Interfaces: PascalCase
- Schema/Zod objects: camelCase for variable names, e.g. `loginSchema`, `registerSchema`, `forgotPasswordSchema`

## Code Style

**Formatting:**
- Tool: Prettier 3.2.0
- Configuration: `/c/dev/12ity/ity/.prettierrc`
- Settings:
  - `semi: true` - Semicolons required at end of statements
  - `singleQuote: true` - Single quotes for strings (with JSX exceptions)
  - `tabWidth: 2` - 2 space indentation
  - `trailingComma: 'es5'` - Trailing commas where valid in ES5
  - `printWidth: 100` - Line width limit of 100 characters

**Linting:**
- Tool: ESLint 8.57.0
- Web app: Uses `next lint` with `eslint-config-next`
- UI package: Uses `eslint src/`
- DB and API packages: Use `eslint src/`
- No root-level `.eslintrc` found; uses Next.js and package-specific configurations

## Import Organization

**Order:**
1. External library imports (React, Next.js, third-party packages)
2. Type imports with `type` keyword when needed, e.g. `import type { LoginInput }`
3. Internal package imports (workspace packages like `@ity/db`, `@ity/config`)
4. Relative imports from local directories (lib, components, utils)

**Patterns:**
- Named imports preferred for utilities and functions
- Default exports used for page components and main entry points
- Barrel files used for component grouping, e.g. `/c/dev/12ity/ity/apps/web/components/auth/index.ts` exports component groups
- Path aliases via `baseUrl` and `paths` in tsconfig: `@/*` points to project root

**Examples:**
```typescript
// External imports first
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Type imports
import type { LoginInput } from '@/lib/validations/auth';

// Workspace imports
import { createClient } from '@/lib/supabase/client';
import { loginSchema } from '@/lib/validations/auth';

// Component imports
import { GoogleAuthButton, AuthDivider } from '@/components/auth';
import Link from 'next/link';
```

## Error Handling

**Patterns:**
- Zod for validation error handling with `z.infer<>` for type inference
- Try-catch blocks for async operations, checking for `error` objects
- tRPC `TRPCError` for API errors with specific error codes: `'UNAUTHORIZED'`, `'NOT_FOUND'`, `'CONFLICT'`, `'BAD_REQUEST'`
- Server error state stored in component state (e.g., `serverError`)
- Client-side form error display via `react-hook-form` error objects

**Examples:**
```typescript
// tRPC error pattern
if (!creator) {
  throw new TRPCError({
    code: 'NOT_FOUND',
    message: 'Creator profile not found',
  });
}

// Async error handling
const { error } = await supabase.auth.signInWithPassword({
  email: data.email,
  password: data.password,
});

if (error) {
  setServerError('Invalid email or password');
  return;
}

// Validation error handling with Zod
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
```

## Logging

**Framework:** No centralized logging library; uses `console` methods

**Patterns:**
- Comments used for inline documentation of business logic
- No structured logging observed in codebase
- Comments limited to explaining complex conditional logic or assumptions

**Example from code:**
```typescript
// For OAuth users, ensure a creator profile exists in our database
if (user) {
  // Check if creator profile already exists
  const { data: existing } = await supabase...
}
```

## Comments

**When to Comment:**
- Complex business logic that isn't self-evident
- Non-obvious conditional branches (e.g., OAuth user profile creation)
- Assumptions or side effects that may surprise future maintainers

**JSDoc/TSDoc:**
- Minimal usage observed
- One example in tRPC root: `/** Create a server-side caller for the tRPC API. */`
- Focuses on critical utility functions and exported APIs
- Not required for simple functions or obvious code

**Pattern:**
```typescript
/**
 * Create a server-side caller for the tRPC API.
 * This allows calling tRPC procedures directly from Server Components
 */
export const createCaller = (ctx: Context) => appRouter.createCaller(ctx);
```

## Function Design

**Size:** Functions kept concise
- Page components: 20-170 lines (including JSX)
- Utility functions: 5-10 lines
- Router procedures: 5-25 lines

**Parameters:**
- Typed parameters using TypeScript
- Destructured object parameters for functions with multiple arguments
- Context passed as single object parameter in tRPC procedures

**Return Values:**
- Explicit TypeScript return types for API routes and exported functions
- Inferred types for internal helpers
- Return type specified in procedure definitions (`.query()`, `.mutation()`)

**Pattern:**
```typescript
// Explicit return type
export async function GET(request: Request): Promise<NextResponse> {
  // ...
}

// tRPC procedure with input/output types
protectedProcedure
  .input(z.object({ schoolId: z.string().uuid() }))
  .query(async ({ ctx, input }) => {
    // Returns typed data
  })
```

## Module Design

**Exports:**
- Named exports for utilities and helpers
- Default exports for page/layout components (Next.js convention)
- `export type` for TypeScript types and interfaces

**Pattern:**
```typescript
// Utility exports (named)
export { cn } from './utils';
export const authRouter = router({ ... });

// Component exports (default)
export default function ForgotPasswordPage() { ... }

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type Context = { ... };
```

**Barrel Files:** Used for component organization
- `/c/dev/12ity/ity/apps/web/components/auth/index.ts` exports related auth components
- Simplifies imports: `import { GoogleAuthButton, AuthDivider } from '@/components/auth'`

## Async/Await

**Patterns:**
- Async functions for all server-side operations
- Async handlers in route handlers and API procedures
- Client-side event handlers marked as `async` when performing async operations
- Error handling via explicit error checks, not try-catch

**Example:**
```typescript
const onSubmit = async (data: LoginInput) => {
  setServerError(null);

  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) {
    setServerError('Invalid email or password');
    return;
  }

  router.push('/dashboard');
};
```

## React Component Patterns

**Client vs Server Components:**
- Server components by default (Next.js App Router)
- `'use client'` directive at top of client components (e.g., form pages)
- `Suspense` used for async boundaries on client components

**Form Handling:**
- `react-hook-form` with Zod validation via `zodResolver`
- Form state managed at component level with `useForm`
- Inline error display from form state

**State Management:**
- Local component state via `useState` for simple cases
- Zustand used in dependencies (observed in `package.json` but not heavily used yet)
- Supabase client instantiated per component for authentication

---

*Convention analysis: 2026-02-26*
