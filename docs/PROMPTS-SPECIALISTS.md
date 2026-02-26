# ITY - Prompts para Especialistas
## Instrucciones de Ejecución Autónoma

Cada prompt está diseñado para ser ejecutado de forma independiente por un desarrollador especialista o un agente de IA. Incluyen todas las dependencias, comandos y contexto necesario.

---

# PROMPT 1: DATABASE DEVELOPER

## Contexto del Proyecto

Estás trabajando en **ITY (I Teach You)**, una plataforma SaaS multi-tenant para creadores de cursos online. La arquitectura usa:

- **Base de datos:** Supabase (PostgreSQL)
- **ORM:** Drizzle ORM
- **Multi-tenant:** Escuelas separadas por `school_id`, estudiantes scoped por escuela

## Tu Rol

Eres el **Database Developer**. Tu responsabilidad es:
1. Configurar el proyecto de Supabase
2. Crear el schema de base de datos con Drizzle ORM
3. Configurar Row Level Security (RLS)
4. Crear seeders para desarrollo
5. Documentar el modelo de datos

## Entregables Exactos

### 1. Package `packages/db`

```
packages/db/
├── src/
│   ├── schema.ts          # Drizzle schema completo
│   ├── relations.ts       # Relaciones entre tablas
│   ├── client.ts          # Cliente de DB
│   ├── types.ts           # Types exportados
│   └── index.ts           # Barrel export
├── drizzle/
│   └── migrations/        # Migraciones generadas
├── scripts/
│   ├── seed.ts            # Seeder de desarrollo
│   └── reset.ts           # Reset DB
├── drizzle.config.ts
├── package.json
└── tsconfig.json
```

### 2. Schema de Base de Datos

Implementar las siguientes tablas (ver ARCHITECTURE.md para detalles):

| Tabla | Descripción |
|-------|-------------|
| `creators` | Usuarios de ITY (creadores de escuelas) |
| `schools` | Escuelas (multi-tenant, un creador puede tener varias) |
| `courses` | Cursos dentro de una escuela |
| `modules` | Módulos de un curso |
| `lessons` | Lecciones de un módulo |
| `students` | Estudiantes (scoped por escuela) |
| `enrollments` | Inscripciones estudiante-curso |
| `live_classes` | Clases en vivo programadas |
| `announcements` | Anuncios de la escuela |
| `payments` | Pagos procesados |
| `domain_verifications` | Verificación de dominios custom |

### 3. Row Level Security (RLS)

Configurar políticas para:
- Creadores solo ven sus propias escuelas
- Estudiantes solo ven datos de su escuela
- Aislamiento completo entre tenants

### 4. Seeder de Desarrollo

Crear datos de prueba:
- 2 creadores
- 3 escuelas (2 del primer creador, 1 del segundo)
- 2 cursos por escuela
- Módulos y lecciones de ejemplo
- 5 estudiantes por escuela
- Enrollments y progreso

## Dependencias (package.json)

```json
{
  "name": "@ity/db",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./schema": "./src/schema.ts",
    "./client": "./src/client.ts"
  },
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "db:seed": "tsx scripts/seed.ts",
    "db:reset": "tsx scripts/reset.ts",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "drizzle-orm": "^0.29.3",
    "postgres": "^3.4.3",
    "@supabase/supabase-js": "^2.39.3"
  },
  "devDependencies": {
    "drizzle-kit": "^0.20.13",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3",
    "@ity/typescript-config": "workspace:*"
  }
}
```

## Variables de Entorno Requeridas

```bash
# Para conectar a Supabase
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres

# Para el cliente de Supabase (si se usa)
SUPABASE_URL=https://[PROJECT-ID].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## Comandos de Ejecución

```bash
# 1. Instalar dependencias (desde root del monorepo)
pnpm install

# 2. Generar migraciones
pnpm --filter @ity/db db:generate

