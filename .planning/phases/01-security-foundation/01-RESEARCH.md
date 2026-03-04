# Phase 1: Security Foundation - Research

**Researched:** 2026-03-04
**Domain:** Supabase SSR auth security, Next.js middleware, tRPC context, open redirect prevention
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Redirect Allowlist
- Prefix-based matching: any path starting with `/dashboard`, `/courses`, `/settings`, or `/school` is allowed
- Hardcoded array in a utility file (`lib/auth/redirect.ts`) — not configurable via env
- Invalid redirect attempts: silently fallback to `/dashboard` AND log the attempt server-side as structured JSON
- Validation rules: must start with `/`, must NOT start with `//`, must match one of the allowed prefixes
- URL is normalized before allowlist check (handle `%2F%2F` encoding bypass)

#### Error Responses
- Auth failures redirect to `/login` with error context passed as URL query params (e.g. `?error=auth_failed`)
- Login page reads query params and displays a toast notification with the error message
- Toast library: install `sonner` — project doesn't have one yet. This is a new dependency for Phase 1.
- Error messages are generic in production ("Something went wrong. Please try again.") — no specific error details to prevent info leakage
- In development mode, detailed error info is logged to console

#### Creator Provisioning Move
- `auth.createCreator` moves from `publicProcedure` to `protectedProcedure`, using `ctx.user.id` exclusively
- Safety net: Dashboard layout (server component) checks if authenticated user has a creator record. If missing, auto-creates it via upsert. This catches edge cases from the old flow.
- Unified callback route: one `/callback` route handles ALL auth types (signup, login, OAuth, password reset)
- Callback determines auth event type using BOTH Supabase query params (`type=signup`, `type=recovery`, etc.) AND session state verification
- Creator provisioning in callback uses idempotent upsert (INSERT ... ON CONFLICT DO NOTHING)

#### Dev vs Prod Behavior
- Cookie errors in `server.ts`: THROW in development mode (hard failure to catch issues), console.warn in production
- Security fixes are invisible to existing users — no forced re-login, no visible state change
- All auth failures are logged server-side in all environments (visible in Vercel function logs)

#### Auth Logging
- New utility module: `lib/auth/logger.ts` with typed log functions
- Structured JSON format: `{ event: 'auth_failure', type: 'invalid_redirect', ip: '...', timestamp: '...', details: {...} }`
- Reusable across all phases — Phase 2+ auth flows will use the same logger
- Logs go to server stdout (readable in Vercel logs) — no external monitoring service for now

#### Sign-Out & Navigation
- Sign-out route adds `Cache-Control: no-store` header to prevent edge caching
- Post-login navigation uses `window.location.href` instead of `router.push` to ensure cookies flush before navigation
- These are invisible fixes — users won't notice any change

### Claude's Discretion
- Exact toast library choice (sonner, react-hot-toast, etc.) — NOTE: LOCKED to `sonner` above, discretion on config details
- Middleware refactoring approach (how to merge updateSession + user extraction)
- tRPC context wiring details
- Exact Zod schema for redirect validation

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SEC-01 | Auth callback validates `next` parameter against allowlist of known app paths before redirecting (no open redirect) | Redirect allowlist pattern in `lib/auth/redirect.ts`, Zod schema for path validation, URL normalization for `%2F%2F` bypass |
| SEC-02 | `auth.createCreator` is a protected procedure that uses `ctx.user.id` from verified session (not user-supplied UUID) | Change `publicProcedure` → `protectedProcedure` in `packages/api/src/routers/auth.ts`, remove `id` input field |
| SEC-03 | Cookie errors in Supabase server client surface as warnings in development mode (not silently swallowed) | Modify `setAll` in `lib/supabase/server.ts` to throw in dev, warn in prod |
| SEC-04 | Middleware creates one Supabase client per request, returning user from `updateSession()` without double API call | Refactor `middleware.ts` to extract user from the single `updateSession()` call instead of creating a second client |
| SEC-05 | Supabase client is passed to tRPC context (not null) for use in procedures | Pass supabase instance from API route handler into `createTRPCContext()` |
| SEC-06 | Sign-out route returns `Cache-Control: no-store` header to prevent edge caching | Add response header to `app/api/auth/signout/route.ts` |
| SEC-07 | Post-login navigation uses `window.location.href` instead of `router.push` to ensure cookies are flushed | Update `app/(auth)/login/page.tsx` onSubmit handler |
</phase_requirements>

