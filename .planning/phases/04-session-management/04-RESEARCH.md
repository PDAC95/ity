# Phase 4: Session Management - Research

**Researched:** 2026-03-31
**Domain:** Supabase SSR token refresh, Next.js middleware redirects, tRPC error codes, auth error enumeration
**Confidence:** HIGH

## Summary

Session management in this stack is handled by three coordinated layers: Next.js middleware (via `@supabase/ssr`), the tRPC API route handler, and React client components. The core mechanism is already in place — `updateSession()` calls `supabase.auth.getUser()`, which internally triggers a silent token refresh via Supabase's `POST /token?grant_type=refresh_token` endpoint when the access token has expired. The refresh is automatic; there is nothing additional to install for SESS-01.

The main work of Phase 4 is: (1) detecting the "both tokens expired" case in middleware and redirecting with `?reason=session_expired&next=<path>`, (2) reading that param in the login page and displaying a dismissible message, (3) creating an `auth-errors.ts` enum file to replace ad-hoc string construction, and (4) ensuring the tRPC layer surfaces its `UNAUTHORIZED` code in a way client code can check by code rather than by message string.

No new dependencies are required. The stack already has sonner (v2.0.7) installed and configured in the root layout, `next-intl` v3.25.0 is installed but not in use for auth — the decision is to use a simple constants object for i18n rather than the full next-intl pipeline.

**Primary recommendation:** Extend middleware to detect null user after `updateSession()` and redirect to `/login?reason=session_expired&next=<path>`. Create `lib/auth/errors.ts` with an enum + message map. Update the login page to consume `reason=session_expired` param via sonner toast (matching existing toast pattern for `error` and `message` params already in the login page).

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Expiry message component:** Claude decides (toast vs banner) based on existing project pattern. Dismiss: message disappears when user focuses on a login form field. URL cleanup: after reading `?reason=session_expired`, do `replaceState` to remove the param from the URL.
- **Silent token refresh strategy:** Reactive — middleware detects expired token when a request arrives and refreshes at that moment. Completely invisible to the user (no spinners). If a tRPC call fails due to expired token, middleware refreshes and client retries automatically (1 attempt). If refresh fails, session is dead → redirect to login with `?reason=session_expired`.
- **Auth error enum:** One file `auth-errors.ts` with an enum of codes (`SESSION_EXPIRED`, `INVALID_CREDENTIALS`, etc.) and a map of code → message (es/en). Scope: only session/auth errors. Rate limit (Phase 3) keeps its own HTTP 429 handling. Transport: Claude decides the right mechanism per layer (query param for redirects, TRPCError for tRPC, JSON body for API routes). Claude must investigate and migrate any `message.includes()` string matching.
- **Post-expiry redirect:** Include `&next=/previous-route` in the redirect URL. Do not clear local state (hard navigation to /login already resets React state). Edge case: if user is already on /login when session expires, nothing happens (expiry only handled when accessing protected routes). Multi-tab: not handled — each tab manages its own expiry independently.

