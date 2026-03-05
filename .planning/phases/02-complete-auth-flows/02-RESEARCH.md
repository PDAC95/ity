# Phase 2: Complete Auth Flows - Research

**Researched:** 2026-03-05
**Domain:** Supabase SSR Auth (PKCE flow, email verification, password reset, Google OAuth) with Next.js App Router
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Formularios y páginas**
- Layout: Card centrada minimal — logo arriba, formulario debajo, fondo limpio
- Todas las páginas de auth (login, registro, forgot-password, reset-password) comparten el mismo layout base — solo cambian campos y textos
- Validación mixta: on blur para formato (email válido, password mínimo), on submit para errores del servidor (credenciales incorrectas)
- Botón de Google OAuth arriba, separador "o", luego campos de email/password debajo

**Feedback al usuario**
- Éxitos: Toast con sonner que aparece después del redirect (ej: llegar al dashboard con toast "Sesión iniciada")
- Errores de validación: inline debajo del campo correspondiente
- Errores del servidor: alerta/banner rojo arriba del formulario
- Estado de carga: botón con spinner + texto cambia ("Iniciando sesión...", "Enviando..."), botón deshabilitado durante carga
- Idioma de mensajes: español

**Contenido de emails**
- Usar templates de Supabase (Claude decide nivel de personalización de branding)
- Idioma de emails: español
- Remitente: default de Supabase (se puede cambiar después)
- URL de redirect en emails: desde variable de entorno (NEXT_PUBLIC_SITE_URL o similar) — funciona en dev y prod

**Flujo de redirecciones**
- Post-login: si venía de ruta protegida, vuelve ahí; si fue directo a login, va al dashboard
- Acceso no autenticado a ruta protegida: redirect a /login?next=/ruta-original
- Post-registro (email/password): página dedicada de confirmación — "Revisa tu email para verificar tu cuenta" con opción de reenviar email
- Post-reset de contraseña: redirect a /login con toast de éxito "Contraseña actualizada, inicia sesión"

### Claude's Discretion
- Diseño exacto de la card de auth (spacing, typography, shadows)
- Nivel de personalización de templates de email en Supabase
- Skeleton/loading states durante OAuth redirect
- Manejo exacto del PKCE verifier en el flujo de callback

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | User can log in with Google OAuth and land in dashboard (creator record auto-created if new) | GoogleAuthButton exists, callback route has upsert — needs `next` param propagation and middleware not consuming PKCE verifier |
| AUTH-02 | User can log in with email/password and land in dashboard | LoginForm exists with signInWithPassword — needs `next` param honoring after login |
| AUTH-03 | User can register with email/password and receive verification email from Supabase | RegisterPage exists with signUp + emailRedirectTo — needs env-var-based redirectTo and Spanish copy |
| AUTH-04 | User clicking email verification link lands in dashboard with creator record created via callback | Callback route uses exchangeCodeForSession but must switch to verifyOtp(token_hash) for email type; creator upsert already in callback |
| AUTH-05 | Creator provisioning happens only in server-side callback route (not client-side), using idempotent upsert | Already implemented in callback/route.ts — needs verification that register page removes any client-side provisioning |
| AUTH-06 | User can request password reset email from forgot-password page | ForgotPasswordPage exists — needs env-var-based redirectTo pointing to `/auth/confirm` with token_hash template |
| AUTH-07 | User clicking password reset link lands on reset-password page with valid recovery session | Callback/confirm route must handle token_type=recovery via verifyOtp and redirect to /reset-password |
| AUTH-08 | Reset-password page validates recovery session exists before allowing password change | ResetPasswordPage must check session is a recovery session before rendering form |
| AUTH-09 | After successful password reset, user is redirected to login with success message | ResetPasswordPage onSubmit already redirects to /login?message=password_reset — needs toast instead of query param per CONTEXT.md |
</phase_requirements>

---

## Summary

