import { User, Badge, Title, UserStats, Domain, Quest, UserQuestProgress, QuestRequirement, Channel, Post, Reaction, Attachment, Comment, LearningModule, UserModuleProgress, Difficulty, ModuleContent, Quiz, Certificate, QuizQuestion, Event, Notification, NotificationPreferences, NotificationType } from './types';
import { ActivityItem } from '@/components/dashboard';

export const mockBadges: Badge[] = [
  {
    id: '1',
    name: 'First Steps',
    description: 'Completed your first quest',
    iconUrl: '/badges/first-steps.svg',
    xpRequirement: 10,
    earnedAt: new Date('2024-01-15')
  },
  {
    id: '2',
    name: 'Community Builder',
    description: 'Made 10 posts in community channels',
    iconUrl: '/badges/community-builder.svg',
    xpRequirement: 100,
    earnedAt: new Date('2024-02-01')
  },
  {
    id: '3',
    name: 'Knowledge Seeker',
    description: 'Completed 5 learning modules',
    iconUrl: '/badges/knowledge-seeker.svg',
    xpRequirement: 250,
    earnedAt: new Date('2024-02-15')
  },
  {
    id: '4',
    name: 'Forge Master',
    description: 'Reached level 10',
    iconUrl: '/badges/forge-master.svg',
    xpRequirement: 1000
  }
];

export const mockTitles: Title[] = [
  {
    id: '1',
    name: 'Apprentice Developer',
    description: 'Starting your journey in game development',
    xpRequirement: 0,
    isActive: false
  },
  {
    id: '2',
    name: 'Code Artisan',
    description: 'Skilled in the craft of programming',
    xpRequirement: 500,
    isActive: true
  },
  {
    id: '3',
    name: 'Master Forger',
    description: 'Elite member of The Game Forge',
    xpRequirement: 2000,
    isActive: false
  }
];

export const mockUser: User = {
  id: '1',
  username: 'CodeCrafter42',
  email: 'codecrafter@example.com',
  domain: 'Game Development',
  role: 'member',
  xp: 1250,
  level: 8,
  badges: mockBadges.filter(badge => badge.earnedAt),
  titles: mockTitles,
  avatarUrl: '/avatars/default-avatar.png',
  bio: 'Passionate indie game developer with 3 years of experience in Unity and C#. Love creating immersive gameplay experiences and learning new technologies.',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-03-01')
};

export const mockUserStats: UserStats = {
  totalXP: 1250,
  currentLevel: 8,
  xpToNextLevel: 250,
  xpInCurrentLevel: 150,
  totalBadges: 3,
  questsCompleted: 24,
  postsCreated: 18,
  modulesCompleted: 7
};

export function calculateLevelFromXP(xp: number): number {
  return Math.floor(xp / 200) + 1;
}

export function calculateXPForNextLevel(xp: number): { xpToNext: number; xpInCurrent: number } {
  const currentLevel = calculateLevelFromXP(xp);
  const xpForCurrentLevel = (currentLevel - 1) * 200;
  const xpForNextLevel = currentLevel * 200;

  return {
    xpToNext: xpForNextLevel - xp,
    xpInCurrent: xp - xpForCurrentLevel
  };
}

export const mockDailyQuests: Quest[] = [
  {
    id: 'daily-1',
    title: 'Community Contributor',
    description: 'Make 3 posts in community channels',
    type: 'daily',
    xpReward: 50,
    requirements: [
      {
        type: 'post',
        target: 3,
        description: 'Create 3 posts in any community channel'
      }
    ],
    isActive: true,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    createdAt: new Date()
  },
  {
    id: 'daily-2',
    title: 'Knowledge Seeker',
    description: 'Complete 1 learning module',
    type: 'daily',
    xpReward: 75,
    requirements: [
      {
        type: 'module_complete',
        target: 1,
        description: 'Complete any learning module'
      }
    ],
    domain: 'Game Development',
    isActive: true,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    createdAt: new Date()
  },
  {
    id: 'daily-3',
    title: 'Profile Perfectionist',
    description: 'Update your profile information',
    type: 'daily',
    xpReward: 25,
    requirements: [
      {
        type: 'profile_update',
        target: 1,
        description: 'Update any part of your profile'
      }
    ],
    isActive: true,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    createdAt: new Date()
  }
];

