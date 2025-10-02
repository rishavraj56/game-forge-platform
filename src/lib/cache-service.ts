/**
 * Comprehensive caching service for API responses and data
 * Implements multiple caching strategies for different types of data
 */

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  tags: string[]; // Cache tags for invalidation
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  tags?: string[]; // Tags for cache invalidation
  staleWhileRevalidate?: number; // Additional time to serve stale data
}

class CacheService {
  private cache = new Map<string, CacheEntry>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Cache durations for different data types
   */
  static readonly CACHE_DURATIONS = {
    // Leaderboards - frequently updated
    LEADERBOARD_ALL_TIME: 5 * 60 * 1000, // 5 minutes
    LEADERBOARD_WEEKLY: 2 * 60 * 1000, // 2 minutes
    LEADERBOARD_WIDGET: 3 * 60 * 1000, // 3 minutes

    // User data - moderately dynamic
    USER_PROFILE: 10 * 60 * 1000, // 10 minutes
    USER_PROGRESS: 5 * 60 * 1000, // 5 minutes
    USER_BADGES: 15 * 60 * 1000, // 15 minutes

    // Gamification - semi-static
    QUESTS: 30 * 60 * 1000, // 30 minutes
    BADGES: 60 * 60 * 1000, // 1 hour
    TITLES: 60 * 60 * 1000, // 1 hour

    // Community content - dynamic
    POSTS: 2 * 60 * 1000, // 2 minutes
    CHANNELS: 10 * 60 * 1000, // 10 minutes
    COMMENTS: 1 * 60 * 1000, // 1 minute

    // Learning content - static
    MODULES: 30 * 60 * 1000, // 30 minutes
    MODULE_CONTENT: 60 * 60 * 1000, // 1 hour

    // Events - semi-dynamic
    EVENTS: 15 * 60 * 1000, // 15 minutes
    EVENT_DETAILS: 10 * 60 * 1000, // 10 minutes

    // Admin/Analytics - less frequent updates
    ANALYTICS: 30 * 60 * 1000, // 30 minutes
    ADMIN_STATS: 15 * 60 * 1000, // 15 minutes

    // Static/Reference data
    DOMAINS: 2 * 60 * 60 * 1000, // 2 hours
    SYSTEM_CONFIG: 60 * 60 * 1000, // 1 hour
  } as const;

  /**
   * Get data from cache or execute function if not cached/expired
   */
  async get<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = this.cache.get(key);
    const now = Date.now();
    const ttl = options.ttl || this.defaultTTL;
    const staleTime = options.staleWhileRevalidate || 0;

    // Check if we have valid cached data
    if (cached && (now - cached.timestamp) < cached.ttl) {
      return cached.data;
    }

    // Check if we can serve stale data while revalidating
    if (cached && staleTime > 0 && (now - cached.timestamp) < (cached.ttl + staleTime)) {
      // Serve stale data immediately
      const staleData = cached.data;
      
      // Revalidate in background (don't await)
      this.revalidateInBackground(key, fetchFn, options);
      
      return staleData;
    }

    // Fetch fresh data
    const data = await fetchFn();
    
    // Cache the result
    this.set(key, data, options);
    
