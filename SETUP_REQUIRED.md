# Environment Configuration Required

Your application is experiencing 500 errors due to missing environment variables and database setup. Here's what needs to be fixed:

## 1. Create `.env.local` file in project root

Add the following environment variables:

```env
# Database (PostgreSQL - use Supabase PostgreSQL connection string)
DATABASE_URL=postgresql://user:password@host:port/database

# Supabase (for client-side API)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_public_key
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# App Configuration
VITE_APP_URL=http://localhost:5173
VITE_API_URL=http://localhost:3001

# Auth Secret
BETTER_AUTH_SECRET=your_secret_key_here_min_32_chars

# Vercel (for deployment)
BETTER_AUTH_URL=https://your-domain.vercel.app/api/auth
```

## 2. Run Database Migrations

The better-auth migration file exists at `better-auth_migrations/2026-05-13T01-12-07.180Z.sql`

To apply it:
1. Connect to your PostgreSQL database
2. Run the SQL migration file to create auth tables

Or using CLI:
```bash
psql $DATABASE_URL < better-auth_migrations/2026-05-13T01-12-07.180Z.sql
```

## 3. Ensure events table exists in Supabase

Create the events table in your Supabase database with the schema used by EventsManager.

## 4. Changes Made to Fix 500 Errors

✅ **Fixed:**
- Added missing `/api/events` endpoint in `server.ts`
- Fixed `api/auth/better-auth.ts` to use `process.env.BETTER_AUTH_URL` instead of client-side env vars
- Updated `EventsSection.tsx` to use correct API URL with fallback to current origin
- Made Supabase key handling consistent

## 5. Dev Server Setup

Run the development server:
```bash
npm run dev
```

This will start:
- Vite dev server on `http://localhost:5173`
- Express backend on `http://localhost:3001`

## Troubleshooting

If you still see 500 errors:

1. **Auth endpoint 500**: Check that DATABASE_URL is valid and migrations have been run
2. **Events endpoint 500**: Verify Supabase credentials are correct and events table exists
3. **Sign-in page 500**: Ensure BETTER_AUTH_SECRET and DATABASE_URL are set

Check console logs for more detailed error messages.
