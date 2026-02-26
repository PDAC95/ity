# ITY - I Teach You

The simplest way to create your online school.

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React 18, Tailwind CSS
- **Backend:** tRPC, Drizzle ORM
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Hosting:** Vercel + Cloudflare Workers
- **Payments:** Stripe Connect
- **Storage:** Cloudflare R2

## Project Structure

```
ity/
├── apps/
│   ├── web/          # Next.js application
│   └── worker/       # Cloudflare Worker (domain routing)
├── packages/
│   ├── api/          # tRPC routers
│   ├── db/           # Database schema (Drizzle)
│   ├── ui/           # Shared UI components
│   ├── config/       # Shared configuration
│   └── typescript-config/
└── docs/             # Documentation
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/PDAC95/ity.git
   cd ity
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your credentials
   ```

4. **Push database schema**
   ```bash
   pnpm db:push
   ```

5. **Start development server**
   ```bash
   pnpm dev
   ```

The app will be running at http://localhost:3000

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Build all apps and packages |
| `pnpm lint` | Run ESLint on all packages |
| `pnpm type-check` | Run TypeScript type checking |
| `pnpm test` | Run all tests |
| `pnpm db:push` | Push schema changes to database |
| `pnpm db:studio` | Open Drizzle Studio |
| `pnpm db:seed` | Seed the database with test data |

## Environments

| Environment | Branch | URL |
|-------------|--------|-----|
| Local | - | http://localhost:3000 |
| Staging | `develop` | https://ity-staging.vercel.app |
| Production | `main` | https://ity.vercel.app |

## License

Private - All rights reserved.
