import { sql } from '@vercel/postgres';

// User-related database operations
export async function getUserById(id: string) {
  const result = await sql`
    SELECT id, username, email, domain, role, xp, level, avatar_url, bio, is_active, created_at, updated_at
    FROM users 
    WHERE id = ${id} AND is_active = true
  `;
  return result.rows[0] || null;
}

export async function getUserByEmail(email: string) {
  const result = await sql`
    SELECT id, username, email, domain, role, xp, level, avatar_url, bio, is_active, created_at, updated_at
    FROM users 
    WHERE email = ${email} AND is_active = true
  `;
  return result.rows[0] || null;
}

export async function getUserByUsername(username: string) {
  const result = await sql`
    SELECT id, username, email, domain, role, xp, level, avatar_url, bio, is_active, created_at, updated_at
    FROM users 
    WHERE username = ${username} AND is_active = true
  `;
  return result.rows[0] || null;
}

export async function updateUserXP(userId: string, xpToAdd: number) {
  const result = await sql`
    UPDATE users 
    SET xp = xp + ${xpToAdd}, 
        level = FLOOR((xp + ${xpToAdd}) / 100) + 1,
        updated_at = NOW()
    WHERE id = ${userId}
    RETURNING xp, level
  `;
  return result.rows[0];
}

// Quest-related operations
export async function getUserActiveQuests(userId: string) {
  const result = await sql`
    SELECT q.*, uqp.completed, uqp.progress, uqp.completed_at
    FROM quests q
    LEFT JOIN user_quest_progress uqp ON q.id = uqp.quest_id AND uqp.user_id = ${userId}
    WHERE q.is_active = true
    ORDER BY q.type, q.created_at
  `;
  return result.rows;
}

export async function completeQuest(userId: string, questId: string) {
  const result = await sql`
    INSERT INTO user_quest_progress (user_id, quest_id, completed, progress, completed_at)
    VALUES (${userId}, ${questId}, true, 100, NOW())
    ON CONFLICT (user_id, quest_id) 
    DO UPDATE SET completed = true, progress = 100, completed_at = NOW()
    RETURNING *
  `;
  return result.rows[0];
}

// Leaderboard operations
export async function getLeaderboard(domain?: string, timeframe: 'weekly' | 'all-time' = 'all-time', limit = 10) {
  if (timeframe === 'weekly') {
    if (domain) {
      const result = await sql`
        SELECT u.id, u.username, u.avatar_url, u.domain, u.xp, u.level,
               COALESCE(weekly_xp.xp, 0) as weekly_xp
        FROM users u
        LEFT JOIN (
          SELECT uqp.user_id, SUM(q.xp_reward) as xp
          FROM user_quest_progress uqp
          JOIN quests q ON uqp.quest_id = q.id
          WHERE uqp.completed_at >= date_trunc('week', NOW())
          GROUP BY uqp.user_id
        ) weekly_xp ON u.id = weekly_xp.user_id
        WHERE u.is_active = true AND u.domain = ${domain}
        ORDER BY weekly_xp.xp DESC NULLS LAST, u.xp DESC
        LIMIT ${limit}
      `;
      return result.rows;
    } else {
      const result = await sql`
        SELECT u.id, u.username, u.avatar_url, u.domain, u.xp, u.level,
               COALESCE(weekly_xp.xp, 0) as weekly_xp
        FROM users u
        LEFT JOIN (
          SELECT uqp.user_id, SUM(q.xp_reward) as xp
          FROM user_quest_progress uqp
          JOIN quests q ON uqp.quest_id = q.id
          WHERE uqp.completed_at >= date_trunc('week', NOW())
          GROUP BY uqp.user_id
        ) weekly_xp ON u.id = weekly_xp.user_id
        WHERE u.is_active = true
        ORDER BY weekly_xp.xp DESC NULLS LAST, u.xp DESC
        LIMIT ${limit}
      `;
      return result.rows;
    }
  } else {
    if (domain) {
      const result = await sql`
        SELECT u.id, u.username, u.avatar_url, u.domain, u.xp, u.level
        FROM users u
        WHERE u.is_active = true AND u.domain = ${domain}
        ORDER BY u.xp DESC
        LIMIT ${limit}
      `;
      return result.rows;
    } else {
      const result = await sql`
        SELECT u.id, u.username, u.avatar_url, u.domain, u.xp, u.level
        FROM users u
        WHERE u.is_active = true
        ORDER BY u.xp DESC
        LIMIT ${limit}
      `;
      return result.rows;
    }
  }
}

// Channel and post operations
export async function getChannelsByDomain(domain: string) {
  const result = await sql`
    SELECT c.*, u.username as lead_username
    FROM channels c
    LEFT JOIN users u ON c.lead_id = u.id
    WHERE c.domain = ${domain} AND c.is_active = true
    ORDER BY c.type, c.created_at
  `;
  return result.rows;
}

