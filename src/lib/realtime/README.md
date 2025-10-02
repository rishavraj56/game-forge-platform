# Real-time Features Documentation

This directory contains the implementation of real-time features for the Game Forge platform, including WebSocket connections, live updates, and notification systems.

## Overview

The real-time system is built on top of Supabase Realtime, providing:

- **Live Activity Feed**: Real-time updates for community activities
- **Leaderboard Updates**: Instant leaderboard position changes
- **Notification System**: In-app and email notifications
- **Presence Tracking**: Who's online functionality
- **Real-time Chat**: Live messaging capabilities

## Architecture

```
Real-time System
├── Connection Management (connection-manager.ts)
├── Event Handlers (event-handlers.ts)
├── React Hooks (../hooks/useRealtime.ts)
├── React Provider (../components/providers/RealtimeProvider.tsx)
├── Notification Service (../services/notification-service.ts)
├── Email Service (../services/email-service.ts)
└── UI Components (../components/notifications/)
```

## Setup

### 1. Environment Variables

Add these to your `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"

# Email Configuration (optional)
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-email-password"
EMAIL_FROM="noreply@gameforge.dev"
```

### 2. Database Setup

Run the notification migration:

```bash
npm run migrate:up
```

This creates the following tables:
- `notifications` - Stores notification records
- `notification_preferences` - User notification preferences

### 3. Provider Setup

Wrap your app with the RealtimeProvider:

```tsx
import { RealtimeProvider } from '@/lib/realtime';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SessionProvider>
          <RealtimeProvider>
            {children}
          </RealtimeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
```

## Usage

### Activity Feed

```tsx
import { useActivityFeed } from '@/lib/realtime';

function ActivityFeed() {
  const { activities, isLoading } = useActivityFeed();

  return (
    <div>
      {activities.map(activity => (
        <div key={activity.id}>
          {activity.username} {activity.description}
        </div>
      ))}
    </div>
  );
}
```

### Notifications

```tsx
import { useNotifications } from '@/lib/realtime';
import { NotificationCenter } from '@/lib/realtime';

function Header() {
  const { data: session } = useSession();
  
  return (
    <header>
      <NotificationCenter />
    </header>
  );
}
```

### Leaderboard Updates

```tsx
import { useLeaderboardUpdates } from '@/lib/realtime';

function Leaderboard() {
  const { updates, lastUpdate } = useLeaderboardUpdates();

  useEffect(() => {
    if (lastUpdate) {
      // Show animation or update UI
      console.log('Leaderboard updated:', lastUpdate);
    }
  }, [lastUpdate]);

  return <div>Leaderboard content...</div>;
}
```

### Broadcasting Events

```tsx
import { useRealtimeBroadcast } from '@/lib/realtime';

function QuestComponent() {
  const { broadcastActivity } = useRealtimeBroadcast();

  const handleQuestComplete = async () => {
    // Complete quest logic...
    
    // Broadcast activity
    broadcastActivity({
      userId: user.id,
      username: user.username,
      type: 'quest_completed',
      description: 'completed a daily quest',
      metadata: { questId: 'daily-1', xpEarned: 50 }
    });
  };

  return <button onClick={handleQuestComplete}>Complete Quest</button>;
}
```

### Server-side Notifications

```tsx
import { NotificationService } from '@/lib/realtime';

// In your API routes or server actions
export async function completeQuest(userId: string, questId: string) {
  // Quest completion logic...
  
  // Send notification
  await NotificationService.notifyQuestCompletion(
    userId,
    'Daily Challenge',
    100 // XP earned
  );
}
```

## API Endpoints

### Notifications

- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/[id]/read` - Mark notification as read
- `PUT /api/notifications/mark-all-read` - Mark all as read
- `GET /api/notifications/unread-count` - Get unread count
- `GET /api/notifications/preferences` - Get preferences
- `PUT /api/notifications/preferences` - Update preferences

### Real-time Broadcasting

- `POST /api/realtime/broadcast` - Broadcast events to channels

## Event Types

### Activity Events

```typescript
interface ActivityEvent {
  id: string;
  userId: string;
  username: string;
  type: 'quest_completed' | 'post_created' | 'badge_earned' | 'level_up' | 'event_joined';
  description: string;
  metadata?: Record<string, any>;
  timestamp: string;
}
```

### Notification Types

- `achievement` - Quest completions, badges, level ups
- `mention` - User mentions in posts/comments
- `event_reminder` - Upcoming events
- `quest_available` - New quests available
- `system` - Platform announcements

### Leaderboard Updates

```typescript
interface LeaderboardUpdate {
  userId: string;
  username: string;
  domain: string;
  oldPosition?: number;
  newPosition: number;
  xp: number;
  type: 'weekly' | 'all_time';
}
```

## Connection Management

The system automatically handles:

- **Connection Monitoring**: Tracks WebSocket connection status
- **Auto-reconnection**: Exponential backoff retry logic
- **Channel Management**: Subscribe/unsubscribe from channels
- **Error Handling**: Graceful error recovery

### Connection Status

```tsx
import { useRealtimeConnection } from '@/lib/realtime';

