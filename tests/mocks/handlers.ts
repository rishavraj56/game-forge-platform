import { http, HttpResponse } from 'msw'

// Mock data generators (inline to avoid circular dependencies)
const generateMockQuests = (count = 3) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `quest-${i + 1}`,
    title: `Test Quest ${i + 1}`,
    description: `Description for test quest ${i + 1}`,
    type: (i % 2 === 0 ? 'daily' : 'weekly') as 'daily' | 'weekly',
    xp_reward: 50 + i * 25,
    requirements: [
      {
        type: 'test',
        target: 3,
        description: `Complete 3 test actions`,
      },
    ],
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  }))
}

const generateMockLeaderboard = (count = 5) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `user-${i + 1}`,
    username: `User${i + 1}`,
    avatar_url: `/avatars/user-${i + 1}.png`,
    domain: 'Game Development' as const,
    role: 'member' as const,
    xp: 2000 - i * 200,
    level: 10 - i,
    rank: i + 1,
    active_title: i === 0 ? 'Master Forger' : undefined,
    badge_count: 5 - i,
  }))
}

const generateMockPosts = (count = 3) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `post-${i + 1}`,
    channel_id: 'channel-1',
    author_id: 'user-1',
    content: `This is test post content ${i + 1}`,
    attachments: [],
    reaction_counts: { like: i + 1, love: i },
    is_pinned: i === 0,
    is_deleted: false,
    created_at: new Date(Date.now() - i * 60000),
    updated_at: new Date(Date.now() - i * 60000),
  }))
}

const createMockApiResponse = <T>(data: T, success = true) => ({
  success,
  data,
  timestamp: new Date().toISOString(),
  ...(success ? {} : { error: { code: 'TEST_ERROR', message: 'Test error' } }),
})

export const handlers = [
  // Authentication endpoints
  http.post('/api/auth/register', () => {
    return HttpResponse.json(createMockApiResponse({
      user: {
        id: 'new-user-1',
        username: 'NewUser',
        email: 'newuser@example.com',
        domain: 'Game Development',
        role: 'member',
        xp: 0,
        level: 1,
        created_at: new Date(),
      }
    }))
  }),

  http.post('/api/auth/login', () => {
    return HttpResponse.json(createMockApiResponse({
      user: {
        id: 'test-user-1',
        username: 'TestUser',
        email: 'test@example.com',
        domain: 'Game Development',
        role: 'member',
        xp: 1250,
        level: 8,
      }
    }))
  }),

  // Gamification endpoints
  http.get('/api/gamification/quests', ({ request }) => {
    const url = new URL(request.url)
    const type = url.searchParams.get('type')
    const quests = generateMockQuests(5).filter((quest: any) => 
      !type || quest.type === type
    )
    
    return HttpResponse.json(createMockApiResponse({ quests }))
  }),

  http.post('/api/gamification/quests/:questId/complete', () => {
    return HttpResponse.json(createMockApiResponse({
      xpGained: 75
    }))
  }),

  http.get('/api/gamification/badges', () => {
    return HttpResponse.json(createMockApiResponse({
      badges: [
        {
          id: 'badge-1',
          name: 'First Steps',
          description: 'Completed your first quest',
          icon_url: '/badges/first-steps.svg',
          xp_requirement: 10,
          is_active: true,
          created_at: new Date(),
        }
      ]
    }))
  }),

  http.get('/api/gamification/titles', () => {
    return HttpResponse.json(createMockApiResponse({
      titles: [
        {
          id: 'title-1',
          name: 'Apprentice Developer',
          description: 'Starting your journey',
          xp_requirement: 0,
          is_active: true,
          created_at: new Date(),
        }
      ]
    }))
  }),

  // Leaderboard endpoints
  http.get('/api/leaderboards', ({ request }) => {
    const url = new URL(request.url)
    const type = url.searchParams.get('type') || 'all-time'
    const limit = parseInt(url.searchParams.get('limit') || '10')
    
    const leaderboard = generateMockLeaderboard(limit)
    
    return HttpResponse.json(createMockApiResponse({
      leaderboard,
      pagination: {
        limit,
        offset: 0,
        total: leaderboard.length,
        hasNext: false,
        hasPrev: false,
      },
      type,
    }))
  }),

  // Community endpoints
  http.get('/api/community/channels', () => {
    return HttpResponse.json(createMockApiResponse({
      channels: [
        {
          id: 'channel-1',
          name: 'Game Development',
          domain: 'Game Development',
          type: 'primary',
          description: 'Main channel for game development discussions',
          member_count: 1247,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        }
      ]
    }))
  }),

  http.get('/api/community/channels/:channelId/posts', () => {
    return HttpResponse.json(createMockApiResponse({
      posts: generateMockPosts(5)
    }))
  }),

  http.post('/api/community/channels/:channelId/posts', async ({ request }) => {
    const body = await request.json() as { content: string }
    
    return HttpResponse.json(createMockApiResponse({
      post: {
        id: 'new-post-1',
        channel_id: 'channel-1',
        author_id: 'test-user-1',
        content: body.content,
        attachments: [],
        reaction_counts: {},
        is_pinned: false,
        is_deleted: false,
        created_at: new Date(),
        updated_at: new Date(),
      }
    }))
  }),

  http.get('/api/community/posts/:postId/comments', () => {
    return HttpResponse.json(createMockApiResponse({
      comments: [
        {
          id: 'comment-1',
          post_id: 'post-1',
          author_id: 'user-2',
          content: 'Great post!',
          is_deleted: false,
          created_at: new Date(),
          updated_at: new Date(),
        }
      ]
    }))
  }),

  // Learning Academy endpoints
  http.get('/api/academy/modules', () => {
    return HttpResponse.json(createMockApiResponse({
      modules: [
        {
          id: 'module-1',
          title: 'Unity Fundamentals',
          description: 'Learn the basics of Unity',
          domain: 'Game Development',
          difficulty: 'beginner',
          xp_reward: 100,
          content: [],
          prerequisites: [],
          is_published: true,
          created_at: new Date(),
          updated_at: new Date(),
        }
      ]
    }))
  }),

  http.get('/api/academy/modules/:moduleId/progress', () => {
    return HttpResponse.json(createMockApiResponse({
      progress: {
        id: 'progress-1',
        user_id: 'test-user-1',
        module_id: 'module-1',
        completed: false,
        progress: 50,
        started_at: new Date(),
        last_accessed: new Date(),
      }
    }))
  }),

  // Events endpoints
  http.get('/api/events', () => {
    return HttpResponse.json(createMockApiResponse({
      events: [
        {
          id: 'event-1',
          title: '48-Hour Game Jam',
          description: 'Create an amazing game in 48 hours!',
          event_type: 'game_jam',
          start_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          end_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          max_participants: 100,
          current_participants: 67,
          organizer_id: 'user-2',
          is_virtual: true,
          xp_reward: 200,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        }
      ]
    }))
  }),

  // Notifications endpoints
  http.get('/api/notifications', () => {
    return HttpResponse.json(createMockApiResponse({
      notifications: [
        {
          id: 'notif-1',
          user_id: 'test-user-1',
          type: 'quest_completed',
          title: 'Quest Completed!',
          message: 'You completed the "Knowledge Seeker" quest',
          data: { questId: 'quest-1', xpGained: 75 },
          is_read: false,
          created_at: new Date(),
        }
      ]
    }))
  }),

  // Error simulation endpoints
  http.get('/api/test/error', () => {
    return HttpResponse.json(
      createMockApiResponse(null, false),
      { status: 500 }
    )
  }),

  http.get('/api/test/network-error', () => {
    return HttpResponse.error()
  }),
]