export const mockWeeklyQuests: Quest[] = [
  {
    id: 'weekly-1',
    title: 'Master Forger',
    description: 'Complete 5 daily quests this week',
    type: 'weekly',
    xpReward: 200,
    requirements: [
      {
        type: 'login',
        target: 5,
        description: 'Complete 5 daily quests'
      }
    ],
    isActive: true,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: new Date()
  },
  {
    id: 'weekly-2',
    title: 'Community Leader',
    description: 'Help 10 community members with comments',
    type: 'weekly',
    xpReward: 150,
    requirements: [
      {
        type: 'comment',
        target: 10,
        description: 'Leave helpful comments on 10 posts'
      }
    ],
    isActive: true,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: new Date()
  }
];

export const mockUserQuestProgress: UserQuestProgress[] = [
  {
    questId: 'daily-1',
    userId: '1',
    completed: false,
    progress: 1,
    startedAt: new Date()
  },
  {
    questId: 'daily-2',
    userId: '1',
    completed: true,
    progress: 1,
    completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    startedAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
  },
  {
    questId: 'daily-3',
    userId: '1',
    completed: false,
    progress: 0,
    startedAt: new Date()
  },
  {
    questId: 'weekly-1',
    userId: '1',
    completed: false,
    progress: 3,
    startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  },
  {
    questId: 'weekly-2',
    userId: '1',
    completed: false,
    progress: 7,
    startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  }
];

export const mockLeaderboardUsers: User[] = [
  {
    id: '1',
    username: 'CodeCrafter42',
    email: 'codecrafter@example.com',
    domain: 'Game Development',
    role: 'member',
    xp: 2850,
    level: 15,
    badges: mockBadges.filter(badge => badge.earnedAt),
    titles: mockTitles,
    avatarUrl: '/avatars/avatar-1.png',
    bio: 'Passionate indie game developer',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-03-01')
  },
  {
    id: '2',
    username: 'PixelMaster',
    email: 'pixelmaster@example.com',
    domain: 'Game Art',
    role: 'domain_lead',
    xp: 2650,
    level: 14,
    badges: mockBadges.slice(0, 2),
    titles: mockTitles.slice(0, 2),
    avatarUrl: '/avatars/avatar-2.png',
    bio: '2D/3D artist specializing in game environments',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-03-02')
  },
  {
    id: '3',
    username: 'GameDesignGuru',
    email: 'designguru@example.com',
    domain: 'Game Design',
    role: 'member',
    xp: 2400,
    level: 12,
    badges: mockBadges.slice(0, 3),
    titles: mockTitles.slice(0, 1),
    avatarUrl: '/avatars/avatar-3.png',
    bio: 'Systems designer with focus on player engagement',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-02-28')
  },
  {
    id: '4',
    username: 'AIWizard',
    email: 'aiwizard@example.com',
    domain: 'AI for Game Development',
    role: 'member',
    xp: 2200,
    level: 11,
    badges: mockBadges.slice(0, 2),
    titles: mockTitles.slice(0, 2),
    avatarUrl: '/avatars/avatar-4.png',
    bio: 'ML engineer creating intelligent game systems',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-03-01')
  },
  {
    id: '5',
    username: 'CreativeForce',
    email: 'creative@example.com',
    domain: 'Creative',
    role: 'member',
    xp: 1950,
    level: 10,
    badges: mockBadges.slice(0, 1),
    titles: mockTitles.slice(0, 1),
    avatarUrl: '/avatars/avatar-5.png',
    bio: 'Narrative designer and creative writer',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-02-25')
  }
];

export const mockWeeklyLeaderboardUsers: User[] = [
  mockLeaderboardUsers[2],
  mockLeaderboardUsers[0],
  mockLeaderboardUsers[3],
  mockLeaderboardUsers[1],
  mockLeaderboardUsers[4]
];