Phase 2 inherits a nearly-complete auth scaffold from Phase 1. All pages exist (login, register, forgot-password, reset-password, verify-email) with working Supabase client calls. The gaps are precise and architectural, not from-scratch work.

The most critical gap is the **PKCE callback pattern**. The current `/callback/route.ts` uses `exchangeCodeForSession(code)` which works for OAuth but fails for email-based flows (email verification, password reset). Supabase's SSR documentation requires a unified `/auth/confirm` route that uses `verifyOtp({ token_hash, type })` for email flows — this is what Supabase email templates link to. The existing `/callback` route should be kept for OAuth but a new `/auth/confirm` route is needed for email flows.

The second major gap is **middleware not preserving the `next` param** when redirecting unauthenticated users to login. The current middleware does `redirect('/login')` without appending `?next=${pathname}`. The existing `isAllowedRedirect` allowlist from Phase 1 should be reused. Additionally, after email/password login, the login page must honor the `next` search param by redirecting to it instead of always going to `/dashboard`. The middleware matcher must also exclude `/auth/confirm` and `/callback` to avoid consuming PKCE verifiers.

**Primary recommendation:** Add `/auth/confirm` route for email OTP flows (verifyOtp pattern), fix middleware to pass `?next=` on protected redirects, update login form to honor `next` param, and localize all UI copy to Spanish.

---

## Standard Stack

### Core (all already installed — no new dependencies needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/ssr` | `^0.5.0` | SSR-safe Supabase clients | Official Supabase package for Next.js App Router |
| `@supabase/supabase-js` | `^2.45.0` | Supabase client + auth methods | Core auth API (signUp, signInWithPassword, OAuth, etc.) |
| `react-hook-form` | `^7.54.0` | Form state management | Already used in all auth pages |
| `@hookform/resolvers` | `^3.9.0` | Zod integration with RHF | Already used in all auth pages |
| `zod` | `^3.23.0` | Schema validation | Already used in lib/validations/auth.ts |
| `sonner` | `^2.0.7` | Toast notifications | Already installed, Toaster mounted in root layout |
| `lucide-react` | `^0.468.0` | Icons | Already used in auth pages |

### No New Installations Required

All dependencies are present. This phase is pure implementation work on existing scaffold.

---

## Architecture Patterns

### Current Project Structure (Auth-Relevant)

```
ity/apps/web/
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx              # Split-panel layout (branding left, form right) - DO NOT CHANGE
│   │   ├── login/page.tsx          # EXISTS - needs next param + Spanish copy
│   │   ├── register/page.tsx       # EXISTS - needs env redirectTo + Spanish copy
│   │   ├── forgot-password/page.tsx # EXISTS - needs env redirectTo + Spanish copy
│   │   ├── reset-password/page.tsx  # EXISTS - needs session guard + toast redirect
│   │   ├── verify-email/page.tsx    # EXISTS - needs Spanish copy
│   │   └── callback/route.ts       # EXISTS for OAuth - keep as-is
│   └── auth/
│       └── confirm/route.ts        # MISSING - must create for email OTP flows
├── middleware.ts                   # needs: next param preservation, exclude /callback + /auth/confirm
├── lib/
│   ├── auth/
│   │   ├── redirect.ts             # isAllowedRedirect - already used, keep
│   │   └── logger.ts               # logAuthEvent - already used, keep
│   ├── supabase/
│   │   ├── client.ts               # browser client - fine as-is
│   │   ├── server.ts               # server client - fine as-is
│   │   └── middleware.ts           # updateSession - fine as-is
│   └── validations/auth.ts         # all schemas - fine as-is
└── components/auth/
    ├── social-button.tsx           # GoogleAuthButton - needs next param propagation
    └── ...                         # other auth components - fine
```

### Pattern 1: Unified Email Auth Confirm Route (verifyOtp)