### Claude's Discretion
- Component of UI for expiry message (toast with sonner vs inline banner)
- Exact error transport mechanism between layers
- Loading skeleton design if applicable
- Migration strategy for any existing string matching

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SESS-01 | Middleware attempts silent session refresh when access token is expired but refresh token is valid | `@supabase/ssr` `getUser()` triggers `POST /token?grant_type=refresh_token` automatically; `setAll` cookie handler in middleware writes refreshed tokens back to response cookies. This is already wired correctly in `lib/supabase/middleware.ts`. No code change needed for the refresh itself — only the detection of "refresh failed → null user" needs to trigger the expiry redirect. |
| SESS-02 | When both tokens are expired, user is redirected to login with `?reason=session_expired` parameter | Middleware receives `user: null` from `updateSession()` when both tokens are expired (same as unauthenticated). Distinguishing "always-unauthenticated" vs "session-expired" requires checking whether a stale Supabase cookie is present. The correct approach: check for a `sb-*-auth-token` cookie in the request while `user` is null → session_expired redirect; no Supabase cookie + null user → normal unauthenticated redirect. |
| SESS-03 | Login page displays "Your session has expired" message when `reason=session_expired` is present | Login page already uses `useSearchParams()` + `sonner` toast for `error` and `message` params. Adding `reason=session_expired` follows the identical pattern. Decision: use `toast.warning()` (distinct from `toast.error()`). Dismiss on input focus via `onFocus` event on the email field — clear the toast and call `replaceState`. |
| SESS-04 | Auth state is consistent across Supabase, Next.js middleware, and tRPC context (no layer disagrees) | All three layers call `supabase.auth.getUser()` independently per request (middleware, tRPC route handler, RSC server caller). After middleware refreshes the token, the Set-Cookie header updates the browser cookie, so subsequent requests to tRPC see the refreshed token. The "no layer disagrees" requirement is satisfied by the middleware-first architecture. The enum unifies the error vocabulary; no additional sync mechanism is needed. |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/ssr` | ^0.5.0 | SSR-safe Supabase client with cookie-based session handling | Official Supabase library for Next.js middleware; handles token refresh via `getUser()` |
| `sonner` | ^2.0.7 | Toast notifications | Already installed and configured in root layout with `<Toaster position="top-right" />` |
| `next` | ^14.2.0 | App Router middleware, `useSearchParams`, `window.history.replaceState` | Already in use |
| `@trpc/server` | ^10.45.0 | `TRPCError` with typed error codes | Already in use; `UNAUTHORIZED` code maps to HTTP 401 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `next-intl` | ^3.25.0 | i18n | Already installed but NOT used for auth messages — decision is a simple `const AUTH_MESSAGES` object with `es`/`en` keys instead |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Simple `const` message map | `next-intl` pipeline | next-intl requires locale routing setup; overkill for this phase. Constants object is sufficient per locked decision. |
| `toast.warning()` for expiry | Inline banner | Existing project uses `toast.error()` and `toast.success()` for auth feedback; toast is the consistent pattern. Banner would be novel. Use `toast.warning()` to distinguish expiry from hard errors. |
| Cookie presence check for expiry detection | Separate Supabase API call | A second API call to detect "was there a session?" is wasteful. Cookie name inspection is cheap and correct. |

**Installation:** No new packages needed.

---

## Architecture Patterns

### Recommended Project Structure
```
ity/apps/web/
├── lib/
│   └── auth/
│       ├── errors.ts          # NEW: AuthErrorCode enum + message map
│       ├── redirect.ts        # Existing: isAllowedRedirect()
│       └── logger.ts          # Existing: logAuthEvent()
├── app/
│   └── (auth)/
│       └── login/
│           └── page.tsx       # MODIFY: add reason=session_expired handling
└── middleware.ts              # MODIFY: expiry redirect with ?reason + ?next
```

### Pattern 1: Silent Token Refresh (Already Working)
**What:** `@supabase/ssr`'s `createServerClient` in middleware automatically calls `POST /token?grant_type=refresh_token` when `getUser()` finds an expired access token. The `setAll` cookie handler writes the new tokens to the response. No explicit code needed.
**When to use:** Already active — every request through middleware.
**Key fact (Context7):** "Session refresh happens in the middleware, and not using a middleware function means that the session will likely not be properly refreshed." — Supabase SSR design docs. The current middleware already satisfies this.

```typescript
// Source: /supabase/ssr — this is what updateSession() already does
// lib/supabase/middleware.ts (existing, no change needed)
const { data: { user } } = await supabase.auth.getUser();
// If access token was expired but refresh token valid → supabase internally
// calls POST /token?grant_type=refresh_token and triggers setAll with new cookies.
// user will be non-null. The Set-Cookie header goes onto supabaseResponse.
```

### Pattern 2: Expired Session Detection in Middleware
**What:** After `updateSession()`, `user` is null for two distinct reasons: (a) never authenticated, (b) both tokens expired. Distinguish them by checking for the presence of a Supabase auth cookie in the request.
**When to use:** When redirecting unauthenticated requests to `/login`.

```typescript
// Source: pattern derived from @supabase/ssr cookie naming + middleware docs
// middleware.ts — MODIFIED

import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { callbackLimiter, getClientIp } from '@/lib/ratelimit/limiters';

export async function middleware(request: NextRequest) {
  // ... /callback rate-limit block unchanged ...

  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const authPages = ['/login', '/register', '/forgot-password'];
  const isAuthPage = authPages.some((p) => pathname.startsWith(p));
  const isDashboard = pathname.startsWith('/dashboard');

  if (user && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (!user && isDashboard) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);

    // Detect expired session: Supabase stores session in a cookie named
    // sb-<project-ref>-auth-token (or sb-<ref>-auth-token.0 for chunked).
    // If that cookie exists but getUser() returned null, the session expired.
    const hasSupabaseCookie = request.cookies.getAll().some(
      (c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token')
    );
    if (hasSupabaseCookie) {
      loginUrl.searchParams.set('reason', 'session_expired');
    }

    return NextResponse.redirect(loginUrl);
  }

  return response;
}
```

### Pattern 3: Auth Error Enum
**What:** Single source of truth for auth error codes and their user-facing messages in both languages.
**When to use:** Any layer (middleware redirect, API route JSON body, tRPC TRPCError message) that needs to surface an auth condition to the user.

```typescript
// Source: locked decision from CONTEXT.md
// lib/auth/errors.ts — NEW FILE