---

## Summary

This phase fixes 7 specific security defects in the existing codebase. The codebase is a Next.js 14 (App Router) + Supabase SSR + tRPC monorepo. All the files to be changed are identified — no new routes or major features are added. The work is surgical: change specific lines in specific files, plus create two new utility modules (`lib/auth/redirect.ts` and `lib/auth/logger.ts`).

The most architecturally significant fix is SEC-04: the current `middleware.ts` creates TWO separate Supabase clients per request — one inside `updateSession()` (which calls `getUser()` to refresh the token) and a second one immediately after to get the user for routing decisions. The fix requires modifying `lib/supabase/middleware.ts` to return the user alongside the response, so `middleware.ts` can use that result without a second API call.

The second significant fix is SEC-02: `auth.createCreator` currently accepts an arbitrary UUID from the client, allowing anyone to create a creator record for any user ID. Moving it to `protectedProcedure` and using `ctx.user.id` closes this injection vector. However, `ctx.supabase` is currently `null` in the tRPC context (SEC-05), so SEC-05 must be fixed alongside or before SEC-02 for the dashboard safety-net upsert to work correctly.

**Primary recommendation:** Fix in dependency order — SEC-06 and SEC-07 first (isolated, no dependencies), then SEC-03 (server.ts standalone), then SEC-04+SEC-05 together (middleware feeds tRPC context), then SEC-01 (new utility), then SEC-02 (depends on SEC-05 for ctx.supabase in dashboard layout).

---

## Existing Code Inventory

These are the exact files that need to change, with their current state documented:

### Files to Modify

| File | Current Problem | Fix |
|------|----------------|-----|
| `ity/apps/web/middleware.ts` | Creates second Supabase client after `updateSession()`, calls `getUser()` twice | Refactor to receive user from `updateSession()` return value |
| `ity/apps/web/lib/supabase/middleware.ts` | `updateSession()` calls `getUser()` but discards result | Return `{ response, user }` instead of just `response` |
| `ity/apps/web/lib/supabase/server.ts` | `setAll` silently swallows cookie errors (empty `catch {}`) | Throw in dev, `console.warn` in prod |
| `ity/apps/web/app/(auth)/callback/route.ts` | Uses `${origin}${next}` without validating `next` | Validate `next` via allowlist before redirect |
| `ity/apps/web/app/api/auth/signout/route.ts` | No `Cache-Control` header on response | Add `Cache-Control: no-store` header |
| `ity/apps/web/app/(auth)/login/page.tsx` | Uses `router.push('/dashboard')` after login | Change to `window.location.href = '/dashboard'` |
| `ity/apps/web/app/api/trpc/[trpc]/route.ts` | Creates supabase client but doesn't pass it to `createTRPCContext` | Add `supabase` to context creation |
| `ity/packages/api/src/routers/auth.ts` | `createCreator` uses `publicProcedure` with user-supplied `id` | Change to `protectedProcedure`, use `ctx.user.id` |
| `ity/apps/web/app/(dashboard)/layout.tsx` | No creator safety-net check | Add upsert if creator record missing for authenticated user |

### Files to Create

| File | Purpose |
|------|---------|
| `ity/apps/web/lib/auth/redirect.ts` | Allowlist validation utility for `next` param |
| `ity/apps/web/lib/auth/logger.ts` | Structured JSON auth event logger |