# 3. Aplicar schema a Supabase
pnpm --filter @ity/db db:push

# 4. Ejecutar seeder
pnpm --filter @ity/db db:seed

# 5. Abrir Drizzle Studio (opcional, para visualizar)
pnpm --filter @ity/db db:studio
```

## Configuración Drizzle

```typescript
// packages/db/drizzle.config.ts
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config;
```

## Definition of Done

- [ ] Schema completo implementado en `schema.ts`
- [ ] Todas las relaciones definidas en `relations.ts`
- [ ] Cliente de DB funcionando
- [ ] Migraciones generadas y aplicadas
- [ ] RLS policies configuradas en Supabase
- [ ] Seeder ejecutable con datos de prueba
- [ ] Types exportados correctamente
- [ ] Documentación de cada tabla en comentarios

## Notas Importantes

1. **Multi-tenant:** El `school_id` es crítico. Toda query de estudiantes debe filtrar por `school_id`.

2. **Estudiantes por escuela:** Un mismo email puede existir en diferentes escuelas como estudiantes distintos. El unique constraint es `(school_id, email)`.

3. **JSONB fields:** Los campos `branding`, `content`, `progress`, etc. usan JSONB. Define types exactos en TypeScript.

4. **Soft deletes:** Por ahora NO implementar soft deletes. Si se necesitan, se agregarán después.

5. **Timestamps:** Usar `defaultNow()` para `created_at`. El `updated_at` se manejará con trigger de Supabase.

---

# PROMPT 2: BACKEND DEVELOPER

## Contexto del Proyecto

Estás trabajando en **ITY (I Teach You)**, una plataforma SaaS multi-tenant para creadores de cursos online. La arquitectura usa:

- **Framework:** Next.js 14 con App Router
- **API:** tRPC para type-safety end-to-end
- **Base de datos:** Supabase (PostgreSQL) con Drizzle ORM
- **Autenticación:** Supabase Auth
- **Pagos:** Stripe Connect
- **Video:** Mux (procesamiento) + Daily.co (live)
- **Storage:** Cloudflare R2
- **Email:** Resend

## Tu Rol

Eres el **Backend Developer**. Tu responsabilidad es:
1. Configurar tRPC con todos los routers
2. Implementar autenticación (creadores y estudiantes)
3. Integrar servicios externos (Stripe, Mux, Daily, Resend)
4. Manejar webhooks
5. Implementar uploads a R2

## Entregables Exactos

### 1. Package `packages/api`

```
packages/api/
├── src/
│   ├── root.ts              # Root router
│   ├── trpc.ts              # tRPC setup (context, procedures)
│   ├── routers/
│   │   ├── auth.ts          # Login, register, verify
│   │   ├── schools.ts       # CRUD escuelas, branding, domains
│   │   ├── courses.ts       # CRUD cursos, landing builder
│   │   ├── modules.ts       # CRUD módulos
│   │   ├── lessons.ts       # CRUD lecciones, video upload
│   │   ├── students.ts      # Gestión estudiantes
│   │   ├── enrollments.ts   # Inscripciones, progreso
│   │   ├── live-classes.ts  # Programar, iniciar, Daily.co
│   │   ├── payments.ts      # Stripe checkout, webhooks
│   │   ├── analytics.ts     # Stats del dashboard
│   │   └── uploads.ts       # Presigned URLs para R2
│   └── index.ts
├── package.json
└── tsconfig.json
```

### 2. Endpoints por Router

#### Auth Router
| Procedure | Type | Descripción |
|-----------|------|-------------|
| `register` | mutation | Registro de creador |
| `login` | mutation | Login con email/password |
| `logout` | mutation | Cerrar sesión |
| `verifyEmail` | mutation | Verificar email con token |
| `forgotPassword` | mutation | Enviar email de reset |
| `resetPassword` | mutation | Cambiar password con token |
| `me` | query | Obtener usuario actual |
| `studentLogin` | mutation | Login estudiante (magic link) |
| `studentVerify` | mutation | Verificar magic link |

#### Schools Router
| Procedure | Type | Descripción |
|-----------|------|-------------|
| `list` | query | Listar escuelas del creador |
| `get` | query | Obtener escuela por ID |
| `create` | mutation | Crear nueva escuela |
| `update` | mutation | Actualizar datos básicos |
| `updateBranding` | mutation | Actualizar branding |
| `updateStudentDashboard` | mutation | Config dashboard estudiante |
| `addDomain` | mutation | Agregar dominio custom |
| `verifyDomain` | mutation | Verificar DNS |
| `removeDomain` | mutation | Quitar dominio |
| `connectStripe` | mutation | Iniciar Stripe Connect |
| `stripeStatus` | query | Estado de Stripe Connect |
| `delete` | mutation | Eliminar escuela |

#### Courses Router
| Procedure | Type | Descripción |
|-----------|------|-------------|
| `list` | query | Listar cursos de escuela |
| `get` | query | Obtener curso con módulos |
| `getPublic` | query | Curso público (landing) |
| `create` | mutation | Crear curso |
| `update` | mutation | Actualizar curso |
| `updateBlocks` | mutation | Activar/desactivar bloques |
| `updateLanding` | mutation | Guardar landing page |
| `publish` | mutation | Publicar curso |
| `unpublish` | mutation | Despublicar curso |
| `delete` | mutation | Eliminar curso |
| `duplicate` | mutation | Duplicar curso |

#### Lessons Router
| Procedure | Type | Descripción |
|-----------|------|-------------|
| `list` | query | Lecciones de un módulo |
| `get` | query | Obtener lección |
| `getForStudent` | query | Lección con progreso |
| `create` | mutation | Crear lección |
| `update` | mutation | Actualizar lección |
| `updateContent` | mutation | Actualizar contenido |
| `reorder` | mutation | Reordenar lecciones |
| `delete` | mutation | Eliminar lección |
| `markComplete` | mutation | Marcar como completada (estudiante) |
| `updateProgress` | mutation | Actualizar % visto (video) |

#### Live Classes Router
| Procedure | Type | Descripción |
|-----------|------|-------------|
| `list` | query | Clases de un curso |
| `listUpcoming` | query | Próximas clases (estudiante) |
| `get` | query | Obtener clase |
| `create` | mutation | Programar clase |
| `update` | mutation | Actualizar clase |
| `cancel` | mutation | Cancelar clase |
| `start` | mutation | Iniciar clase (crear room) |
| `end` | mutation | Terminar clase |
| `getJoinToken` | query | Token para unirse (Daily.co) |

#### Payments Router
| Procedure | Type | Descripción |
|-----------|------|-------------|
| `createCheckout` | mutation | Crear Stripe Checkout |
| `getPayments` | query | Historial de pagos |
| `refund` | mutation | Procesar reembolso |

#### Uploads Router
| Procedure | Type | Descripción |
|-----------|------|-------------|
| `getVideoUploadUrl` | mutation | Presigned URL para video |
| `getFileUploadUrl` | mutation | Presigned URL para archivo |
| `getImageUploadUrl` | mutation | Presigned URL para imagen |
| `confirmUpload` | mutation | Confirmar upload completado |

### 3. Webhooks (Next.js API Routes)

```
apps/web/app/api/webhooks/
├── stripe/route.ts       # Stripe webhooks
├── daily/route.ts        # Daily.co webhooks
└── mux/route.ts          # Mux webhooks
```

## Dependencias (package.json)

```json
{
  "name": "@ity/api",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./root": "./src/root.ts"
  },
  "scripts": {
    "type-check": "tsc --noEmit",
    "lint": "eslint src/"
  },
  "dependencies": {
    "@trpc/server": "^11.0.0-next.320",
    "@ity/db": "workspace:*",
    "zod": "^3.22.4",
    "stripe": "^14.14.0",
    "@daily-co/daily-js": "^0.56.0",
    "@mux/mux-node": "^7.3.2",
    "resend": "^3.1.0",
    "@aws-sdk/client-s3": "^3.501.0",
    "@aws-sdk/s3-request-presigner": "^3.501.0",
    "superjson": "^2.2.1"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@ity/typescript-config": "workspace:*"
  },
  "peerDependencies": {
    "@supabase/supabase-js": "^2.39.3"
  }
}
```

## Variables de Entorno Requeridas

```bash
# Supabase
DATABASE_URL=postgresql://...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Daily.co
DAILY_API_KEY=xxx

