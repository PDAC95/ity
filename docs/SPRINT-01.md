# ITY - Sprint 1: Foundation
## Execution Guide

**Sprint Duration:** Week 1-2
**Velocity Target:** 23 points
**Goal:** Establecer la infraestructura base del proyecto

---

## OVERVIEW

Este sprint establece los cimientos técnicos de ITY:
- Monorepo configurado con Turborepo
- Pipeline CI/CD con GitHub Actions
- 3 ambientes (local, staging, production)
- Base de datos completa en Supabase
- Autenticación de creadores
- Setup de Next.js y tRPC

---

## SPRINT BOARD

| Status | ID | Story | Points | Order |
|--------|-----|-------|--------|-------|
| ⬜ | US-001 | Monorepo Setup | 3 | 1 |
| ⬜ | US-001b | CI/CD Pipeline Setup | 3 | 2 |
| ⬜ | US-001c | Environment Configuration | 5 | 3 |
| ⬜ | US-002 | Database Schema Setup | 5 | 4 |
| ⬜ | US-003 | Supabase Auth Configuration | 2 | 5 |
| ⬜ | US-004 | Next.js App Base Setup | 3 | 6 |
| ⬜ | US-005 | tRPC Base Setup | 2 | 7 |
| **Total** | | | **23** | |

---

## USER STORIES DETAIL

---

### US-001: Monorepo Setup
**Points:** 3 | **Priority:** P0 | **Dependencies:** None

#### Objective
Configurar un monorepo con Turborepo y pnpm workspaces que contenga todas las aplicaciones y paquetes compartidos de ITY.

#### Acceptance Criteria
```gherkin
GIVEN a fresh clone of the repo
WHEN I run `pnpm install && pnpm dev`
THEN all apps start without errors
```

#### Technical Tasks

##### 1. Inicializar Proyecto
```bash
# Crear directorio y inicializar
mkdir ity && cd ity
pnpm init

# Instalar Turborepo
pnpm add -D turbo

# Crear estructura de workspaces
mkdir -p apps/web apps/worker packages/{db,api,ui,config,typescript-config}
```

##### 2. Configurar pnpm-workspace.yaml
```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

##### 3. Configurar turbo.json
```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "type-check": {
      "dependsOn": ["^type-check"]
    },
    "test": {
      "dependsOn": ["^test"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "clean": {
      "cache": false
    }
  }
}
```

##### 4. Configurar package.json raíz
```json
{
  "name": "ity",
  "private": true,
  "scripts": {
    "build": "turbo build",
    "dev": "turbo dev",
    "lint": "turbo lint",
    "type-check": "turbo type-check",
    "test": "turbo test",
    "clean": "turbo clean && rm -rf node_modules",
    "format": "prettier --write \"**/*.{ts,tsx,md,json}\"",
    "db:push": "pnpm --filter @ity/db db:push",
    "db:generate": "pnpm --filter @ity/db db:generate",
    "db:seed": "pnpm --filter @ity/db db:seed"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "prettier": "^3.2.0"
  },
  "packageManager": "pnpm@8.15.0",
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=8.0.0"
  }
}
```

##### 5. Crear packages/typescript-config
```json
// packages/typescript-config/package.json
{
  "name": "@ity/typescript-config",
  "version": "0.0.0",
  "private": true,
  "license": "MIT",
  "files": ["*.json"]
}
```

```json
// packages/typescript-config/base.json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "Default",
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true,
    "declaration": true,
    "declarationMap": true,
    "incremental": true
  },
  "exclude": ["node_modules"]
}
```

```json
// packages/typescript-config/nextjs.json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "Next.js",
  "extends": "./base.json",
  "compilerOptions": {
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "plugins": [{ "name": "next" }],
    "allowJs": true
  }
}
```

##### 6. Crear packages/config
```json
// packages/config/package.json
{
  "name": "@ity/config",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@ity/typescript-config": "workspace:*",
    "typescript": "^5.3.0"
  }
}
```

```typescript
// packages/config/src/index.ts
export * from './env';
export * from './constants';
export * from './blocks';
```

```typescript
// packages/config/src/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_APP_ENV: z.enum(['local', 'staging', 'production']).default('local'),

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  DATABASE_URL: z.string().min(1),

  // Stripe
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_'),

  // Cloudflare
  R2_BUCKET_NAME: z.string().min(1).optional(),
  R2_PUBLIC_URL: z.string().url().optional(),
  CLOUDFLARE_API_TOKEN: z.string().min(1).optional(),

  // Feature Flags
  ENABLE_DEBUG: z.coerce.boolean().default(false),
  ENABLE_MOCK_PAYMENTS: z.coerce.boolean().default(false),
});

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);
```

```typescript
// packages/config/src/constants.ts
export const APP_NAME = 'ITY';
export const APP_DESCRIPTION = 'I Teach You - The simplest way to create your online school';

export const SUPPORTED_LOCALES = ['en', 'es', 'fr', 'pt'] as const;
export const DEFAULT_LOCALE = 'en';

export const PLANS = {
  FREE: 'free',
  STARTER: 'starter',
  PRO: 'pro',
  ENTERPRISE: 'enterprise',
} as const;

export const LESSON_TYPES = {
  VIDEO: 'video',
  TEXT: 'text',
  QUIZ: 'quiz',
  DOWNLOAD: 'download',
} as const;

export const LIVE_CLASS_STATUS = {
  SCHEDULED: 'scheduled',
  LIVE: 'live',
  ENDED: 'ended',
  CANCELLED: 'cancelled',
} as const;
```

```typescript
// packages/config/src/blocks.ts
export const AVAILABLE_BLOCKS = {
  videos: {
    id: 'videos',
    name: 'Video Lessons',
    description: 'Pre-recorded video content',
    icon: 'play-circle',
    default: true,
  },
  live: {
    id: 'live',
    name: 'Live Classes',
    description: 'Real-time video sessions with students',
    icon: 'video',
    default: true,
  },
  quizzes: {
    id: 'quizzes',
    name: 'Quizzes',
    description: 'Test student knowledge with assessments',
    icon: 'check-square',
    default: true,
  },
  downloads: {
    id: 'downloads',
    name: 'Downloads',
    description: 'Downloadable files and resources',
    icon: 'download',
    default: true,
  },
  announcements: {
    id: 'announcements',
    name: 'Announcements',
    description: 'Send updates to enrolled students',
    icon: 'megaphone',
    default: true,
  },
  progress: {
    id: 'progress',
    name: 'Progress Tracking',
    description: 'Track student completion and engagement',
    icon: 'bar-chart',
    default: true,
  },
} as const;

