# ITY - Sprint 2: Auth & Creator Dashboard
## Execution Guide

**Sprint Duration:** Week 3-4
**Velocity Target:** 12 points
**Goal:** Flujo completo de autenticacion de creadores y layout del dashboard

---

## OVERVIEW

Este sprint implementa la experiencia completa de autenticacion y el dashboard del creador:
- Registro con validacion y verificacion de email
- Login con manejo de sesion
- Forgot/Reset password
- Dashboard layout con sidebar, header y navegacion
- Creacion del registro `creators` en la base de datos al registrar

### Pre-requisitos (Sprint 1 - Completado)
- Monorepo con Turborepo configurado
- Supabase Auth configurado
- Base de datos con schema pusheado
- tRPC y Next.js funcionando
- CI/CD con GitHub Actions

---

## SPRINT BOARD

| Status | ID | Story | Points | Order |
|--------|-----|-------|--------|-------|
| ⬜ | US-006 | Creator Registration | 3 | 1 |
| ⬜ | US-007 | Creator Email Verification | 2 | 2 |
| ⬜ | US-008 | Creator Login | 2 | 3 |
| ⬜ | US-009 | Password Reset Flow | 2 | 4 |
| ⬜ | US-010 | Creator Dashboard Layout | 3 | 5 |
| **Total** | | | **12** | |

---

## USER STORIES DETAIL

---

### US-006: Creator Registration
**Points:** 3 | **Priority:** P0 | **Dependencies:** US-003, US-004, US-005

#### Objective
Permitir a nuevos creadores registrarse en ITY con email, password y nombre. Al registrarse, se crea el usuario en Supabase Auth y se inserta el registro correspondiente en la tabla `creators`.

#### Acceptance Criteria
```gherkin
GIVEN I'm on the registration page
WHEN I enter valid email, password, and name
THEN my account is created and I receive a verification email
AND I'm redirected to verify email page

GIVEN I enter an invalid email or weak password
WHEN I submit the form
THEN I see inline validation errors

GIVEN I enter an email that already exists
WHEN I submit the form
THEN I see "Email already in use" error
```

#### Validation Rules
- **Email:** valid format, unique
- **Password:** min 8 chars, 1 uppercase, 1 number
- **Name:** min 2 chars, max 255 chars

#### Technical Tasks

##### 1. Crear esquema de validacion Zod
```typescript
// apps/web/lib/validations/auth.ts
import { z } from 'zod';

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(255, 'Name is too long'),
  email: z
    .string()
    .email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});
```

##### 2. Refactorizar pagina de registro
Reemplazar el `/register` actual (basico) con React Hook Form + Zod:

**Archivo:** `apps/web/app/(auth)/register/page.tsx`

- Usar `useForm` de React Hook Form con `zodResolver`
- Mostrar errores inline por campo
- Al submit:
  1. Llamar `supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })`
  2. En paralelo, crear registro en tabla `creators` via tRPC (`auth.createCreator`)
  3. Redirigir a `/verify-email`
- Manejar error de email duplicado

##### 3. Agregar mutation `auth.createCreator` en tRPC
```typescript
// packages/api/src/routers/auth.ts - agregar al router existente

createCreator: publicProcedure
  .input(
    z.object({
      id: z.string().uuid(),
      email: z.string().email(),
      name: z.string().min(2),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const existing = await ctx.db.query.creators.findFirst({
      where: eq(creators.email, input.email),
    });

    if (existing) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Email already in use',
      });
    }

    const [creator] = await ctx.db
      .insert(creators)
      .values({
        id: input.id,
        email: input.email,
        name: input.name,
      })
      .returning();

    return creator;
  }),
```

##### 4. Crear pagina de verificacion pending
**Archivo:** `apps/web/app/(auth)/verify-email/page.tsx`

- Mostrar mensaje "Check your email"
- Mostrar email al que se envio
- Boton "Resend verification email"
- Link a login

##### 5. Configurar Supabase Auth Email Templates
En Supabase Dashboard > Authentication > Email Templates:
- Personalizar "Confirm signup" template con branding ITY
- URL de confirmacion: `{SITE_URL}/callback?next=/dashboard`

#### Definition of Done
- [ ] Formulario de registro con validacion inline
- [ ] Creator se crea en Supabase Auth y en tabla `creators`
- [ ] Email de verificacion se envia
- [ ] Errores se muestran correctamente
- [ ] Pagina verify-email muestra mensaje correcto