# Mux
MUX_TOKEN_ID=xxx
MUX_TOKEN_SECRET=xxx

# Cloudflare R2
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=ity-uploads
R2_ENDPOINT=https://xxx.r2.cloudflarestorage.com

# Resend
RESEND_API_KEY=re_xxx
EMAIL_FROM=ITY <noreply@ity.com>

# App
NEXT_PUBLIC_APP_URL=https://ity.com
```

## Comandos de Ejecución

```bash
# 1. Instalar dependencias
pnpm install

# 2. Generar types de DB (si no existen)
pnpm --filter @ity/db db:generate

# 3. Type check
pnpm --filter @ity/api type-check

# 4. Lint
pnpm --filter @ity/api lint
```

## tRPC Setup

```typescript
// packages/api/src/trpc.ts
import { initTRPC, TRPCError } from '@trpc/server';
import { type CreateNextContextOptions } from '@trpc/server/adapters/next';
import superjson from 'superjson';
import { ZodError } from 'zod';
import { db } from '@ity/db/client';
import { createClient } from '@supabase/supabase-js';

export const createTRPCContext = async (opts: CreateNextContextOptions) => {
  const { req, res } = opts;

  // Get auth from Supabase
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get user from header/cookie
  const authHeader = req.headers.authorization;
  let user = null;
  let student = null;
  let school = null;

  if (authHeader) {
    const { data } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    user = data.user;
  }

  // Check for school context (from Cloudflare Worker header)
  const schoolId = req.headers['x-school-id'] as string | undefined;
  if (schoolId) {
    school = await db.query.schools.findFirst({
      where: eq(schools.id, schoolId)
    });
  }

  return {
    db,
    user,
    student,
    school,
    req,
    res,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
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

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const studentProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.student || !ctx.school) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      ...ctx,
      student: ctx.student,
      school: ctx.school,
    },
  });
});
```

## Definition of Done

- [ ] Todos los routers implementados
- [ ] Validación con Zod en todos los inputs
- [ ] Manejo de errores consistente
- [ ] Webhooks funcionando (Stripe, Mux, Daily)
- [ ] Presigned URLs para R2 funcionando
- [ ] Tests básicos para endpoints críticos
- [ ] Types exportados para el frontend

## Notas Importantes

1. **Multi-tenant security:** SIEMPRE verificar que el creador tiene acceso a la escuela antes de cualquier operación.

2. **Student scoping:** Las queries de estudiantes SIEMPRE deben filtrar por `school_id` del contexto.

3. **Stripe Connect:** Usar cuentas Express. El pago va a la cuenta del creador, ITY cobra fee via application_fee.

4. **Daily.co rooms:** Crear rooms on-demand cuando el creador inicia la clase, no al programarla.

5. **Mux:** Subir video a R2 primero, luego enviar URL a Mux para procesamiento.

---

# PROMPT 3: FRONTEND DEVELOPER

## Contexto del Proyecto

Estás trabajando en **ITY (I Teach You)**, una plataforma SaaS multi-tenant para creadores de cursos online. La arquitectura usa:

- **Framework:** Next.js 14 con App Router
- **Styling:** Tailwind CSS + shadcn/ui
- **State:** Zustand + React Query (via tRPC)
- **Forms:** React Hook Form + Zod
- **i18n:** next-intl

## Tu Rol

Eres el **Frontend Developer**. Tu responsabilidad es:
1. Configurar la app de Next.js
2. Implementar el sistema de routing multi-tenant
3. Crear los componentes de UI
4. Integrar con tRPC
5. Implementar i18n

## Entregables Exactos

### 1. App Structure

```
apps/web/
├── app/
│   ├── (marketing)/           # ity.com público
│   │   ├── page.tsx           # Landing
│   │   ├── pricing/
│   │   ├── features/
│   │   └── layout.tsx
│   │
│   ├── (auth)/                # Autenticación
│   │   ├── login/
│   │   ├── register/
│   │   ├── verify/
│   │   ├── forgot-password/
│   │   └── layout.tsx
│   │
│   ├── (dashboard)/           # Creator dashboard
│   │   ├── page.tsx           # Dashboard home
│   │   ├── schools/
│   │   │   ├── page.tsx       # Lista escuelas
│   │   │   ├── new/
│   │   │   └── [schoolId]/
│   │   │       ├── page.tsx   # School overview
│   │   │       ├── settings/
│   │   │       ├── branding/
│   │   │       ├── domain/
│   │   │       ├── courses/
│   │   │       │   ├── page.tsx
│   │   │       │   ├── new/
│   │   │       │   └── [courseId]/
│   │   │       │       ├── page.tsx
│   │   │       │       ├── content/
│   │   │       │       ├── landing/
│   │   │       │       └── settings/
│   │   │       ├── students/
│   │   │       ├── analytics/
│   │   │       └── live/
│   │   ├── settings/
│   │   └── layout.tsx
│   │
│   ├── (school)/              # Student-facing (custom domains)
│   │   ├── page.tsx           # School home / course list
│   │   ├── courses/
│   │   │   └── [courseSlug]/
│   │   │       ├── page.tsx   # Course landing
│   │   │       ├── checkout/
│   │   │       └── learn/
│   │   │           └── [lessonId]/
│   │   ├── live/
│   │   │   └── [classId]/
│   │   ├── student/           # Student dashboard
│   │   │   ├── page.tsx
│   │   │   ├── courses/
│   │   │   └── settings/
│   │   ├── login/
│   │   └── layout.tsx
│   │
│   ├── api/
│   │   ├── trpc/[trpc]/
│   │   └── webhooks/
│   │
│   ├── layout.tsx
│   └── globals.css
│
├── components/
│   ├── ui/                    # shadcn/ui
│   ├── dashboard/             # Creator components
│   ├── school/                # Student components
│   ├── landing-builder/       # Landing page builder
│   ├── video-player/          # Video player
│   └── live-room/             # Live class room
│
├── lib/
│   ├── trpc/
│   ├── supabase/
│   └── utils/
│
├── hooks/
├── stores/
├── locales/
├── middleware.ts
├── next.config.js
├── tailwind.config.ts
└── package.json
```

### 2. Páginas por Sección

#### Marketing (ity.com)
- Landing page con hero, features, pricing, CTA
- Página de pricing con comparación de planes
- Página de features

#### Auth
- Login (email/password)
- Register (wizard de onboarding)
- Verify email
- Forgot/Reset password

#### Dashboard (Creadores)
- Dashboard home (overview de todas las escuelas)
- Lista de escuelas
- Crear escuela (wizard)
- School settings (general, branding, domain)
- Courses CRUD
- Course content editor (módulos, lecciones)
- Landing page builder (drag & drop)
- Students list
- Analytics básico

#### School (Estudiantes)
- School landing / course list
- Course landing (con builder)
- Checkout (Stripe)
- Course viewer (videos, texto, quiz)
- Live room (Daily.co)
- Student dashboard

### 3. Componentes Clave

| Componente | Descripción |
|------------|-------------|
| `DashboardNav` | Navegación lateral del dashboard |
| `SchoolSwitcher` | Dropdown para cambiar de escuela |
| `CourseCard` | Card de curso (creator y student) |
| `ModuleAccordion` | Módulos expandibles con lecciones |
| `LessonEditor` | Editor de lección (video, texto, quiz) |
| `LandingBuilder` | Builder drag & drop de landing |
| `VideoPlayer` | Reproductor con tracking |
| `LiveRoom` | Sala de video en vivo |
| `BrandingPreview` | Preview de branding en tiempo real |
| `DomainSetup` | Wizard de configuración de dominio |
| `CheckoutButton` | Botón que inicia Stripe Checkout |

## Dependencias (package.json)

```json
{
  "name": "@ity/web",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@trpc/client": "^11.0.0-next.320",
    "@trpc/react-query": "^11.0.0-next.320",
    "@trpc/next": "^11.0.0-next.320",
    "@tanstack/react-query": "^5.17.19",
    "@supabase/supabase-js": "^2.39.3",
    "@supabase/ssr": "^0.0.10",
    "zustand": "^4.5.0",
    "react-hook-form": "^7.49.3",
    "@hookform/resolvers": "^3.3.4",
    "zod": "^3.22.4",
    "next-intl": "^3.5.0",
    "tailwindcss": "^3.4.1",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "lucide-react": "^0.314.0",
    "@radix-ui/react-accordion": "^1.1.2",
    "@radix-ui/react-alert-dialog": "^1.0.5",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-popover": "^1.0.7",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "@tiptap/react": "^2.2.2",
    "@tiptap/starter-kit": "^2.2.2",
    "@daily-co/daily-react": "^0.15.0",
    "framer-motion": "^11.0.3",
    "recharts": "^2.12.0",
    "date-fns": "^3.3.1",
    "superjson": "^2.2.1"
  },
  "devDependencies": {
    "@types/node": "^20.11.10",
    "@types/react": "^18.2.48",
    "@types/react-dom": "^18.2.18",
    "typescript": "^5.3.3",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.33",
    "@ity/typescript-config": "workspace:*",
    "@ity/api": "workspace:*",
    "@ity/db": "workspace:*"
  }
}
```

## Variables de Entorno

```bash
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=ITY

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