export type BlockId = keyof typeof AVAILABLE_BLOCKS;
```

##### 7. Crear packages/db (estructura básica)
```json
// packages/db/package.json
{
  "name": "@ity/db",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "db:push": "drizzle-kit push",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio",
    "db:seed": "tsx src/seed.ts",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "drizzle-orm": "^0.29.0",
    "postgres": "^3.4.0",
    "@ity/config": "workspace:*"
  },
  "devDependencies": {
    "@ity/typescript-config": "workspace:*",
    "drizzle-kit": "^0.20.0",
    "tsx": "^4.7.0",
    "typescript": "^5.3.0"
  }
}
```

##### 8. Crear packages/api (estructura básica)
```json
// packages/api/package.json
{
  "name": "@ity/api",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@trpc/server": "^11.0.0-rc.0",
    "@ity/db": "workspace:*",
    "@ity/config": "workspace:*",
    "zod": "^3.22.0",
    "superjson": "^2.2.0"
  },
  "devDependencies": {
    "@ity/typescript-config": "workspace:*",
    "typescript": "^5.3.0"
  }
}
```

##### 9. Crear packages/ui (estructura básica)
```json
// packages/ui/package.json
{
  "name": "@ity/ui",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0"
  },
  "devDependencies": {
    "@ity/typescript-config": "workspace:*",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.3.0"
  },
  "peerDependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}
```

##### 10. Configurar ESLint y Prettier
```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

```
// .gitignore
# Dependencies
node_modules
.pnpm-store

# Build outputs
.next
.turbo
dist
.vercel

# Environment variables
.env
.env.*
!.env.example

# IDE
.idea
.vscode/*
!.vscode/extensions.json

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
pnpm-debug.log*

# Testing
coverage

# Misc
*.tsbuildinfo
```

##### 11. Crear .env.example
```bash
# .env.example
# ================================================
# ITY Environment Variables
# Copy this file to .env.local and fill in values
# ================================================

# App Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_ENV=local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres

# Stripe (Test Mode)
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx

# Cloudflare R2
R2_BUCKET_NAME=ity-dev-uploads
R2_PUBLIC_URL=http://localhost:9000/ity-dev-uploads
CLOUDFLARE_API_TOKEN=xxx

# Feature Flags
ENABLE_DEBUG=true
ENABLE_MOCK_PAYMENTS=true

# Turbo Remote Cache (Optional)
TURBO_TOKEN=
TURBO_TEAM=
```

#### Definition of Done
- [ ] `pnpm install` completes without errors
- [ ] `pnpm dev` starts (even if apps are empty)
- [ ] `pnpm build` completes for all packages
- [ ] `pnpm type-check` passes
- [ ] All package.json files have correct workspace references
- [ ] Git repository initialized with .gitignore
- [ ] README.md exists with basic setup instructions

---

### US-001b: CI/CD Pipeline Setup
**Points:** 3 | **Priority:** P0 | **Dependencies:** US-001

#### Objective
Configurar GitHub Actions para CI/CD automatizado con deployments a staging y production.

#### Acceptance Criteria
```gherkin
GIVEN a PR is opened
WHEN code is pushed
THEN tests run automatically and preview deployment is created
AND merging to develop deploys to staging
AND merging to main deploys to production
```

#### Technical Tasks

##### 1. Crear GitHub Repository
```bash
# Initialize git (if not already)
git init
git add .
git commit -m "Initial monorepo setup"

# Create repo on GitHub and push
gh repo create ity --private --source=. --push
```

##### 2. Configurar Branch Protection Rules
En GitHub Settings > Branches:

**main branch:**
- Require pull request before merging
- Require status checks to pass (quality, build)
- Require branches to be up to date
- Include administrators

**develop branch:**
- Require pull request before merging
- Require status checks to pass (quality)

##### 3. Crear CI Workflow
```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ vars.TURBO_TEAM }}

jobs:
  # ==========================================
  # QUALITY CHECKS (All branches)
  # ==========================================
  quality:
    name: Quality Checks
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 2

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Type check
        run: pnpm type-check

      - name: Lint
        run: pnpm lint

      - name: Unit tests
        run: pnpm test

  # ==========================================
  # BUILD (All branches)
  # ==========================================
  build:
    name: Build
    needs: quality
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm build
        env:
          NEXT_PUBLIC_APP_URL: https://staging.ity.com
          NEXT_PUBLIC_APP_ENV: staging
          NEXT_PUBLIC_SUPABASE_URL: ${{ vars.NEXT_PUBLIC_SUPABASE_URL_STAGING }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY_STAGING }}
          NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: ${{ vars.STRIPE_PUBLISHABLE_KEY_STAGING }}

  # ==========================================
  # DEPLOY STAGING (develop branch only)
  # ==========================================
  deploy-staging:
    name: Deploy to Staging
    needs: build
    if: github.ref == 'refs/heads/develop' && github.event_name == 'push'
    runs-on: ubuntu-latest
    environment:
      name: staging
      url: https://staging.ity.com
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Deploy to Vercel (Staging)
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          alias-domains: staging.ity.com

      - name: Deploy Cloudflare Worker (Staging)
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          workingDirectory: 'apps/worker'
          command: deploy --env staging

      - name: Run DB Migrations (Staging)
        run: pnpm --filter @ity/db db:push
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL_STAGING }}

  # ==========================================
  # DEPLOY PRODUCTION (main branch only)
  # ==========================================
  deploy-production:
    name: Deploy to Production
    needs: build
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://ity.com
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Deploy to Vercel (Production)
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

      - name: Deploy Cloudflare Worker (Production)
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          workingDirectory: 'apps/worker'
          command: deploy --env production

      - name: Run DB Migrations (Production)
        run: pnpm --filter @ity/db db:push
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL_PRODUCTION }}
```

