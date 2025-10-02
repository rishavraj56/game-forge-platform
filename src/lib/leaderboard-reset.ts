import { db } from './db';
import { LeaderboardService } from './leaderboard-service';

/**
 * Weekly leaderboard reset utilities
 * These functions handle the weekly reset of leaderboard data
 */

export interface WeeklyResetResult {
  success: boolean;
  weekEnding: Date;
  topPerformers: Array<{
    userId: string;
    username: string;
    domain: string;
    weeklyXp: number;
    rank: number;
  }>;
  totalUsers: number;
  error?: string;
}

/**
 * Archive weekly leaderboard data before reset
 */
export async function archiveWeeklyLeaderboard(): Promise<WeeklyResetResult> {
  try {
    const weekEnding = new Date();
    weekEnding.setDate(weekEnding.getDate() - weekEnding.getDay() + 6); // End of current week (Saturday)
    weekEnding.setHours(23, 59, 59, 999);

    const weekStart = new Date(weekEnding);
    weekStart.setDate(weekStart.getDate() - 6); // Start of current week (Sunday)
    weekStart.setHours(0, 0, 0, 0);

    // Create weekly leaderboard archive table if it doesn't exist
    await db`
      CREATE TABLE IF NOT EXISTS weekly_leaderboard_archive (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        week_ending DATE NOT NULL,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        username VARCHAR(50) NOT NULL,
        domain VARCHAR(50) NOT NULL,
        weekly_xp INTEGER NOT NULL DEFAULT 0,
        total_xp INTEGER NOT NULL DEFAULT 0,
        level INTEGER NOT NULL DEFAULT 1,
        rank INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(week_ending, user_id)
      )
    `;

    // Get weekly leaderboard data
    const weeklyData = await db`
      WITH weekly_xp AS (
        SELECT 
          u.id,
          u.username,
          u.domain,
          u.xp as total_xp,
          u.level,
          COALESCE(SUM(q.xp_reward), 0) as weekly_xp
        FROM users u
        LEFT JOIN user_quest_progress uqp ON u.id = uqp.user_id 
          AND uqp.completed = true 
          AND uqp.completed_at >= ${weekStart.toISOString()}
          AND uqp.completed_at <= ${weekEnding.toISOString()}
        LEFT JOIN quests q ON uqp.quest_id = q.id
        WHERE u.is_active = true
        GROUP BY u.id, u.username, u.domain, u.xp, u.level
      )
      SELECT 
        id as user_id,
        username,
        domain,
        total_xp,
        level,
        weekly_xp,
        ROW_NUMBER() OVER (ORDER BY weekly_xp DESC, total_xp DESC, username) as rank
      FROM weekly_xp
      WHERE weekly_xp > 0
      ORDER BY weekly_xp DESC, total_xp DESC, username
    `;

    // Archive the data
    if (weeklyData.rows.length > 0) {
      const archiveValues = weeklyData.rows.map(row => ({
        week_ending: weekEnding.toISOString().split('T')[0],
        user_id: row.user_id,
        username: row.username,
        domain: row.domain,
        weekly_xp: row.weekly_xp,
        total_xp: row.total_xp,
        level: row.level,
        rank: row.rank
      }));

      // Insert archive data (use ON CONFLICT to handle duplicates)
      for (const archive of archiveValues) {
        await db`
          INSERT INTO weekly_leaderboard_archive 
          (week_ending, user_id, username, domain, weekly_xp, total_xp, level, rank)
          VALUES (
            ${archive.week_ending},
            ${archive.user_id},
            ${archive.username},
            ${archive.domain},
            ${archive.weekly_xp},
            ${archive.total_xp},
            ${archive.level},
            ${archive.rank}
          )
          ON CONFLICT (week_ending, user_id) 
          DO UPDATE SET
            username = EXCLUDED.username,
            domain = EXCLUDED.domain,
            weekly_xp = EXCLUDED.weekly_xp,
            total_xp = EXCLUDED.total_xp,
            level = EXCLUDED.level,
            rank = EXCLUDED.rank
        `;
      }
    }

    // Clear weekly leaderboard cache
    LeaderboardService.invalidateCache('weekly');

    return {
      success: true,
      weekEnding,
      topPerformers: weeklyData.rows.slice(0, 10).map(row => ({
        userId: row.user_id,
        username: row.username,
        domain: row.domain,
        weeklyXp: row.weekly_xp,
        rank: row.rank
      })),
      totalUsers: weeklyData.rows.length
    };

  } catch (error) {
    console.error('Archive weekly leaderboard error:', error);
    return {
      success: false,
      weekEnding: new Date(),
      topPerformers: [],
      totalUsers: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get historical weekly leaderboard data
 */
export async function getWeeklyLeaderboardHistory(
  weekEnding?: Date,
  domain?: string,
  limit: number = 10
): Promise<Array<{
  userId: string;
  username: string;
  domain: string;
  weeklyXp: number;
  totalXp: number;
  level: number;
  rank: number;
  weekEnding: Date;
}>> {
  try {
    let query = `
      SELECT 
        user_id,
        username,
        domain,
        weekly_xp,
        total_xp,
        level,
        rank,
        week_ending
      FROM weekly_leaderboard_archive
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (weekEnding) {
      query += ` AND week_ending = $${paramIndex}`;
      params.push(weekEnding.toISOString().split('T')[0]);
      paramIndex++;
    }

    if (domain) {
      query += ` AND domain = $${paramIndex}`;
      params.push(domain);
      paramIndex++;
    }

    query += ` ORDER BY week_ending DESC, rank ASC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await db.query(query, params);

    return result.rows.map(row => ({
      userId: row.user_id,
      username: row.username,
      domain: row.domain,
      weeklyXp: row.weekly_xp,
      totalXp: row.total_xp,
      level: row.level,
      rank: row.rank,
      weekEnding: new Date(row.week_ending)
    }));

  } catch (error) {
    console.error('Get weekly leaderboard history error:', error);
    return [];
  }
}

/**
 * Get available weeks for historical data
 */
export async function getAvailableWeeks(): Promise<Date[]> {
  try {
    const result = await db`
      SELECT DISTINCT week_ending
      FROM weekly_leaderboard_archive
      ORDER BY week_ending DESC
    `;

    return result.rows.map(row => new Date(row.week_ending));

  } catch (error) {
    console.error('Get available weeks error:', error);
    return [];
  }
}

/**
 * Clean up old weekly archive data (keep last 52 weeks)
 */
export async function cleanupWeeklyArchive(): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - (52 * 7)); // 52 weeks ago

    const result = await db`
      DELETE FROM weekly_leaderboard_archive
      WHERE week_ending < ${cutoffDate.toISOString().split('T')[0]}
    `;

    return result.rowCount || 0;

  } catch (error) {
    console.error('Cleanup weekly archive error:', error);
    return 0;
  }
}

/**
 * Get user's weekly performance history
 */
export async function getUserWeeklyHistory(
  userId: string,
  weeks: number = 12
): Promise<Array<{
  weekEnding: Date;
  weeklyXp: number;
  rank: number;
  totalUsers: number;
}>> {
  try {
    const result = await db`
      WITH user_weeks AS (
        SELECT 
          week_ending,
          weekly_xp,
          rank,
          (SELECT COUNT(*) FROM weekly_leaderboard_archive w2 
           WHERE w2.week_ending = w1.week_ending) as total_users
        FROM weekly_leaderboard_archive w1
        WHERE user_id = ${userId}
        ORDER BY week_ending DESC
        LIMIT ${weeks}
      )
      SELECT * FROM user_weeks ORDER BY week_ending ASC
    `;

    return result.rows.map(row => ({
      weekEnding: new Date(row.week_ending),
      weeklyXp: row.weekly_xp,
      rank: row.rank,
      totalUsers: row.total_users
    }));

  } catch (error) {
    console.error('Get user weekly history error:', error);
    return [];
  }
}