**What:** A single GET route at `/auth/confirm` that handles both email verification (type=email) and password reset (type=recovery) by verifying the `token_hash` from the email link, establishing a session server-side, and redirecting to the appropriate next destination.

**When to use:** Whenever a Supabase email link is clicked (email verification after signUp, password reset link). This replaces the old `exchangeCodeForSession(code)` pattern for email flows.

**Why:** Supabase email templates embed `token_hash` (not `code`). The `exchangeCodeForSession` path expects an OAuth authorization code and a PKCE verifier stored in a cookie. For email-based flows, `verifyOtp` is the correct API — it does not require a PKCE verifier in browser storage, so it works when the link is opened in any browser.

```typescript
// app/auth/confirm/route.ts
// Source: https://supabase.com/ui/docs/nextjs/password-based-auth
import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAllowedRedirect } from '@/lib/auth/redirect';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next');

  const safeNext = isAllowedRedirect(next);

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });

    if (!error) {
      if (type === 'email') {
        // Email verification: provision creator and go to dashboard
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('creators').upsert(
            {
              id: user.id,
              email: user.email ?? '',
              name:
                (user.user_metadata?.full_name as string) ??
                user.email?.split('@')[0] ??
                'Creator',
            },
            { onConflict: 'id', ignoreDuplicates: true }
          );
        }
      }
      // For type=recovery, redirect to /reset-password — session is now established
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
```

**Email template URLs to configure in Supabase dashboard:**
- Confirmation URL: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/dashboard`
- Recovery URL: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password`

### Pattern 2: Middleware with `next` Param Preservation

**What:** When middleware redirects an unauthenticated user from a protected route, it appends `?next=<original-path>` to the login URL. The existing `isAllowedRedirect` allowlist already validates these paths.

**When to use:** Every time middleware sends a user to `/login`.

```typescript
// middleware.ts — updated redirect block
if (!user && isDashboard) {
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('next', pathname);
  return NextResponse.redirect(loginUrl);
}
```

**Matcher must exclude `/callback` and `/auth/confirm`** so middleware's `getUser()` does not interfere with the PKCE exchange or OTP verification:

```typescript
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|auth/confirm|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

Note: `/callback` is already excluded by the `api/` pattern (it is `(auth)/callback` not `api/callback`). Actually, looking at the current matcher, `/callback` falls under the `(auth)` group which is NOT excluded. The middleware's `getUser()` call on the callback route is safe because `getUser()` reads an existing session — it does NOT exchange the PKCE code. The `exchangeCodeForSession` call is only in the callback route itself. So the middleware does not consume the PKCE verifier. However, `/auth/confirm` should be excluded from the middleware's redirect logic (or excluded from the matcher) since it is a one-time verification route.

### Pattern 3: Login Page Honoring `next` Param

**What:** After successful email/password login (or Google OAuth), redirect to `next` param if present and valid.

```typescript
// login/page.tsx — in onSubmit after successful signIn
const nextParam = searchParams.get('next');
const safeRedirect = isAllowedRedirect(nextParam);
window.location.href = safeRedirect; // window.location.href required (SEC-07 decision from Phase 1)
```

**For Google OAuth** — the `GoogleAuthButton` must encode the `next` param into the OAuth redirectTo:

```typescript
const nextParam = searchParams.get('next');
const safeNext = isAllowedRedirect(nextParam);

await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/callback?next=${encodeURIComponent(safeNext)}`,
    // ...
  },
});
```

GoogleAuthButton needs to accept and forward the current `next` param. Since it is a child of LoginPage/RegisterPage which reads searchParams, pass `next` as a prop to `GoogleAuthButton`.

### Pattern 4: Recovery Session Guard on Reset-Password Page

**What:** The reset-password page must verify a valid recovery session exists before rendering the password form. A user navigating directly to `/reset-password` without going through the email link must see an error, not an empty form.