---

## Standard Stack

### Core (already installed — no new installs except sonner)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/ssr` | `^0.5.0` | Supabase SSR client for Next.js | Official Supabase package for App Router cookie-based auth |
| `@supabase/supabase-js` | `^2.45.0` | Supabase JS client | Core auth SDK |
| `@trpc/server` | `^10.45.0` | tRPC server + middleware | Type-safe API with middleware chain |
| `zod` | `^3.23.0` | Schema validation | Used throughout project for input validation |
| `next` | `^14.2.0` | Next.js framework | App Router, middleware, route handlers |
| `sonner` | `^2.x` (latest) | Toast notifications | Chosen by user; opinionated, works as server component placement |

### New Dependency

| Library | Install Command | Purpose |
|---------|-----------------|---------|
| `sonner` | `pnpm add sonner` (in `apps/web`) | Toast notifications for auth error display on login page |

**Installation (from `ity/apps/web`):**
```bash
pnpm add sonner
```

---

## Architecture Patterns

### Recommended File Structure for New Utilities

```
ity/apps/web/lib/auth/
├── redirect.ts      # isAllowedRedirect(path) — allowlist validation
└── logger.ts        # logAuthEvent(event, details) — structured JSON logger
```

### Pattern 1: Middleware Single-Client Refactor (SEC-04)

**What:** `updateSession()` in `lib/supabase/middleware.ts` already calls `getUser()` internally to refresh the token. The result should be returned so the outer middleware can use it without a second client creation.

**Current broken flow:**
```
middleware.ts:
  1. calls updateSession(request)          <- creates client, calls getUser() internally
  2. creates SECOND supabase client
  3. calls getUser() AGAIN on second client <- second API call, wasted
```

**Fixed flow:**
```
middleware.ts:
  1. calls updateSession(request)          <- creates client, calls getUser(), returns {response, user}
  2. uses user from updateSession result   <- zero extra API calls
```

**How to implement:**

Modify `lib/supabase/middleware.ts` — change the return type and return the user:

```typescript
// lib/supabase/middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { User } from '@supabase/supabase-js';

type CookieToSet = { name: string; value: string; options?: CookieOptions };

export async function updateSession(
  request: NextRequest
): Promise<{ response: NextResponse; user: User | null }> {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // This is the ONLY getUser() call for this request
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response: supabaseResponse, user };
}
```

Then in `middleware.ts`, destructure the result:

```typescript
// middleware.ts
import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);

  const { pathname } = request.nextUrl;

  const authPages = ['/login', '/register', '/forgot-password'];
  const isAuthPage = authPages.some((p) => pathname.startsWith(p));
  const isDashboard = pathname.startsWith('/dashboard');

  if (user && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (!user && isDashboard) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

**Key constraint:** The `supabaseResponse` object from `updateSession` MUST be returned (not a fresh `NextResponse`) when no redirect occurs. Creating a new response object breaks cookie propagation. The current code already does this correctly — preserve that.

### Pattern 2: tRPC Context Supabase Wiring (SEC-05)

**What:** The API route handler (`app/api/trpc/[trpc]/route.ts`) creates a supabase client and gets the user, but passes `user` to `createTRPCContext` without passing the `supabase` instance. The context type already supports `supabase?: SupabaseClient`.

**Current state in `packages/api/src/trpc.ts`:**
```typescript
export const createTRPCContext = async (opts: {
  headers: Headers;
  supabase?: SupabaseClient;  // Already in the signature
  user?: User | null;
}): Promise<Context> => {
  const { headers, supabase = null, user = null } = opts;
  // ...
};
```

**Fix in `app/api/trpc/[trpc]/route.ts`:**
```typescript
const handler = async (req: Request) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () =>
      createTRPCContext({
        headers: req.headers,
        supabase,   // ADD THIS — was missing before
        user,
      }),
    // ...
  });
};
```

The context signature already accepts `supabase` — this is a one-line fix.

**Also fix `lib/trpc/server.ts`** (RSC caller) to pass supabase:
```typescript
const createContext = cache(async () => {
  const heads = new Headers(await headers());
  heads.set('x-trpc-source', 'rsc');

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return createTRPCContext({
    headers: heads,
    supabase,   // ADD THIS
    user,
  });
});
```

### Pattern 3: Open Redirect Allowlist (SEC-01)

**What:** The `next` query param in `/callback` is used directly in a redirect without validation. An attacker can pass `?next=//evil.com` to redirect users to an external site after auth.