export enum AuthErrorCode {
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  EMAIL_NOT_CONFIRMED = 'EMAIL_NOT_CONFIRMED',
  UNAUTHORIZED = 'UNAUTHORIZED',
}

export const AUTH_MESSAGES: Record<AuthErrorCode, { en: string; es: string }> = {
  [AuthErrorCode.SESSION_EXPIRED]: {
    en: 'Your session has expired. Please sign in again.',
    es: 'Tu sesion ha expirado. Por favor, inicia sesion de nuevo.',
  },
  [AuthErrorCode.INVALID_CREDENTIALS]: {
    en: 'Incorrect email or password.',
    es: 'Email o contrasena incorrectos.',
  },
  [AuthErrorCode.EMAIL_NOT_CONFIRMED]: {
    en: 'Please verify your email before signing in.',
    es: 'Verifica tu email antes de iniciar sesion.',
  },
  [AuthErrorCode.UNAUTHORIZED]: {
    en: 'You must be signed in to access this.',
    es: 'Debes iniciar sesion para acceder a esto.',
  },
};

/** Returns the Spanish message (primary UI language of this project). */
export function getAuthMessage(code: AuthErrorCode): string {
  return AUTH_MESSAGES[code].es;
}
```

### Pattern 4: Login Page Expiry Message
**What:** Read `?reason=session_expired` from URL, show a `toast.warning()`, dismiss on input focus, clean the URL via `replaceState`.
**When to use:** Login page — same `useSearchParams()` + `useEffect` pattern already used for `error` and `message` params.

```typescript
// Source: existing login/page.tsx pattern + locked decisions from CONTEXT.md
// app/(auth)/login/page.tsx — MODIFIED

const reasonParam = searchParams.get('reason');

useEffect(() => {
  if (reasonParam === 'session_expired') {
    toast.warning(getAuthMessage(AuthErrorCode.SESSION_EXPIRED));
    // Clean the URL without triggering a navigation
    const url = new URL(window.location.href);
    url.searchParams.delete('reason');
    window.history.replaceState({}, '', url.toString());
  }
}, [reasonParam]);

// Dismiss on input focus:
<input
  id="email"
  type="email"
  onFocus={() => toast.dismiss()}
  {...register('email')}
  // ...
/>
```

### Pattern 5: API Route Error Consistency
**What:** API routes currently return `{ error: error.message }` with raw Supabase strings. After Phase 4, they return `{ error: getAuthMessage(AuthErrorCode.INVALID_CREDENTIALS) }` and `{ code: AuthErrorCode.INVALID_CREDENTIALS }` so the client can branch on code, not message text.
**When to use:** `/api/auth/login/route.ts` — the only API route that currently returns auth-layer error messages.

```typescript
// lib/auth/login route — MODIFIED error response
if (error) {
  const code = error.message.includes('Email not confirmed')
    ? AuthErrorCode.EMAIL_NOT_CONFIRMED
    : AuthErrorCode.INVALID_CREDENTIALS;
  return NextResponse.json(
    { error: getAuthMessage(code), code },
    { status: 400 }
  );
}
```

The client (`login/page.tsx`) currently does `json.error?.includes('Email not confirmed')` — this is the only `message.includes()` string match found in the codebase (confirmed by grep). After the API route change, the client branches on `json.code` instead.

### Pattern 6: tRPC UNAUTHORIZED Consistency
**What:** tRPC already throws `TRPCError({ code: 'UNAUTHORIZED' })` in `enforceCreatorAuth`. The client can detect this via `TRPCClientError.data?.code === 'UNAUTHORIZED'` — no message string matching needed. No change required to the tRPC server. The client-facing improvement is ensuring any tRPC error display uses the enum message rather than `error.message` raw.
**When to use:** Any client component that catches a tRPC error and wants to surface a user message.

```typescript
// Source: /trpc/trpc Context7 — TRPCClientError typed error handling
import { TRPCClientError } from '@trpc/client';
import { AuthErrorCode, getAuthMessage } from '@/lib/auth/errors';