    return data;
  }

  /**
   * Set data in cache
   */
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const ttl = options.ttl || this.defaultTTL;
    const tags = options.tags || [];

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      tags,
    });
  }

  /**
   * Get data from cache without fetching
   */
  getSync<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if ((now - cached.timestamp) >= cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;

    const now = Date.now();
    if ((now - cached.timestamp) >= cached.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete specific key from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Invalidate cache by tags
   */
  invalidateByTags(tags: string[]): number {
    let deletedCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.some(tag => tags.includes(tag))) {
        this.cache.delete(key);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * Invalidate cache by key pattern
   */
  invalidateByPattern(pattern: RegExp): number {
    let deletedCount = 0;
    
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    keys: string[];
    memoryUsage: number;
  } {
    const keys = Array.from(this.cache.keys());
    const memoryUsage = JSON.stringify(Array.from(this.cache.entries())).length;

    return {
      size: this.cache.size,
      keys,
      memoryUsage,
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let deletedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if ((now - entry.timestamp) >= entry.ttl) {
        this.cache.delete(key);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * Revalidate cache entry in background
   */
  private async revalidateInBackground<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: CacheOptions
  ): Promise<void> {
    try {
      const data = await fetchFn();
      this.set(key, data, options);
    } catch (error) {
      console.error(`Background revalidation failed for key ${key}:`, error);
    }
  }

  /**
   * Generate cache key for leaderboard
   */
  static getLeaderboardKey(
    type: 'all-time' | 'weekly',
    domain?: string,
    limit?: number,
    offset?: number
  ): string {
    return `leaderboard:${type}:${domain || 'all'}:${limit || 10}:${offset || 0}`;
  }

  /**
   * Generate cache key for user data
   */
  static getUserKey(userId: string, dataType: string): string {
    return `user:${userId}:${dataType}`;
  }

  /**
   * Generate cache key for gamification data
   */
  static getGamificationKey(type: string, userId?: string, domain?: string): string {
    const parts = ['gamification', type];
    if (userId) parts.push(userId);
    if (domain) parts.push(domain);
    return parts.join(':');
  }

  /**
   * Generate cache key for community data
   */
  static getCommunityKey(type: string, id?: string, params?: Record<string, any>): string {
    const parts = ['community', type];
    if (id) parts.push(id);
    if (params) {
      const paramString = Object.entries(params)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}:${v}`)
        .join('|');
      if (paramString) parts.push(paramString);
    }
    return parts.join(':');
  }

  /**
   * Generate cache key for learning data
   */
  static getLearningKey(type: string, id?: string, userId?: string): string {
    const parts = ['learning', type];
    if (id) parts.push(id);
    if (userId) parts.push(userId);
    return parts.join(':');
  }
}

// Create singleton instance
export const cacheService = new CacheService();

// Schedule cleanup every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const deletedCount = cacheService.cleanup();
    if (deletedCount > 0) {
      console.log(`Cache cleanup: removed ${deletedCount} expired entries`);
    }
  }, 10 * 60 * 1000);
}

// Cache invalidation helpers
export const CacheInvalidation = {
  /**
   * Invalidate user-related caches
   */
  user: (userId: string) => {
    cacheService.invalidateByTags([`user:${userId}`]);
    cacheService.invalidateByPattern(new RegExp(`user:${userId}:`));
  },

  /**
   * Invalidate leaderboard caches
   */
  leaderboards: (domain?: string) => {
    if (domain) {
      cacheService.invalidateByPattern(new RegExp(`leaderboard:.*:${domain}:`));
    } else {
      cacheService.invalidateByPattern(new RegExp(`leaderboard:`));
    }
  },

  /**
   * Invalidate gamification caches
   */
  gamification: (userId?: string) => {
    if (userId) {
      cacheService.invalidateByPattern(new RegExp(`gamification:.*:${userId}`));
    } else {
      cacheService.invalidateByPattern(new RegExp(`gamification:`));
    }
  },

  /**
   * Invalidate community caches
   */
  community: (channelId?: string) => {
    if (channelId) {
      cacheService.invalidateByPattern(new RegExp(`community:.*:${channelId}`));
    } else {
      cacheService.invalidateByPattern(new RegExp(`community:`));
    }
  },

  /**
   * Invalidate learning caches
   */
  learning: (moduleId?: string, userId?: string) => {
    if (moduleId && userId) {
      cacheService.invalidateByPattern(new RegExp(`learning:.*:${moduleId}:${userId}`));
    } else if (moduleId) {
      cacheService.invalidateByPattern(new RegExp(`learning:.*:${moduleId}`));
    } else {
      cacheService.invalidateByPattern(new RegExp(`learning:`));
    }
  },
};

export { CacheService };