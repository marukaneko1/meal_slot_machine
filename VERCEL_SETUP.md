# Vercel Deployment Setup Guide

## ⚠️ Important: Database Configuration

**SQLite does NOT work on Vercel.** Vercel's serverless functions have read-only filesystems, so you need to use a cloud database.

## Quick Setup Options

### Option 1: Vercel Postgres (Recommended - Easiest)

1. **Create Vercel Postgres Database:**
   - Go to your Vercel project dashboard
   - Click **Storage** → **Create Database** → **Postgres**
   - Choose a name (e.g., `meal-slot-db`)
   - Select a region close to your users

2. **Get Connection String:**
   - Vercel will automatically add `POSTGRES_URL` to your environment variables
   - Copy the connection string

3. **Update Prisma Schema:**
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

4. **Set Environment Variable in Vercel:**
   - Go to **Settings** → **Environment Variables**
   - Add: `DATABASE_URL` = `$POSTGRES_URL` (or use the direct connection string)

5. **Run Migrations:**
   ```bash
   # Locally, connect to your Vercel Postgres
   DATABASE_URL="your-vercel-postgres-url" npx prisma migrate deploy
   ```

### Option 2: Supabase (Free Tier Available)

1. **Create Supabase Project:**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Wait for it to provision

2. **Get Connection String:**
   - Go to **Settings** → **Database**
   - Copy the **Connection string** (URI format)
   - Format: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`

3. **Update Prisma Schema:**
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

4. **Set Environment Variable:**
   - In Vercel: **Settings** → **Environment Variables**
   - Add: `DATABASE_URL` = your Supabase connection string

5. **Run Migrations:**
   ```bash
   DATABASE_URL="your-supabase-url" npx prisma migrate deploy
   ```

### Option 3: Neon (Serverless Postgres)

1. **Create Neon Project:**
   - Go to [neon.tech](https://neon.tech)
   - Create a new project
   - Copy the connection string

2. **Follow same steps as Supabase** (update schema, set env var, run migrations)

## Migration Steps

### 1. Update Prisma Schema

Change `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"  // Changed from "sqlite"
  url      = env("DATABASE_URL")
}
```

### 2. Create Migration

```bash
# This will create a new migration for PostgreSQL
npx prisma migrate dev --name init_postgres
```

### 3. Deploy to Production Database

```bash
# Connect to your production database
DATABASE_URL="your-production-database-url" npx prisma migrate deploy
```

### 4. Seed the Database (Optional)

If you have seed data:
```bash
DATABASE_URL="your-production-database-url" npm run db:seed
```

## Environment Variables Checklist

Make sure these are set in **Vercel** → **Settings** → **Environment Variables**:

- ✅ `DATABASE_URL` - Your PostgreSQL connection string
- ✅ `ADMIN_PASSWORD` - (Optional) Admin password
- ✅ `SESSION_SECRET` - (Optional) Session secret for admin auth

## Testing the Connection

After deployment, check:

1. **API Routes:**
   - Visit: `https://your-app.vercel.app/api/dishes`
   - Should return JSON (even if empty array)

2. **Spin Endpoint:**
   - Try spinning the slot machine
   - Check browser console for errors
   - Check Vercel function logs

## Troubleshooting

### Error: "Can't reach database server"
- Check your `DATABASE_URL` is correct
- Verify database allows connections from Vercel IPs
- Check database is not paused (Supabase/Neon free tiers pause after inactivity)

### Error: "PrismaClientInitializationError"
- Make sure `prisma generate` runs during build (already fixed in package.json)
- Check Prisma schema matches your database provider

### Error: "relation does not exist"
- Run migrations: `npx prisma migrate deploy`
- Check migrations ran successfully

## Local Development

Keep SQLite for local dev:

```bash
# .env.local (for local development)
DATABASE_URL="file:./dev.db"
```

Vercel will use the production `DATABASE_URL` automatically.

## Need Help?

- Check Vercel function logs: **Deployments** → **Functions** → **View Logs**
- Check Prisma docs: https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel
- Vercel Postgres docs: https://vercel.com/docs/storage/vercel-postgres
