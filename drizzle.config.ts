import 'dotenv/config';

export default {
  dialect: 'postgresql',
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.NODE_ENV === 'production'
      ? process.env.DATABASE_URL!
      : 'postgres://neon:npg@localhost:5432/neondb?sslmode=no-verify',
  },
};