##### 4. Crear PR Preview Workflow
```yaml
# .github/workflows/preview.yml
name: Preview Deployment

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  preview:
    name: Deploy Preview
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Deploy Preview to Vercel
        uses: amondnet/vercel-action@v25
        id: vercel-preview
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

      - name: Comment PR with Preview URL
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## Preview Deployment

              | Status | URL |
              |--------|-----|
              | ✅ Ready | ${{ steps.vercel-preview.outputs.preview-url }} |

              **Commit:** \`${{ github.sha }}\`
              `
            })
```

#### Definition of Done
- [ ] GitHub repository created with correct branch structure
- [ ] Branch protection rules configured
- [ ] CI workflow runs on PR and push
- [ ] Quality checks (type-check, lint, test) pass
- [ ] Build completes successfully
- [ ] Preview deployments work for PRs
- [ ] Staging deployment triggers on develop merge
- [ ] Production deployment triggers on main merge

---

### US-001c: Environment Configuration
**Points:** 5 | **Priority:** P0 | **Dependencies:** US-001, US-001b

#### Objective
Configurar los 3 ambientes (local, staging, production) con sus respectivos servicios y variables de entorno.

#### Acceptance Criteria
```gherkin
GIVEN the three environments
WHEN I deploy to each
THEN each uses its own database, storage, and API keys
```

#### Technical Tasks

##### 1. Crear Proyectos Supabase

**Staging Project:**
1. Ir a [supabase.com](https://supabase.com)
2. Create New Project: `ity-staging`
3. Region: US East (closest to Vercel)
4. Guardar credenciales:
   - Project URL
   - Anon Key
   - Service Role Key
   - Database URL

**Production Project:**
1. Create New Project: `ity-prod`
2. Misma región que staging
3. Guardar todas las credenciales

##### 2. Configurar Cloudflare

**Crear recursos para Staging:**
```bash
# R2 Bucket
wrangler r2 bucket create ity-staging-uploads

# KV Namespace
wrangler kv:namespace create "DOMAIN_MAPPING" --preview
# Guardar el ID del namespace

# Crear worker staging (se configura después)
```

**Crear recursos para Production:**
```bash
# R2 Bucket
wrangler r2 bucket create ity-prod-uploads

# KV Namespace
wrangler kv:namespace create "DOMAIN_MAPPING"
# Guardar el ID del namespace
```

##### 3. Configurar Cloudflare Worker
```toml
# apps/worker/wrangler.toml
name = "ity-domain-router"
main = "src/index.ts"
compatibility_date = "2024-01-01"

# ==========================================
# LOCAL DEVELOPMENT (default)
# ==========================================
[vars]
VERCEL_URL = "http://localhost:3000"

# ==========================================
# STAGING ENVIRONMENT
# ==========================================
[env.staging]
name = "ity-domain-router-staging"
vars = { VERCEL_URL = "https://staging.ity.com" }

[[env.staging.kv_namespaces]]
binding = "DOMAIN_MAPPING"
id = "your-staging-kv-id"

[[env.staging.r2_buckets]]
binding = "UPLOADS"
bucket_name = "ity-staging-uploads"

# ==========================================
# PRODUCTION ENVIRONMENT
# ==========================================
[env.production]
name = "ity-domain-router"
vars = { VERCEL_URL = "https://ity.com" }
routes = [
  { pattern = "*", zone_name = "ity.com" }
]

[[env.production.kv_namespaces]]
binding = "DOMAIN_MAPPING"
id = "your-production-kv-id"

[[env.production.r2_buckets]]
binding = "UPLOADS"
bucket_name = "ity-prod-uploads"
```

##### 4. Crear Worker Base
```typescript
// apps/worker/src/index.ts
export interface Env {
  DOMAIN_MAPPING: KVNamespace;
  UPLOADS: R2Bucket;
  VERCEL_URL: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const hostname = url.hostname;

    // Skip for main ITY domains
    if (hostname === 'ity.com' || hostname.endsWith('.ity.com')) {
      return fetch(request);
    }

    // Lookup custom domain
    const schoolId = await env.DOMAIN_MAPPING.get(hostname);

    if (!schoolId) {
      return new Response('School not found', { status: 404 });
    }

    // Forward to Vercel with school context
    const newUrl = new URL(url.pathname + url.search, env.VERCEL_URL);
    const newRequest = new Request(newUrl, {
      method: request.method,
      headers: new Headers(request.headers),
      body: request.body,
    });

    newRequest.headers.set('X-School-ID', schoolId);
    newRequest.headers.set('X-School-Domain', hostname);

    return fetch(newRequest);
  },
};
```

```json
// apps/worker/package.json
{
  "name": "@ity/worker",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "deploy:staging": "wrangler deploy --env staging",
    "deploy:production": "wrangler deploy --env production",
    "type-check": "tsc --noEmit"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20240117.0",
    "wrangler": "^3.24.0",
    "typescript": "^5.3.0"
  }
}
```

##### 5. Configurar Vercel Project

1. Ir a [vercel.com](https://vercel.com)
2. Import Git Repository: `ity`
3. Framework Preset: Next.js
4. Root Directory: `apps/web`
5. Build Command: `cd ../.. && pnpm build --filter=@ity/web`
6. Install Command: `cd ../.. && pnpm install`

**Configurar Environment Variables en Vercel:**

| Variable | Development | Preview | Production |
|----------|-------------|---------|------------|
| `NEXT_PUBLIC_APP_ENV` | local | staging | production |
| `NEXT_PUBLIC_APP_URL` | - | staging.ity.com | ity.com |
| `NEXT_PUBLIC_SUPABASE_URL` | - | (staging URL) | (prod URL) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | - | (staging key) | (prod key) |
| `SUPABASE_SERVICE_ROLE_KEY` | - | (staging key) | (prod key) |
| `DATABASE_URL` | - | (staging DB) | (prod DB) |
| `STRIPE_SECRET_KEY` | - | sk_test_xxx | sk_live_xxx |
| `STRIPE_WEBHOOK_SECRET` | - | whsec_staging | whsec_prod |

##### 6. Configurar GitHub Environments

En GitHub Settings > Environments:

**staging:**
- Protection rules: None (auto-deploy)
- Secrets:
  - `DATABASE_URL_STAGING`
  - `SUPABASE_ANON_KEY_STAGING`
  - `SUPABASE_SERVICE_ROLE_KEY_STAGING`
  - `VERCEL_TOKEN`
  - `VERCEL_ORG_ID`
  - `VERCEL_PROJECT_ID`
  - `CLOUDFLARE_API_TOKEN`

**production:**
- Protection rules: Required reviewers (1)
- Secrets: (same as staging but with production values)
  - `DATABASE_URL_PRODUCTION`
  - `SUPABASE_ANON_KEY_PRODUCTION`
  - `SUPABASE_SERVICE_ROLE_KEY_PRODUCTION`

##### 7. Crear vercel.json
```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "cd ../.. && pnpm build --filter=@ity/web",
  "installCommand": "cd ../.. && pnpm install",
  "outputDirectory": ".next",
  "regions": ["iad1"],
  "git": {
    "deploymentEnabled": {
      "main": true,
      "develop": true
    }
  }
}
```

##### 8. Documentar Setup Local
```markdown
// README.md
# ITY - I Teach You