## Comandos de Ejecución

```bash
# 1. Instalar dependencias
pnpm install

# 2. Inicializar shadcn/ui
pnpm dlx shadcn-ui@latest init

# 3. Agregar componentes shadcn
pnpm dlx shadcn-ui@latest add button card input label dialog dropdown-menu tabs toast accordion alert-dialog popover select

# 4. Ejecutar en desarrollo
pnpm --filter @ity/web dev

# 5. Build
pnpm --filter @ity/web build

# 6. Type check
pnpm --filter @ity/web type-check
```

## Middleware para Multi-Tenant

```typescript
// apps/web/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';

const intlMiddleware = createIntlMiddleware({
  locales: ['en', 'es', 'fr', 'pt'],
  defaultLocale: 'en',
});

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const schoolId = request.headers.get('x-school-id');

  // Main ITY domain
  if (hostname === 'ity.com' || hostname === 'localhost:3000') {
    return intlMiddleware(request);
  }

  // App subdomain (creator dashboard)
  if (hostname.startsWith('app.') || hostname === 'app.localhost:3000') {
    // Verify creator auth
    return intlMiddleware(request);
  }

  // Custom domain (school) - handled by Cloudflare Worker
  if (schoolId) {
    // Set school context for the request
    const response = intlMiddleware(request);
    response.headers.set('x-school-id', schoolId);
    return response;
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
```

