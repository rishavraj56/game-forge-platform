# Admin Backend API

This directory contains the administrative backend API endpoints for The Game Forge platform. These endpoints provide comprehensive management capabilities for platform administrators.

## Overview

The admin backend provides the following core functionalities:

1. **Dashboard Analytics** - Platform overview and key metrics
2. **User Management** - User administration, role management, and account control
3. **Content Moderation** - Report handling and content management
4. **Analytics & Metrics** - Detailed platform analytics and insights
5. **Gamification Management** - Quest, badge, and title administration

## Authentication & Authorization

All admin endpoints require:
- Valid user session (NextAuth.js)
- Admin role (`role: 'admin'`)

Unauthorized requests return `403 Forbidden` with error details.

## API Endpoints

### Dashboard
- `GET /api/admin` - Get dashboard overview with key statistics

### User Management
- `GET /api/admin/users` - List users with filtering and pagination
- `GET /api/admin/users/[id]` - Get detailed user information
- `PUT /api/admin/users/[id]` - Update user (role, status, domain, XP)
- `GET /api/admin/users/[id]/sanctions` - Get user sanctions/warnings
- `POST /api/admin/users/[id]/sanctions` - Create user sanction

### Content Moderation
- `GET /api/admin/moderation` - Get moderation queue (reports)
- `GET /api/admin/moderation/[id]` - Get detailed report information
- `PUT /api/admin/moderation/[id]` - Resolve report with action

### Analytics
- `GET /api/admin/analytics` - Get comprehensive platform analytics

### Gamification Management
- `GET /api/admin/gamification` - Get all quests, badges, and titles
- `POST /api/admin/gamification` - Create new quest, badge, or title
- `PUT /api/admin/gamification/[type]/[id]` - Update gamification item
- `DELETE /api/admin/gamification/[type]/[id]` - Delete gamification item

### Testing
- `GET /api/admin/test` - Test admin API functionality

## Request/Response Format

### Standard Response Format
```json
{
  "success": boolean,
  "data": any,
  "error": {
    "code": string,
    "message": string,
    "details": any
  },
  "timestamp": string
}
```

### Paginated Response Format
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": number,
    "limit": number,
    "total": number,
    "totalPages": number,
    "hasNext": boolean,
    "hasPrev": boolean
  },
  "timestamp": string
}
```

## User Management

### Filtering Users
The user management endpoint supports comprehensive filtering:

```
GET /api/admin/users?search=john&domain=Game Development&role=member&isActive=true&sortBy=xp&sortOrder=desc&page=1&limit=20
```

**Parameters:**
- `search` - Search username or email
- `domain` - Filter by domain
- `role` - Filter by user role
- `isActive` - Filter by active status
- `sortBy` - Sort field (created_at, xp, username, level, updated_at)
- `sortOrder` - Sort direction (asc, desc)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)

### Updating Users
Admins can update user properties:

```json
{
  "role": "domain_lead",
  "isActive": true,
  "domain": "Game Development",
  "xp": 1500
}
```

**Restrictions:**
- Admins cannot demote themselves
- XP must be non-negative
- Domain and role must be valid values

### User Sanctions
Create warnings, temporary bans, or permanent bans:

```json
{
  "type": "temporary_ban",
  "reason": "Violation of community guidelines",
  "description": "Inappropriate content in multiple posts",
  "duration": 24
}
```

**Sanction Types:**
- `warning` - Warning message (no restrictions)
- `temporary_ban` - Temporary account suspension
- `permanent_ban` - Permanent account suspension

## Content Moderation

### Report Management
Handle user-generated content reports:

```
GET /api/admin/moderation?status=pending&contentType=post&reason=spam&page=1&limit=20
```

**Report Statuses:**
- `pending` - Awaiting review
- `resolved` - Action taken
- `dismissed` - No action needed

**Report Reasons:**
- `spam` - Spam content
- `harassment` - Harassment or bullying
- `hate_speech` - Hate speech
- `inappropriate_content` - Inappropriate content
- `misinformation` - False information
- `copyright_violation` - Copyright infringement
- `other` - Other reasons

### Report Resolution
Resolve reports with appropriate actions:

```json
{
  "action": "resolve_delete",
  "resolutionNotes": "Content removed for violating community guidelines"
}
```

**Resolution Actions:**
- `dismiss` - No action needed
- `resolve_delete` - Delete the reported content
- `resolve_warn` - Issue warning to content author
- `resolve_ban` - Temporarily ban content author

## Analytics

### Platform Analytics
Get comprehensive platform insights:

```
GET /api/admin/analytics?timeframe=30d&domain=Game Development
```

**Timeframes:**
- `7d` - Last 7 days
- `30d` - Last 30 days (default)
- `90d` - Last 90 days
- `1y` - Last year

**Analytics Include:**
- User growth over time
- Content creation metrics
- Engagement statistics
- Gamification metrics
- Domain breakdowns
- Top users by XP
- Recent activity patterns

## Gamification Management

### Creating Items
Create quests, badges, or titles:

```json
{
  "itemType": "quest",
  "title": "Daily Contributor",
  "description": "Make 3 posts in community channels",
  "type": "daily",
  "xpReward": 50,
  "domain": "Game Development",
  "requirements": [
    {
      "type": "post_count",
      "count": 3,
      "timeframe": "daily"
    }
  ]
}
```

### Updating Items
Update existing gamification items:

```json
{
  "title": "Updated Quest Title",
  "xpReward": 75,
  "isActive": true
}
```

## Error Handling

### Common Error Codes
- `UNAUTHORIZED` (403) - Admin access required
- `NOT_FOUND` (404) - Resource not found
- `INVALID_INPUT` (400) - Invalid request data
- `INTERNAL_ERROR` (500) - Server error

### Error Response Example
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Admin access required"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Logging & Audit Trail

All admin actions are logged in the `moderation_actions` table:
- User updates
- Content moderation actions
- Gamification changes
- User sanctions

This provides a complete audit trail for administrative activities.

## Security Considerations

1. **Role Verification** - All endpoints verify admin role
2. **Self-Protection** - Admins cannot demote themselves
3. **Input Validation** - All inputs are validated and sanitized
4. **Audit Logging** - All actions are logged for accountability
5. **Rate Limiting** - Consider implementing rate limiting for admin endpoints
6. **CSRF Protection** - NextAuth.js provides CSRF protection

## Usage Examples

### Frontend Integration
```typescript
import { useAdmin } from '@/hooks/use-admin';

function AdminDashboard() {
  const {
    dashboardData,
    loadingDashboard,
    fetchDashboard,
    error
  } = useAdmin();

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loadingDashboard) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <p>Total Users: {dashboardData?.users.total_users}</p>
      <p>Active Quests: {dashboardData?.gamification.active_quests}</p>
    </div>
  );
}
```

### Direct API Usage
```typescript
// Fetch dashboard data
const response = await fetch('/api/admin');
const { data } = await response.json();

// Update user role
await fetch('/api/admin/users/user-id', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ role: 'domain_lead' })
});

// Resolve report
await fetch('/api/admin/moderation/report-id', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    action: 'resolve_delete',
    resolutionNotes: 'Content violated guidelines'
  })
});
```

## Testing

Use the test endpoint to verify admin functionality:

```bash
curl -X GET /api/admin/test \
  -H "Authorization: Bearer <admin-session-token>"
```

This endpoint returns a comprehensive overview of available admin features and endpoints.