## Local Development Setup

### Prerequisites
- Node.js 20+
- pnpm 8+
- Docker (for local Supabase)

### Getting Started

1. **Clone repository**
   ```bash
   git clone https://github.com/your-org/ity.git
   cd ity
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Copy environment template**
   ```bash
   cp .env.example .env.local
   ```

4. **Start Supabase locally**
   ```bash
   pnpm supabase start
   ```
   This will output local credentials - copy them to .env.local

5. **Push database schema**
   ```bash
   pnpm db:push
   ```

6. **Seed development data (optional)**
   ```bash
   pnpm db:seed
   ```

7. **Start development server**
   ```bash
   pnpm dev
   ```

App running at http://localhost:3000

### Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Build all apps and packages |
| `pnpm lint` | Run ESLint on all packages |
| `pnpm type-check` | Run TypeScript type checking |
| `pnpm test` | Run all tests |
| `pnpm db:push` | Push schema changes to database |
| `pnpm db:studio` | Open Drizzle Studio |

### Project Structure

```
ity/
├── apps/
│   ├── web/          # Next.js application
│   └── worker/       # Cloudflare Worker
├── packages/
│   ├── api/          # tRPC routers
│   ├── db/           # Database schema (Drizzle)
│   ├── ui/           # Shared UI components
│   └── config/       # Shared configuration
└── docs/             # Documentation
```
```

#### Definition of Done
- [ ] Supabase projects created (staging + production)
- [ ] Cloudflare R2 buckets created
- [ ] Cloudflare KV namespaces created
- [ ] Cloudflare Worker configured with environments
- [ ] Vercel project configured
- [ ] GitHub Environments configured with secrets
- [ ] All environment variables documented
- [ ] README with local setup instructions
- [ ] `pnpm dev` works locally

---

### US-002: Database Schema Setup
**Points:** 5 | **Priority:** P0 | **Dependencies:** US-001

#### Objective
Implementar el schema completo de la base de datos usando Drizzle ORM.

#### Acceptance Criteria
```gherkin
GIVEN the Drizzle schema
WHEN I run `pnpm db:push`
THEN all tables are created in Supabase with correct relations
```

#### Technical Tasks

##### 1. Configurar Drizzle
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
} satisfies Config;
```

##### 2. Crear Schema Completo
```typescript
// packages/db/src/schema.ts
import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  jsonb,
  decimal,
  integer,
  unique,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================
// CREATORS (ITY platform users)
// ============================================
export const creators = pgTable('creators', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  language: varchar('language', { length: 5 }).default('en'),
  emailVerified: boolean('email_verified').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const creatorsRelations = relations(creators, ({ many }) => ({
  schools: many(schools),
}));

// ============================================
// SCHOOLS
// ============================================
export const schools = pgTable('schools', {
  id: uuid('id').primaryKey().defaultRandom(),
  creatorId: uuid('creator_id').references(() => creators.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).unique().notNull(),
  description: text('description'),
  customDomain: varchar('custom_domain', { length: 255 }).unique(),
  domainVerified: boolean('domain_verified').default(false),
  branding: jsonb('branding').$type<{
    logo?: string;
    primaryColor: string;
    secondaryColor: string;
    font: 'inter' | 'merriweather' | 'space-mono';
    favicon?: string;
  }>().default({
    primaryColor: '#6366F1',
    secondaryColor: '#F59E0B',
    font: 'inter',
  }),
  studentDashboardConfig: jsonb('student_dashboard_config').$type<{
    sections: Array<{
      id: string;
      type: 'announcements' | 'progress' | 'live-classes' | 'activity';
      visible: boolean;
      order: number;
    }>;
    showProgressPercentage: boolean;
    showNextLesson: boolean;
  }>(),
  stripeAccountId: varchar('stripe_account_id', { length: 255 }),
  stripeOnboarded: boolean('stripe_onboarded').default(false),
  subscriptionPlan: varchar('subscription_plan', { length: 50 }).default('free'),
  language: varchar('language', { length: 5 }).default('en'),
  timezone: varchar('timezone', { length: 50 }).default('America/New_York'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  creatorIdx: index('schools_creator_idx').on(table.creatorId),
  domainIdx: index('schools_domain_idx').on(table.customDomain),
}));

export const schoolsRelations = relations(schools, ({ one, many }) => ({
  creator: one(creators, {
    fields: [schools.creatorId],
    references: [creators.id],
  }),
  courses: many(courses),
  students: many(students),
  announcements: many(announcements),
}));

// ============================================
// COURSES
// ============================================
export const courses = pgTable('courses', {
  id: uuid('id').primaryKey().defaultRandom(),
  schoolId: uuid('school_id').references(() => schools.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull(),
  description: text('description'),
  shortDescription: varchar('short_description', { length: 500 }),
  thumbnailUrl: varchar('thumbnail_url', { length: 500 }),
  price: decimal('price', { precision: 10, scale: 2 }).default('0'),
  currency: varchar('currency', { length: 3 }).default('USD'),
  isPublished: boolean('is_published').default(false),
  activeBlocks: jsonb('active_blocks').$type<string[]>().default([
    'videos', 'live', 'quizzes', 'downloads', 'announcements', 'progress',
  ]),
  landingPageData: jsonb('landing_page_data').$type<{
    sections: Array<{
      id: string;
      type: 'hero' | 'about' | 'curriculum' | 'testimonials' | 'faq' | 'cta';
      order: number;
      content: Record<string, unknown>;
    }>;
  }>(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  schoolIdx: index('courses_school_idx').on(table.schoolId),
  slugIdx: index('courses_slug_idx').on(table.schoolId, table.slug),
  unique: unique('courses_school_slug_unique').on(table.schoolId, table.slug),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  school: one(schools, {
    fields: [courses.schoolId],
    references: [schools.id],
  }),
  modules: many(modules),
  enrollments: many(enrollments),
  liveClasses: many(liveClasses),
}));

// ============================================
// MODULES
// ============================================
export const modules = pgTable('modules', {
  id: uuid('id').primaryKey().defaultRandom(),
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  order: integer('order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  courseIdx: index('modules_course_idx').on(table.courseId),
  orderIdx: index('modules_order_idx').on(table.courseId, table.order),
}));

export const modulesRelations = relations(modules, ({ one, many }) => ({
  course: one(courses, {
    fields: [modules.courseId],
    references: [courses.id],
  }),
  lessons: many(lessons),
}));

// ============================================
// LESSONS
// ============================================
export const lessons = pgTable('lessons', {
  id: uuid('id').primaryKey().defaultRandom(),
  moduleId: uuid('module_id').references(() => modules.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }).notNull(), // video, text, quiz, download
  content: jsonb('content').$type<{
    // For video
    muxAssetId?: string;
    muxPlaybackId?: string;
    duration?: number;
    // For text
    html?: string;
    // For quiz
    questions?: Array<{
      id: string;
      type: 'multiple-choice' | 'true-false' | 'open-ended';
      question: string;
      options?: string[];
      correctAnswer: string | number;
      points: number;
    }>;
    timeLimit?: number;
    // For download
    files?: Array<{
      id: string;
      name: string;
      url: string;
      size: number;
      mimeType: string;
    }>;
  }>(),
  order: integer('order').notNull().default(0),
  isFreePreview: boolean('is_free_preview').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  moduleIdx: index('lessons_module_idx').on(table.moduleId),
  orderIdx: index('lessons_order_idx').on(table.moduleId, table.order),
}));