if (cause instanceof TRPCClientError && cause.data?.code === 'UNAUTHORIZED') {
  toast.error(getAuthMessage(AuthErrorCode.UNAUTHORIZED));
}
```

### Anti-Patterns to Avoid
- **`message.includes()` string matching:** The one instance in `login/page.tsx` (`json.error?.includes('Email not confirmed')`) must be migrated to `json.code === AuthErrorCode.EMAIL_NOT_CONFIRMED`.
- **Calling `getUser()` twice per request:** The tRPC route handler already calls `getUser()` once. Do not add a second call in middleware for the same request.
- **Concurrent refresh race:** Supabase refresh tokens are single-use. The middleware-first pattern mitigates this for page navigations, but parallel `fetch()` calls from the client may still race. This phase does not need to solve this — it's flagged in Supabase SSR docs as expected behavior.
- **`router.push('/login')` instead of `window.location.href`:** The project already uses `window.location.href` for post-login navigation (Phase 1 decision SEC-07). Expiry redirects happen in middleware (server-side), so this doesn't apply there, but any client-side sign-out should continue using `window.location.href`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Token refresh logic | Custom `refreshToken()` fetch wrapper | `@supabase/ssr` `getUser()` in middleware | Already handles refresh + cookie write atomically; single-use token race conditions handled |
| Toast system | Custom notification component | `sonner` (already installed, `<Toaster>` in root layout) | Consistent with existing `toast.error()` / `toast.success()` calls in login page |
| i18n framework | `next-intl` routing setup | Simple `AUTH_MESSAGES` constant object | `next-intl` is installed but locked decision says "simple constants, not a full i18n framework" |
| Error code detection | `error.message.includes()` | `AuthErrorCode` enum + `json.code` field | String matching breaks on Supabase message changes; enum is stable |

---

## Common Pitfalls

### Pitfall 1: Can't Distinguish "Never Logged In" from "Session Expired"
**What goes wrong:** Both states produce `user: null` from `updateSession()`. Without distinguishing them, every unauthenticated visit to `/dashboard` shows "Your session has expired" — including first-time visitors.
**Why it happens:** `getUser()` returns null for both unauthenticated requests and expired-token requests.
**How to avoid:** Check for presence of a `sb-*-auth-token` cookie in the request before setting `reason=session_expired`. If the cookie exists but `getUser()` returned null, the session is expired. No cookie = never logged in.
**Warning signs:** First-time users seeing "session expired" message on login page.

### Pitfall 2: `replaceState` Called Before Hydration
**What goes wrong:** `window.history.replaceState` called during SSR (server-side render) throws a ReferenceError.
**Why it happens:** `window` is not available in the server component or in early render before hydration.
**How to avoid:** Only call `replaceState` inside a `useEffect` (which only runs client-side). The existing login page already wraps `searchParams` effects in `useEffect` — follow the same pattern.

### Pitfall 3: Supabase Cookie Name Variation
**What goes wrong:** Supabase auth cookie is named `sb-<project-ref>-auth-token`, but for large tokens it chunks into `sb-<ref>-auth-token.0`, `sb-<ref>-auth-token.1`, etc.
**Why it happens:** Browser cookie size limits (4KB). Supabase SSR splits large JWTs.
**How to avoid:** Use `c.name.startsWith('sb-') && (c.name.includes('-auth-token'))` to match both the base name and chunked variants.
**Warning signs:** Expiry not detected on users with large JWT payloads (many custom claims).

### Pitfall 4: `toast.dismiss()` on Focus Clears All Toasts
**What goes wrong:** `toast.dismiss()` with no argument dismisses every active toast, not just the session-expired one.
**Why it happens:** `sonner` `toast.dismiss()` without an ID clears all toasts.
**How to avoid:** Store the toast ID returned by `toast.warning(...)` in a `useRef`. Call `toast.dismiss(toastIdRef.current)` on input focus.

```typescript
const sessionToastId = useRef<string | number | null>(null);

useEffect(() => {
  if (reasonParam === 'session_expired') {
    sessionToastId.current = toast.warning(getAuthMessage(AuthErrorCode.SESSION_EXPIRED));
    // ...replaceState...
  }
}, [reasonParam]);

