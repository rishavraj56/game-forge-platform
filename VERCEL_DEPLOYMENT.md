# Vercel Deployment Guide

## Quick Start

Your app is now ready to deploy to Vercel! Follow these steps:

### 1. Push to GitHub

```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js settings

### 3. Set Up Environment Variables

**IMPORTANT:** Before deploying, add these environment variables in Vercel Dashboard:

#### Required Variables:

**Database (Vercel Postgres):**
1. In Vercel Dashboard → Storage → Create Database → Postgres
2. After creation, go to your database → `.env.local` tab
3. Copy all `POSTGRES_*` variables to your project's Environment Variables

**NextAuth:**
```bash
# Generate a secret key
openssl rand -base64 32
```
Then add:
- `NEXTAUTH_SECRET` = (the generated key)
- `NEXTAUTH_URL` = `https://your-app.vercel.app`

#### Optional Variables:

**Supabase (for real-time features):**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

> **Note:** If you skip Supabase, the app will work fine but without real-time notifications and live updates.

**Email (for notifications):**
- `EMAIL_SERVER_HOST`
- `EMAIL_SERVER_PORT`
- `EMAIL_SERVER_USER`
- `EMAIL_SERVER_PASSWORD`
- `EMAIL_FROM`

### 4. Deploy

Click "Deploy" and Vercel will build and deploy your app!

## Post-Deployment

### Initialize Database

After first deployment, run database migrations:

```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Link your project
vercel link

# Run migrations
vercel env pull .env.local
npm run migrate:up
```

### Verify Deployment

1. Visit your deployed URL
2. Test user registration
3. Check that pages load correctly

## Troubleshooting

### Build Fails

- Check that all required environment variables are set
- Review build logs in Vercel Dashboard
- Ensure `.env.local` has dummy Supabase values for local builds

### Database Connection Issues

- Verify `POSTGRES_URL` is correct
- Check that database is in the same region as your Vercel project
- Ensure database migrations have run

### Real-time Features Not Working

- Verify Supabase environment variables are set
- Check Supabase project is active
- Review browser console for connection errors

## Features Status

✅ **Working without additional setup:**
- User authentication
- Profile management
- Community channels
- Learning modules
- Events
- Gamification (quests, badges, XP)
- Leaderboards

⚠️ **Requires Supabase setup:**
- Real-time notifications
- Live activity feed
- Live leaderboard updates
- Real-time chat

⚠️ **Requires Email setup:**
- Email notifications
- Password reset emails

## Next Steps

1. **Set up Supabase** (optional but recommended):
   - Create account at [supabase.com](https://supabase.com)
   - Create new project
   - Copy API keys to Vercel environment variables
   - Redeploy

2. **Configure Email** (optional):
   - Set up SMTP credentials (Gmail, SendGrid, etc.)
   - Add email environment variables
   - Redeploy

3. **Custom Domain** (optional):
   - Go to Vercel Dashboard → Settings → Domains
   - Add your custom domain
   - Follow DNS configuration instructions

## Support

If you encounter issues:
1. Check Vercel build logs
2. Review browser console for errors
3. Verify all environment variables are set correctly
4. Ensure database migrations have run

## Security Notes

- Never commit `.env.local` or `.env.production` to git
- Rotate `NEXTAUTH_SECRET` regularly
- Use strong passwords for database and email
- Keep Supabase service role key secret
