# Leaderboard System Backend

This document describes the implementation of the leaderboard system backend for The Game Forge platform.

## Overview

The leaderboard system provides real-time ranking of users based on their XP (experience points) with support for:
- All-time and weekly rankings
- Domain-specific filtering
- Caching for performance
- Real-time updates when XP changes
- Historical weekly data archival

## Architecture

### Core Components

1. **LeaderboardService** (`leaderboard-service.ts`)
   - Main service class for leaderboard operations
   - Handles caching and data retrieval
   - Provides methods for different leaderboard types

2. **API Endpoints** (`/api/leaderboards/`)
   - RESTful API for leaderboard data access
   - Supports pagination and filtering
   - Includes admin endpoints for management

3. **XP Integration** (`xp-utils.ts`)
   - Automatic leaderboard updates when XP changes
   - Triggers cache invalidation on XP awards

4. **Weekly Reset System** (`leaderboard-reset.ts`)
   - Archives weekly leaderboard data
   - Manages historical data cleanup
   - Provides weekly performance tracking

## API Endpoints

### GET /api/leaderboards
Get leaderboard data with pagination and filtering.

**Parameters:**
- `type`: 'all-time' | 'weekly' (default: 'all-time')
- `domain`: Domain filter (optional)
- `limit`: Number of entries (1-100, default: 10)
- `offset`: Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "id": "user-id",
        "username": "username",
        "avatar_url": "avatar-url",
        "domain": "Game Development",
        "xp": 5000,
        "level": 6,
        "weekly_xp": 250,
        "rank": 1
      }
    ],
    "pagination": {
      "limit": 10,
      "offset": 0,
      "total": 150,
      "hasNext": true,
      "hasPrev": false
    },
    "type": "all-time",
    "domain": null,
    "userRank": 25,
    "userEntry": { /* user's leaderboard entry */ }
  }
}
```

### GET /api/leaderboards/user/[userId]
Get specific user's leaderboard position with context.

**Parameters:**
- `type`: 'all-time' | 'weekly'
- `domain`: Domain filter (optional)
- `context`: Number of users above/below (0-20, default: 5)

### GET /api/leaderboards/widget
Get leaderboard data optimized for dashboard widgets.

**Parameters:**
- `type`: 'all-time' | 'weekly'
- `domain`: Domain filter (optional)
- `limit`: Number of entries (1-20, default: 5)
- `includeUser`: Include current user's position (default: false)

### POST /api/leaderboards/update (Admin Only)
Trigger leaderboard cache refresh.

**Body:**
```json
{
  "type": "all-time" | "weekly" (optional),
  "domain": "domain-name" (optional),
  "userId": "user-id" (optional)
}
```

### GET /api/leaderboards/weekly
Get weekly leaderboard history and data.

**Parameters:**
- `action`: 'history' | 'weeks' | 'user-history'
- `weekEnding`: Week ending date (for history)
- `domain`: Domain filter (optional)
- `userId`: User ID (for user-history)
- `weeks`: Number of weeks (for user-history, default: 12)

### POST /api/leaderboards/weekly (Admin Only)
Manage weekly leaderboard archival.

**Body:**
```json
{
  "action": "archive" | "cleanup"
}
```

## Caching Strategy

### Cache Duration
- All-time leaderboards: 5 minutes
- Weekly leaderboards: 2 minutes (more dynamic)

### Cache Keys
Format: `{type}-{domain|all}-{limit}-{offset}`

Examples:
- `all-time-all-10-0`
- `weekly-Game Development-5-0`

### Cache Invalidation
Automatic invalidation occurs when:
- User XP changes (via `awardXP` function)
- Admin triggers manual refresh
- Cache expires naturally
- Weekly reset occurs

## Database Schema

### Leaderboard Indexes
Optimized indexes for leaderboard queries:

```sql
-- All-time leaderboard with domain filtering
CREATE INDEX idx_users_leaderboard_all_time 
ON users(is_active, domain, xp DESC, level DESC, username) 
WHERE is_active = true;

-- Weekly XP calculations
CREATE INDEX idx_user_quest_progress_weekly 
ON user_quest_progress(user_id, completed, completed_at) 
WHERE completed = true AND completed_at >= (NOW() - INTERVAL '7 days');
```

### Weekly Archive Table
```sql
CREATE TABLE weekly_leaderboard_archive (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  week_ending DATE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id),
  username VARCHAR(50) NOT NULL,
  domain VARCHAR(50) NOT NULL,
  weekly_xp INTEGER NOT NULL DEFAULT 0,
  total_xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  rank INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(week_ending, user_id)
);
```

## Performance Considerations

### Query Optimization
- Uses composite indexes for efficient sorting
- Limits result sets with pagination
- Caches frequently accessed data
- Uses partial indexes for active users only

### Memory Management
- In-memory cache with automatic cleanup
- Configurable cache duration
- Selective cache invalidation

### Scalability
- Serverless-friendly architecture
- Stateless service design
- Efficient database queries
- Horizontal scaling support

## Integration with XP System

The leaderboard system automatically updates when XP changes:

```typescript
// In xp-utils.ts
await LeaderboardService.updateLeaderboardsForUser(userId, oldXp, newXp);
```

This ensures real-time leaderboard updates without manual intervention.

## Weekly Reset Process

### Automatic Archival
1. Calculate weekly XP for all users
2. Rank users by weekly performance
3. Archive data to `weekly_leaderboard_archive`
4. Clear weekly leaderboard cache

### Cleanup
- Keeps 52 weeks of historical data
- Automatic cleanup of older records
- Configurable retention period

## Error Handling

### Graceful Degradation
- Cache failures don't break functionality
- Database errors return appropriate HTTP status codes
- Leaderboard update failures don't affect XP awards

### Logging
- Comprehensive error logging
- Performance metrics tracking
- Cache hit/miss statistics

## Testing

### Test Endpoint
`GET /api/leaderboards/test` (Admin only)

Tests:
1. Database connection
2. All-time leaderboard functionality
3. Weekly leaderboard functionality
4. Domain-specific filtering
5. User rank lookup
6. Cache performance

### Usage Example
```bash
curl -X GET "/api/leaderboards/test" \
  -H "Authorization: Bearer admin-token"
```

## Requirements Satisfied

This implementation satisfies the following requirements from the specification:

- **4.1**: Display "Forge Masters" leaderboard showing top 10 members ✅
- **4.2**: Provide both weekly and all-time XP rankings ✅
- **4.3**: Allow filtering by specific domains ✅
- **4.4**: Update leaderboard positions in real-time when XP changes ✅
- **4.5**: Archive previous week's data and start fresh weekly tracking ✅

## Future Enhancements

1. **Redis Integration**: Replace in-memory cache with Redis for multi-instance deployments
2. **Real-time Updates**: WebSocket integration for live leaderboard updates
3. **Advanced Analytics**: Trend analysis and performance insights
4. **Seasonal Leaderboards**: Monthly/quarterly leaderboard cycles
5. **Team Leaderboards**: Domain-based team competitions