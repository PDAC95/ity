# Conventions

## Code Style

### Formatting
- **Prettier** for auto-formatting: `prettier --write "**/*.{ts,tsx,md,json}"`
- **ESLint** with `eslint-config-next` in `apps/web`
- No shared ESLint config across packages (each has its own `lint` script)

### Indentation & Quotes
- 2-space indentation (Prettier default)
- Single quotes for strings
- Semicolons enabled
- Trailing commas

## Naming Conventions

### Files
- **kebab-case** for all files: `dashboard-shell.tsx`, `social-button.tsx`, `mobile-nav.tsx`
- **Route files:** `page.tsx` (pages), `layout.tsx` (layouts), `route.ts` (API routes)
- **Index files:** `index.ts` for package/component barrel exports

### TypeScript
- **Components:** PascalCase (`DashboardShell`, `GoogleAuthButton`, `PasswordInput`)
- **Functions/variables:** camelCase (`createClient`, `loginSchema`, `serverError`)
- **Types/interfaces:** PascalCase (`LoginInput`, `Branding`, `LessonContent`, `Context`)
- **Constants:** SCREAMING_SNAKE_CASE objects with `as const`: `AVAILABLE_BLOCKS`, `PLANS`, `LESSON_TYPES`
- **Enums:** Not used — prefer `as const` objects with derived types

### Database
- **Tables:** snake_case plural (`live_classes`, `domain_verifications`)
- **Columns:** snake_case in DB (`creator_id`), auto-mapped to camelCase in TS (`creatorId`)
- **Indexes:** descriptive names: `schools_creator_idx`, `courses_school_slug_unique`

## Patterns

### Component Structure
```tsx
'use client';                        // Client directive when needed (first line)

import { ... } from 'react';        // React imports first
import { ... } from 'next/...';     // Next.js imports
import { ... } from '@/lib/...';    // Internal lib imports
import { ... } from '@/components/...'; // Component imports

export default function PageName() { // Default export for pages
  // State hooks
  const [state, setState] = useState();

  // Form hooks (react-hook-form)
  const { register, handleSubmit, formState: { errors } } = useForm();

  // Event handlers
  const onSubmit = async (data) => { ... };

  // JSX
  return ( ... );
}
```

### Form Pattern
- **Library:** react-hook-form + @hookform/resolvers + Zod
- **Validation:** Zod schemas in `lib/validations/` with exported types
- **Error display:** Inline `{errors.field && <p className="text-red-600">...</p>}`
- **Loading state:** `isSubmitting` from `formState`, button disabled + spinner

Example from `apps/web/app/(auth)/login/page.tsx`:
```tsx
const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({
  resolver: zodResolver(loginSchema),
});
```

### tRPC Procedure Pattern
```tsx
// Input: inline Zod schema
// Auth: protectedProcedure for creators, publicProcedure for anonymous
// Ownership: manual check via and(eq(table.id, input.id), eq(table.creatorId, ctx.user.id))
// Errors: throw new TRPCError({ code: 'NOT_FOUND' | 'CONFLICT' | 'UNAUTHORIZED', message: '...' })
// Return: .returning() for mutations, direct query result for queries
```

### Error Handling
- **tRPC:** `TRPCError` with HTTP-like codes (`NOT_FOUND`, `CONFLICT`, `UNAUTHORIZED`, `BAD_REQUEST`)
- **Supabase Auth:** Check `error` object, use `error.message.includes(...)` for specific errors
- **Forms:** Zod validation errors surfaced via react-hook-form `errors` object
- **Server errors:** `useState<string | null>` for server-side error messages

### Styling
- **Tailwind CSS 3.4** with `tailwindcss-animate` plugin
- **Utility function:** `cn()` from `@ity/ui/utils` (clsx + tailwind-merge)
- **CVA:** class-variance-authority for variant-based component styling
- **Inline classes:** Utility classes directly in JSX (no CSS modules, no styled-components)
- **Color scheme:** Blue primary (`blue-600`/`blue-500`), gray for text/borders, red for errors, green for success

### Data Fetching
- **Server Components:** `createClient()` from `@/lib/supabase/server` for auth checks in layouts
- **Client Components:** tRPC hooks via `@trpc/react-query` for data mutations and queries
- **State management:** Zustand for client-only state (e.g., mobile nav toggle)

### Import Aliases
- `@/` maps to `apps/web/` root (Next.js path alias)
- `@ity/api`, `@ity/db`, `@ity/config`, `@ity/ui` for workspace packages
- `workspace:*` for internal package references in `package.json`

## Module Exports
- **Barrel exports:** `index.ts` re-exports from sub-modules
- **Named exports:** Preferred over default exports (except page/layout components)
- **Package exports field:** Explicit `exports` map in `package.json` (e.g., `".": "./src/index.ts"`)
