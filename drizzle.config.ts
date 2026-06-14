import dotenv from 'dotenv';
import { defineConfig } from 'drizzle-kit';

dotenv.config({ path: '.env.local' });

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema.js',
  out: './drizzle',
  dbCredentials: {
    url: process.env.AUTH_DRIZZLE_URL || '',
  },
});