export const lessonsRelations = relations(lessons, ({ one }) => ({
  module: one(modules, {
    fields: [lessons.moduleId],
    references: [modules.id],
  }),
}));

// ============================================
// STUDENTS (scoped per school)
// ============================================
export const students = pgTable('students', {
  id: uuid('id').primaryKey().defaultRandom(),
  schoolId: uuid('school_id').references(() => schools.id, { onDelete: 'cascade' }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  schoolIdx: index('students_school_idx').on(table.schoolId),
  emailIdx: index('students_email_idx').on(table.schoolId, table.email),
  unique: unique('students_school_email_unique').on(table.schoolId, table.email),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  school: one(schools, {
    fields: [students.schoolId],
    references: [schools.id],
  }),
  enrollments: many(enrollments),
  payments: many(payments),
}));

// ============================================
// ENROLLMENTS
// ============================================
export const enrollments = pgTable('enrollments', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id').references(() => students.id, { onDelete: 'cascade' }).notNull(),
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'cascade' }).notNull(),
  progress: jsonb('progress').$type<{
    completedLessons: string[];
    lastLessonId?: string;
    lastAccessedAt?: string;
    quizScores?: Record<string, number>;
  }>().default({ completedLessons: [] }),
  completedAt: timestamp('completed_at'),
  enrolledAt: timestamp('enrolled_at').defaultNow(),
}, (table) => ({
  studentIdx: index('enrollments_student_idx').on(table.studentId),
  courseIdx: index('enrollments_course_idx').on(table.courseId),
  unique: unique('enrollments_student_course_unique').on(table.studentId, table.courseId),
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  student: one(students, {
    fields: [enrollments.studentId],
    references: [students.id],
  }),
  course: one(courses, {
    fields: [enrollments.courseId],
    references: [courses.id],
  }),
}));

// ============================================
// PAYMENTS
// ============================================
export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  schoolId: uuid('school_id').references(() => schools.id, { onDelete: 'cascade' }).notNull(),
  studentId: uuid('student_id').references(() => students.id, { onDelete: 'set null' }),
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'set null' }),
  stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }).unique(),
  stripeCheckoutSessionId: varchar('stripe_checkout_session_id', { length: 255 }).unique(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('USD'),
  status: varchar('status', { length: 50 }).notNull(), // pending, completed, failed, refunded
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  schoolIdx: index('payments_school_idx').on(table.schoolId),
  studentIdx: index('payments_student_idx').on(table.studentId),
  statusIdx: index('payments_status_idx').on(table.status),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  school: one(schools, {
    fields: [payments.schoolId],
    references: [schools.id],
  }),
  student: one(students, {
    fields: [payments.studentId],
    references: [students.id],
  }),
  course: one(courses, {
    fields: [payments.courseId],
    references: [courses.id],
  }),
}));

// ============================================
// LIVE CLASSES
// ============================================
export const liveClasses = pgTable('live_classes', {
  id: uuid('id').primaryKey().defaultRandom(),
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  scheduledAt: timestamp('scheduled_at').notNull(),
  duration: integer('duration').notNull().default(60), // minutes
  roomUrl: varchar('room_url', { length: 500 }),
  recordingUrl: varchar('recording_url', { length: 500 }),
  status: varchar('status', { length: 50 }).default('scheduled'), // scheduled, live, ended, cancelled
  attendees: jsonb('attendees').$type<string[]>().default([]),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  courseIdx: index('live_classes_course_idx').on(table.courseId),
  scheduledIdx: index('live_classes_scheduled_idx').on(table.scheduledAt),
  statusIdx: index('live_classes_status_idx').on(table.status),
}));

export const liveClassesRelations = relations(liveClasses, ({ one }) => ({
  course: one(courses, {
    fields: [liveClasses.courseId],
    references: [courses.id],
  }),
}));