**Bypass vectors to defend against:**
- `//evil.com` — protocol-relative URL, browsers treat as `https://evil.com`
- `%2F%2Fevil.com` — percent-encoded double slash bypasses naive string checks
- `//evil.com%2F` — trailing slash encoding variants

**The `lib/auth/redirect.ts` utility:**

```typescript
// lib/auth/redirect.ts
// Source: locked decisions from CONTEXT.md

const ALLOWED_PREFIXES = ['/dashboard', '/courses', '/settings', '/school'] as const;

export function isAllowedRedirect(next: string | null | undefined): string {
  const fallback = '/dashboard';

  if (!next) return fallback;

  // Decode percent-encoded characters before validation
  let decoded: string;
  try {
    decoded = decodeURIComponent(next);
  } catch {
    return fallback;
  }

  // Must start with single slash (not double)
  if (!decoded.startsWith('/') || decoded.startsWith('//')) {
    return fallback;
  }

  // Must match one of the allowed prefixes
  const isAllowed = ALLOWED_PREFIXES.some((prefix) => decoded.startsWith(prefix));
  if (!isAllowed) {
    return fallback;
  }

  return decoded;
}
```

**Usage in callback route:**
```typescript
import { isAllowedRedirect } from '@/lib/auth/redirect';

const next = searchParams.get('next');
const safeNext = isAllowedRedirect(next);

return NextResponse.redirect(`${origin}${safeNext}`);
```

**Note:** Logging invalid redirect attempts is handled by `lib/auth/logger.ts` (see Pattern 4).

### Pattern 4: Structured Auth Logger (SEC-01 logging + future phases)

**What:** Structured JSON logging to stdout for server-side auth events. Maps cleanly to Sentry/DataDog schema for future migration.

```typescript
// lib/auth/logger.ts

type AuthEvent =
  | 'invalid_redirect'
  | 'auth_failure'
  | 'cookie_error'
  | 'creator_provision_error';

interface AuthLogEntry {
  event: AuthEvent;
  timestamp: string;
  environment: string;
  details: Record<string, unknown>;
}

export function logAuthEvent(
  event: AuthEvent,
  details: Record<string, unknown> = {}
): void {
  const entry: AuthLogEntry = {
    event,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV ?? 'unknown',
    details,
  };
  console.log(JSON.stringify(entry));
}
```

### Pattern 5: protectedProcedure Conversion (SEC-02)

**What:** `auth.createCreator` accepts a user-supplied UUID and creates a database record for that UUID. This lets any authenticated (or unauthenticated) user create records for arbitrary UUIDs.

**Current (broken):**
```typescript
createCreator: publicProcedure
  .input(z.object({
    id: z.string().uuid(),        // <- user-supplied, dangerous
    email: z.string().email(),
    name: z.string().min(2).max(255),
  }))
  .mutation(async ({ ctx, input }) => {
    // uses input.id — can be any UUID
  })
```

**Fixed:**
```typescript
createCreator: protectedProcedure  // <- requires verified session
  .input(z.object({
    name: z.string().min(2).max(255),
    // id removed — uses ctx.user.id instead
  }))
  .mutation(async ({ ctx, input }) => {
    // upsert using verified session user ID
    await ctx.db.insert(creators)
      .values({
        id: ctx.user.id,      // <- from verified Supabase session
        email: ctx.user.email!,
        name: input.name,
      })
      .onConflictDoNothing();
  })
```

