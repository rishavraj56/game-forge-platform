import { db } from './db';
import { awardXP } from './xp-utils';

// Achievement tracking utilities for the gamification system

export interface AchievementCheck {
  badgeId: string;
  titleId?: string;
  condition: (userId: string) => Promise<boolean>;
  xpBonus?: number;
}

// Check and award achievements for a user
export async function checkAndAwardAchievements(userId: string, triggerType: string): Promise<void> {
  try {
    const achievements = getAchievementsByTrigger(triggerType);
    
    for (const achievement of achievements) {
      const meetsCondition = await achievement.condition(userId);
      
      if (meetsCondition) {
        await awardAchievement(userId, achievement);
      }
    }
  } catch (error) {
    console.error('Check achievements error:', error);
    // Don't throw - achievements are nice-to-have, not critical
  }
}

// Award a specific achievement to a user
async function awardAchievement(userId: string, achievement: AchievementCheck): Promise<void> {
  try {
    // Start transaction
    await db`BEGIN`;

    // Check if user already has the badge
    const existingBadge = await db`
      SELECT earned_at FROM user_badges 
      WHERE user_id = ${userId} AND badge_id = ${achievement.badgeId}
    `;

    if (existingBadge.rows.length === 0) {
      // Award badge
      await db`
        INSERT INTO user_badges (user_id, badge_id, earned_at)
        VALUES (${userId}, ${achievement.badgeId}, NOW())
      `;

      // Get badge info for activity
      const badgeResult = await db`
        SELECT name FROM badges WHERE id = ${achievement.badgeId}
      `;

      if (badgeResult.rows.length > 0) {
        const badgeName = badgeResult.rows[0].name;

        // Create activity record
        await db`
          INSERT INTO activities (user_id, type, description, data, created_at)
          VALUES (
            ${userId}, 
            'badge_earned', 
            ${`Earned badge: ${badgeName}`},
            ${JSON.stringify({ 
              badge_id: achievement.badgeId, 
              badge_name: badgeName,
              auto_awarded: true,
              trigger_type: 'achievement_system'
            })},
            NOW()
          )
        `;

        // Award XP bonus if specified
        if (achievement.xpBonus && achievement.xpBonus > 0) {
          await awardXP(userId, achievement.xpBonus, `badge_earned_${badgeName}`);
        }
      }
    }

    // Award title if specified
    if (achievement.titleId) {
      const existingTitle = await db`
        SELECT earned_at FROM user_titles 
        WHERE user_id = ${userId} AND title_id = ${achievement.titleId}
      `;

      if (existingTitle.rows.length === 0) {
        await db`
          INSERT INTO user_titles (user_id, title_id, is_active, earned_at)
          VALUES (${userId}, ${achievement.titleId}, false, NOW())
        `;

        // Get title info for activity
        const titleResult = await db`
          SELECT name FROM titles WHERE id = ${achievement.titleId}
        `;

        if (titleResult.rows.length > 0) {
          const titleName = titleResult.rows[0].name;

          await db`
            INSERT INTO activities (user_id, type, description, data, created_at)
            VALUES (
              ${userId}, 
              'title_earned', 
              ${`Earned title: ${titleName}`},
              ${JSON.stringify({ 
                title_id: achievement.titleId, 
                title_name: titleName,
                auto_awarded: true
              })},
              NOW()
            )
          `;
        }
      }
    }

    await db`COMMIT`;

  } catch (error) {
    await db`ROLLBACK`;
    console.error('Award achievement error:', error);
    throw error;
  }
}