**How:** Check the session on mount using `supabase.auth.getSession()` and verify the session has `aal` (Assurance Level) or check for the user. Simpler: use `supabase.auth.getUser()` — if no user is returned, the user has no valid session and should be redirected.

```typescript
// reset-password/page.tsx — add session check on mount
useEffect(() => {
  const checkSession = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace('/login?error=no_recovery_session');
    }
  };
  checkSession();
}, []);
```

Note: This approach works because after clicking the password reset email link and going through `/auth/confirm?type=recovery`, the user has a valid Supabase session. Direct navigation to `/reset-password` without that flow has no session, so `getUser()` returns null.

### Pattern 5: Post-Action Toasts via Search Params

**What:** After redirect (e.g., successful password reset → login), show a toast triggered by a URL search param. This is the pattern already partially implemented — login page reads `?message=password_reset`.

**Update needed:** Per CONTEXT.md, success feedback uses sonner toasts. The existing login page `?message=password_reset` banner should become a toast. The reset-password page should use `window.location.href = '/login?message=password_reset'` (to ensure cookie flush per SEC-07), and the login page reads `?message` on mount and fires `toast.success(...)`.

```typescript
// login/page.tsx — add message param toast
useEffect(() => {
  if (message === 'password_reset') {
    toast.success('Contraseña actualizada. Inicia sesión.');
  }
}, [message]);
```

### Anti-Patterns to Avoid

- **Using `exchangeCodeForSession(code)` for email links:** Works for OAuth PKCE but not for email OTP flows. Email templates use `token_hash`, not OAuth `code`. Use `verifyOtp` for email types.
- **Client-side creator provisioning:** All creator upserts must happen server-side in callback routes (AUTH-05). The register page must NEVER call a tRPC `createCreator` mutation.
- **Using `router.push()` after signIn:** Phase 1 decision SEC-07 — must use `window.location.href` to ensure cookies are flushed before navigation.
- **Hardcoding `window.location.origin` in emailRedirectTo:** Must use `process.env.NEXT_PUBLIC_SITE_URL` so the URL works in both dev and prod. `window.location.origin` gives `http://localhost:8080` in dev, which may not match Supabase's allowed redirect URLs if the env var differs.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Token verification for email links | Custom JWT decode + validate | `supabase.auth.verifyOtp({ token_hash, type })` | Supabase handles token expiry, single-use enforcement, type validation |
| PKCE verifier storage | Custom cookie/localStorage management | `@supabase/ssr` client handles automatically | PKCE verifier stored and retrieved by library |
| OAuth state parameter | Custom state param | Supabase PKCE flow handles it | Library generates and validates state |
| Password strength validation | Custom regex | Already in `lib/validations/auth.ts` Zod schema | Schema already enforced on all forms |
| Session existence check | Decode JWT cookie manually | `supabase.auth.getUser()` | Auth server validates token freshness |

**Key insight:** Supabase's `@supabase/ssr` handles nearly all cryptographic complexity. The phase is about wiring the flows correctly, not building auth primitives.

---

## Common Pitfalls

### Pitfall 1: Wrong Callback URL in Supabase Email Templates

**What goes wrong:** Email links contain `/callback?code=...` instead of `/auth/confirm?token_hash=...`. The code in the email link is an OAuth authorization code, not an OTP token_hash. Calling `verifyOtp` with it fails.

**Why it happens:** Supabase dashboard email templates default to the recovery URL format, and developers forget to update them to the token_hash format.

**How to avoid:** In Supabase Dashboard → Authentication → Email Templates, update both "Confirm signup" and "Reset password" templates to use `{{ .TokenHash }}` in the URL, not the default. Use:
- Confirmation: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/dashboard`
- Recovery: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password`

**Warning signs:** Users report "verification link doesn't work" or `verifyOtp` returns `"Token has expired"` immediately after clicking.

### Pitfall 2: Google OAuth Redirect URI Not Configured

**What goes wrong:** Google OAuth button click results in "redirect_uri_mismatch" error from Google.

