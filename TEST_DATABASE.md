# Database Connection Test

## Why Registration is Failing

Your registration is calling the real API now (✅ fixed!), but the API can't connect to the database because:

### Local Development:
- ❌ No database configured in `.env.local`
- ❌ Database URL is placeholder: `"your-vercel-postgres-url"`

### Vercel Deployment:
- ❌ No Postgres database created yet
- ❌ No environment variables set
- ❌ No migrations run

---

## Quick Test

To verify the API is working, check the browser console:

1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Try to register
4. You should see an error like:
   ```
   Registration failed: Registration failed. Please try again.
   ```

This means the API is being called, but the database connection is failing.

---

## Fix for Vercel (Production):

### Step 1: Create Database
1. Go to Vercel Dashboard
2. Your Project → **Storage** → **Create Database**
3. Select **Postgres**
4. Create it

### Step 2: Add Environment Variables
1. Go to database → **`.env.local`** tab
2. Copy all `POSTGRES_*` variables
3. Go to Project → **Settings** → **Environment Variables**
4. Add each variable

Also add:
```bash
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
NEXTAUTH_URL=https://your-app.vercel.app
```

### Step 3: Redeploy
1. **Deployments** → **...** → **Redeploy**

### Step 4: Run Migrations
```bash
vercel link
vercel env pull .env.local
npm run migrate:up
```

---

## Fix for Local Development:

### Option 1: Use Vercel Postgres Locally
```bash
# Create database in Vercel first, then:
vercel link
vercel env pull .env.local
npm run migrate:up
npm run dev
```

### Option 2: Use Local PostgreSQL
1. Install PostgreSQL locally
2. Create database: `createdb gameforge`
3. Update `.env.local`:
   ```env
   POSTGRES_URL="postgresql://localhost:5432/gameforge"
   NEXTAUTH_SECRET="local-dev-secret-key"
   ```
4. Run migrations: `npm run migrate:up`
5. Start dev server: `npm run dev`

---

## How to Tell if Database is Connected:

### Test the API directly:

```bash
# Test registration endpoint
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "domain": "Game Development"
  }'
```

**If database is working:**
```json
{
  "success": true,
  "data": {
    "user": { ... }
  }
}
```

**If database is NOT working:**
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Registration failed. Please try again."
  }
}
```

---

## Current Status:

✅ **Frontend**: Fixed - calling real API  
✅ **API Endpoints**: Working - ready to use  
❌ **Database**: Not configured  
❌ **Environment Variables**: Not set  

**Next Step:** Set up the database following the steps above!