// Get achievements that should be checked for a specific trigger
function getAchievementsByTrigger(triggerType: string): AchievementCheck[] {
  const allAchievements: Record<string, AchievementCheck[]> = {
    'quest_completed': [
      {
        badgeId: 'first-quest-badge',
        condition: async (userId: string) => {
          const result = await db`
            SELECT COUNT(*) as count FROM user_quest_progress 
            WHERE user_id = ${userId} AND completed = true
          `;
          return parseInt(result.rows[0].count) >= 1;
        },
        xpBonus: 50
      },
      {
        badgeId: 'quest-master-badge',
        titleId: 'quest-master-title',
        condition: async (userId: string) => {
          const result = await db`
            SELECT COUNT(*) as count FROM user_quest_progress 
            WHERE user_id = ${userId} AND completed = true
          `;
          return parseInt(result.rows[0].count) >= 100;
        },
        xpBonus: 500
      }
    ],
    'level_up': [
      {
        badgeId: 'level-10-badge',
        condition: async (userId: string) => {
          const result = await db`
            SELECT level FROM users WHERE id = ${userId}
          `;
          return result.rows[0]?.level >= 10;
        },
        xpBonus: 100
      },
      {
        badgeId: 'level-50-badge',
        titleId: 'veteran-title',
        condition: async (userId: string) => {
          const result = await db`
            SELECT level FROM users WHERE id = ${userId}
          `;
          return result.rows[0]?.level >= 50;
        },
        xpBonus: 1000
      }
    ],
    'post_created': [
      {
        badgeId: 'first-post-badge',
        condition: async (userId: string) => {
          const result = await db`
            SELECT COUNT(*) as count FROM posts 
            WHERE author_id = ${userId} AND is_deleted = false
          `;
          return parseInt(result.rows[0].count) >= 1;
        },
        xpBonus: 25
      },
      {
        badgeId: 'prolific-poster-badge',
        condition: async (userId: string) => {
          const result = await db`
            SELECT COUNT(*) as count FROM posts 
            WHERE author_id = ${userId} AND is_deleted = false
          `;
          return parseInt(result.rows[0].count) >= 50;
        },
        xpBonus: 200
      }
    ],
    'module_completed': [
      {
        badgeId: 'first-module-badge',
        condition: async (userId: string) => {
          const result = await db`
            SELECT COUNT(*) as count FROM user_module_progress 
            WHERE user_id = ${userId} AND completed = true
          `;
          return parseInt(result.rows[0].count) >= 1;
        },
        xpBonus: 75
      },
      {
        badgeId: 'learning-enthusiast-badge',
        titleId: 'scholar-title',
        condition: async (userId: string) => {
          const result = await db`
            SELECT COUNT(*) as count FROM user_module_progress 
            WHERE user_id = ${userId} AND completed = true
          `;
          return parseInt(result.rows[0].count) >= 25;
        },
        xpBonus: 500
      }
    ],
    'event_attended': [
      {
        badgeId: 'event-participant-badge',
        condition: async (userId: string) => {
          const result = await db`
            SELECT COUNT(*) as count FROM event_registrations 
            WHERE user_id = ${userId} AND status = 'attended'
          `;
          return parseInt(result.rows[0].count) >= 1;
        },
        xpBonus: 50
      },
      {
        badgeId: 'event-enthusiast-badge',
        condition: async (userId: string) => {
          const result = await db`
            SELECT COUNT(*) as count FROM event_registrations 
            WHERE user_id = ${userId} AND status = 'attended'
          `;
          return parseInt(result.rows[0].count) >= 10;
        },
        xpBonus: 300
      }
    ]
  };

  return allAchievements[triggerType] || [];
}

// Check for streak-based achievements
export async function checkStreakAchievements(userId: string): Promise<void> {
  try {
    // Check daily quest streak
    const dailyStreak = await getDailyQuestStreak(userId);
    if (dailyStreak >= 7) {
      await checkAndAwardAchievements(userId, 'daily_streak_7');
    }
    if (dailyStreak >= 30) {
      await checkAndAwardAchievements(userId, 'daily_streak_30');
    }

    // Check weekly quest streak
    const weeklyStreak = await getWeeklyQuestStreak(userId);
    if (weeklyStreak >= 4) {
      await checkAndAwardAchievements(userId, 'weekly_streak_4');
    }

  } catch (error) {
    console.error('Check streak achievements error:', error);
  }
}

// Get daily quest completion streak
async function getDailyQuestStreak(userId: string): Promise<number> {
  try {
    const result = await db`
      WITH daily_completions AS (
        SELECT DATE(uqp.completed_at) as completion_date
        FROM user_quest_progress uqp
        JOIN quests q ON uqp.quest_id = q.id
        WHERE uqp.user_id = ${userId} 
          AND q.type = 'daily'
          AND uqp.completed = true
        ORDER BY completion_date DESC
      ),
      streak_calc AS (
        SELECT 
          completion_date,
          ROW_NUMBER() OVER (ORDER BY completion_date DESC) as rn,
          completion_date + INTERVAL '1 day' * ROW_NUMBER() OVER (ORDER BY completion_date DESC) as expected_date
        FROM daily_completions
      )
      SELECT COUNT(*) as streak
      FROM streak_calc
      WHERE expected_date = CURRENT_DATE + INTERVAL '1 day' * rn
    `;

    return parseInt(result.rows[0]?.streak) || 0;

  } catch (error) {
    console.error('Get daily quest streak error:', error);
    return 0;
  }
}