export const mockActivityFeed: ActivityItem[] = [
  {
    id: 'activity-1',
    type: 'quest_completed',
    user: {
      id: '1',
      username: 'CodeCrafter42',
      avatarUrl: '/avatars/avatar-1.png',
      domain: 'Game Development'
    },
    title: 'Completed "Community Contributor" quest',
    description: 'Made 3 helpful posts in community channels',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    xpGained: 50,
    metadata: {
      questName: 'Community Contributor'
    }
  },
  {
    id: 'activity-2',
    type: 'badge_earned',
    user: {
      id: '2',
      username: 'PixelMaster',
      avatarUrl: '/avatars/avatar-2.png',
      domain: 'Game Art'
    },
    title: 'Earned "Knowledge Seeker" badge',
    description: 'Completed 5 learning modules in Game Art',
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
    xpGained: 100,
    metadata: {
      badgeName: 'Knowledge Seeker'
    }
  }
];

export const mockEvents: Event[] = [
  {
    id: 'event-1',
    title: '48-Hour Indie Game Jam',
    description: 'Create an amazing game in just 48 hours!',
    type: 'game_jam',
    startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    domain: 'Game Development',
    maxParticipants: 100,
    currentParticipants: 67,
    isRegistered: true,
    organizer: {
      id: '2',
      username: 'PixelMaster',
      domain: 'Game Art'
    },
    location: 'Online',
    isActive: true,
    xpReward: 200,
    tags: ['unity', 'indie', 'competition'],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
  }
];

export const mockUpcomingEvents = mockEvents;

export const mockChannels: Channel[] = [
  {
    id: 'channel-1',
    name: 'Game Development',
    domain: 'Game Development',
    type: 'primary',
    leadId: '1',
    description: 'Main channel for game development discussions',
    memberCount: 1247,
    isActive: true,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'channel-2',
    name: 'Game Design',
    domain: 'Game Design',
    type: 'primary',
    leadId: '3',
    description: 'Game design theory and practice',
    memberCount: 892,
    isActive: true,
    createdAt: new Date('2024-01-01')
  }
];

export const mockPosts: Post[] = [
  {
    id: 'post-1',
    channelId: 'channel-1',
    authorId: '1',
    content: 'Best practices for implementing AI behavior trees in Unity?',
    attachments: [],
    reactions: [
      { id: 'reaction-1', userId: '2', type: 'like', createdAt: new Date(Date.now() - 30 * 60 * 1000) }
    ],
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
  }
];

export const mockComments: Comment[] = [
  {
    id: 'comment-1',
    postId: 'post-1',
    authorId: '4',
    content: 'I recommend using NodeCanvas for Unity behavior trees.',
    reactions: [],
    createdAt: new Date(Date.now() - 90 * 60 * 1000),
    updatedAt: new Date(Date.now() - 90 * 60 * 1000)
  }
];

export const mockLearningModules: LearningModule[] = [
  {
    id: 'module-1',
    title: 'Unity Fundamentals: Getting Started',
    description: 'Learn the basics of Unity game engine.',
    domain: 'Game Development',
    difficulty: 'beginner',
    xpReward: 100,
    estimatedDuration: 120,
    content: [
      {
        id: 'content-1',
        type: 'text',
        title: 'Introduction to Unity Interface',
        content: 'Unity is a powerful game engine...',
        order: 1,
        isRequired: true
      }
    ],
    prerequisites: [],
    tags: ['unity', 'beginner', 'fundamentals'],
    isPublished: true,
    authorId: '7',
    enrollmentCount: 1247,
    rating: 4.8,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-02-01')
  }
];

export const mockUserModuleProgress: UserModuleProgress[] = [
  {
    userId: '1',
    moduleId: 'module-1',
    completed: true,
    progress: 100,
    currentContentId: 'content-1',
    startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    timeSpent: 125
  }
];

export const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    userId: '1',
    type: 'quest_completed',
    title: 'Quest Completed!',
    message: 'You completed the "Knowledge Seeker" daily quest and earned 75 XP!',
    isRead: false,
    actionUrl: '/dashboard',
    metadata: {
      questId: 'daily-2',
      xpGained: 75
    },
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
  }
];

