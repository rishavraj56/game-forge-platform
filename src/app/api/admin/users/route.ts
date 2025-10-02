import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { UserRole, Domain } from '@/lib/types';

// GET /api/admin/users - Get users with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = (page - 1) * limit;
    
    const search = searchParams.get('search') || '';
    const domain = searchParams.get('domain') as Domain;
    const role = searchParams.get('role') as UserRole;
    const isActive = searchParams.get('isActive');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

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

    if (isActive !== null && isActive !== undefined) {
      conditions.push(`is_active = $${paramIndex}`);
      params.push(isActive === 'true');
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');
    const orderClause = `ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`;

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM users
      WHERE ${whereClause}
    `;
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Get users with stats
    const usersQuery = `
      SELECT 
        u.id,
        u.username,
        u.email,
        u.domain,
        u.role,
        u.xp,
        u.level,
        u.avatar_url,
        u.is_active,
        u.email_verified,
        u.created_at,
        u.updated_at,
        (SELECT COUNT(*) FROM posts WHERE author_id = u.id AND is_deleted = false) as post_count,
        (SELECT COUNT(*) FROM user_quest_progress WHERE user_id = u.id AND completed = true) as completed_quests,
        (SELECT COUNT(*) FROM user_badges WHERE user_id = u.id) as badge_count
      FROM users u
      WHERE ${whereClause}
      ${orderClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    params.push(limit, offset);
    const usersResult = await db.query(usersQuery, params);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: usersResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin users fetch error:', error);
    return NextResponse.json(
      { 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to fetch users' 
        } 
      },
      { status: 500 }
    );
  }
}