**Why it happens:** Google Cloud Console OAuth credentials must allowlist the exact callback URI. Supabase also requires the site URL to be in its redirect URL allowlist.

**How to avoid:** Before testing OAuth:
1. Google Cloud Console → APIs & Services → Credentials → Your OAuth client → Add `https://<your-supabase-project>.supabase.co/auth/v1/callback` to authorized redirect URIs
2. Supabase Dashboard → Authentication → URL Configuration → Add site URL and `http://localhost:8080` to Redirect URLs allowlist

**Warning signs:** Google shows "Error 400: redirect_uri_mismatch". This is a manual configuration step that cannot be done in code.

### Pitfall 3: PKCE Verifier Cross-Browser Failure

**What goes wrong:** User opens email verification link in a different browser than where they signed up → authentication fails with "both auth code and code verifier should be non-empty".

**Why it happens:** PKCE verifier is stored in browser localStorage/cookies of the originating browser session. Opening the link in a different browser has no verifier to match.

**How to avoid:** The `verifyOtp({ token_hash })` approach (Pattern 1) avoids this entirely — it does not require a stored verifier. The `token_hash` in the URL is self-contained. Always use `/auth/confirm` with `verifyOtp` for email flows.

**Warning signs:** Works in same browser, fails when link copied to incognito or different browser.

### Pitfall 4: Middleware Redirecting `/auth/confirm` Before OTP Exchange

**What goes wrong:** If `/auth/confirm` falls under the dashboard protection check, middleware could theoretically interfere. More importantly, `/reset-password` is a protected route in some setups — after OTP verification, the recovery session must be present for the middleware's `getUser()` to succeed.

**Why it happens:** The `/reset-password` route is NOT in the `isDashboard` protection block (it is in `(auth)` group which is unprotected). This is correct. Do not add it to the protected routes.

**How to avoid:** Keep `/reset-password` in the `(auth)` group (unprotected by middleware). The page itself guards via `getUser()` on mount (Pattern 4). The middleware should only protect `/dashboard` routes.

### Pitfall 5: `emailRedirectTo` Using `window.location.origin` Instead of Env Var

**What goes wrong:** In production, `window.location.origin` gives the production domain, but Supabase's allowed redirect URLs may not include it, OR in dev, it gives `http://localhost:8080` which may differ from the configured Supabase site URL.

**Why it happens:** Developers use `window.location.origin` for convenience.

**How to avoid:** Use `process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin` as fallback pattern. Set `NEXT_PUBLIC_SITE_URL=http://localhost:8080` in `.env.local` for dev.

**Warning signs:** "Redirect URL not allowed" error from Supabase after clicking login/register.

### Pitfall 6: Login Page Not Using `window.location.href` for `next` Redirect

**What goes wrong:** Using `router.push(safeNext)` after successful login causes cookie sync issues — the new page renders before cookies are fully flushed, causing the dashboard to see no user.

**Why it happens:** `router.push` does a client-side navigation that does not force a full cookie sync.

**How to avoid:** Always use `window.location.href = safeNext` after signIn. This was locked as SEC-07 in Phase 1.

---

## Code Examples

Verified patterns from official sources and existing codebase:

### Email Confirmation Confirm Route

```typescript
// Source: https://supabase.com/ui/docs/nextjs/password-based-auth
// app/auth/confirm/route.ts
import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAllowedRedirect } from '@/lib/auth/redirect';
import { logAuthEvent } from '@/lib/auth/logger';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next');

  const safeNext = isAllowedRedirect(next);

  if (!token_hash || !type) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash });

  if (error) {
    logAuthEvent('auth_failure', { type: 'otp_verify', error: error.message });
    return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
  }

  if (type === 'email') {
    // Provision creator for email-verified signup
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error: upsertError } = await supabase.from('creators').upsert(
        {
          id: user.id,
          email: user.email ?? '',
          name:
            (user.user_metadata?.full_name as string) ??
            user.email?.split('@')[0] ??
            'Creator',
          email_verified: true,
        },
        { onConflict: 'id', ignoreDuplicates: true }
      );
      if (upsertError) {
        logAuthEvent('creator_provision_error', {
          userId: user.id,
          error: upsertError.message,
        });
      }
    }
  }

  return NextResponse.redirect(`${origin}${safeNext}`);
}
```