**Note:** After this change, the procedure no longer accepts a user-supplied `id`. Any existing code calling `auth.createCreator` with an `id` field must be updated.

### Pattern 6: Cookie Error Surface (SEC-03)

**Current state in `lib/supabase/server.ts`:**
```typescript
setAll(cookiesToSet: CookieToSet[]) {
  try {
    cookiesToSet.forEach(({ name, value, options }) =>
      cookieStore.set(name, value, options)
    );
  } catch {
    // Silent — error is swallowed
  }
}
```

**Fixed:**
```typescript
setAll(cookiesToSet: CookieToSet[]) {
  try {
    cookiesToSet.forEach(({ name, value, options }) =>
      cookieStore.set(name, value, options)
    );
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      // Hard failure in dev — you need to know this is broken
      throw error;
    } else {
      // Graceful degradation in prod — session refresh in middleware handles it
      console.warn('[supabase/server] Cookie setAll failed:', error);
    }
  }
}
```

**Why the catch exists at all:** Supabase SSR docs note that `setAll` can be called from Server Components where cookies are read-only. The catch is intentional for that scenario but should not be silent.

### Pattern 7: Sign-Out Cache-Control (SEC-06)

**Current `app/api/auth/signout/route.ts`:**
```typescript
return NextResponse.redirect(`${origin}/login`, { status: 302 });
```

**Fixed:**
```typescript
const redirectResponse = NextResponse.redirect(`${origin}/login`, { status: 302 });
redirectResponse.headers.set('Cache-Control', 'no-store');
return redirectResponse;
```

### Pattern 8: Login Navigation Fix (SEC-07)

**Current `app/(auth)/login/page.tsx`:**
```typescript
router.push('/dashboard');
router.refresh();
```

**Fixed:**
```typescript
// window.location.href causes a full page load, ensuring:
// 1. Auth cookies set by Supabase are included in the next request
// 2. No stale React state or cached auth context
window.location.href = '/dashboard';
```

**Why this matters:** `router.push()` is a client-side navigation that doesn't re-send cookies set during the same render. `window.location.href` triggers a full browser navigation, so all cookies including newly set auth cookies are included in the request to `/dashboard`.

### Pattern 9: Dashboard Creator Safety Net

**Addition to `app/(dashboard)/layout.tsx`:**
```typescript
// After confirming user is authenticated:
const { data: existingCreator } = await supabase
  .from('creators')
  .select('id')
  .eq('id', user.id)
  .single();

if (!existingCreator) {
  // Idempotent upsert — handles race conditions and migrated users
  await supabase.from('creators').upsert({
    id: user.id,
    email: user.email ?? '',
    name: (user.user_metadata?.full_name as string) ?? user.email?.split('@')[0] ?? 'Creator',
  }, { onConflict: 'id', ignoreDuplicates: true });
}
```

### Pattern 10: Sonner Toast Setup

**Install:**
```bash
# from ity/ (workspace root) or ity/apps/web/
pnpm add sonner --filter @ity/web
```

**Add Toaster to root layout (`app/layout.tsx`):**
```tsx
import { Toaster } from 'sonner';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
```

**Trigger toast from error query param in login page:**
```tsx
import { toast } from 'sonner';
import { useEffect } from 'react';

// In LoginForm component:
useEffect(() => {
  if (errorParam) {
    toast.error('Something went wrong. Please try again.');
  }
}, [errorParam]);
```

**Note:** The `Toaster` component can be placed in server components (layout.tsx). The `toast()` call must be in client components.

### Anti-Patterns to Avoid