---

### US-007: Creator Email Verification
**Points:** 2 | **Priority:** P0 | **Dependencies:** US-006

#### Objective
Manejar el callback de verificacion de email de Supabase y actualizar el estado del creator en la base de datos.

#### Acceptance Criteria
```gherkin
GIVEN I received a verification email
WHEN I click the verification link
THEN my email is marked as verified
AND I'm redirected to the dashboard

GIVEN the verification link has expired
WHEN I click it
THEN I see an error message with option to resend
```

#### Technical Tasks

##### 1. Actualizar callback route existente
**Archivo:** `apps/web/app/(auth)/callback/route.ts`

El callback actual ya existe. Agregar logica para:
- Despues de `exchangeCodeForSession`, verificar el tipo de callback
- Si es verificacion de email, actualizar `creators.emailVerified = true`
- Redirigir a `/dashboard` si es verificacion exitosa

```typescript
// Actualizar apps/web/app/(auth)/callback/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';
  const type = searchParams.get('type'); // 'signup', 'recovery', 'email_change'

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Si es verificacion de signup, actualizar emailVerified
      if (type === 'signup') {
        // Llamar API interna para marcar email como verificado
        // O hacerlo directamente con el service role client
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=verification_failed`);
}
```

##### 2. Crear pagina de error de verificacion
**Archivo:** `apps/web/app/(auth)/verify-error/page.tsx`

- Mostrar mensaje de error
- Boton "Resend verification email"
- Link a login

#### Definition of Done
- [ ] Click en link de verificacion marca email como verificado
- [ ] Redireccion correcta al dashboard
- [ ] Links expirados muestran error con opcion de reenvio

---

### US-008: Creator Login
**Points:** 2 | **Priority:** P0 | **Dependencies:** US-006

#### Objective
Permitir a creadores verificados iniciar sesion con email y password.

#### Acceptance Criteria
```gherkin
GIVEN I have a verified account
WHEN I enter correct email and password
THEN I'm logged in and redirected to dashboard

GIVEN I enter incorrect credentials
WHEN I submit the form
THEN I see "Invalid email or password" error

GIVEN my email is not verified
WHEN I try to login
THEN I see "Please verify your email" message
```

#### Technical Tasks

##### 1. Refactorizar pagina de login
**Archivo:** `apps/web/app/(auth)/login/page.tsx`

Reemplazar el login actual con React Hook Form + Zod:
- Usar `loginSchema` de validaciones
- Al submit: `supabase.auth.signInWithPassword({ email, password })`
- Manejar errores: credenciales invalidas, email no verificado
- Link a `/forgot-password`
- Link a `/register`

##### 2. Crear layout de auth
**Archivo:** `apps/web/app/(auth)/layout.tsx`

- Layout compartido para login, register, verify-email, forgot-password
- Centrado vertical y horizontal
- Logo ITY en la parte superior
- Fondo gris claro

```typescript
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            ITY
          </h1>
        </div>
        {children}
      </div>
    </div>
  );
}
```

##### 3. Agregar middleware de redireccion
Actualizar `apps/web/middleware.ts` para:
- Si usuario autenticado visita `/login` o `/register`, redirigir a `/dashboard`
- Si usuario no autenticado visita `/dashboard/*`, redirigir a `/login`

```typescript
// Actualizar middleware.ts
export async function middleware(request: NextRequest) {
  const response = await updateSession(request);
  const supabase = createServerClient(/* ... */);
  const { data: { user } } = await supabase.auth.getUser();

  const isAuthPage = request.nextUrl.pathname.startsWith('/login') ||
                     request.nextUrl.pathname.startsWith('/register');
  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard');

  if (user && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (!user && isDashboard) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return response;
}
```

#### Definition of Done
- [ ] Login funciona con credenciales validas
- [ ] Errores se muestran correctamente
- [ ] Redireccion a dashboard despues de login
- [ ] Middleware redirige usuarios autenticados/no autenticados

---

### US-009: Password Reset Flow
**Points:** 2 | **Priority:** P1 | **Dependencies:** US-006

#### Objective
Permitir a creadores recuperar su password via email.

#### Acceptance Criteria
```gherkin
GIVEN I'm on the forgot password page
WHEN I enter my email
THEN I receive a password reset email
AND I see a confirmation message

