import { defineConfig } from 'drizzle-kit';
import dotenv from 'dotenv';

dotenv.config({ path: './.env.local' }); // Assuming .env.local is in the root

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set for drizzle-kit');
}

export default defineConfig({
  schema: './db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql', // Specify dialect as postgresql
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
});