function ConnectionStatus() {
  const { connectionStatus, isConnected, connect, disconnect } = useRealtimeConnection();

  return (
    <div>
      Status: {connectionStatus}
      {!isConnected && (
        <button onClick={connect}>Reconnect</button>
      )}
    </div>
  );
}
```

## Presence Tracking

Track who's online in specific areas:

```tsx
import { usePresence } from '@/lib/realtime';

function ChannelView({ channelId }) {
  const { data: session } = useSession();
  const { onlineUsers, isUserOnline } = usePresence(
    channelId,
    session?.user?.id,
    { username: session?.user?.username }
  );

  return (
    <div>
      <p>{onlineUsers.length} users online</p>
      {onlineUsers.map(userId => (
        <span key={userId}>
          {isUserOnline(userId) ? '🟢' : '⚫'} User {userId}
        </span>
      ))}
    </div>
  );
}
```

## Real-time Chat

```tsx
import { useRealtimeChat } from '@/lib/realtime';

function ChatComponent({ channelId }) {
  const { data: session } = useSession();
  const { messages, isTyping, sendMessage, sendTypingIndicator } = useRealtimeChat(
    channelId,
    session?.user?.id
  );

  const handleSendMessage = (content: string) => {
    sendMessage({
      id: Date.now().toString(),
      content,
      userId: session?.user?.id,
      username: session?.user?.username
    });
  };

  return (
    <div>
      <div className="messages">
        {messages.map(message => (
          <div key={message.id}>
            <strong>{message.username}:</strong> {message.content}
          </div>
        ))}
      </div>
      
      {isTyping.length > 0 && (
        <div>
          {isTyping.join(', ')} {isTyping.length === 1 ? 'is' : 'are'} typing...
        </div>
      )}
      
      <input
        onFocus={() => sendTypingIndicator(true)}
        onBlur={() => sendTypingIndicator(false)}
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            handleSendMessage(e.target.value);
            e.target.value = '';
          }
        }}
      />
    </div>
  );
}
```

## Email Notifications

The system supports rich HTML email templates for different notification types:

- **Achievement emails** - Quest completions, badges, level ups
- **Mention emails** - When users are mentioned
- **Event reminders** - Upcoming events
- **System announcements** - Platform updates

Email templates are automatically selected based on notification type and include:
- Responsive HTML design
- Plain text fallback
- Unsubscribe links
- Branded styling

## Performance Considerations

- **Connection Pooling**: Reuse WebSocket connections
- **Event Batching**: Group related events to reduce noise
- **Caching**: Cache notification preferences and user data
- **Rate Limiting**: Prevent notification spam
- **Cleanup**: Automatic cleanup of old notifications

## Security

- **Authentication**: All real-time features require valid session
- **Authorization**: Users can only access their own notifications
- **Rate Limiting**: Prevent abuse of broadcast endpoints
- **Input Validation**: Sanitize all user inputs
- **CORS**: Proper CORS configuration for WebSocket connections

## Troubleshooting

### Connection Issues

1. Check Supabase configuration
2. Verify environment variables
3. Check network connectivity
4. Review browser console for errors

### Notification Issues

1. Verify database migrations ran successfully
2. Check user notification preferences
3. Verify email configuration (if using email notifications)
4. Check server logs for errors

### Performance Issues

1. Monitor WebSocket connection count
2. Check for memory leaks in event handlers
3. Review notification frequency settings
4. Consider implementing notification batching

## Testing

Run the notification service tests:

```bash
npm test src/lib/services/__tests__/notification-service.test.ts
```

Note: Tests require database connection to run fully. The test file serves as documentation for expected behavior.

## Future Enhancements

- **Push Notifications**: Mobile push notification support
- **Notification Batching**: Group similar notifications
- **Advanced Filtering**: More granular notification controls
- **Analytics**: Notification engagement tracking
- **A/B Testing**: Test different notification strategies