# Quick Setup Guide - Database is Already Created!

Good news! Your Vercel Postgres database is already set up and the environment variables are pulled.

## The Issue:

Vercel Postgres uses a special connection method that doesn't work well with traditional migration scripts locally. 

## Solution: Run Migrations on Vercel

Since your database is on Vercel, the easiest way is to run migrations there:

### Option 1: Use Vercel CLI (Recommended)

```bash
# Run migration command on Vercel
vercel env pull
vercel dev
# Then in another terminal:
npm run migrate:up
```

### Option 2: Create a Migration API Endpoint

I can create an API endpoint that runs migrations when you visit it in your browser.

### Option 3: Manual SQL (Fastest for Now)

Since you just need to test registration, let me create a simple SQL script you can run directly in Vercel's database dashboard.

---

## Fastest Solution Right Now:

1. Go to Vercel Dashboard
2. Your Project → **Storage** → Your Database
3. Click **Query** tab
4. Copy and paste this SQL:

```sql
-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  domain VARCHAR(50) NOT NULL,
  role VARCHAR(20) DEFAULT 'member',
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  avatar_url TEXT,
  bio TEXT,
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
```

5. Click **Run Query**
6. Done! ✅

---

## Test Registration:

After running the SQL:

1. Go to your Vercel deployment URL
2. Click **Register**
3. Fill in the form
4. Submit
5. You should be redirected to login (no more mock!)
6. Login with your credentials
7. Success! 🎉

---

## Why This Happens:

Vercel Postgres uses a serverless connection pool that works differently from traditional PostgreSQL. The migration scripts are designed for traditional connections, so they don't work well locally with Vercel's database.

The SQL script above creates just the `users` table which is all you need to test authentication. You can run the full migrations later when needed.

---

Would you like me to create the migration API endpoint instead? That way you can just visit `/api/migrate` in your browser to run all migrations.