// Get weekly quest completion streak
async function getWeeklyQuestStreak(userId: string): Promise<number> {
  try {
    const result = await db`
      WITH weekly_completions AS (
        SELECT 
          DATE_TRUNC('week', uqp.completed_at) as week_start
        FROM user_quest_progress uqp
        JOIN quests q ON uqp.quest_id = q.id
        WHERE uqp.user_id = ${userId} 
          AND q.type = 'weekly'
          AND uqp.completed = true
        GROUP BY week_start
        ORDER BY week_start DESC
      ),
      streak_calc AS (
        SELECT 
          week_start,
          ROW_NUMBER() OVER (ORDER BY week_start DESC) as rn,
          week_start + INTERVAL '1 week' * ROW_NUMBER() OVER (ORDER BY week_start DESC) as expected_week
        FROM weekly_completions
      )
      SELECT COUNT(*) as streak
      FROM streak_calc
      WHERE expected_week = DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '1 week' * rn
    `;

    return parseInt(result.rows[0]?.streak) || 0;

  } catch (error) {
    console.error('Get weekly quest streak error:', error);
    return 0;
  }
}

// Check for domain-specific achievements
export async function checkDomainAchievements(userId: string, domain: string): Promise<void> {
  try {
    const domainAchievements: AchievementCheck[] = [
      {
        badgeId: `${domain.toLowerCase().replace(/\s+/g, '-')}-expert-badge`,
        condition: async (userId: string) => {
          // Check if user has completed 10 quests in their domain
          const result = await db`
            SELECT COUNT(*) as count FROM user_quest_progress uqp
            JOIN quests q ON uqp.quest_id = q.id
            WHERE uqp.user_id = ${userId} 
              AND q.domain = ${domain}
              AND uqp.completed = true
          `;
          return parseInt(result.rows[0].count) >= 10;
        },
        xpBonus: 200
      }
    ];

    for (const achievement of domainAchievements) {
      const meetsCondition = await achievement.condition(userId);
      if (meetsCondition) {
        await awardAchievement(userId, achievement);
      }
    }

  } catch (error) {
    console.error('Check domain achievements error:', error);
  }
}

// Initialize default badges and titles (run once during setup)
export async function initializeDefaultAchievements(): Promise<void> {
  try {
    const defaultBadges = [
      { id: 'first-quest-badge', name: 'First Steps', description: 'Complete your first quest' },
      { id: 'quest-master-badge', name: 'Quest Master', description: 'Complete 100 quests' },
      { id: 'level-10-badge', name: 'Rising Star', description: 'Reach level 10' },
      { id: 'level-50-badge', name: 'Veteran Forger', description: 'Reach level 50' },
      { id: 'first-post-badge', name: 'Voice Heard', description: 'Create your first post' },
      { id: 'prolific-poster-badge', name: 'Community Voice', description: 'Create 50 posts' },
      { id: 'first-module-badge', name: 'Knowledge Seeker', description: 'Complete your first learning module' },
      { id: 'learning-enthusiast-badge', name: 'Scholar', description: 'Complete 25 learning modules' },
      { id: 'event-participant-badge', name: 'Team Player', description: 'Attend your first event' },
      { id: 'event-enthusiast-badge', name: 'Event Enthusiast', description: 'Attend 10 events' }
    ];

    const defaultTitles = [
      { id: 'quest-master-title', name: 'Quest Master', description: 'Master of all quests' },
      { id: 'veteran-title', name: 'Veteran Forger', description: 'A seasoned member of the forge' },
      { id: 'scholar-title', name: 'Scholar', description: 'Dedicated to learning and growth' }
    ];

    // Insert badges if they don't exist
    for (const badge of defaultBadges) {
      await db`
        INSERT INTO badges (id, name, description, is_active, created_at)
        VALUES (${badge.id}, ${badge.name}, ${badge.description}, true, NOW())
        ON CONFLICT (id) DO NOTHING
      `;
    }

    // Insert titles if they don't exist
    for (const title of defaultTitles) {
      await db`
        INSERT INTO titles (id, name, description, is_active, created_at)
        VALUES (${title.id}, ${title.name}, ${title.description}, true, NOW())
        ON CONFLICT (id) DO NOTHING
      `;
    }

  } catch (error) {
    console.error('Initialize default achievements error:', error);
    throw error;
  }
}