- **Do NOT use `getSession()` in server-side code.** `getSession()` does not validate the JWT with Supabase servers — it just parses the cookie. Always use `getUser()` on the server. (Source: Supabase SSR docs)
- **Do NOT create a new `NextResponse` after modifying cookies in `updateSession()`.** The `supabaseResponse` must be the exact same object returned from `setAll`. Creating a new response discards the cookie modifications. (Source: Supabase SSR official guide)
- **Do NOT pass `id` in `createCreator` input.** After SEC-02 fix, `ctx.user.id` is used exclusively. If any client code currently passes `id`, it must be removed.
- **Do NOT use blocklist validation for redirect URLs.** Blocklists are easily bypassed with encoding tricks. Use allowlist (prefix matching) only.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| URL decoding before validation | Custom regex for encoded chars | `decodeURIComponent()` (native) | Handles all percent-encoding edge cases; custom regexes miss variants |
| Toast notifications | Custom `useState` + CSS toast | `sonner` | Handles stacking, animation, accessibility, promise states |
| tRPC auth middleware | Custom session check in each procedure | `protectedProcedure` (already exists) | Already in `packages/api/src/trpc.ts` — just use it |
| Supabase cookie management | Custom cookie read/write | `@supabase/ssr` (already installed) | Handles httpOnly, SameSite, expiry, cross-component consistency |

**Key insight:** All the infrastructure for auth (tRPC middleware, Supabase SSR client) already exists in this project. The fixes are configuration and wiring changes, not new implementations.

---

## Common Pitfalls

### Pitfall 1: Breaking Cookie Propagation in Middleware

**What goes wrong:** After fixing the double-client problem, if you return a `new NextResponse()` instead of the `supabaseResponse` from `updateSession()`, auth tokens refreshed during `updateSession()` are lost. The browser never gets the new cookies, and the next request treats the user as unauthenticated.

**Why it happens:** `updateSession()` uses the `supabaseResponse` variable as a closure — it replaces it when `setAll()` is called. If you discard this object and return a fresh response, the cookie `set` calls are gone.

**How to avoid:** Always return the `response` returned from `updateSession()` for non-redirect paths. The current `middleware.ts` does this correctly for the non-redirect case — preserve that behavior.

**Warning signs:** Users randomly logged out; middleware logs show `getUser()` returning null on pages they just authenticated into.

### Pitfall 2: Double-Decoding URL

**What goes wrong:** If `next` comes in as `%252F%252F` (double-encoded), one call to `decodeURIComponent` produces `%2F%2F`, not `//`. The check would incorrectly allow it.

**Why it happens:** Malicious actors double-encode to bypass naive single-decode checks.

**How to avoid:** After one `decodeURIComponent()` pass, check if the result still contains `%`. If yes, reject (only one level of decoding — do not decode twice, as that opens re-encoding attacks). Alternatively: after decoding, check the first two characters are exactly `/` and not another `/` — the allowlist prefix check handles the rest.

**Warning signs:** Security scanner reports open redirect with double-encoded paths.

### Pitfall 3: Sonner Toaster in Wrong Component

**What goes wrong:** Placing `<Toaster>` in a client component parent can cause hydration mismatches. The `toast()` function is called in the client component but the `Toaster` isn't mounted yet.

**Why it happens:** `Toaster` needs to be a DOM singleton, high in the tree.

**How to avoid:** Place `<Toaster>` directly in the root `app/layout.tsx` body (server component). Sonner explicitly supports this pattern. Do NOT place it inside a client-side provider.

**Warning signs:** "Toast is not defined" errors, toasts that appear briefly then disappear, React hydration warnings.

### Pitfall 4: createCreator Still Called with ID from Client

**What goes wrong:** After converting `createCreator` to `protectedProcedure` and removing the `id` input, if any client code still passes `id: uuid`, Zod will reject it (unexpected property) and the call fails.

**Why it happens:** The procedure's input schema changes — callers must be updated in sync.

**How to avoid:** Search for all usages of `trpc.auth.createCreator.mutate` across the codebase before and after the change. Remove the `id` field from all call sites.