export const mockNotificationPreferences: NotificationPreferences = {
  userId: '1',
  inApp: {
    questCompleted: true,
    badgeEarned: true,
    levelUp: true,
    postReaction: true,
    commentReply: true,
    mention: true,
    eventReminder: true,
    eventRegistration: true,
    moduleCompleted: true,
    systemAnnouncement: true,
    domainAnnouncement: true
  },
  email: {
    questCompleted: false,
    badgeEarned: true,
    levelUp: true,
    postReaction: false,
    commentReply: true,
    mention: true,
    eventReminder: true,
    eventRegistration: true,
    moduleCompleted: false,
    systemAnnouncement: true,
    domainAnnouncement: true
  },
  updatedAt: new Date('2024-02-01')
};

// Helper functions
export function getChannelsByDomain(domain: Domain): Channel[] {
  return mockChannels.filter(channel => channel.domain === domain);
}

export function getPrimaryChannels(): Channel[] {
  return mockChannels.filter(channel => channel.type === 'primary');
}

export function getSubChannels(parentId: string): Channel[] {
  return mockChannels.filter(channel => channel.type === 'sub' && channel.parentId === parentId);
}

export function getChannelById(id: string): Channel | undefined {
  return mockChannels.find(channel => channel.id === id);
}

export function getPostsByChannel(channelId: string): Post[] {
  return mockPosts.filter(post => post.channelId === channelId);
}

export function getPostById(id: string): Post | undefined {
  return mockPosts.find(post => post.id === id);
}

export function getCommentsByPost(postId: string): Comment[] {
  return mockComments.filter(comment => comment.postId === postId);
}

export function getModulesByDomain(domain: Domain): LearningModule[] {
  return mockLearningModules.filter(module => module.domain === domain);
}

export function getModulesByDifficulty(difficulty: Difficulty): LearningModule[] {
  return mockLearningModules.filter(module => module.difficulty === difficulty);
}

export function getUserModuleProgress(userId: string, moduleId: string): UserModuleProgress | undefined {
  return mockUserModuleProgress.find(progress => 
    progress.userId === userId && progress.moduleId === moduleId
  );
}

export function getUserCompletedModules(userId: string): LearningModule[] {
  const completedProgressIds = mockUserModuleProgress
    .filter(progress => progress.userId === userId && progress.completed)
    .map(progress => progress.moduleId);
  
  return mockLearningModules.filter(module => 
    completedProgressIds.includes(module.id)
  );
}

export function getUnreadNotifications(userId: string): Notification[] {
  return mockNotifications.filter(notif => 
    notif.userId === userId && !notif.isRead
  );
}

export function getNotificationsByType(userId: string, type: NotificationType): Notification[] {
  return mockNotifications.filter(notif => 
    notif.userId === userId && notif.type === type
  );
}

export function getActiveQuests(): Quest[] {
  return [...mockDailyQuests, ...mockWeeklyQuests].filter(quest => quest.isActive);
}

export function getUserQuestProgress(userId: string, questId: string): UserQuestProgress | undefined {
  return mockUserQuestProgress.find(progress => 
    progress.userId === userId && progress.questId === questId
  );
}

export function getCompletedQuests(userId: string): Quest[] {
  const completedQuestIds = mockUserQuestProgress
    .filter(progress => progress.userId === userId && progress.completed)
    .map(progress => progress.questId);
  
  return getActiveQuests().filter(quest => 
    completedQuestIds.includes(quest.id)
  );
}

export function getUpcomingEvents(): Event[] {
  const now = new Date();
  return mockEvents
    .filter(event => event.startDate > now && event.isActive)
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
}

export function getEventsByDomain(domain: Domain): Event[] {
  return mockEvents.filter(event => event.domain === domain);
}

export function getUserRegisteredEvents(userId: string): Event[] {
  return mockEvents.filter(event => event.isRegistered);
}