### Register Page — env-var-based redirectTo

```typescript
// register/page.tsx — in onSubmit
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;

const { error: authError } = await supabase.auth.signUp({
  email: data.email,
  password: data.password,
  options: {
    data: { full_name: data.name },
    emailRedirectTo: `${siteUrl}/auth/confirm?token_hash=&type=email&next=/dashboard`,
    // Note: Supabase replaces the token_hash template in the email template;
    // the emailRedirectTo sets the base redirect URL that gets the token appended.
    // Actually, for signUp the emailRedirectTo is the base URL sent in the email.
    // Supabase appends the token_hash automatically based on the dashboard template.
  },
});
```

**Important clarification on `emailRedirectTo`:** The `emailRedirectTo` in `signUp()` sets the `redirectTo` for the confirmation email. However, when using Supabase email templates with `{{ .TokenHash }}`, the template itself constructs the full URL. The `emailRedirectTo` is only used if the template uses `{{ .ConfirmationURL }}` (legacy). For the `token_hash` pattern, set the template URL in Supabase Dashboard and use `emailRedirectTo` only as the `next` destination if the template supports it, OR let the dashboard template be the source of truth and ignore `emailRedirectTo` for the token hash URL.

**Simpler approach (recommended):** Configure Supabase email template in the dashboard to point to the correct `/auth/confirm` URL with `{{ .TokenHash }}`. The `emailRedirectTo` in `signUp()` can be used as the `next` param value the template injects if the template uses `{{ .RedirectTo }}`. Check the Supabase dashboard template variables to confirm.

### Middleware — `next` param preservation

```typescript
// middleware.ts
if (!user && isDashboard) {
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('next', pathname);
  return NextResponse.redirect(loginUrl);
}
```

### Login Form — honoring `next` param

```typescript
// login/page.tsx — in onSubmit after successful signIn
const nextParam = searchParams.get('next');
const safeRedirect = isAllowedRedirect(nextParam);
window.location.href = safeRedirect;
```

### Reset Password Page — session guard

```typescript
// reset-password/page.tsx
const [sessionChecked, setSessionChecked] = useState(false);
const [hasSession, setHasSession] = useState(false);

useEffect(() => {
  const checkSession = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setHasSession(!!user);
    setSessionChecked(true);
    if (!user) {
      router.replace('/login?error=session_expired');
    }
  };
  checkSession();
}, []);

if (!sessionChecked) return null; // or spinner
if (!hasSession) return null; // redirecting
```

### Post-Reset Toast on Login Page

```typescript
// login/page.tsx — in useEffect
useEffect(() => {
  if (message === 'password_reset') {
    toast.success('Contraseña actualizada. Inicia sesión.');
  }
}, [message]);
```

### Forgot Password — env-var redirectTo

```typescript
// forgot-password/page.tsx — in onSubmit
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;

const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
  redirectTo: `${siteUrl}/auth/confirm?type=recovery&next=/reset-password`,
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `auth-helpers-nextjs` package | `@supabase/ssr` | 2023-2024 | `auth-helpers` deprecated; project already uses `@supabase/ssr` |
| `exchangeCodeForSession(code)` for email links | `verifyOtp({ token_hash, type })` | ~2024 | Email OTP flows no longer use OAuth code exchange; project callback uses old pattern for email flows |
| Hash-fragment auth tokens (`#access_token=...`) | PKCE code flow with cookies | 2023 | Hash params not accessible server-side; PKCE enables SSR |
| `ConfirmationURL` in email templates | `TokenHash` in email templates | ~2024 | Allows SSR-compatible verification without browser storage dependency |
| `router.push()` after login | `window.location.href` | Phase 1 decision | Ensures full cookie flush (SEC-07) |

