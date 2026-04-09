---
phase: quick-landing-redirect
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  # Filesystem renames (directory)
  - ity/apps/web/app/(dashboard)/a/page.tsx
  - ity/apps/web/app/(dashboard)/a/profile/page.tsx
  - ity/apps/web/app/(dashboard)/a/school-setup/page.tsx
  - ity/apps/web/app/(dashboard)/a/coming-soon/page.tsx
  - ity/apps/web/app/(dashboard)/a/landing/templates/page.tsx
  - ity/apps/web/app/(dashboard)/a/landing/chat/page.tsx
  # Files with path references to update
  - ity/apps/web/middleware.ts
  - ity/apps/web/next.config.js
  - ity/apps/web/lib/auth/redirect.ts
  - ity/apps/web/app/page.tsx
  - ity/apps/web/app/(auth)/register/page.tsx
  - ity/apps/web/components/dashboard/sidebar.tsx
  - ity/apps/web/components/dashboard/header.tsx
  - ity/apps/web/components/dashboard/onboarding-checklist.tsx
  - ity/apps/web/components/dashboard/mobile-nav.tsx
  - ity/apps/web/components/landing/template-preview-modal.tsx
  - ity/apps/web/app/(dashboard)/dashboard-shell.tsx
  - ity/apps/web/app/(dashboard)/a/landing/chat/page.tsx
autonomous: true
requirements: []

must_haves:
  truths:
    - "Landing page (www.ity.com) has login button linking to app.ity.com/login"
    - "Dashboard routes live under /a/* instead of /dashboard/*"
    - "Middleware protects /a/* routes (redirects unauthenticated users to /login)"
    - "Root page (/) redirects to /login"
    - "All sidebar, header, and internal links point to /a/* paths"
  artifacts:
    - path: "ity/apps/web/app/(dashboard)/a/page.tsx"
      provides: "Dashboard home page at /a"
    - path: "ity/apps/web/middleware.ts"
      provides: "Auth guard for /a/* routes"
    - path: "ity/apps/web/lib/auth/redirect.ts"
      provides: "Safe redirect allowlist with /a prefix"
  key_links:
    - from: "ity/apps/web/middleware.ts"
      to: "/a/*"
      via: "pathname.startsWith('/a')"
      pattern: "startsWith.*'/a'"
    - from: "ity/apps/web/components/dashboard/sidebar.tsx"
      to: "/a/*"
      via: "nav links href"
      pattern: "href.*'/a"
---

