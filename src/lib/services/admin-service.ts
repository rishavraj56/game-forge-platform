import { db } from '@/lib/db';
import { User, UserRole, Domain } from '@/lib/types';

export interface AdminDashboardStats {
  users: {
    total_users: number;
    new_users_week: number;
    new_users_month: number;
    domain_leads: number;
    active_users: number;
  };
  content: {
    total_posts: number;
    posts_week: number;
    total_comments: number;
    published_modules: number;
    active_events: number;
  };
  gamification: {
    active_quests: number;
    completed_quests: number;
    badges_earned: number;
    avg_user_xp: number;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    created_at: Date;
    username: string;
    avatar_url?: string;
  }>;
}

export interface UserManagementFilters {
  search?: string;
  domain?: Domain;
  role?: UserRole;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface UserWithStats extends User {
  post_count: number;
  completed_quests: number;
  badge_count: number;
}

export interface ModerationReport {
  id: string;
  content_type: 'post' | 'comment';
  content_id: string;
  reporter_id: string;
  reason: string;
  description?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  resolved_by?: string;
  resolved_at?: Date;
  resolution_notes?: string;
  created_at: Date;
  updated_at: Date;
  reporter_username: string;
  reporter_avatar?: string;
  resolver_username?: string;
  content_details?: any;
}

export interface UserSanction {
  id: string;
  user_id: string;
  moderator_id: string;
  type: 'warning' | 'temporary_ban' | 'permanent_ban';
  reason: string;
  description?: string;
  expires_at?: Date;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  moderator_username: string;
  moderator_avatar?: string;
}

export interface PlatformAnalytics {
  overview: {
    userGrowth: Array<{
      date: Date;
      new_users: number;
      total_users: number;
    }>;
    growthRates: {
      users: number;
      posts: number;
      quests: number;
    };
  };
  content: {
    posts_created: number;
    comments_created: number;
    modules_created: number;
    events_created: number;
  };
  engagement: {
    quests_completed: number;
    badges_earned: number;
    modules_completed: number;
    event_registrations: number;
    reactions_given: number;
  };
  gamification: {
    avg_xp: number;
    max_xp: number;
    high_xp_users: number;
    high_level_users: number;
  };
  domains: Array<{
    domain: Domain;
    user_count: number;
    avg_xp: number;
    domain_leads: number;
    posts_count: number;
    events_count: number;
  }>;
  topUsers: Array<UserWithStats>;
  recentActivity: Array<{
    type: string;
    count: number;
    date: Date;
  }>;
  timeframe: string;
  generatedAt: string;
}

export class AdminService {
  /**
   * Get comprehensive dashboard statistics
   */
  static async getDashboardStats(): Promise<AdminDashboardStats> {
    const [userStats, contentStats, gamificationStats, recentActivity] = await Promise.all([
      // User statistics
      db.query(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as new_users_week,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_users_month,
          COUNT(CASE WHEN role = 'domain_lead' THEN 1 END) as domain_leads,
          COUNT(CASE WHEN is_active = true THEN 1 END) as active_users
        FROM users
      `),
      
      // Content statistics
      db.query(`
        SELECT 
          (SELECT COUNT(*) FROM posts WHERE is_deleted = false) as total_posts,
          (SELECT COUNT(*) FROM posts WHERE is_deleted = false AND created_at >= NOW() - INTERVAL '7 days') as posts_week,
          (SELECT COUNT(*) FROM comments WHERE is_deleted = false) as total_comments,
          (SELECT COUNT(*) FROM learning_modules WHERE is_published = true) as published_modules,
          (SELECT COUNT(*) FROM events WHERE is_active = true) as active_events
      `),
      
      // Gamification statistics
      db.query(`
        SELECT 
          (SELECT COUNT(*) FROM quests WHERE is_active = true) as active_quests,
          (SELECT COUNT(*) FROM user_quest_progress WHERE completed = true) as completed_quests,
          (SELECT COUNT(*) FROM user_badges) as badges_earned,
          (SELECT AVG(xp) FROM users WHERE is_active = true) as avg_user_xp
      `),
      
      // Recent activity
      db.query(`
        SELECT 
          a.id,
          a.type,
          a.description,
          a.created_at,
          u.username,
          u.avatar_url
        FROM activities a
        JOIN users u ON a.user_id = u.id
        ORDER BY a.created_at DESC
        LIMIT 10
      `)
    ]);

    return {
      users: userStats.rows[0],
      content: contentStats.rows[0],
      gamification: gamificationStats.rows[0],
      recentActivity: recentActivity.rows
    };
  }

  /**
   * Get users with filtering and pagination
   */
  static async getUsers(filters: UserManagementFilters) {
    const {
      search = '',
      domain,
      role,
      isActive,
      sortBy = 'created_at',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = filters;

    const offset = (page - 1) * Math.min(limit, 100);

    // Build WHERE clause
    const conditions = ['1=1'];
    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      conditions.push(`(username ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (domain) {
      conditions.push(`domain = $${paramIndex}`);
      params.push(domain);
      paramIndex++;
    }

    if (role) {
      conditions.push(`role = $${paramIndex}`);
      params.push(role);
      paramIndex++;
    }

    if (isActive !== undefined) {
      conditions.push(`is_active = $${paramIndex}`);
      params.push(isActive);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');
    const orderClause = `ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`;

    // Get total count
    const countResult = await db.query(`
      SELECT COUNT(*) as total FROM users WHERE ${whereClause}
    `, params);
    const total = parseInt(countResult.rows[0].total);

    // Get users with stats
    const usersResult = await db.query(`
      SELECT 
        u.*,
        (SELECT COUNT(*) FROM posts WHERE author_id = u.id AND is_deleted = false) as post_count,
        (SELECT COUNT(*) FROM user_quest_progress WHERE user_id = u.id AND completed = true) as completed_quests,
        (SELECT COUNT(*) FROM user_badges WHERE user_id = u.id) as badge_count
      FROM users u
      WHERE ${whereClause}
      ${orderClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...params, Math.min(limit, 100), offset]);

    const totalPages = Math.ceil(total / Math.min(limit, 100));

    return {
      users: usersResult.rows as UserWithStats[],
      pagination: {
        page,
        limit: Math.min(limit, 100),
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  /**
   * Get detailed user information for admin view
   */
  static async getUserDetails(userId: string) {
    const userResult = await db.query(`
      SELECT 
        u.*,
        (SELECT COUNT(*) FROM posts WHERE author_id = u.id AND is_deleted = false) as post_count,
        (SELECT COUNT(*) FROM comments WHERE author_id = u.id AND is_deleted = false) as comment_count,
        (SELECT COUNT(*) FROM user_quest_progress WHERE user_id = u.id AND completed = true) as completed_quests,
        (SELECT COUNT(*) FROM user_badges WHERE user_id = u.id) as badge_count,
        (SELECT COUNT(*) FROM user_module_progress WHERE user_id = u.id AND completed = true) as completed_modules,
        (SELECT COUNT(*) FROM event_registrations WHERE user_id = u.id) as events_registered,
        (SELECT COUNT(*) FROM reports WHERE reporter_id = u.id) as reports_made,
        (SELECT COUNT(*) FROM reports WHERE content_id IN (
          SELECT id FROM posts WHERE author_id = u.id
          UNION
          SELECT id FROM comments WHERE author_id = u.id
        )) as reports_received
      FROM users u
      WHERE u.id = $1
    `, [userId]);

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = userResult.rows[0];

    // Get user's badges
    const badgesResult = await db.query(`
      SELECT b.id, b.name, b.description, b.icon_url, ub.earned_at
      FROM user_badges ub
      JOIN badges b ON ub.badge_id = b.id
      WHERE ub.user_id = $1
      ORDER BY ub.earned_at DESC
    `, [userId]);

    // Get user's recent activity
    const activityResult = await db.query(`
      SELECT type, description, data, created_at
      FROM activities
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 20
    `, [userId]);

    // Get user's sanctions
    const sanctionsResult = await db.query(`
      SELECT 
        us.*,
        m.username as moderator_username,
        m.avatar_url as moderator_avatar
      FROM user_sanctions us
      JOIN users m ON us.moderator_id = m.id
      WHERE us.user_id = $1
      ORDER BY us.created_at DESC
    `, [userId]);

    return {
      ...user,
      badges: badgesResult.rows,
      recentActivity: activityResult.rows,
      sanctions: sanctionsResult.rows as UserSanction[]
    };
  }

  /**
   * Update user information (admin only)
   */
  static async updateUser(
    userId: string, 
    updates: Partial<Pick<User, 'role' | 'domain' | 'xp' | 'is_active'>>,
    adminId: string
  ) {
    const updateFields: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      throw new Error('No valid updates provided');
    }

    updateFields.push(`updated_at = NOW()`);
    params.push(userId);

    const result = await db.query(`
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, params);

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    // Log the admin action
    await db.query(`
      INSERT INTO moderation_actions (moderator_id, content_type, content_id, action, reason, notes)
      VALUES ($1, 'user', $2, 'update', 'Admin user update', $3)
    `, [adminId, userId, JSON.stringify({ updates })]);

    return result.rows[0] as User;
  }

  /**
   * Create user sanction
   */
  static async createUserSanction(
    userId: string,
    moderatorId: string,
    sanctionData: {
      type: 'warning' | 'temporary_ban' | 'permanent_ban';
      reason: string;
      description?: string;
      duration?: number; // hours for temporary ban
    }
  ) {
    const { type, reason, description, duration } = sanctionData;

    // Calculate expiration for temporary bans
    let expiresAt = null;
    if (type === 'temporary_ban' && duration) {
      expiresAt = new Date(Date.now() + duration * 60 * 60 * 1000);
    }

    // Create sanction
    const sanctionResult = await db.query(`
      INSERT INTO user_sanctions (user_id, moderator_id, type, reason, description, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [userId, moderatorId, type, reason, description || null, expiresAt]);

    // If it's a ban, deactivate the user
    if (type === 'temporary_ban' || type === 'permanent_ban') {
      await db.query('UPDATE users SET is_active = false WHERE id = $1', [userId]);
    }

    // Log the moderation action
    await db.query(`
      INSERT INTO moderation_actions (moderator_id, content_type, content_id, action, reason, notes)
      VALUES ($1, 'user', $2, $3, $4, $5)
    `, [
      moderatorId,
      userId,
      type,
      reason,
      JSON.stringify({ description, duration, expiresAt: expiresAt?.toISOString() })
    ]);

    return sanctionResult.rows[0] as UserSanction;
  }

  /**
   * Get moderation reports with filtering
   */
  static async getModerationReports(filters: {
    status?: string;
    contentType?: string;
    reason?: string;
    page?: number;
    limit?: number;
  }) {
    const {
      status = 'pending',
      contentType,
      reason,
      page = 1,
      limit = 20
    } = filters;

    const offset = (page - 1) * Math.min(limit, 100);

    // Build WHERE clause
    const conditions = ['1=1'];
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      conditions.push(`r.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (contentType) {
      conditions.push(`r.content_type = $${paramIndex}`);
      params.push(contentType);
      paramIndex++;
    }

    if (reason) {
      conditions.push(`r.reason = $${paramIndex}`);
      params.push(reason);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // Get total count
    const countResult = await db.query(`
      SELECT COUNT(*) as total FROM reports r WHERE ${whereClause}
    `, params.slice(0, paramIndex - 1));
    const total = parseInt(countResult.rows[0].total);

    // Get reports with content details
    const reportsResult = await db.query(`
      SELECT 
        r.*,
        reporter.username as reporter_username,
        reporter.avatar_url as reporter_avatar,
        resolver.username as resolver_username,
        CASE 
          WHEN r.content_type = 'post' THEN (
            SELECT json_build_object(
              'id', p.id,
              'content', p.content,
              'author_id', p.author_id,
              'author_username', author.username,
              'channel_id', p.channel_id,
              'created_at', p.created_at
            )
            FROM posts p
            JOIN users author ON p.author_id = author.id
            WHERE p.id = r.content_id
          )
          WHEN r.content_type = 'comment' THEN (
            SELECT json_build_object(
              'id', c.id,
              'content', c.content,
              'author_id', c.author_id,
              'author_username', author.username,
              'post_id', c.post_id,
              'created_at', c.created_at
            )
            FROM comments c
            JOIN users author ON c.author_id = author.id
            WHERE c.id = r.content_id
          )
        END as content_details
      FROM reports r
      JOIN users reporter ON r.reporter_id = reporter.id
      LEFT JOIN users resolver ON r.resolved_by = resolver.id
      WHERE ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...params, Math.min(limit, 100), offset]);

    const totalPages = Math.ceil(total / Math.min(limit, 100));

    return {
      reports: reportsResult.rows as ModerationReport[],
      pagination: {
        page,
        limit: Math.min(limit, 100),
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  /**
   * Resolve a moderation report
   */
  static async resolveReport(
    reportId: string,
    moderatorId: string,
    action: 'dismiss' | 'resolve_delete' | 'resolve_warn' | 'resolve_ban',
    resolutionNotes?: string
  ) {
    // Get the report details
    const reportResult = await db.query(`
      SELECT r.*, 
        CASE 
          WHEN r.content_type = 'post' THEN (
            SELECT json_build_object(
              'id', p.id,
              'author_id', p.author_id,
              'channel_id', p.channel_id,
              'content', p.content
            )
            FROM posts p WHERE p.id = r.content_id
          )
          WHEN r.content_type = 'comment' THEN (
            SELECT json_build_object(
              'id', c.id,
              'author_id', c.author_id,
              'post_id', c.post_id,
              'content', c.content
            )
            FROM comments c WHERE c.id = r.content_id
          )
        END as content_details
      FROM reports r
      WHERE r.id = $1 AND r.status = 'pending'
    `, [reportId]);

    if (reportResult.rows.length === 0) {
      throw new Error('Report not found or already resolved');
    }

    const report = reportResult.rows[0];
    const contentDetails = report.content_details;

    // Start transaction
    await db.query('BEGIN');

    try {
      // Update report status
      const status = action === 'dismiss' ? 'dismissed' : 'resolved';
      await db.query(`
        UPDATE reports 
        SET status = $1, resolved_by = $2, resolved_at = NOW(), resolution_notes = $3
        WHERE id = $4
      `, [status, moderatorId, resolutionNotes, reportId]);

      // Perform the moderation action
      let moderationAction = '';
      
      if (action === 'resolve_delete' && contentDetails) {
        if (report.content_type === 'post') {
          await db.query('UPDATE posts SET is_deleted = true WHERE id = $1', [contentDetails.id]);
        } else if (report.content_type === 'comment') {
          await db.query('UPDATE comments SET is_deleted = true WHERE id = $1', [contentDetails.id]);
        }
        moderationAction = 'delete';
      } else if (action === 'resolve_warn' && contentDetails) {
        await this.createUserSanction(contentDetails.author_id, moderatorId, {
          type: 'warning',
          reason: `Content violation: ${report.reason}`,
          description: `Warning issued for reported content. Report ID: ${reportId}`
        });
        moderationAction = 'warn';
      } else if (action === 'resolve_ban' && contentDetails) {
        await this.createUserSanction(contentDetails.author_id, moderatorId, {
          type: 'temporary_ban',
          reason: `Content violation: ${report.reason}`,
          description: `Temporary ban issued for reported content. Report ID: ${reportId}`,
          duration: 24 // 24 hours
        });
        moderationAction = 'ban';
      }

      // Log the moderation action
      if (moderationAction) {
        await db.query(`
          INSERT INTO moderation_actions (moderator_id, content_type, content_id, action, reason, notes)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          moderatorId,
          report.content_type,
          report.content_id,
          moderationAction,
          `Report resolution: ${report.reason}`,
          JSON.stringify({ reportId, action, resolutionNotes })
        ]);
      }

      await db.query('COMMIT');

      return { reportId, action, status };

    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  }
}