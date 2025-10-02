import { db } from './db';
import { LeaderboardService } from './leaderboard-service';

// XP calculation utilities for the gamification system

export interface XPCalculation {
  totalXp: number;
  level: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  progressToNextLevel: number;
}

export interface XPSource {
  source: string;
  amount: number;
  date: Date;
}

// Calculate level from XP (formula: level = floor(xp / 1000) + 1)
export function calculateLevel(xp: number): number {
  return Math.floor(xp / 1000) + 1;
}

// Calculate XP required for a specific level
export function getXpForLevel(level: number): number {
  return (level - 1) * 1000;
}

// Calculate XP needed to reach next level
export function getXpForNextLevel(currentXp: number): number {
  const currentLevel = calculateLevel(currentXp);
  return getXpForLevel(currentLevel + 1);
}

// Calculate progress percentage to next level
export function getProgressToNextLevel(currentXp: number): number {
  const currentLevel = calculateLevel(currentXp);
  const xpForCurrentLevel = getXpForLevel(currentLevel);
  const xpForNextLevel = getXpForLevel(currentLevel + 1);
  const progressXp = currentXp - xpForCurrentLevel;
  const levelXpRange = xpForNextLevel - xpForCurrentLevel;
  
  return Math.round((progressXp / levelXpRange) * 100);
}

// Get comprehensive XP calculation for a user
export function getXPCalculation(xp: number): XPCalculation {
  const level = calculateLevel(xp);
  const xpForCurrentLevel = getXpForLevel(level);
  const xpForNextLevel = getXpForLevel(level + 1);
  const progressToNextLevel = getProgressToNextLevel(xp);

  return {
    totalXp: xp,
    level,
    xpForCurrentLevel,
    xpForNextLevel,
    progressToNextLevel
  };
}

// Award XP to a user and update their level
export async function awardXP(userId: string, amount: number, source: string): Promise<XPCalculation> {
  try {
    // Start transaction
    await db`BEGIN`;

    // Get current user XP and level
    const userResult = await db`
      SELECT xp, level FROM users WHERE id = ${userId}
    `;

    if (userResult.rows.length === 0) {
      await db`ROLLBACK`;
      throw new Error('User not found');
    }

    const currentXp = userResult.rows[0].xp;
    const currentLevel = userResult.rows[0].level;
    const newXp = currentXp + amount;
    const newLevel = calculateLevel(newXp);

    const now = new Date();

    // Update user XP and level
    await db`
      UPDATE users 
      SET xp = ${newXp}, level = ${newLevel}, updated_at = ${now.toISOString()}
      WHERE id = ${userId}
    `;

    // Create activity record for XP gain
    await db`
      INSERT INTO activities (user_id, type, description, data, created_at)
      VALUES (
        ${userId}, 
        'xp_earned', 
        ${`Earned ${amount} XP from ${source}`},
        ${JSON.stringify({ 
          source,
          amount,
          old_xp: currentXp,
          new_xp: newXp,
          old_level: currentLevel,
          new_level: newLevel
        })},
        ${now.toISOString()}
      )
    `;

    // If leveled up, create level up activity
    if (newLevel > currentLevel) {
      await db`
        INSERT INTO activities (user_id, type, description, data, created_at)
        VALUES (
          ${userId}, 
          'level_up', 
          ${`Reached level ${newLevel}!`},
          ${JSON.stringify({ 
            old_level: currentLevel, 
            new_level: newLevel,
            total_xp: newXp
          })},
          ${now.toISOString()}
        )
      `;
    }

    await db`COMMIT`;

    // Update leaderboards after successful XP award
    try {
      await LeaderboardService.updateLeaderboardsForUser(userId, currentXp, newXp);
    } catch (leaderboardError) {
      // Don't fail the XP award if leaderboard update fails
      console.error('Leaderboard update error after XP award:', leaderboardError);
    }

    return getXPCalculation(newXp);

  } catch (error) {
    await db`ROLLBACK`;
    console.error('Award XP error:', error);
    throw error;
  }
}

// Get XP breakdown for a user (sources of XP)
export async function getUserXPBreakdown(userId: string, days: number = 30): Promise<XPSource[]> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await db`
      SELECT 
        (data->>'source')::text as source,
        (data->>'amount')::integer as amount,
        created_at as date
      FROM activities 
      WHERE user_id = ${userId} 
        AND type = 'xp_earned'
        AND created_at >= ${cutoffDate.toISOString()}
      ORDER BY created_at DESC
    `;

    return result.rows.map(row => ({
      source: row.source || 'Unknown',
      amount: row.amount || 0,
      date: new Date(row.date)
    }));

  } catch (error) {
    console.error('Get XP breakdown error:', error);
    throw error;
  }
}

// Get weekly XP for leaderboard calculations
export async function getWeeklyXP(userId: string): Promise<number> {
  try {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
    weekStart.setHours(0, 0, 0, 0);

    const result = await db`
      SELECT COALESCE(SUM((data->>'amount')::integer), 0) as weekly_xp
      FROM activities 
      WHERE user_id = ${userId} 
        AND type = 'xp_earned'
        AND created_at >= ${weekStart.toISOString()}
    `;

    return parseInt(result.rows[0].weekly_xp) || 0;

  } catch (error) {
    console.error('Get weekly XP error:', error);
    throw error;
  }
}

// Validate XP amount for different sources
export function validateXPAmount(source: string, amount: number): boolean {
  const xpLimits: Record<string, { min: number; max: number }> = {
    'quest_completion': { min: 10, max: 1000 },
    'module_completion': { min: 50, max: 2000 },
    'event_participation': { min: 25, max: 500 },
    'post_creation': { min: 5, max: 50 },
    'comment_creation': { min: 2, max: 20 },
    'badge_earned': { min: 100, max: 5000 },
    'manual_award': { min: 1, max: 10000 }
  };

  const limits = xpLimits[source];
  if (!limits) {
    return amount >= 1 && amount <= 100; // Default limits
  }

  return amount >= limits.min && amount <= limits.max;
}

// Calculate bonus XP for streaks or special conditions
export function calculateBonusXP(baseAmount: number, bonusType: string, multiplier: number = 1): number {
  const bonusMultipliers: Record<string, number> = {
    'daily_streak': 1.2,
    'weekly_streak': 1.5,
    'domain_expert': 1.3,
    'first_completion': 2.0,
    'perfect_score': 1.5
  };

  const bonus = bonusMultipliers[bonusType] || 1;
  return Math.round(baseAmount * bonus * multiplier);
}

// Reset daily/weekly quest eligibility (for cron jobs)
export async function resetQuestEligibility(type: 'daily' | 'weekly'): Promise<void> {
  try {
    if (type === 'daily') {
      // Reset daily quest eligibility at midnight
      await db`
        UPDATE user_quest_progress 
        SET completed = false, progress = 0, completed_at = NULL, updated_at = NOW()
        WHERE quest_id IN (
          SELECT id FROM quests WHERE type = 'daily' AND is_active = true
        )
        AND completed = true
        AND DATE(completed_at) < CURRENT_DATE
      `;
    } else if (type === 'weekly') {
      // Reset weekly quest eligibility at start of week
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);

      await db`
        UPDATE user_quest_progress 
        SET completed = false, progress = 0, completed_at = NULL, updated_at = NOW()
        WHERE quest_id IN (
          SELECT id FROM quests WHERE type = 'weekly' AND is_active = true
        )
        AND completed = true
        AND completed_at < ${weekStart.toISOString()}
      `;
    }
  } catch (error) {
    console.error(`Reset ${type} quest eligibility error:`, error);
    throw error;
  }
}