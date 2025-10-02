import { db } from './db';
import { Domain, LeaderboardEntry } from './types';
import { cacheService, CacheService, CacheInvalidation } from './cache-service';

export class LeaderboardService {
  
  /**
   * Get leaderboard data with enhanced caching
   */
  static async getLeaderboard(
    type: 'all-time' | 'weekly',
    domain?: Domain,
    limit: number = 10,
    offset: number = 0
  ): Promise<{ leaderboard: LeaderboardEntry[]; total: number }> {
    const cacheKey = CacheService.getLeaderboardKey(type, domain, limit, offset);
    const cacheDuration = type === 'weekly' 
      ? CacheService.CACHE_DURATIONS.LEADERBOARD_WEEKLY 
      : CacheService.CACHE_DURATIONS.LEADERBOARD_ALL_TIME;

    return cacheService.get(
      cacheKey,
      () => this.fetchLeaderboardData(type, domain, limit, offset),
      {
        ttl: cacheDuration,
        tags: [`leaderboard:${type}`, domain ? `domain:${domain}` : 'all-domains'],
        staleWhileRevalidate: cacheDuration * 2, // Serve stale data for 2x the cache duration
      }
    );
  }

  /**
   * Fetch leaderboard data from database
   */
  private static async fetchLeaderboardData(
    type: 'all-time' | 'weekly',
    domain?: Domain,
    limit: number = 10,
    offset: number = 0
  ): Promise<{ leaderboard: LeaderboardEntry[]; total: number }> {
    
    let leaderboardQuery: string;
    let queryParams: any[] = [];
    let paramIndex = 1;

    if (type === 'weekly') {
      // Weekly leaderboard - XP gained in the last 7 days
      leaderboardQuery = `
        WITH weekly_xp AS (
          SELECT 
            u.id,
            u.username,
            u.avatar_url,
            u.domain,
            u.xp as total_xp,
            u.level,
            COALESCE(SUM(q.xp_reward), 0) as weekly_xp
          FROM users u
          LEFT JOIN user_quest_progress uqp ON u.id = uqp.user_id 
            AND uqp.completed = true 
            AND uqp.completed_at >= NOW() - INTERVAL '7 days'
          LEFT JOIN quests q ON uqp.quest_id = q.id
          WHERE u.is_active = true
      `;

      if (domain) {
        leaderboardQuery += ` AND u.domain = $${paramIndex}`;
        queryParams.push(domain);
        paramIndex++;
      }

      leaderboardQuery += `
          GROUP BY u.id, u.username, u.avatar_url, u.domain, u.xp, u.level
        )
        SELECT 
          id,
          username,
          avatar_url,
          domain,
          total_xp as xp,
          level,
          weekly_xp,
          ROW_NUMBER() OVER (ORDER BY weekly_xp DESC, total_xp DESC, username) as rank
        FROM weekly_xp
        ORDER BY weekly_xp DESC, total_xp DESC, username
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      queryParams.push(limit, offset);
    } else {
      // All-time leaderboard - total XP
      leaderboardQuery = `
        SELECT 
          id,
          username,
          avatar_url,
          domain,
          xp,
          level,
          0 as weekly_xp,
          ROW_NUMBER() OVER (ORDER BY xp DESC, level DESC, username) as rank
        FROM users
        WHERE is_active = true
      `;

      if (domain) {
        leaderboardQuery += ` AND domain = $${paramIndex}`;
        queryParams.push(domain);
        paramIndex++;
      }

      leaderboardQuery += `
        ORDER BY xp DESC, level DESC, username
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      queryParams.push(limit, offset);
    }

    const result = await db.query(leaderboardQuery, queryParams);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM users
      WHERE is_active = true
    `;
    let countParams: any[] = [];

    if (domain) {
      countQuery += ` AND domain = $1`;
      countParams.push(domain);
    }

    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    return {
      leaderboard: result.rows,
      total
    };
  }

  /**
   * Get user's rank in leaderboard with caching
   */
  static async getUserRank(
    userId: string,
    type: 'all-time' | 'weekly',
    domain?: Domain
  ): Promise<{ rank: number; entry: LeaderboardEntry } | null> {
    const cacheKey = `user-rank:${userId}:${type}:${domain || 'all'}`;
    const cacheDuration = type === 'weekly' 
      ? CacheService.CACHE_DURATIONS.LEADERBOARD_WEEKLY 
      : CacheService.CACHE_DURATIONS.LEADERBOARD_ALL_TIME;

    return cacheService.get(
      cacheKey,
      () => this.fetchUserRank(userId, type, domain),
      {
        ttl: cacheDuration,
        tags: [`user:${userId}`, `leaderboard:${type}`],
        staleWhileRevalidate: cacheDuration,
      }
    );
  }

  /**
   * Fetch user's rank from database
   */
  private static async fetchUserRank(
    userId: string,
    type: 'all-time' | 'weekly',
    domain?: Domain
  ): Promise<{ rank: number; entry: LeaderboardEntry } | null> {
    let userRankQuery: string;
    let userRankParams: any[] = [userId];

    if (type === 'weekly') {
      userRankQuery = `
        WITH weekly_xp AS (
          SELECT 
            u.id,
            u.username,
            u.avatar_url,
            u.domain,
            u.xp as total_xp,
            u.level,
            COALESCE(SUM(q.xp_reward), 0) as weekly_xp
          FROM users u
          LEFT JOIN user_quest_progress uqp ON u.id = uqp.user_id 
            AND uqp.completed = true 
            AND uqp.completed_at >= NOW() - INTERVAL '7 days'
          LEFT JOIN quests q ON uqp.quest_id = q.id
          WHERE u.is_active = true
      `;

      if (domain) {
        userRankQuery += ` AND u.domain = $2`;
        userRankParams.push(domain);
      }

      userRankQuery += `
          GROUP BY u.id, u.username, u.avatar_url, u.domain, u.xp, u.level
        ),
        ranked_users AS (
          SELECT 
            *,
            ROW_NUMBER() OVER (ORDER BY weekly_xp DESC, total_xp DESC, username) as rank
          FROM weekly_xp
        )
        SELECT 
          id,
          username,
          avatar_url,
          domain,
          total_xp as xp,
          level,
          weekly_xp,
          rank
        FROM ranked_users
        WHERE id = $1
      `;
    } else {
      userRankQuery = `
        WITH ranked_users AS (
          SELECT 
            id,
            username,
            avatar_url,
            domain,
            xp,
            level,
            0 as weekly_xp,
            ROW_NUMBER() OVER (ORDER BY xp DESC, level DESC, username) as rank
          FROM users
          WHERE is_active = true
      `;

      if (domain) {
        userRankQuery += ` AND domain = $2`;
        userRankParams.push(domain);
      }

      userRankQuery += `
        )
        SELECT *
        FROM ranked_users
        WHERE id = $1
      `;
    }

    const result = await db.query(userRankQuery, userRankParams);
    
    if (result.rows.length === 0) {
      return null;
    }

    const entry = result.rows[0];
    return {
      rank: parseInt(entry.rank),
      entry: {
        id: entry.id,
        username: entry.username,
        avatar_url: entry.avatar_url,
        domain: entry.domain,
        xp: parseInt(entry.xp),
        level: parseInt(entry.level),
        weekly_xp: parseInt(entry.weekly_xp || 0),
        rank: parseInt(entry.rank)
      }
    };
  }

  /**
   * Invalidate leaderboard cache
   */
  static invalidateCache(type?: 'all-time' | 'weekly', domain?: Domain): void {
    if (type && domain) {
      // Invalidate specific type and domain
      cacheService.invalidateByTags([`leaderboard:${type}`, `domain:${domain}`]);
    } else if (type) {
      // Invalidate specific type for all domains
      cacheService.invalidateByTags([`leaderboard:${type}`]);
    } else if (domain) {
      // Invalidate specific domain for all types
      cacheService.invalidateByTags([`domain:${domain}`]);
    } else {
      // Clear all leaderboard cache
      CacheInvalidation.leaderboards();
    }
  }

  /**
   * Update leaderboards when user XP changes
   */
  static async updateLeaderboardsForUser(userId: string, oldXp: number, newXp: number): Promise<void> {
    try {
      // Get user's domain
      const userResult = await db.query(
        'SELECT domain FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        return;
      }

      const userDomain = userResult.rows[0].domain as Domain;

      // Invalidate relevant caches using the new cache service
      CacheInvalidation.leaderboards(); // All leaderboards
      CacheInvalidation.user(userId); // User-specific caches
      
      // Also invalidate user rank caches specifically
      cacheService.invalidateByPattern(new RegExp(`user-rank:${userId}:`));

      // Log the leaderboard update
      console.log(`Leaderboard cache invalidated for user ${userId} (${userDomain}): ${oldXp} -> ${newXp} XP`);

    } catch (error) {
      console.error('Error updating leaderboards for user:', error);
    }
  }

  /**
   * Get top performers for dashboard widget with optimized caching
   */
  static async getTopPerformers(limit: number = 5): Promise<LeaderboardEntry[]> {
    const cacheKey = `widget:top-performers:${limit}`;
    
    return cacheService.get(
      cacheKey,
      async () => {
        const { leaderboard } = await this.getLeaderboard('all-time', undefined, limit, 0);
        return leaderboard;
      },
      {
        ttl: CacheService.CACHE_DURATIONS.LEADERBOARD_WIDGET,
        tags: ['widget', 'leaderboard:all-time'],
        staleWhileRevalidate: CacheService.CACHE_DURATIONS.LEADERBOARD_WIDGET,
      }
    );
  }

  /**
   * Get domain-specific top performers with caching
   */
  static async getDomainTopPerformers(domain: Domain, limit: number = 5): Promise<LeaderboardEntry[]> {
    const cacheKey = `widget:domain-performers:${domain}:${limit}`;
    
    return cacheService.get(
      cacheKey,
      async () => {
        const { leaderboard } = await this.getLeaderboard('all-time', domain, limit, 0);
        return leaderboard;
      },
      {
        ttl: CacheService.CACHE_DURATIONS.LEADERBOARD_WIDGET,
        tags: ['widget', 'leaderboard:all-time', `domain:${domain}`],
        staleWhileRevalidate: CacheService.CACHE_DURATIONS.LEADERBOARD_WIDGET,
      }
    );
  }

  /**
   * Get weekly top performers with caching
   */
  static async getWeeklyTopPerformers(limit: number = 5): Promise<LeaderboardEntry[]> {
    const cacheKey = `widget:weekly-performers:${limit}`;
    
    return cacheService.get(
      cacheKey,
      async () => {
        const { leaderboard } = await this.getLeaderboard('weekly', undefined, limit, 0);
        return leaderboard;
      },
      {
        ttl: CacheService.CACHE_DURATIONS.LEADERBOARD_WIDGET,
        tags: ['widget', 'leaderboard:weekly'],
        staleWhileRevalidate: CacheService.CACHE_DURATIONS.LEADERBOARD_WIDGET,
      }
    );
  }

  /**
   * Get cache statistics for monitoring
   */
  static getCacheStats(): {
    size: number;
    keys: string[];
    memoryUsage: number;
  } {
    return cacheService.getStats();
  }

  /**
   * Warm up cache with frequently accessed data
   */
  static async warmupCache(): Promise<void> {
    try {
      // Warm up top performers for all domains
      const domains: Domain[] = ['Game Development', 'Game Design', 'Game Art', 'AI for Game Development', 'Creative', 'Corporate'];
      
      // Warm up general leaderboards
      await Promise.all([
        this.getTopPerformers(10),
        this.getWeeklyTopPerformers(10),
        ...domains.map(domain => this.getDomainTopPerformers(domain, 5))
      ]);

      console.log('Leaderboard cache warmed up successfully');
    } catch (error) {
      console.error('Error warming up leaderboard cache:', error);
    }
  }
}