## Definition of Done

- [ ] Estructura de carpetas completa
- [ ] Routing multi-tenant funcionando
- [ ] Todos los componentes shadcn instalados
- [ ] tRPC client configurado
- [ ] Auth flow completo (creator)
- [ ] Dashboard básico funcional
- [ ] School pages básicas
- [ ] i18n configurado con archivos EN
- [ ] Responsive en todas las páginas
- [ ] Loading states y error handling

## Notas Importantes

1. **Server Components:** Usar Server Components por defecto. Solo usar 'use client' cuando sea necesario.

2. **Data fetching:** Usar tRPC con React Query. Prefetch en Server Components cuando sea posible.

3. **Forms:** Siempre usar React Hook Form + Zod para validación.

4. **Styling:** Usar Tailwind utility classes. Evitar CSS custom excepto para animaciones complejas.

5. **i18n:** Nunca hardcodear strings. Todo debe ir en los archivos de locales.

6. **Accessibility:** Todos los componentes interactivos deben ser accesibles (keyboard navigation, ARIA).

---

# PROMPT 4: CLOUDFLARE WORKER DEVELOPER

## Contexto del Proyecto

Estás trabajando en **ITY (I Teach You)**. Tu responsabilidad es crear el Cloudflare Worker que maneja el routing de custom domains.

