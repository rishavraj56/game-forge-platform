import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withAdmin, AuthenticatedRequest } from '../../../lib/auth-middleware';
import { db } from '../../../lib/db';
import { Domain, UserRole } from '../../../lib/types';

// GET /api/users - Search and filter users (authenticated users can search, admins see all details)
export async function GET(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100); // Max 100 per page
      const domain = searchParams.get('domain') as Domain;
      const role = searchParams.get('role') as UserRole;
      const search = searchParams.get('search'); // Search by username or email
      const sortBy = searchParams.get('sortBy') || 'created_at'; // created_at, xp, username
      const sortOrder = searchParams.get('sortOrder') || 'desc'; // asc, desc
      const minXp = searchParams.get('minXp');
      const maxXp = searchParams.get('maxXp');
      const minLevel = searchParams.get('minLevel');
      const maxLevel = searchParams.get('maxLevel');
      
      const offset = (page - 1) * limit;
      const isAdmin = req.user!.role === 'admin';

      // Build query conditions
      const whereConditions = ['is_active = true'];
      const queryParams: any[] = [];
      let paramIndex = 1;

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

      // Role filter (admin only)
      if (role && isAdmin) {
        const validRoles: UserRole[] = ['member', 'domain_lead', 'admin'];
        if (validRoles.includes(role)) {
          whereConditions.push(`role = $${paramIndex}`);
          queryParams.push(role);
          paramIndex++;
        }
      }

      // Search filter
      if (search && search.trim().length > 0) {
        const searchTerm = `%${search.trim().toLowerCase()}%`;
        if (isAdmin) {
          // Admins can search by username or email
          whereConditions.push(`(LOWER(username) LIKE $${paramIndex} OR LOWER(email) LIKE $${paramIndex})`);
        } else {
          // Regular users can only search by username
          whereConditions.push(`LOWER(username) LIKE $${paramIndex}`);
        }
        queryParams.push(searchTerm);
        paramIndex++;
      }

      // XP range filter
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

      // Level range filter
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

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Validate sort parameters
      const validSortFields = ['created_at', 'xp', 'username', 'level', 'updated_at'];
      const validSortOrders = ['asc', 'desc'];
      const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_at';
      const finalSortOrder = validSortOrders.includes(sortOrder.toLowerCase()) ? sortOrder.toUpperCase() : 'DESC';

      // Get total count
      const countResult = await db.query(
        `SELECT COUNT(*) as total FROM users ${whereClause}`,
        queryParams
      );
      const total = parseInt(countResult.rows[0].total);

      // Select fields based on user role
      const selectFields = isAdmin 
        ? `id, username, email, domain, role, xp, level, avatar_url, bio, 
           is_active, email_verified, created_at, updated_at`
        : `id, username, domain, role, xp, level, avatar_url, bio, created_at`;

      // Get users with pagination
      const usersResult = await db.query(
        `SELECT ${selectFields}
         FROM users 
         ${whereClause}
         ORDER BY ${finalSortBy} ${finalSortOrder}
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...queryParams, limit, offset]
      );

      const totalPages = Math.ceil(total / limit);

      // For non-admin users, also get badge counts for each user
      let usersWithBadges = usersResult.rows;
      if (!isAdmin && usersResult.rows.length > 0) {
        const userIds = usersResult.rows.map(user => user.id);
        
        const badgeCountsResult = await db.query(
          `SELECT ub.user_id, COUNT(*) as badge_count
           FROM user_badges ub
           JOIN badges b ON ub.badge_id = b.id
           WHERE ub.user_id = ANY($1) AND b.is_active = true
           GROUP BY ub.user_id`,
          [userIds]
        );

        const badgeCounts = badgeCountsResult.rows.reduce((acc, row) => {
          acc[row.user_id] = parseInt(row.badge_count);
          return acc;
        }, {} as Record<string, number>);

        usersWithBadges = usersResult.rows.map(user => ({
          ...user,
          badge_count: badgeCounts[user.id] || 0
        }));
      }

      return NextResponse.json(
        {
          success: true,
          data: usersWithBadges,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          },
          filters: {
            domain,
            role: isAdmin ? role : undefined,
            search,
            sortBy: finalSortBy,
            sortOrder: finalSortOrder.toLowerCase(),
            minXp: minXp ? parseInt(minXp) : undefined,
            maxXp: maxXp ? parseInt(maxXp) : undefined,
            minLevel: minLevel ? parseInt(minLevel) : undefined,
            maxLevel: maxLevel ? parseInt(maxLevel) : undefined
          },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Users search error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to search users'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}