**Warning signs:** tRPC validation error on `createCreator` calls after deployment.

### Pitfall 5: Dev Throw Breaks Supabase SSR Pattern

**What goes wrong:** The `setAll` catch in `server.ts` is deliberately there for Server Components (where cookies are read-only). Throwing in ALL dev scenarios including Server Components will cause false positives.

**Why it happens:** Supabase SSR's own docs say "This can be ignored if you have middleware refreshing user sessions" — they expect the catch to swallow the error silently in Server Components.

**How to avoid:** The throw should still be informative. Consider whether the caller context matters. A `console.warn` in dev (rather than a throw) might be more appropriate than a hard throw, since Supabase itself documents this pattern as expected. **Validate this behavior against SEC-03's success criterion:** "a cookie operation failure produces a console warning instead of silently swallowing."

**Warning signs:** Server component renders crashing with cookie errors even when middleware is correctly refreshing sessions.

### Pitfall 6: Sign-Out Redirect Loses Cache-Control

**What goes wrong:** `NextResponse.redirect()` creates a response with no custom headers. If you add headers after redirect creation but before returning, some Vercel edge configurations may strip them.

**Why it happens:** Edge network behavior with 3xx redirect responses.

**How to avoid:** Set the header directly on the response object: `response.headers.set('Cache-Control', 'no-store')`. Test against Vercel preview to confirm the header appears on the 302 response.

**Warning signs:** Browser back button after logout returns to authenticated state; Vercel response inspector shows no `Cache-Control` header on the 302.

---

## Code Examples

Verified patterns from research and codebase analysis:

### Redirect Validation (SEC-01)
```typescript
// lib/auth/redirect.ts
const ALLOWED_PREFIXES = ['/dashboard', '/courses', '/settings', '/school'] as const;

export function isAllowedRedirect(next: string | null | undefined): string {
  const fallback = '/dashboard';
  if (!next) return fallback;

  let decoded: string;
  try {
    decoded = decodeURIComponent(next);
  } catch {
    return fallback;
  }

  // Reject anything that doesn't start with exactly one slash
  if (!decoded.startsWith('/') || decoded.startsWith('//')) {
    return fallback;
  }

  const isAllowed = ALLOWED_PREFIXES.some((prefix) => decoded.startsWith(prefix));
  return isAllowed ? decoded : fallback;
}
```

### Protected Procedure (SEC-02)
```typescript
// packages/api/src/routers/auth.ts — createCreator
createCreator: protectedProcedure
  .input(z.object({
    name: z.string().min(2).max(255),
  }))
  .mutation(async ({ ctx, input }) => {
    await ctx.db
      .insert(creators)
      .values({
        id: ctx.user.id,
        email: ctx.user.email!,
        name: input.name,
      })
      .onConflictDoNothing();
  }),
```

### Cookie Error Surface (SEC-03)
```typescript
// lib/supabase/server.ts — setAll handler
setAll(cookiesToSet: CookieToSet[]) {
  try {
    cookiesToSet.forEach(({ name, value, options }) =>
      cookieStore.set(name, value, options)
    );
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      throw error;
    } else {
      console.warn('[supabase/server] Cookie setAll failed (expected in Server Components):', error);
    }
  }
}
```

### Sign-Out with Cache-Control (SEC-06)
```typescript
// app/api/auth/signout/route.ts
export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const { origin } = new URL(request.url);
  const response = NextResponse.redirect(`${origin}/login`, { status: 302 });
  response.headers.set('Cache-Control', 'no-store');
  return response;
}
```

### Structured Auth Logger
```typescript
// lib/auth/logger.ts
type AuthEvent = 'invalid_redirect' | 'auth_failure' | 'cookie_error' | 'creator_provision_error';

export function logAuthEvent(
  event: AuthEvent,
  details: Record<string, unknown> = {}
): void {
  console.log(JSON.stringify({
    event,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    details,
  }));
}
```