// ============================================
// ANNOUNCEMENTS
// ============================================
export const announcements = pgTable('announcements', {
  id: uuid('id').primaryKey().defaultRandom(),
  schoolId: uuid('school_id').references(() => schools.id, { onDelete: 'cascade' }).notNull(),
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  isPublished: boolean('is_published').default(false),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  schoolIdx: index('announcements_school_idx').on(table.schoolId),
  courseIdx: index('announcements_course_idx').on(table.courseId),
  publishedIdx: index('announcements_published_idx').on(table.isPublished),
}));

export const announcementsRelations = relations(announcements, ({ one }) => ({
  school: one(schools, {
    fields: [announcements.schoolId],
    references: [schools.id],
  }),
  course: one(courses, {
    fields: [announcements.courseId],
    references: [courses.id],
  }),
}));

// ============================================
// DOMAIN VERIFICATIONS
// ============================================
export const domainVerifications = pgTable('domain_verifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  schoolId: uuid('school_id').references(() => schools.id, { onDelete: 'cascade' }).notNull(),
  domain: varchar('domain', { length: 255 }).unique().notNull(),
  verificationToken: varchar('verification_token', { length: 255 }).notNull(),
  verifiedAt: timestamp('verified_at'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  schoolIdx: index('domain_verifications_school_idx').on(table.schoolId),
}));

export const domainVerificationsRelations = relations(domainVerifications, ({ one }) => ({
  school: one(schools, {
    fields: [domainVerifications.schoolId],
    references: [schools.id],
  }),
}));
```

##### 3. Crear Cliente DB
```typescript
// packages/db/src/client.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

const client = postgres(connectionString);
export const db = drizzle(client, { schema });

export type DB = typeof db;
```

##### 4. Crear Index de Exports
```typescript
// packages/db/src/index.ts
export * from './schema';
export * from './client';
```

##### 5. Crear Seed Script
```typescript
// packages/db/src/seed.ts
import { db } from './client';
import { creators, schools, courses, modules, lessons } from './schema';

async function seed() {
  console.log('🌱 Seeding database...');

  // Create test creator
  const [creator] = await db.insert(creators).values({
    email: 'dev@jappi.ca',
    name: 'Dev User',
    emailVerified: true,
  }).returning();

  console.log('Created creator:', creator.email);

  // Create test school
  const [school] = await db.insert(schools).values({
    creatorId: creator.id,
    name: 'Test School',
    slug: 'test-school',
  }).returning();

  console.log('Created school:', school.name);

  // Create test course
  const [course] = await db.insert(courses).values({
    schoolId: school.id,
    title: 'Getting Started',
    slug: 'getting-started',
    description: 'A sample course to get you started',
    isPublished: true,
  }).returning();

  console.log('Created course:', course.title);

  // Create module
  const [module] = await db.insert(modules).values({
    courseId: course.id,
    title: 'Introduction',
    order: 0,
  }).returning();

  // Create lessons
  await db.insert(lessons).values([
    {
      moduleId: module.id,
      title: 'Welcome',
      type: 'text',
      content: { html: '<p>Welcome to the course!</p>' },
      order: 0,
      isFreePreview: true,
    },
    {
      moduleId: module.id,
      title: 'Getting Started',
      type: 'video',
      content: {},
      order: 1,
    },
  ]);

  console.log('✅ Seed completed!');
  process.exit(0);
}

seed().catch((e) => {
  console.error('❌ Seed failed:', e);
  process.exit(1);
});
```

#### Definition of Done
- [ ] All tables defined in Drizzle schema
- [ ] All relations configured correctly
- [ ] Indexes created for common queries
- [ ] `pnpm db:push` executes without errors
- [ ] `pnpm db:seed` creates test data
- [ ] Schema matches ARCHITECTURE.md ERD
- [ ] Types exported correctly for use in other packages

---

### US-003: Supabase Auth Configuration
**Points:** 2 | **Priority:** P0 | **Dependencies:** US-002

#### Objective
Configurar Supabase Auth para autenticación de creadores con email/password.

#### Acceptance Criteria
```gherkin
GIVEN a new user
WHEN they register with email/password
THEN an account is created and verification email sent
```

#### Technical Tasks

##### 1. Configurar Supabase Auth Settings

En Supabase Dashboard > Authentication > Settings:

**Email Settings:**
- Enable email confirmations: ON
- Enable email change confirmations: ON
- Secure email change: ON

**Password Settings:**
- Min password length: 8
- Require special character: OFF
- Require number: ON
- Require uppercase: ON

##### 2. Configurar Email Templates

En Authentication > Email Templates:

**Confirm signup:**
```html
<h2>Confirm your ITY Account</h2>
<p>Hi,</p>
<p>Thanks for signing up! Please confirm your email by clicking the button below:</p>
<p>
  <a href="{{ .ConfirmationURL }}" style="background-color: #6366F1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
    Confirm Email
  </a>
</p>
<p>Or copy this link: {{ .ConfirmationURL }}</p>
<p>This link expires in 24 hours.</p>
```

**Reset password:**
```html
<h2>Reset your ITY Password</h2>
<p>Hi,</p>
<p>We received a request to reset your password. Click the button below:</p>
<p>
  <a href="{{ .ConfirmationURL }}" style="background-color: #6366F1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
    Reset Password
  </a>
</p>
<p>If you didn't request this, you can safely ignore this email.</p>
```

##### 3. Crear Database Trigger para Creator

En SQL Editor, ejecutar:

```sql
-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.creators (id, email, name, email_verified)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN true ELSE false END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to handle email verification
CREATE OR REPLACE FUNCTION public.handle_user_email_verified()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    UPDATE public.creators
    SET email_verified = true
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for email verification
CREATE OR REPLACE TRIGGER on_auth_user_verified
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL)
  EXECUTE FUNCTION public.handle_user_email_verified();
```

##### 4. Configurar RLS Policies

```sql
-- Enable RLS on all tables
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Creators policies
CREATE POLICY "Users can view own creator profile" ON creators
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own creator profile" ON creators
  FOR UPDATE USING (auth.uid() = id);

-- Schools policies
CREATE POLICY "Creators can view own schools" ON schools
  FOR SELECT USING (creator_id = auth.uid());

