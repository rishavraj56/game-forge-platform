# Game Forge Platform - Setup Guide

## Database Infrastructure Setup ✅

The database setup and core infrastructure has been successfully implemented. Here's what's been completed:

### 🗄️ Database Schema
- **Complete PostgreSQL schema** with all required tables:
  - Users and authentication (users, accounts, sessions, verification_tokens)
  - Gamification system (quests, user_quest_progress, badges, titles, user_badges, user_titles)
  - Community features (channels, posts, comments, post_reactions, channel_members)
  - Learning academy (learning_modules, user_module_progress, mentorship_programs, mentorship_relationships)
  - Events system (events, event_registrations)
  - Notifications and activities (notifications, activities)

### 🔧 Migration System
- **Automated migration system** with version control
- **Seed data** for initial badges, titles, channels, quests, and learning modules
- **Migration CLI tools** for easy database management
- **Database reset functionality** for development

### 🛠️ Database Utilities
- **Connection management** with Vercel Postgres integration
- **Comprehensive utility functions** for all major operations:
  - User management (getUserById, updateUserXP, etc.)
  - Quest system (getUserActiveQuests, completeQuest, etc.)
  - Leaderboards (getLeaderboard with domain/timeframe filtering)
  - Community features (getChannelPosts, createActivity, etc.)
  - Learning progress tracking
  - Event management
  - Notification system

### 📝 Type Definitions
- **Complete TypeScript interfaces** for all database models
- **API response types** and pagination interfaces
- **Form validation types** and context interfaces
- **Domain constants** and configuration types

### ⚙️ Configuration Management
- **Environment variable validation** with helpful error messages
- **Database configuration** with multiple connection options
- **Application constants** for XP, levels, rate limiting, etc.
- **Cache TTL settings** for performance optimization

### 🔍 Health Monitoring
- **Health check API endpoint** (`/api/health`) for monitoring
- **Database connection testing** utilities
- **Migration status checking** tools

## Quick Start Commands

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your actual database credentials

# Run database migrations
npm run migrate:up

# Check migration status
npm run migrate:status

# Test database setup
npm run db:test

# Start development server
npm run dev

# Test health endpoint
curl http://localhost:3000/api/health
```

## Environment Variables Required

```env
# Database (Vercel Postgres)
POSTGRES_URL="your-vercel-postgres-url"
POSTGRES_PRISMA_URL="your-vercel-postgres-prisma-url"
POSTGRES_URL_NO_SSL="your-vercel-postgres-url-no-ssl"
POSTGRES_URL_NON_POOLING="your-vercel-postgres-url-non-pooling"

# Authentication
NEXTAUTH_SECRET="your-nextauth-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Real-time features (Supabase)
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"

# Email
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-email-password"
```

## Database Performance Features

### Optimized Indexes
- User lookups by email, username, domain, XP
- Quest progress and completion tracking
- Community content retrieval
- Learning module progress
- Event and notification queries

### Caching Strategy
- Leaderboard caching (5 minutes)
- User profile caching (10 minutes)
- Channel list caching (30 minutes)
- Platform stats caching (15 minutes)

### Connection Management
- Vercel Postgres serverless connections
- Traditional pg Pool for migrations
- Connection pooling and error handling
- Graceful connection cleanup

## Next Steps

1. **Set up Vercel Postgres database** in your Vercel dashboard
2. **Configure environment variables** with real database credentials
3. **Run migrations** to create the schema and seed data
4. **Test the setup** using the health endpoint
5. **Begin implementing authentication** (Task 15)

## Files Created

### Core Database Files
- `src/lib/db.ts` - Database connection and utilities
- `src/lib/schema.sql` - Complete database schema
- `src/lib/migrations.ts` - Migration system
- `src/lib/seed.sql` - Initial seed data
- `src/lib/db-utils.ts` - Database utility functions
- `src/lib/types.ts` - TypeScript type definitions
- `src/lib/config.ts` - Configuration management

### Scripts and Tools
- `scripts/migrate.ts` - Migration CLI tool
- `scripts/test-db.ts` - Database testing utility
- `src/app/api/health/route.ts` - Health check endpoint

### Documentation
- `DATABASE.md` - Detailed database documentation
- `SETUP.md` - This setup guide
- `.env.example` - Environment variable template

The database infrastructure is now ready for the next phase of development! 🚀