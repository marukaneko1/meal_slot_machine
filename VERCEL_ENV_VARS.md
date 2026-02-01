# Vercel Environment Variables

Add these environment variables in **Vercel Dashboard** → **Settings** → **Environment Variables**:

## Required Variables

```
DATABASE_URL=postgresql://neondb_owner:npg_kr1Wxd0AJSLc@ep-summer-art-ahisbb71-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
```

## Optional Variables

```
ADMIN_PASSWORD=mealslot2024
SESSION_SECRET=your-session-secret-change-in-production
```

## Important Notes

- ✅ **Use the pooled connection** (`-pooler`) for `DATABASE_URL` in Vercel
- ✅ The migration has already been applied to your Neon database
- ✅ Your Prisma schema is now configured for PostgreSQL
- ⚠️ **Do NOT commit these credentials to git** - they're already in your Neon dashboard

## After Setting Environment Variables

1. **Redeploy** your Vercel project (or push a new commit)
2. The slot machine should now work! 🎰

## Testing

After deployment, test:
- Visit: `https://your-app.vercel.app/api/dishes` - should return JSON
- Try spinning the slot machine - should work now!