CREATE POLICY "Creators can insert schools" ON schools
  FOR INSERT WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Creators can update own schools" ON schools
  FOR UPDATE USING (creator_id = auth.uid());

CREATE POLICY "Creators can delete own schools" ON schools
  FOR DELETE USING (creator_id = auth.uid());

-- Courses policies
CREATE POLICY "Creators can manage own courses" ON courses
  FOR ALL USING (
    school_id IN (SELECT id FROM schools WHERE creator_id = auth.uid())
  );

CREATE POLICY "Public can view published courses" ON courses
  FOR SELECT USING (is_published = true);

-- Modules policies
CREATE POLICY "Creators can manage modules" ON modules
  FOR ALL USING (
    course_id IN (
      SELECT c.id FROM courses c
      JOIN schools s ON c.school_id = s.id
      WHERE s.creator_id = auth.uid()
    )
  );

-- Lessons policies
CREATE POLICY "Creators can manage lessons" ON lessons
  FOR ALL USING (
    module_id IN (
      SELECT m.id FROM modules m
      JOIN courses c ON m.course_id = c.id
      JOIN schools s ON c.school_id = s.id
      WHERE s.creator_id = auth.uid()
    )
  );
```

#### Definition of Done
- [ ] Email confirmations enabled
- [ ] Password policies configured
- [ ] Email templates customized
- [ ] Database trigger creates creator on signup
- [ ] Email verification updates creator record
- [ ] RLS policies protect all tables
- [ ] Registration flow works end-to-end

---

### US-004: Next.js App Base Setup
**Points:** 3 | **Priority:** P0 | **Dependencies:** US-001

#### Objective
Configurar la aplicación Next.js con todas las dependencias base.

#### Acceptance Criteria
```gherkin
GIVEN the `apps/web` folder
WHEN I run `pnpm dev`
THEN the app starts with Tailwind, shadcn/ui, and tRPC configured
```

#### Technical Tasks

##### 1. Crear Next.js App
```bash
cd apps
pnpm create next-app@latest web --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
cd web
```

##### 2. Configurar package.json
```json
// apps/web/package.json
{
  "name": "@ity/web",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",

    "@ity/api": "workspace:*",
    "@ity/db": "workspace:*",
    "@ity/config": "workspace:*",
    "@ity/ui": "workspace:*",

    "@supabase/supabase-js": "^2.39.0",
    "@supabase/ssr": "^0.1.0",
    "@tanstack/react-query": "^5.17.0",
    "@trpc/client": "^11.0.0-rc.0",
    "@trpc/react-query": "^11.0.0-rc.0",
    "@trpc/server": "^11.0.0-rc.0",

    "next-intl": "^3.4.0",
    "zustand": "^4.5.0",
    "react-hook-form": "^7.49.0",
    "@hookform/resolvers": "^3.3.0",
    "zod": "^3.22.0",
    "superjson": "^2.2.0",

    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "lucide-react": "^0.312.0"
  },
  "devDependencies": {
    "@ity/typescript-config": "workspace:*",
    "@types/node": "^20.11.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.33",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.3.0"
  }
}
```

##### 3. Configurar TypeScript
```json
// apps/web/tsconfig.json
{
  "extends": "@ity/typescript-config/nextjs.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

##### 4. Configurar Tailwind
```typescript
// apps/web/tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
```

##### 5. Configurar next.config.js
```javascript
// apps/web/next.config.js
const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@ity/ui', '@ity/api', '@ity/db', '@ity/config'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
      },
    ],
  },
};

module.exports = withNextIntl(nextConfig);
```

##### 6. Crear Supabase Clients
```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

```typescript
// lib/supabase/server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Handle cookie errors in Server Components
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Handle cookie errors in Server Components
          }
        },
      },
    }
  );
}
```

##### 7. Crear Middleware
```typescript
// middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Check school context from custom domain
  const schoolId = request.headers.get('x-school-id');
  const schoolDomain = request.headers.get('x-school-domain');

  if (schoolId) {
    response.headers.set('x-school-id', schoolId);
  }
  if (schoolDomain) {
    response.headers.set('x-school-domain', schoolDomain);
  }

  // Refresh session
  await supabase.auth.getSession();

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

##### 8. Crear App Layout
```typescript
// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ITY - I Teach You',
  description: 'The simplest way to create your online school',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

```typescript
// app/providers.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import superjson from 'superjson';

function getBaseUrl() {
  if (typeof window !== 'undefined') return '';
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: superjson,
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
```

##### 9. Crear Home Page Temporal
```typescript
// app/page.tsx
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">ITY - I Teach You</h1>
      <p className="text-muted-foreground">
        The simplest way to create your online school
      </p>
    </main>
  );
}
```

#### Definition of Done
- [ ] Next.js app runs with `pnpm dev`
- [ ] Tailwind CSS configured and working
- [ ] Supabase clients created (browser + server)
- [ ] Middleware handles auth and school context
- [ ] tRPC client configured
- [ ] Providers wrapper created
- [ ] Home page renders correctly
- [ ] No TypeScript errors

---

### US-005: tRPC Base Setup
**Points:** 2 | **Priority:** P0 | **Dependencies:** US-002, US-004

#### Objective
Configurar tRPC con contexto, procedimientos y error handling.

#### Acceptance Criteria
```gherkin
GIVEN the tRPC setup
WHEN I call a protected procedure without auth
THEN I get an UNAUTHORIZED error
```

#### Technical Tasks

##### 1. Crear tRPC Context
```typescript
// packages/api/src/trpc.ts
import { initTRPC, TRPCError } from '@trpc/server';
import { type FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import superjson from 'superjson';
import { ZodError } from 'zod';
import { db } from '@ity/db';
import { createClient } from '@supabase/supabase-js';

export const createTRPCContext = async (opts: FetchCreateContextFnOptions) => {
  const { req } = opts;

  // Get school context from headers (set by Cloudflare Worker)
  const schoolId = req.headers.get('x-school-id');
  const schoolDomain = req.headers.get('x-school-domain');

  // Create Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get user from auth header
  const authHeader = req.headers.get('authorization');
  let user = null;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const { data: { user: authUser } } = await supabase.auth.getUser(token);
    user = authUser;
  }

  return {
    db,
    supabase,
    user,
    schoolId,
    schoolDomain,
  };
};

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