export function getLeaderboardByDomain(domain: Domain, type: 'weekly' | 'all-time' = 'all-time'): User[] {
  const users = type === 'weekly' ? mockWeeklyLeaderboardUsers : mockLeaderboardUsers;
  return users.filter(user => user.domain === domain);
}

export function getUserRank(userId: string, type: 'weekly' | 'all-time' = 'all-time'): number {
  const users = type === 'weekly' ? mockWeeklyLeaderboardUsers : mockLeaderboardUsers;
  const index = users.findIndex(user => user.id === userId);
  return index === -1 ? -1 : index + 1;
}

export const mockData = {
  users: mockLeaderboardUsers,
  currentUser: mockUser,
  userStats: mockUserStats,
  badges: mockBadges,
  titles: mockTitles,
  dailyQuests: mockDailyQuests,
  weeklyQuests: mockWeeklyQuests,
  userQuestProgress: mockUserQuestProgress,
  leaderboardUsers: mockLeaderboardUsers,
  weeklyLeaderboardUsers: mockWeeklyLeaderboardUsers,
  activityFeed: mockActivityFeed,
  events: mockEvents,
  channels: mockChannels,
  posts: mockPosts,
  comments: mockComments,
  learningModules: mockLearningModules,
  userModuleProgress: mockUserModuleProgress,
  notifications: mockNotifications,
  notificationPreferences: mockNotificationPreferences
};

// Additional helper functions that components are expecting
export function getChannelPath(channelId: string): string {
  const channel = getChannelById(channelId);
  if (!channel) return '/community';
  
  if (channel.type === 'sub' && channel.parentId) {
    const parent = getChannelById(channel.parentId);
    return `/community/${parent?.domain.toLowerCase().replace(/\s+/g, '-')}/${channel.name.toLowerCase().replace(/\s+/g, '-')}`;
  }
  
  return `/community/${channel.domain.toLowerCase().replace(/\s+/g, '-')}`;
}

export function getModuleById(id: string): LearningModule | undefined {
  return mockLearningModules.find(module => module.id === id);
}

export function getPostsByChannelId(channelId: string): Post[] {
  return mockPosts.filter(post => post.channelId === channelId);
}

export function getRecentNotifications(userId: string, limit: number = 10): Notification[] {
  return mockNotifications
    .filter(notif => notif.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
}

export function getUserById(id: string): User | undefined {
  return mockLeaderboardUsers.find(user => user.id === id) || 
         (id === mockUser.id ? mockUser : undefined);
}

export function getReplies(commentId: string): Comment[] {
  return mockComments.filter(comment => comment.parentId === commentId);
}

export function getTopLevelComments(postId: string): Comment[] {
  return mockComments.filter(comment => comment.postId === postId && !comment.parentId);
}

export function getRecommendedModules(userId: string, limit: number = 6): LearningModule[] {
  const user = getUserById(userId);
  if (!user) return mockLearningModules.slice(0, limit);
  
  // Return modules from user's domain first, then others
  const domainModules = mockLearningModules.filter(module => module.domain === user.domain);
  const otherModules = mockLearningModules.filter(module => module.domain !== user.domain);
  
  return [...domainModules, ...otherModules].slice(0, limit);
}

export function getUserInProgressModules(userId: string): LearningModule[] {
  const inProgressIds = mockUserModuleProgress
    .filter(progress => progress.userId === userId && !progress.completed)
    .map(progress => progress.moduleId);
  
  return mockLearningModules.filter(module => inProgressIds.includes(module.id));
}

export function searchModules(query: string, domain?: Domain, difficulty?: Difficulty): LearningModule[] {
  let results = mockLearningModules;
  
  if (query) {
    const lowerQuery = query.toLowerCase();
    results = results.filter(module => 
      module.title.toLowerCase().includes(lowerQuery) ||
      module.description.toLowerCase().includes(lowerQuery) ||
      module.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }
  
  if (domain) {
    results = results.filter(module => module.domain === domain);
  }
  
  if (difficulty) {
    results = results.filter(module => module.difficulty === difficulty);
  }
  
  return results;
}