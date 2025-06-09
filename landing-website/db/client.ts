import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import dotenv from 'dotenv';
import path from 'path'; // Import path module

dotenv.config({ path: path.resolve(__dirname, '../.env.local') }); // Corrected path to .env.local

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // ssl: {
  //   rejectUnauthorized: false, // Required for some cloud providers like Heroku/Render
  // },
});

export const db = drizzle(pool, { schema });
export { pool }; // Export the pool for explicit connection management if needed