<objective>
Rename all dashboard routes from `/dashboard/*` to `/a/*` so the app architecture matches the domain plan: www.ity.com = landing/marketing, app.ity.com = application with auth at root and dashboard under /a/*.

Purpose: The static landing page (ity/apps/landing) already links to app.ity.com/login correctly. The web app needs its dashboard path shortened from /dashboard to /a for cleaner URLs and clear separation from the marketing site.

Output: All dashboard pages accessible at /a/* with all internal links, middleware, and redirects updated.
</objective>

<execution_context>
@C:/Users/patri/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/patri/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@ity/apps/web/middleware.ts
@ity/apps/web/lib/auth/redirect.ts
@ity/apps/web/app/page.tsx
@ity/apps/web/components/dashboard/sidebar.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Rename dashboard directory from /dashboard to /a and update all path references</name>
  <files>
    ity/apps/web/app/(dashboard)/a/ (entire directory — moved from dashboard/)
    ity/apps/web/middleware.ts
    ity/apps/web/next.config.js
    ity/apps/web/lib/auth/redirect.ts
    ity/apps/web/app/page.tsx
    ity/apps/web/app/(auth)/register/page.tsx
    ity/apps/web/components/dashboard/sidebar.tsx
    ity/apps/web/components/dashboard/header.tsx
    ity/apps/web/components/dashboard/onboarding-checklist.tsx
    ity/apps/web/components/dashboard/mobile-nav.tsx
    ity/apps/web/components/landing/template-preview-modal.tsx
    ity/apps/web/app/(dashboard)/a/landing/chat/page.tsx
  </files>
  <action>
    1. **Rename the filesystem directory:**
       ```bash
       cd ity/apps/web/app/(dashboard)
       git mv dashboard a
       ```
       This moves the entire route segment from `/dashboard/*` to `/a/*`.

    2. **Update middleware.ts** — Change ALL occurrences:
       - `pathname.startsWith('/dashboard')` -> `pathname.startsWith('/a')`
       - `new URL('/dashboard', request.url)` -> `new URL('/a', request.url)`

    3. **Update next.config.js** — Change CSP source:
       - `'/dashboard/landing/templates'` -> `'/a/landing/templates'`

    4. **Update lib/auth/redirect.ts** — Change:
       - ALLOWED_PREFIXES: `'/dashboard'` -> `'/a'`
       - fallback: `'/dashboard'` -> `'/a'`
       - Also add `'/a'` prefix to the allowlist (keep `/courses`, `/settings`, `/school`, `/reset-password` as-is)

    5. **Update app/page.tsx** — Change:
       - `redirect('/login')` stays as-is (already correct — root goes to login)

    6. **Update app/(auth)/register/page.tsx** — Change:
       - `next=/dashboard` -> `next=/a` in the emailRedirectTo URL

    7. **Update components/dashboard/sidebar.tsx** — Change ALL nav item hrefs:
       - `'/dashboard'` -> `'/a'`
       - `'/dashboard/school-setup'` -> `'/a/school-setup'`
       - `'/dashboard/profile'` -> `'/a/profile'`
       - `'/dashboard/landing/templates'` -> `'/a/landing/templates'`
       - `'/dashboard/coming-soon'` -> `'/a/coming-soon'`
       - Also update the isActive check: `pathname === '/dashboard'` -> `pathname === '/a'`

    8. **Update components/dashboard/header.tsx** — Change ALL pageTitles keys:
       - `'/dashboard'` -> `'/a'`
       - `'/dashboard/school-setup'` -> `'/a/school-setup'`
       - `'/dashboard/profile'` -> `'/a/profile'`
       - `'/dashboard/coming-soon'` -> `'/a/coming-soon'`
       - Also update the profile link href: `'/dashboard/profile'` -> `'/a/profile'`

    9. **Update components/dashboard/onboarding-checklist.tsx** — Change all hrefs:
       - `'/dashboard/school-setup'` -> `'/a/school-setup'`
       - `'/dashboard/profile'` -> `'/a/profile'`

    10. **Update components/landing/template-preview-modal.tsx** — Change:
        - `'/dashboard/landing/chat?templateId=...'` -> `'/a/landing/chat?templateId=...'`

    11. **Update app/(dashboard)/a/landing/chat/page.tsx** — Change redirects:
        - `'/dashboard/landing/templates'` -> `'/a/landing/templates'`
        - `'/dashboard/school-setup'` -> `'/a/school-setup'`

    IMPORTANT: Do NOT change any component import paths that reference `@/components/dashboard/*` or `@/app/(dashboard)/*` — those are filesystem imports using the (dashboard) route group which is NOT changing. Only change URL path strings that appear in hrefs, redirects, and middleware checks.
  </action>
  <verify>
    Run from project root:
    ```bash
    cd ity/apps/web && npx tsc --noEmit
    ```
    TypeScript compiles without errors.

    Then verify no stale /dashboard references remain in URL strings:
    ```bash
    grep -r "'/dashboard" ity/apps/web/app ity/apps/web/components ity/apps/web/lib ity/apps/web/middleware.ts ity/apps/web/next.config.js
    ```
    Should return zero matches (component import paths like `@/components/dashboard/` are fine and expected — only string literals like `'/dashboard'` or `'/dashboard/...'` should be gone).
  </verify>
  <done>
    - All dashboard pages serve at /a/* (not /dashboard/*)
    - Middleware guards /a/* routes
    - All sidebar/header/onboarding links use /a/* paths
    - Redirect allowlist uses /a as fallback
    - No remaining '/dashboard...' URL string literals in app/components/lib code
    - TypeScript compiles cleanly
  </done>
</task>

</tasks>

<verification>
1. `cd ity/apps/web && npx tsc --noEmit` — compiles without errors
2. `grep -rn "'/dashboard" ity/apps/web/app ity/apps/web/components ity/apps/web/lib ity/apps/web/middleware.ts` — zero matches for URL path strings
3. `ls ity/apps/web/app/\(dashboard\)/a/page.tsx` — directory was renamed successfully
4. `ls ity/apps/web/app/\(dashboard\)/dashboard/` — old directory no longer exists
</verification>

<success_criteria>
- Dashboard accessible at /a, /a/profile, /a/school-setup, /a/landing/templates, /a/landing/chat
- /dashboard/* routes no longer exist
- Unauthenticated users hitting /a/* get redirected to /login
- Authenticated users on /login get redirected to /a
- All internal navigation (sidebar, header, onboarding) uses /a/* paths
- Landing page login button still points to app.ity.com/login (unchanged, already correct)
</success_criteria>

<output>
After completion, create `.planning/quick/1-landing-page-con-login-redirect-a-app-au/1-SUMMARY.md`
</output>
