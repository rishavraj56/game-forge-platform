/**
 * API Client for Game Forge Platform
 * Provides centralized API communication with error handling and type safety
 */

import { 
  User, 
  Quest, 
  UserQuestProgress, 
  Badge, 
  Title, 
  Channel, 
  Post, 
  Comment, 
  LearningModule, 
  UserModuleProgress, 
  Event, 
  Notification,
  NotificationPreferences,
  Domain,
  QuestType,
  LeaderboardEntry
} from './types';
import { withRetry, RetryOptions, isRetryableError } from './retry-utils';

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface LeaderboardParams extends PaginationParams {
  type?: 'all-time' | 'weekly';
  domain?: Domain;
}

export interface QuestParams {
  type?: QuestType;
  domain?: Domain;
  active?: boolean;
}

class APIClient {
  private baseURL: string;
  private defaultRetryOptions: RetryOptions;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || '';
    this.defaultRetryOptions = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffFactor: 2,
      retryCondition: isRetryableError
    };
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {},
    retryOptions?: RetryOptions
  ): Promise<APIResponse<T>> {
    const makeRequest = async (): Promise<APIResponse<T>> => {
      const url = `${this.baseURL}/api${endpoint}`;
      
      const config: RequestInit = {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      };

      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        const error = new Error(data.error?.message || `HTTP ${response.status}`) as any;
        error.status = response.status;
        error.response = data;
        throw error;
      }

      return data;
    };

    try {
      return await withRetry(makeRequest, {
        ...this.defaultRetryOptions,
        ...retryOptions
      });
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // Authentication APIs
  async register(userData: {
    username: string;
    email: string;
    password: string;
    domain: Domain;
  }): Promise<APIResponse<{ user: User }>> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials: {
    email: string;
    password: string;
  }): Promise<APIResponse<{ user: User }>> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async logout(): Promise<APIResponse> {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  // User APIs
  async getUser(userId: string): Promise<APIResponse<{ user: User }>> {
    return this.request(`/users/${userId}`);
  }

  async updateUser(userId: string, userData: Partial<User>): Promise<APIResponse<{ user: User }>> {
    return this.request(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async searchUsers(query: string, domain?: Domain): Promise<APIResponse<{ users: User[] }>> {
    const params = new URLSearchParams({ query });
    if (domain) params.append('domain', domain);
    
    return this.request(`/users/search?${params}`);
  }

  // Gamification APIs
  async getQuests(params: QuestParams = {}): Promise<APIResponse<{ quests: Quest[] }>> {
    const searchParams = new URLSearchParams();
    if (params.type) searchParams.append('type', params.type);
    if (params.domain) searchParams.append('domain', params.domain);
    if (params.active !== undefined) searchParams.append('active', params.active.toString());

    return this.request(`/gamification/quests?${searchParams}`);
  }

  async completeQuest(questId: string): Promise<APIResponse<{ xpGained: number }>> {
    return this.request(`/gamification/quests/${questId}/complete`, {
      method: 'POST',
    });
  }

  async updateQuestProgress(
    questId: string, 
    progress: number
  ): Promise<APIResponse<{ progress: UserQuestProgress }>> {
    return this.request(`/gamification/progress/${questId}`, {
      method: 'PUT',
      body: JSON.stringify({ progress }),
    });
  }

  async getBadges(): Promise<APIResponse<{ badges: Badge[] }>> {
    return this.request('/gamification/badges');
  }

  async getTitles(): Promise<APIResponse<{ titles: Title[] }>> {
    return this.request('/gamification/titles');
  }

  // Leaderboard APIs
  async getLeaderboard(params: LeaderboardParams = {}): Promise<APIResponse<{
    leaderboard: LeaderboardEntry[];
    pagination: {
      limit: number;
      offset: number;
      total: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    type: string;
    domain?: Domain;
    userRank?: number;
    userEntry?: LeaderboardEntry;
  }>> {
    const searchParams = new URLSearchParams();
    if (params.type) searchParams.append('type', params.type);
    if (params.domain) searchParams.append('domain', params.domain);
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.offset) searchParams.append('offset', params.offset.toString());

    return this.request(`/leaderboards?${searchParams}`);
  }

  // Community APIs
  async getChannels(): Promise<APIResponse<{ channels: Channel[] }>> {
    return this.request('/community/channels');
  }

  async getChannelPosts(channelId: string): Promise<APIResponse<{ posts: Post[] }>> {
    return this.request(`/community/channels/${channelId}/posts`);
  }

  async createPost(channelId: string, content: string): Promise<APIResponse<{ post: Post }>> {
    return this.request(`/community/channels/${channelId}/posts`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async getPostComments(postId: string): Promise<APIResponse<{ comments: Comment[] }>> {
    return this.request(`/community/posts/${postId}/comments`);
  }

  async createComment(postId: string, content: string): Promise<APIResponse<{ comment: Comment }>> {
    return this.request(`/community/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  // Learning Academy APIs
  async getLearningModules(domain?: Domain): Promise<APIResponse<{ modules: LearningModule[] }>> {
    const params = domain ? `?domain=${domain}` : '';
    return this.request(`/academy/modules${params}`);
  }

  async getModuleProgress(moduleId: string): Promise<APIResponse<{ progress: UserModuleProgress }>> {
    return this.request(`/academy/modules/${moduleId}/progress`);
  }

  async updateModuleProgress(
    moduleId: string, 
    progress: number
  ): Promise<APIResponse<{ progress: UserModuleProgress }>> {
    return this.request(`/academy/modules/${moduleId}/progress`, {
      method: 'PUT',
      body: JSON.stringify({ progress }),
    });
  }

  async completeModule(moduleId: string): Promise<APIResponse<{ xpGained: number }>> {
    return this.request(`/academy/modules/${moduleId}/complete`, {
      method: 'POST',
    });
  }

  // Events APIs
  async getEvents(): Promise<APIResponse<{ events: Event[] }>> {
    return this.request('/events');
  }

  async registerForEvent(eventId: string): Promise<APIResponse> {
    return this.request(`/events/${eventId}/register`, {
      method: 'POST',
    });
  }

  async unregisterFromEvent(eventId: string): Promise<APIResponse> {
    return this.request(`/events/${eventId}/register`, {
      method: 'DELETE',
    });
  }

  // Notifications APIs
  async getNotifications(): Promise<APIResponse<{ notifications: Notification[] }>> {
    return this.request('/notifications');
  }

  async markNotificationRead(notificationId: string): Promise<APIResponse> {
    return this.request(`/notifications/${notificationId}`, {
      method: 'PUT',
      body: JSON.stringify({ isRead: true }),
    });
  }

  async markAllNotificationsRead(): Promise<APIResponse> {
    return this.request('/notifications/mark-all-read', {
      method: 'POST',
    });
  }

  async getNotificationPreferences(): Promise<APIResponse<{ preferences: NotificationPreferences }>> {
    return this.request('/notifications/preferences');
  }

  async updateNotificationPreferences(
    preferences: Partial<NotificationPreferences>
  ): Promise<APIResponse<{ preferences: NotificationPreferences }>> {
    return this.request('/notifications/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  }

  async getUnreadNotificationCount(): Promise<APIResponse<{ count: number }>> {
    return this.request('/notifications/unread-count');
  }
}

export const apiClient = new APIClient();