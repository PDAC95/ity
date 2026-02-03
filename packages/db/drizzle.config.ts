import 'dotenv/config';
import { resolve } from 'path';
import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// Load .env.local from monorepo root
config({ path: resolve(__dirname, '../../.env.local') });

export default defineConfig({
  schema: './src/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
