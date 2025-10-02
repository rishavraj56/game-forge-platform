# Game Forge Platform - Database Setup

This document provides instructions for setting up and managing the database for the Game Forge platform.

## Prerequisites

- Vercel account with Postgres addon
- Node.js 18+ installed
- Environment variables configured

## Environment Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Update the environment variables in `.env.local` with your actual values:
   - `POSTGRES_URL`: Your Vercel Postgres connection string
   - `NEXTAUTH_SECRET`: A secure random string for NextAuth
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

## Database Setup

### Initial Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run database migrations:**
   ```bash
   npm run migrate:up
   ```

   This will:
   - Create all required tables
   - Set up indexes for performance
   - Insert initial seed data (badges, titles, channels, etc.)

### Migration Commands

- **Run migrations:** `npm run migrate:up`
- **Check migration status:** `npm run migrate:status`
- **Reset database (dev only):** `npm run migrate:reset`

### Vercel Postgres Setup

1. **Create a Vercel Postgres database:**
   - Go to your Vercel dashboard
   - Navigate to your project
   - Go to the "Storage" tab
   - Click "Create Database" and select "Postgres"

2. **Get connection details:**
   - Copy the connection strings from the Vercel dashboard
   - Add them to your `.env.local` file

3. **Connect locally:**
   ```bash
   # Test the connection
   npm run migrate:status
   ```

## Database Schema

The database includes the following main entities:

### Core Tables
- **users**: User accounts and profiles
- **accounts/sessions**: NextAuth authentication
- **quests**: Daily and weekly challenges
- **user_quest_progress**: Quest completion tracking

### Gamification
- **badges**: Achievement badges
- **titles**: User titles and ranks
- **user_badges/user_titles**: User achievements

### Community
- **channels**: Discussion channels by domain
- **posts**: Community posts and discussions
- **comments**: Post comments and replies

### Learning
- **learning_modules**: Educational content
- **user_module_progress**: Learning progress tracking
- **mentorship_programs**: Mentorship matching

### Events
- **events**: Community events and activities
- **event_registrations**: Event attendance tracking

### System
- **notifications**: User notifications
- **activities**: Activity feed entries

## Database Utilities

The platform includes several utility functions for common database operations:

### User Operations
```typescript
import { getUserById, updateUserXP } from '@/lib/db-utils';

// Get user by ID
const user = await getUserById(userId);

// Add XP to user
const result = await updateUserXP(userId, 50);
```

### Quest Operations
```typescript
import { getUserActiveQuests, completeQuest } from '@/lib/db-utils';

// Get user's active quests
const quests = await getUserActiveQuests(userId);

// Complete a quest
await completeQuest(userId, questId);
```

### Leaderboard Operations
```typescript
import { getLeaderboard } from '@/lib/db-utils';

// Get global leaderboard
const leaderboard = await getLeaderboard();

// Get domain-specific weekly leaderboard
const weeklyLeaderboard = await getLeaderboard('Game Development', 'weekly');
```

## Performance Considerations

### Indexes
The database includes optimized indexes for:
- User lookups by email, username, domain
- Quest progress queries
- Leaderboard calculations
- Community content retrieval
- Learning progress tracking

### Caching Strategy
Consider implementing caching for:
- Leaderboards (5-minute TTL)
- User profiles (10-minute TTL)
- Channel lists (30-minute TTL)
- Platform statistics (15-minute TTL)

## Monitoring and Maintenance

### Health Checks
Use the health check endpoint to monitor database connectivity:
```bash
curl http://localhost:3000/api/health
```

### Database Maintenance
- Monitor query performance in Vercel dashboard
- Review slow query logs regularly
- Update statistics and vacuum tables as needed
- Monitor connection pool usage

### Backup Strategy
- Vercel Postgres includes automatic backups
- Consider additional backup strategies for production
- Test backup restoration procedures

## Development Workflow

### Local Development
1. Use `.env.local` for local environment variables
2. Run migrations after pulling schema changes
3. Use `npm run migrate:reset` to reset local database

### Testing
1. Use separate test database for automated tests
2. Reset database state between test runs
3. Mock external services (Supabase, email) in tests

### Production Deployment
1. Environment variables are managed in Vercel dashboard
2. Migrations run automatically on deployment
3. Monitor database performance and scaling

## Troubleshooting

### Common Issues

**Connection Errors:**
- Verify environment variables are set correctly
- Check Vercel Postgres dashboard for service status
- Ensure IP allowlisting is configured if required

**Migration Failures:**
- Check database permissions
- Verify SQL syntax in migration files
- Review migration logs for specific errors

**Performance Issues:**
- Monitor slow query logs
- Check index usage with EXPLAIN ANALYZE
- Consider connection pooling optimization

### Getting Help

- Check Vercel Postgres documentation
- Review database logs in Vercel dashboard
- Use `npm run migrate:status` to check migration state
- Test connection with health check endpoint

## Security Considerations

- Never commit `.env.local` or production credentials
- Use environment variables for all sensitive configuration
- Implement proper input validation and sanitization
- Use parameterized queries to prevent SQL injection
- Regularly update dependencies and security patches