**Deprecated/outdated in this project:**
- `exchangeCodeForSession` in `/callback/route.ts` for email link flows: Keep for OAuth code (it IS correct for Google OAuth PKCE), but email verification and password reset must use the new `/auth/confirm` route with `verifyOtp`.

---

## Open Questions

1. **Supabase Email Template Configuration Authority**
   - What we know: Email templates in Supabase Dashboard need to be updated to use `{{ .TokenHash }}` and point to `/auth/confirm`. The `emailRedirectTo` in client code affects what gets passed to `{{ .RedirectTo }}` template variable.
   - What's unclear: Whether configuring the template URL in the dashboard OR using `emailRedirectTo` in `signUp()` is sufficient, or if both are required.
   - Recommendation: Configure dashboard templates AND pass `emailRedirectTo` as a belt-and-suspenders approach. Test in dev with Supabase local or sandbox to confirm the email link format before marking AUTH-03/AUTH-04 done.

2. **Google OAuth Redirect URI — Manual Config Prerequisite**
   - What we know: Flagged in STATE.md as a Phase 2 prerequisite. Google Cloud Console and Supabase Redirect URL allowlist must be configured manually.
   - What's unclear: Whether the dev environment (localhost:8080) is already configured or needs setup.
   - Recommendation: Document exact manual steps in the plan as a Wave 0 task (environment setup) that must complete before OAuth testing can happen.

3. **`/reset-password` and Middleware**
   - What we know: `/reset-password` is in the `(auth)` group, unprotected by middleware. The middleware only protects `/dashboard`. After OTP verification sets a recovery session, the user can access `/reset-password` with a valid session.
   - What's unclear: Whether the middleware's `isAuthPage` check should include `/reset-password` to redirect authenticated (non-recovery) users away.
   - Recommendation: Do NOT add `/reset-password` to `authPages` list (which redirects authenticated users to dashboard). A user with an active creator session could still want to reset their password. Keep it accessible to all; just guard it with a client-side session check.

---

## Sources

### Primary (HIGH confidence)
- `https://supabase.com/ui/docs/nextjs/password-based-auth` — callback route with verifyOtp pattern, token_hash approach
- `https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail` — resetPasswordForEmail API, redirectTo format
- `https://supabase.com/docs/guides/auth/sessions/pkce-flow` — PKCE code validity (5 min, single use), cross-browser constraint
- Existing codebase (C:/dev/12ity/ity/apps/web) — all auth pages, middleware, callback route, validations — read directly

### Secondary (MEDIUM confidence)
- `https://github.com/orgs/supabase/discussions/20922` — PKCE cross-browser failure root cause, token_hash solution
- `https://github.com/orgs/supabase/discussions/28655` — password reset PKCE failure, verifyOtp solution
- `https://supabase.com/docs/guides/auth/server-side/advanced-guide` — PKCE code single-use constraint, cookie-based token storage

### Tertiary (LOW confidence)
- WebSearch results on middleware matcher exclusion patterns — general principle verified against existing matcher config in codebase

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages already installed, verified against package.json
- Architecture: HIGH — existing code read directly, patterns verified against official Supabase docs
- Pitfalls: HIGH — PKCE cross-browser and email template issues verified via official discussions + docs; OAuth prerequisite is a known project blocker from STATE.md
- Email template configuration: MEDIUM — the `emailRedirectTo` vs dashboard template interaction is verified conceptually but exact behavior needs testing

**Research date:** 2026-03-05
**Valid until:** 2026-04-05 (Supabase SSR API is relatively stable; @supabase/ssr 0.5.x is the current version)
