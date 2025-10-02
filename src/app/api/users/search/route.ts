import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '../../../../lib/auth-middleware';
import { db } from '../../../../lib/db';
import { Domain, UserRole } from '../../../../lib/types';

// GET /api/users/search - Advanced user search with multiple criteria
export async function GET(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const query = searchParams.get('q'); // General search query
      const domain = searchParams.get('domain') as Domain;
      const role = searchParams.get('role') as UserRole;
      const hasAvatar = searchParams.get('hasAvatar'); // 'true' or 'false'
      const hasBio = searchParams.get('hasBio'); // 'true' or 'false'
      const minXp = searchParams.get('minXp');
      const maxXp = searchParams.get('maxXp');
      const minLevel = searchParams.get('minLevel');
      const maxLevel = searchParams.get('maxLevel');
      const joinedAfter = searchParams.get('joinedAfter'); // ISO date string
      const joinedBefore = searchParams.get('joinedBefore'); // ISO date string
      const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
      
      const isAdmin = req.user!.role === 'admin';

      // Build search conditions
      const whereConditions = ['is_active = true'];
      const queryParams: any[] = [];
      let paramIndex = 1;

      // General search query (username, bio, or email for admins)
      if (query && query.trim().length > 0) {
        const searchTerm = `%${query.trim().toLowerCase()}%`;
        if (isAdmin) {
          whereConditions.push(`(
            LOWER(username) LIKE $${paramIndex} OR 
            LOWER(bio) LIKE $${paramIndex} OR 
            LOWER(email) LIKE $${paramIndex}
          )`);
        } else {
          whereConditions.push(`(
            LOWER(username) LIKE $${paramIndex} OR 
            LOWER(bio) LIKE $${paramIndex}
          )`);
        }
        queryParams.push(searchTerm);
        paramIndex++;
      }

      // Domain filter
      if (domain) {
        const validDomains: Domain[] = [
          'Game Development', 'Game Design', 'Game Art',
          'AI for Game Development', 'Creative', 'Corporate'
        ];
        if (validDomains.includes(domain)) {
          whereConditions.push(`domain = $${paramIndex}`);
          queryParams.push(domain);
          paramIndex++;
        }
      }

      // Role filter (admin only for non-member roles)
      if (role) {
        if (role === 'member' || isAdmin) {
          whereConditions.push(`role = $${paramIndex}`);
          queryParams.push(role);
          paramIndex++;
        }
      }

      // Avatar filter
      if (hasAvatar === 'true') {
        whereConditions.push('avatar_url IS NOT NULL');
      } else if (hasAvatar === 'false') {
        whereConditions.push('avatar_url IS NULL');
      }

      // Bio filter
      if (hasBio === 'true') {
        whereConditions.push('bio IS NOT NULL AND bio != \'\'');
      } else if (hasBio === 'false') {
        whereConditions.push('(bio IS NULL OR bio = \'\')');
      }

      // XP range filters
      if (minXp && !isNaN(parseInt(minXp))) {
        whereConditions.push(`xp >= $${paramIndex}`);
        queryParams.push(parseInt(minXp));
        paramIndex++;
      }

      if (maxXp && !isNaN(parseInt(maxXp))) {
        whereConditions.push(`xp <= $${paramIndex}`);
        queryParams.push(parseInt(maxXp));
        paramIndex++;
      }

      // Level range filters
      if (minLevel && !isNaN(parseInt(minLevel))) {
        whereConditions.push(`level >= $${paramIndex}`);
        queryParams.push(parseInt(minLevel));
        paramIndex++;
      }

      if (maxLevel && !isNaN(parseInt(maxLevel))) {
        whereConditions.push(`level <= $${paramIndex}`);
        queryParams.push(parseInt(maxLevel));
        paramIndex++;
      }

      // Date range filters
      if (joinedAfter) {
        try {
          const afterDate = new Date(joinedAfter);
          whereConditions.push(`created_at >= $${paramIndex}`);
          queryParams.push(afterDate);
          paramIndex++;
        } catch (error) {
          // Invalid date, ignore filter
        }
      }

      if (joinedBefore) {
        try {
          const beforeDate = new Date(joinedBefore);
          whereConditions.push(`created_at <= $${paramIndex}`);
          queryParams.push(beforeDate);
          paramIndex++;
        } catch (error) {
          // Invalid date, ignore filter
        }
      }

      const whereClause = whereConditions.length > 1 ? `WHERE ${whereConditions.join(' AND ')}` : 'WHERE is_active = true';

      // Select appropriate fields based on user role
      const selectFields = isAdmin 
        ? `u.id, u.username, u.email, u.domain, u.role, u.xp, u.level, 
           u.avatar_url, u.bio, u.created_at, u.updated_at`
        : `u.id, u.username, u.domain, u.role, u.xp, u.level, 
           u.avatar_url, u.bio, u.created_at`;

      // Execute search with user stats
      const searchResult = await db.query(
        `SELECT ${selectFields},
                COUNT(DISTINCT ub.badge_id) as badge_count,
                COUNT(DISTINCT uqp.quest_id) as completed_quests,
                COUNT(DISTINCT p.id) as total_posts
         FROM users u
         LEFT JOIN user_badges ub ON u.id = ub.user_id
         LEFT JOIN user_quest_progress uqp ON u.id = uqp.user_id AND uqp.completed = true
         LEFT JOIN posts p ON u.id = p.author_id AND p.is_deleted = false
         ${whereClause}
         GROUP BY u.id, u.username, u.email, u.domain, u.role, u.xp, u.level, 
                  u.avatar_url, u.bio, u.created_at, u.updated_at
         ORDER BY u.xp DESC, u.created_at DESC
         LIMIT $${paramIndex}`,
        [...queryParams, limit]
      );

      // Format results
      const users = searchResult.rows.map(user => ({
        id: user.id,
        username: user.username,
        email: isAdmin ? user.email : undefined,
        domain: user.domain,
        role: user.role,
        xp: user.xp,
        level: user.level,
        avatar_url: user.avatar_url,
        bio: user.bio,
        created_at: user.created_at,
        updated_at: isAdmin ? user.updated_at : undefined,
        stats: {
          badge_count: parseInt(user.badge_count),
          completed_quests: parseInt(user.completed_quests),
          total_posts: parseInt(user.total_posts)
        }
      }));

      // Get search summary
      const totalResult = await db.query(
        `SELECT COUNT(*) as total FROM users u ${whereClause}`,
        queryParams.slice(0, -1) // Remove limit parameter
      );

      const total = parseInt(totalResult.rows[0].total);

      return NextResponse.json(
        {
          success: true,
          data: users,
          meta: {
            total_found: total,
            returned: users.length,
            limit,
            has_more: total > limit
          },
          search_params: {
            query,
            domain,
            role: isAdmin ? role : undefined,
            hasAvatar: hasAvatar === 'true' ? true : hasAvatar === 'false' ? false : undefined,
            hasBio: hasBio === 'true' ? true : hasBio === 'false' ? false : undefined,
            minXp: minXp ? parseInt(minXp) : undefined,
            maxXp: maxXp ? parseInt(maxXp) : undefined,
            minLevel: minLevel ? parseInt(minLevel) : undefined,
            maxLevel: maxLevel ? parseInt(maxLevel) : undefined,
            joinedAfter,
            joinedBefore
          },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Advanced user search error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to perform user search'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}

// POST /api/users/search - Advanced search with complex criteria (for complex filters)
export async function POST(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      const {
        query,
        domains = [],
        roles = [],
        xpRange,
        levelRange,
        dateRange,
        badges = [],
        hasAvatar,
        hasBio,
        sortBy = 'xp',
        sortOrder = 'desc',
        limit = 50
      } = body;

      const isAdmin = req.user!.role === 'admin';
      const finalLimit = Math.min(limit, 100);

      // Build complex search conditions
      const whereConditions = ['u.is_active = true'];
      const queryParams: any[] = [];
      let paramIndex = 1;

      // Text search
      if (query && query.trim().length > 0) {
        const searchTerm = `%${query.trim().toLowerCase()}%`;
        if (isAdmin) {
          whereConditions.push(`(
            LOWER(u.username) LIKE $${paramIndex} OR 
            LOWER(u.bio) LIKE $${paramIndex} OR 
            LOWER(u.email) LIKE $${paramIndex}
          )`);
        } else {
          whereConditions.push(`(
            LOWER(u.username) LIKE $${paramIndex} OR 
            LOWER(u.bio) LIKE $${paramIndex}
          )`);
        }
        queryParams.push(searchTerm);
        paramIndex++;
      }

      // Multiple domains
      if (domains.length > 0) {
        const validDomains = domains.filter((d: string) => [
          'Game Development', 'Game Design', 'Game Art',
          'AI for Game Development', 'Creative', 'Corporate'
        ].includes(d));
        
        if (validDomains.length > 0) {
          whereConditions.push(`u.domain = ANY($${paramIndex})`);
          queryParams.push(validDomains);
          paramIndex++;
        }
      }

      // Multiple roles (admin only for non-member roles)
      if (roles.length > 0) {
        const allowedRoles = isAdmin ? roles : roles.filter((r: string) => r === 'member');
        if (allowedRoles.length > 0) {
          whereConditions.push(`u.role = ANY($${paramIndex})`);
          queryParams.push(allowedRoles);
          paramIndex++;
        }
      }

      // XP range
      if (xpRange) {
        if (xpRange.min !== undefined) {
          whereConditions.push(`u.xp >= $${paramIndex}`);
          queryParams.push(xpRange.min);
          paramIndex++;
        }
        if (xpRange.max !== undefined) {
          whereConditions.push(`u.xp <= $${paramIndex}`);
          queryParams.push(xpRange.max);
          paramIndex++;
        }
      }

      // Level range
      if (levelRange) {
        if (levelRange.min !== undefined) {
          whereConditions.push(`u.level >= $${paramIndex}`);
          queryParams.push(levelRange.min);
          paramIndex++;
        }
        if (levelRange.max !== undefined) {
          whereConditions.push(`u.level <= $${paramIndex}`);
          queryParams.push(levelRange.max);
          paramIndex++;
        }
      }

      // Date range
      if (dateRange) {
        if (dateRange.after) {
          whereConditions.push(`u.created_at >= $${paramIndex}`);
          queryParams.push(new Date(dateRange.after));
          paramIndex++;
        }
        if (dateRange.before) {
          whereConditions.push(`u.created_at <= $${paramIndex}`);
          queryParams.push(new Date(dateRange.before));
          paramIndex++;
        }
      }

      // Badge filter
      if (badges.length > 0) {
        whereConditions.push(`
          u.id IN (
            SELECT DISTINCT ub.user_id 
            FROM user_badges ub 
            JOIN badges b ON ub.badge_id = b.id 
            WHERE b.name = ANY($${paramIndex})
          )
        `);
        queryParams.push(badges);
        paramIndex++;
      }

      // Avatar and bio filters
      if (hasAvatar === true) {
        whereConditions.push('u.avatar_url IS NOT NULL');
      } else if (hasAvatar === false) {
        whereConditions.push('u.avatar_url IS NULL');
      }

      if (hasBio === true) {
        whereConditions.push('u.bio IS NOT NULL AND u.bio != \'\'');
      } else if (hasBio === false) {
        whereConditions.push('(u.bio IS NULL OR u.bio = \'\')');
      }

      const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

      // Validate sort parameters
      const validSortFields = ['xp', 'level', 'created_at', 'username'];
      const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'xp';
      const finalSortOrder = ['asc', 'desc'].includes(sortOrder) ? sortOrder.toUpperCase() : 'DESC';

      // Execute search
      const selectFields = isAdmin 
        ? `u.id, u.username, u.email, u.domain, u.role, u.xp, u.level, 
           u.avatar_url, u.bio, u.created_at, u.updated_at`
        : `u.id, u.username, u.domain, u.role, u.xp, u.level, 
           u.avatar_url, u.bio, u.created_at`;

      const searchResult = await db.query(
        `SELECT ${selectFields},
                COUNT(DISTINCT ub.badge_id) as badge_count,
                COUNT(DISTINCT uqp.quest_id) as completed_quests
         FROM users u
         LEFT JOIN user_badges ub ON u.id = ub.user_id
         LEFT JOIN user_quest_progress uqp ON u.id = uqp.user_id AND uqp.completed = true
         ${whereClause}
         GROUP BY u.id, u.username, u.email, u.domain, u.role, u.xp, u.level, 
                  u.avatar_url, u.bio, u.created_at, u.updated_at
         ORDER BY u.${finalSortBy} ${finalSortOrder}
         LIMIT $${paramIndex}`,
        [...queryParams, finalLimit]
      );

      const users = searchResult.rows.map(user => ({
        id: user.id,
        username: user.username,
        email: isAdmin ? user.email : undefined,
        domain: user.domain,
        role: user.role,
        xp: user.xp,
        level: user.level,
        avatar_url: user.avatar_url,
        bio: user.bio,
        created_at: user.created_at,
        updated_at: isAdmin ? user.updated_at : undefined,
        stats: {
          badge_count: parseInt(user.badge_count),
          completed_quests: parseInt(user.completed_quests)
        }
      }));

      return NextResponse.json(
        {
          success: true,
          data: users,
          meta: {
            returned: users.length,
            limit: finalLimit,
            sortBy: finalSortBy,
            sortOrder: finalSortOrder.toLowerCase()
          },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Complex user search error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to perform complex user search'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}