## Tu Rol

El Worker actúa como proxy entre los custom domains de las escuelas y la app de Vercel.

## Entregables Exactos

### 1. Worker Structure

```
apps/worker/
├── src/
│   ├── index.ts           # Main worker
│   ├── domain-router.ts   # Domain → School mapping
│   └── utils/
│       ├── cache.ts
│       └── headers.ts
├── wrangler.toml
├── package.json
└── tsconfig.json
```

### 2. Worker Logic

```typescript
// apps/worker/src/index.ts
export interface Env {
  DOMAIN_MAPPING: KVNamespace;
  VERCEL_URL: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const hostname = url.hostname;

    // Skip main ITY domains (let Vercel handle directly)
    if (hostname === 'ity.com' ||
        hostname === 'www.ity.com' ||
        hostname.endsWith('.ity.com')) {
      return fetch(request);
    }

    // Lookup school for custom domain
    const schoolData = await env.DOMAIN_MAPPING.get(hostname);

    if (!schoolData) {
      return new Response('School not found', {
        status: 404,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    const { schoolId, schoolSlug } = JSON.parse(schoolData);

    // Create proxied request to Vercel
    const vercelUrl = new URL(env.VERCEL_URL + url.pathname + url.search);

    const modifiedHeaders = new Headers(request.headers);
    modifiedHeaders.set('X-School-ID', schoolId);
    modifiedHeaders.set('X-School-Slug', schoolSlug);
    modifiedHeaders.set('X-Original-Host', hostname);
    modifiedHeaders.set('X-Forwarded-Host', hostname);

    const modifiedRequest = new Request(vercelUrl.toString(), {
      method: request.method,
      headers: modifiedHeaders,
      body: request.body,
      redirect: 'manual',
    });

    const response = await fetch(modifiedRequest);

    // Return response with CORS headers if needed
    const modifiedResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });

    return modifiedResponse;
  },
};
```

### 3. wrangler.toml

```toml
name = "ity-domain-router"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[vars]
VERCEL_URL = "https://ity.vercel.app"

[[kv_namespaces]]
binding = "DOMAIN_MAPPING"
id = "xxx"
preview_id = "xxx"
```

## Comandos

```bash
# Desarrollo
wrangler dev

# Deploy
wrangler deploy

# Agregar dominio al KV
wrangler kv:key put --binding=DOMAIN_MAPPING "mariayoga.com" '{"schoolId":"abc123","schoolSlug":"maria-yoga"}'

# Ver dominios
wrangler kv:key list --binding=DOMAIN_MAPPING
```

## Definition of Done

- [ ] Worker desplegado en Cloudflare
- [ ] KV namespace creado
- [ ] Routing funcionando para custom domains
- [ ] Headers correctamente propagados
- [ ] Error handling para dominios no encontrados

---

**Documento generado para ITY v1.0**
**Última actualización:** Enero 2025