// Middleware for authenticated creators
const enforceCreatorAuth = t.middleware(async ({ ctx, next }) => {
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

export const protectedProcedure = t.procedure.use(enforceCreatorAuth);

// Middleware for authenticated students (within school context)
const enforceStudentAuth = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user || !ctx.schoolId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  // Verify student belongs to this school
  // (Implementation depends on student auth strategy)

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      schoolId: ctx.schoolId,
    },
  });
});

export const studentProcedure = t.procedure.use(enforceStudentAuth);
```

##### 2. Crear Routers Base
```typescript
// packages/api/src/routers/auth.ts
import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { creators } from '@ity/db';
import { eq } from 'drizzle-orm';

export const authRouter = router({
  // Get current user
  me: protectedProcedure.query(async ({ ctx }) => {
    const creator = await ctx.db.query.creators.findFirst({
      where: eq(creators.id, ctx.user.id),
    });

    if (!creator) {
      throw new TRPCError({ code: 'NOT_FOUND' });
    }

    return creator;
  }),

  // Update profile
  updateProfile: protectedProcedure
    .input(z.object({
      name: z.string().min(2).max(255).optional(),
      language: z.enum(['en', 'es', 'fr', 'pt']).optional(),
      avatarUrl: z.string().url().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(creators)
        .set({
          ...input,
          updatedAt: new Date(),
        })
        .where(eq(creators.id, ctx.user.id))
        .returning();

      return updated;
    }),
});
```

```typescript
// packages/api/src/routers/schools.ts
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { schools } from '@ity/db';
import { eq, and } from 'drizzle-orm';

export const schoolsRouter = router({
  // List creator's schools
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.schools.findMany({
      where: eq(schools.creatorId, ctx.user.id),
      orderBy: (schools, { desc }) => [desc(schools.createdAt)],
    });
  }),

  // Get school by ID
  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const school = await ctx.db.query.schools.findFirst({
        where: and(
          eq(schools.id, input.id),
          eq(schools.creatorId, ctx.user.id)
        ),
      });

      if (!school) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return school;
    }),

  // Create school
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(2).max(255),
      slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check slug uniqueness
      const existing = await ctx.db.query.schools.findFirst({
        where: eq(schools.slug, input.slug),
      });

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Slug already in use',
        });
      }

      const [school] = await ctx.db.insert(schools).values({
        ...input,
        creatorId: ctx.user.id,
      }).returning();

      return school;
    }),

  // Update school
  update: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      name: z.string().min(2).max(255).optional(),
      description: z.string().optional(),
      language: z.enum(['en', 'es', 'fr', 'pt']).optional(),
      timezone: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const [updated] = await ctx.db
        .update(schools)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(and(
          eq(schools.id, id),
          eq(schools.creatorId, ctx.user.id)
        ))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return updated;
    }),
});
```

##### 3. Crear Root Router
```typescript
// packages/api/src/root.ts
import { router } from './trpc';
import { authRouter } from './routers/auth';
import { schoolsRouter } from './routers/schools';

export const appRouter = router({
  auth: authRouter,
  schools: schoolsRouter,
});

export type AppRouter = typeof appRouter;
```

##### 4. Crear Index de Exports
```typescript
// packages/api/src/index.ts
export { appRouter, type AppRouter } from './root';
export { createTRPCContext } from './trpc';
```

##### 5. Crear tRPC Client
```typescript
// apps/web/lib/trpc/client.ts
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@ity/api';

export const trpc = createTRPCReact<AppRouter>();
```

##### 6. Crear API Handler
```typescript
// apps/web/app/api/trpc/[trpc]/route.ts
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter, createTRPCContext } from '@ity/api';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: createTRPCContext,
    onError:
      process.env.NODE_ENV === 'development'
        ? ({ path, error }) => {
            console.error(
              `❌ tRPC failed on ${path ?? '<no-path>'}: ${error.message}`
            );
          }
        : undefined,
  });

export { handler as GET, handler as POST };
```

#### Definition of Done
- [ ] tRPC context created with DB, auth, and school context
- [ ] `publicProcedure` works without auth
- [ ] `protectedProcedure` requires authentication
- [ ] `studentProcedure` requires auth + school context
- [ ] Error handling includes Zod validation errors
- [ ] Root router exports all sub-routers
- [ ] API handler responds at `/api/trpc/*`
- [ ] tRPC client works in React components

---

## EXECUTION ORDER

```
1. US-001: Monorepo Setup (Day 1-2)
   └── 2. US-001b: CI/CD Pipeline Setup (Day 2-3)
         └── 3. US-001c: Environment Configuration (Day 3-5)
   └── 4. US-002: Database Schema Setup (Day 3-5)
         └── 5. US-003: Supabase Auth Configuration (Day 5-6)
   └── 6. US-004: Next.js App Base Setup (Day 5-7)
         └── 7. US-005: tRPC Base Setup (Day 7-8)
```

**Note:** US-002 and US-004 can run in parallel after US-001.

---

## SPRINT COMPLETION CHECKLIST

### Infrastructure
- [ ] Monorepo initialized with Turborepo
- [ ] All packages have correct workspace references
- [ ] `pnpm install`, `pnpm dev`, `pnpm build` work
- [ ] Git repository with branch protection
- [ ] CI/CD pipeline configured
- [ ] Staging environment functional
- [ ] Production environment ready

### Database
- [ ] All tables created in Supabase
- [ ] Relations configured correctly
- [ ] RLS policies active
- [ ] Seed script works

### Authentication
- [ ] Creator registration works
- [ ] Email verification sends
- [ ] Login creates session
- [ ] Auth triggers create creator record

### Application
- [ ] Next.js app runs locally
- [ ] Tailwind CSS working
- [ ] tRPC endpoints accessible
- [ ] Supabase client configured

---

## NEXT SPRINT PREVIEW

**Sprint 2: Auth & Dashboard**
- US-006: Creator Registration (UI)
- US-007: Creator Email Verification (UI)
- US-008: Creator Login (UI)
- US-009: Password Reset Flow
- US-010: Creator Dashboard Layout

---

**Document Version:** 1.0
**Last Updated:** January 2025
**Sprint Status:** Ready to Execute