export async function getChannelPosts(channelId: string, limit = 20, offset = 0) {
  const result = await sql`
    SELECT p.*, u.username, u.avatar_url, u.domain as user_domain,
           (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND is_deleted = false) as comment_count
    FROM posts p
    JOIN users u ON p.author_id = u.id
    WHERE p.channel_id = ${channelId} AND p.is_deleted = false
    ORDER BY p.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;
  return result.rows;
}

// Learning module operations
export async function getLearningModulesByDomain(domain: string) {
  const result = await sql`
    SELECT lm.*, 
           (SELECT COUNT(*) FROM user_module_progress WHERE module_id = lm.id AND completed = true) as completion_count
    FROM learning_modules lm
    WHERE lm.domain = ${domain} AND lm.is_published = true
    ORDER BY lm.difficulty, lm.created_at
  `;
  return result.rows;
}

export async function getUserModuleProgress(userId: string, moduleId: string) {
  const result = await sql`
    SELECT * FROM user_module_progress
    WHERE user_id = ${userId} AND module_id = ${moduleId}
  `;
  return result.rows[0] || null;
}

// Event operations
export async function getUpcomingEvents(domain?: string, limit = 10) {
  if (domain) {
    const result = await sql`
      SELECT e.*, u.username as organizer_username,
             (SELECT COUNT(*) FROM event_registrations WHERE event_id = e.id) as registration_count
      FROM events e
      JOIN users u ON e.organizer_id = u.id
      WHERE e.is_active = true AND e.start_date > NOW() AND e.domain = ${domain}
      ORDER BY e.start_date ASC
      LIMIT ${limit}
    `;
    return result.rows;
  } else {
    const result = await sql`
      SELECT e.*, u.username as organizer_username,
             (SELECT COUNT(*) FROM event_registrations WHERE event_id = e.id) as registration_count
      FROM events e
      JOIN users u ON e.organizer_id = u.id
      WHERE e.is_active = true AND e.start_date > NOW()
      ORDER BY e.start_date ASC
      LIMIT ${limit}
    `;
    return result.rows;
  }
}

// Notification operations
export async function createNotification(userId: string, type: string, title: string, message: string, data = {}) {
  const result = await sql`
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (${userId}, ${type}, ${title}, ${message}, ${JSON.stringify(data)})
    RETURNING *
  `;
  return result.rows[0];
}

export async function getUserNotifications(userId: string, limit = 20, unreadOnly = false) {
  if (unreadOnly) {
    const result = await sql`
      SELECT * FROM notifications
      WHERE user_id = ${userId} AND is_read = false
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
    return result.rows;
  } else {
    const result = await sql`
      SELECT * FROM notifications
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
    return result.rows;
  }
}

export async function markNotificationAsRead(notificationId: string) {
  const result = await sql`
    UPDATE notifications 
    SET is_read = true 
    WHERE id = ${notificationId}
    RETURNING *
  `;
  return result.rows[0];
}

// Activity feed operations
export async function createActivity(userId: string, type: string, description: string, data = {}) {
  const result = await sql`
    INSERT INTO activities (user_id, type, description, data)
    VALUES (${userId}, ${type}, ${description}, ${JSON.stringify(data)})
    RETURNING *
  `;
  return result.rows[0];
}

export async function getActivityFeed(limit = 50, domain?: string) {
  if (domain) {
    const result = await sql`
      SELECT a.*, u.username, u.avatar_url, u.domain as user_domain
      FROM activities a
      JOIN users u ON a.user_id = u.id
      WHERE u.is_active = true AND u.domain = ${domain}
      ORDER BY a.created_at DESC
      LIMIT ${limit}
    `;
    return result.rows;
  } else {
    const result = await sql`
      SELECT a.*, u.username, u.avatar_url, u.domain as user_domain
      FROM activities a
      JOIN users u ON a.user_id = u.id
      WHERE u.is_active = true
      ORDER BY a.created_at DESC
      LIMIT ${limit}
    `;
    return result.rows;
  }
}

// Badge and title operations
export async function getUserBadges(userId: string) {
  const result = await sql`
    SELECT b.*, ub.earned_at
    FROM badges b
    JOIN user_badges ub ON b.id = ub.badge_id
    WHERE ub.user_id = ${userId}
    ORDER BY ub.earned_at DESC
  `;
  return result.rows;
}

export async function awardBadge(userId: string, badgeId: string) {
  const result = await sql`
    INSERT INTO user_badges (user_id, badge_id)
    VALUES (${userId}, ${badgeId})
    ON CONFLICT (user_id, badge_id) DO NOTHING
    RETURNING *
  `;
  return result.rows[0];
}

export async function getUserTitles(userId: string) {
  const result = await sql`
    SELECT t.*, ut.is_active, ut.earned_at
    FROM titles t
    JOIN user_titles ut ON t.id = ut.title_id
    WHERE ut.user_id = ${userId}
    ORDER BY ut.earned_at DESC
  `;
  return result.rows;
}

// Statistics and analytics
export async function getPlatformStats() {
  const result = await sql`
    SELECT 
      (SELECT COUNT(*) FROM users WHERE is_active = true) as total_users,
      (SELECT COUNT(*) FROM posts WHERE is_deleted = false) as total_posts,
      (SELECT COUNT(*) FROM learning_modules WHERE is_published = true) as total_modules,
      (SELECT COUNT(*) FROM events WHERE is_active = true AND start_date > NOW()) as upcoming_events,
      (SELECT COUNT(*) FROM user_quest_progress WHERE completed = true) as completed_quests
  `;
  return result.rows[0];
}

export async function getDomainStats(domain: string) {
  const result = await sql`
    SELECT 
      (SELECT COUNT(*) FROM users WHERE domain = ${domain} AND is_active = true) as domain_users,
      (SELECT COUNT(*) FROM channels WHERE domain = ${domain} AND is_active = true) as domain_channels,
      (SELECT COUNT(*) FROM learning_modules WHERE domain = ${domain} AND is_published = true) as domain_modules,
      (SELECT COUNT(*) FROM events WHERE domain = ${domain} AND is_active = true) as domain_events
  `;
  return result.rows[0];
}