GIVEN I click the reset link in the email
WHEN I enter a new valid password
THEN my password is updated
AND I'm redirected to login
```

#### Technical Tasks

##### 1. Crear pagina forgot-password
**Archivo:** `apps/web/app/(auth)/forgot-password/page.tsx`

- Formulario con campo de email
- Al submit: `supabase.auth.resetPasswordForEmail(email, { redirectTo: '{origin}/reset-password' })`
- Mostrar mensaje de exito "Check your email"
- Link a login

##### 2. Crear pagina reset-password
**Archivo:** `apps/web/app/(auth)/reset-password/page.tsx`

- Formulario con password y confirm password
- Validacion con `resetPasswordSchema`
- Al submit: `supabase.auth.updateUser({ password })`
- Redirigir a `/login` con mensaje de exito

##### 3. Actualizar callback para recovery
El callback en `/callback/route.ts` ya maneja el `code`. Para password reset:
- Supabase envia al usuario a `/reset-password` con los tokens en la URL
- La pagina reset-password usa `supabase.auth.exchangeCodeForSession(code)` primero
- Luego permite cambiar el password

##### 4. Configurar template de email en Supabase
En Supabase Dashboard > Authentication > Email Templates:
- Personalizar "Reset password" template
- URL de reset: `{SITE_URL}/reset-password`

#### Definition of Done
- [ ] Formulario de forgot-password envia email
- [ ] Email de reset llega correctamente
- [ ] Pagina reset-password permite cambiar contraseña
- [ ] Validacion de password fuerte
- [ ] Redireccion a login despues de reset

---

### US-010: Creator Dashboard Layout
**Points:** 3 | **Priority:** P0 | **Dependencies:** US-008

#### Objective
Crear el layout principal del dashboard del creador con sidebar, header y navegacion responsive.

#### Acceptance Criteria
```gherkin
GIVEN I'm logged in
WHEN I access the dashboard
THEN I see a sidebar with navigation links
AND I see a header with my profile info
AND I can switch between sections

GIVEN I'm on a mobile device
WHEN I open the menu
THEN I see a mobile-friendly navigation
```

#### Technical Tasks

##### 1. Crear componentes de UI base
Antes de crear el layout, agregar componentes basicos al package `@ity/ui`:

**Archivos en `packages/ui/src/`:**

```typescript
// packages/ui/src/button.tsx
// Componente Button con variantes usando class-variance-authority

// packages/ui/src/input.tsx
// Componente Input con label, error, y estados

// packages/ui/src/avatar.tsx
// Componente Avatar con fallback de iniciales

// packages/ui/src/dropdown-menu.tsx
// Componente DropdownMenu basico

// packages/ui/src/sheet.tsx
// Componente Sheet (drawer) para mobile nav
```

##### 2. Crear dashboard layout
**Archivo:** `apps/web/app/(dashboard)/layout.tsx`

```typescript
// Layout del dashboard con:
// - Sidebar (desktop): 256px fixed left
// - Header: 64px fixed top
// - Main content: scroll area
// - Mobile: sidebar hidden, hamburger menu

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

##### 3. Crear componente Sidebar
**Archivo:** `apps/web/components/dashboard/sidebar.tsx`

```
Sidebar Navigation Items:
- Dashboard (Home icon) -> /dashboard
- Schools (Building icon) -> /dashboard/schools
- Separator
- Settings (Gear icon) -> /dashboard/settings
- Help (Question icon) -> /dashboard/help
```

- 256px de ancho
- Fixed left
- Logo ITY arriba
- Navigation links con iconos (lucide-react)
- Active state basado en pathname
- Responsive: hidden en mobile

##### 4. Crear componente Header
**Archivo:** `apps/web/components/dashboard/header.tsx`

```
Header:
- Left: Mobile menu button (hamburger) + Page title
- Right: User avatar dropdown
  - Profile
  - Settings
  - Separator
  - Sign out
```

- 64px de alto
- Fixed top
- Avatar con dropdown menu
- Sign out button

##### 5. Crear mobile navigation
**Archivo:** `apps/web/components/dashboard/mobile-nav.tsx`

- Sheet/Drawer component que se abre con hamburger
- Mismos items que sidebar
- Se cierra al seleccionar item

##### 6. Actualizar dashboard page
**Archivo:** `apps/web/app/(dashboard)/dashboard/page.tsx`

Actualizar la pagina existente para usar el nuevo layout:
- Mostrar saludo "Welcome, {name}"
- Cards de acceso rapido: "Create School", "View Schools"
- Stats placeholder (0 schools, 0 students, 0 courses)