// In the email input:
onFocus={() => {
  if (sessionToastId.current) {
    toast.dismiss(sessionToastId.current);
    sessionToastId.current = null;
  }
}}
```

### Pitfall 5: `next` Param Carries Through to `replaceState`
**What goes wrong:** After `replaceState` removes `reason`, the `?next=/dashboard` param is also removed, causing loss of the return URL.
**Why it happens:** Naively doing `url.searchParams.delete('reason')` only — but if `replaceState` reconstructs the full URL, `next` is preserved. If using `window.history.replaceState({}, '', '?')` naively, all params are lost.
**How to avoid:** Use `new URL(window.location.href)` → `url.searchParams.delete('reason')` → `replaceState` with `url.toString()`. This preserves all other params including `next`.

---

## Code Examples

### Verified: How `@supabase/ssr` triggers refresh
```typescript
// Source: /supabase/ssr Context7 — design.md
// Cookies are set only on specific onAuthStateChange events:
// TOKEN_REFRESHED (when the access token was expired)
// SESSION_EXPIRED (when the session expired or was terminated → user = null)
//
// The setAll handler in middleware.ts is what writes the refreshed cookies back.
// Current implementation in lib/supabase/middleware.ts is CORRECT and complete.
// No changes needed to updateSession() for SESS-01.
```

### Verified: `TRPCClientError` code-based detection
```typescript
// Source: /trpc/trpc Context7 — TRPCClientError typed error handling
import { TRPCClientError } from '@trpc/client';

if (cause instanceof TRPCClientError) {
  console.log('tRPC error code:', cause.data?.code); // e.g. 'UNAUTHORIZED'
}
```

### Existing string-match to migrate (confirmed by grep)
```typescript
// CURRENT (login/page.tsx line 71) — must migrate
if (json.error?.includes('Email not confirmed')) {

// AFTER Phase 4 — branch on code, not message
if (json.code === AuthErrorCode.EMAIL_NOT_CONFIRMED) {
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `auth.getSession()` in middleware | `auth.getUser()` | Supabase SSR v0.x → current | `getSession()` reads from cookie (unverified); `getUser()` validates with Supabase server and triggers refresh. Current codebase already uses `getUser()` — correct. |
| Manual `refreshSession()` call | Automatic refresh in `getUser()` | Supabase SSR design | No explicit refresh needed; middleware's `getUser()` is the refresh trigger |

---

## Open Questions

1. **Supabase cookie name for this specific project**
   - What we know: Supabase uses `sb-<project-ref>-auth-token` naming. The project ref is in `NEXT_PUBLIC_SUPABASE_URL`.
   - What's unclear: Exact cookie name until we inspect a real browser session or the env var.
   - Recommendation: Use `c.name.startsWith('sb-') && c.name.includes('-auth-token')` to match regardless of project ref. This is safe — no other cookies in this app start with `sb-`.

2. **tRPC client-side UNAUTHORIZED auto-retry**
   - What we know: CONTEXT.md says "if a tRPC call fails due to expired token, middleware refreshes and client retries automatically." tRPC has `retryLink` for this.
   - What's unclear: The CONTEXT.md phrasing suggests this is a goal, but tRPC `retryLink` is not currently installed in the `TRPCProvider`. REQUIREMENTS.md lists `AUTH-V2-01` (silent tRPC 401 retry) as a **v2 requirement**, not v1.
   - Recommendation: SESS-04 ("auth state is consistent across layers") is satisfied by the middleware-first architecture without a retry link. The auto-retry behavior described in CONTEXT.md for mid-action tRPC calls is likely aspirational for v1 — if the middleware refreshes the token, the *next* request (e.g. after page reload or re-navigation) will succeed. Confirm scope with user before adding `retryLink` to the provider.

---

## Sources

### Primary (HIGH confidence)
- `/supabase/ssr` Context7 — `getUser()` trigger for refresh, `setAll` cookie flow, cookie naming, concurrency warning
- `/trpc/trpc` Context7 — `TRPCClientError` typed error handling, `retryLink` API, `TRPCError` codes
- Direct codebase read: `middleware.ts`, `lib/supabase/middleware.ts`, `lib/trpc/provider.tsx`, `app/(auth)/login/page.tsx`, `packages/api/src/trpc.ts`

### Secondary (MEDIUM confidence)
- Supabase SSR README (via Context7): concurrent request race condition behavior
- Supabase SSR design.md (via Context7): `TOKEN_REFRESHED` / `SIGNED_OUT` event triggers

### Tertiary (LOW confidence)
- Cookie name format (`sb-<ref>-auth-token`) — inferred from Supabase open source; not explicitly documented in Context7 snippets retrieved. Recommend verifying against actual browser cookies in dev.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed, versions confirmed from package.json
- Architecture: HIGH — patterns verified against Context7 official docs + direct codebase read
- Pitfalls: HIGH (pitfalls 1-3, 5) / MEDIUM (pitfall 4 toast ID — sonner behavior inferred from API, not explicitly verified)

**Research date:** 2026-03-31
**Valid until:** 2026-04-30 (stable libraries; Supabase SSR cookie naming could change but is unlikely)