---

## State of the Art

| Old Approach | Current Approach | Impact on This Phase |
|--------------|------------------|---------------------|
| `createRouteHandlerClient` (auth-helpers) | `createServerClient` from `@supabase/ssr` | Project already uses correct package — no migration needed |
| `getSession()` in server code | `getUser()` in server code | Current code uses `getUser()` — correct already |
| Silent `catch {}` in cookie setAll | `console.warn` or throw | SEC-03 fix required |
| `router.push()` after login | `window.location.href` | SEC-07 fix required |

**Already correct in codebase:**
- Uses `@supabase/ssr` (not deprecated `auth-helpers`)
- Uses `getUser()` not `getSession()` in server contexts
- Middleware uses the `updateSession()` pattern (just creates a second client unnecessarily)
- tRPC `protectedProcedure` and `enforceCreatorAuth` middleware already exist

---

## Open Questions

1. **SEC-03 Dev Throw Scope**
   - What we know: The catch in `setAll` exists because Supabase SSR docs say Server Components can't write cookies, and this is expected behavior when middleware handles refresh
   - What's unclear: Should the dev throw apply to ALL cookie failures, or only those not expected in Server Components? The success criterion says "produces a console warning" — not a throw — which contradicts the CONTEXT.md decision to "THROW in development mode"
   - Recommendation: Implement as THROW per CONTEXT.md decision. The success criterion's "console warning" language may be describing production behavior. Verify with stakeholder if needed, but implement THROW in dev as the locked decision states.

2. **Drizzle upsert syntax for onConflictDoNothing**
   - What we know: The project uses Drizzle ORM (`@ity/db` package). The callback route currently uses direct Supabase `.from().insert()` not Drizzle.
   - What's unclear: Whether the creator upsert in the dashboard layout should use Drizzle or Supabase client directly.
   - Recommendation: Use the Supabase client (already available via `createClient()`) for the dashboard layout upsert — consistent with callback route pattern. Drizzle is available via `ctx.db` in tRPC, not directly in layouts.

3. **tRPC RSC Caller supabase pass-through**
   - What we know: `lib/trpc/server.ts` creates a supabase client and gets the user but currently doesn't pass `supabase` to context (only `user`)
   - What's unclear: Whether RSC-invoked tRPC procedures actually need the supabase client, or only the API route handler does
   - Recommendation: Pass `supabase` in both places (API route + RSC caller) for consistency — the context type already supports it.

---

## Sources

### Primary (HIGH confidence)
- Codebase inspection (direct file reads) — all existing file patterns documented above
- Supabase SSR official docs (https://supabase.com/docs/guides/auth/server-side/nextjs) — middleware pattern, cookie handling
- Sonner official docs (https://sonner.emilkowal.ski/getting-started) — installation and layout placement pattern

### Secondary (MEDIUM confidence)
- Supabase GitHub discussion #27873 — pattern for avoiding duplicate `getUser()` calls (pass user via response or headers)
- Noah Flk blog (https://noahflk.com/blog/supabase-auth-nextjs) — Supabase + tRPC context integration pattern
- Open redirect bypass research — `//evil.com` and `%2F%2F` encoding bypass vectors

### Tertiary (LOW confidence)
- Sonner peer dependency compatibility with React 18 — not explicitly confirmed via official source, but version 2.x is widely reported as React 18 compatible

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed (except sonner); versions confirmed from package.json
- Architecture patterns: HIGH — based on direct codebase inspection; exact files and line-level changes identified
- Pitfalls: HIGH — patterns from Supabase official docs + direct code analysis of existing bugs
- Redirect security: MEDIUM — URL bypass vectors confirmed via security research, normalization approach is standard practice

**Research date:** 2026-03-04
**Valid until:** 2026-04-04 (Supabase SSR API is stable; sonner is actively maintained but pre-2.x API changes possible)