#### Definition of Done
- [ ] Layout con sidebar y header funcional
- [ ] Navegacion entre secciones
- [ ] Responsive en mobile
- [ ] User menu con sign out
- [ ] Dashboard muestra saludo y cards de accion rapida

---

## EXECUTION ORDER

```
US-006 (Registration)
  │
  ├── US-007 (Email Verification)
  │
  ├── US-008 (Login)
  │     │
  │     └── US-010 (Dashboard Layout)
  │
  └── US-009 (Password Reset)
```

**Orden recomendado de implementacion:**

1. **US-006** - Registro (refactorizar el existente, agregar validacion, crear mutation)
2. **US-008** - Login (refactorizar el existente, agregar validacion, middleware)
3. **US-007** - Verificacion de email (actualizar callback, crear paginas)
4. **US-009** - Password reset (crear paginas, configurar emails)
5. **US-010** - Dashboard layout (sidebar, header, navegacion)

---

## TECHNICAL NOTES

### Estructura de archivos final del Sprint

```
apps/web/
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx                  # Auth layout compartido
│   │   ├── login/page.tsx              # Refactorizado con RHF + Zod
│   │   ├── register/page.tsx           # Refactorizado con RHF + Zod
│   │   ├── verify-email/page.tsx       # Nuevo
│   │   ├── verify-error/page.tsx       # Nuevo
│   │   ├── forgot-password/page.tsx    # Nuevo
│   │   ├── reset-password/page.tsx     # Nuevo
│   │   └── callback/route.ts          # Actualizado
│   ├── (dashboard)/
│   │   ├── layout.tsx                  # Dashboard layout con sidebar
│   │   └── dashboard/page.tsx          # Actualizado
│   └── api/
│       └── auth/signout/route.ts       # Existente
├── components/
│   └── dashboard/
│       ├── sidebar.tsx                 # Nuevo
│       ├── header.tsx                  # Nuevo
│       └── mobile-nav.tsx              # Nuevo
├── lib/
│   ├── validations/
│   │   └── auth.ts                     # Nuevo - schemas Zod
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   └── trpc/
│       ├── client.ts
│       ├── provider.tsx
│       └── server.ts
└── middleware.ts                        # Actualizado con auth redirects

packages/api/src/
└── routers/
    └── auth.ts                          # Actualizado con createCreator

packages/ui/src/
├── button.tsx                           # Nuevo
├── input.tsx                            # Nuevo
├── avatar.tsx                           # Nuevo
└── index.ts                             # Actualizado
```

### Dependencias a agregar

```bash
# En apps/web (ya instaladas la mayoria)
# Verificar que react-hook-form, @hookform/resolvers, zod esten correctos
pnpm --filter @ity/web add react-hook-form @hookform/resolvers zod
```

### Configuracion de Supabase Auth

En Supabase Dashboard > Authentication > URL Configuration:
- **Site URL:** `http://localhost:3000` (local) / URL de Vercel (staging/prod)
- **Redirect URLs:**
  - `http://localhost:3000/callback`
  - `http://localhost:3001/callback`
  - `https://*.vercel.app/callback`

En Supabase Dashboard > Authentication > Email Templates:
- **Confirm signup:** personalizar con branding ITY, URL: `{{ .SiteURL }}/callback?code={{ .ConfirmationToken }}&type=signup`
- **Reset password:** personalizar, URL: `{{ .SiteURL }}/reset-password?code={{ .ConfirmationToken }}&type=recovery`

### Testing manual

1. **Registro:** Ir a `/register`, crear cuenta, verificar que llega email
2. **Verificacion:** Click en link del email, verificar redireccion a dashboard
3. **Login:** Ir a `/login`, ingresar credenciales, verificar dashboard
4. **Password Reset:** Click "Forgot password", ingresar email, verificar email, cambiar password
5. **Dashboard:** Verificar sidebar, header, navegacion, sign out
6. **Mobile:** Verificar responsive, hamburger menu

---

## NOTES

- Las paginas de login y register actuales son funcionales pero basicas. Este sprint las refactoriza con validacion completa y mejor UX.
- El middleware de auth redirect evita que usuarios autenticados vean paginas de login.
- Los componentes de UI (`button`, `input`, `avatar`) se crean en `@ity/ui` para reutilizarse en toda la app.
- Sprint 3 (School Management) depende del dashboard layout de este sprint.
