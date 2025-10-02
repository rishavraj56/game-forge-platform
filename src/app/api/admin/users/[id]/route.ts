import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { UserRole, Domain } from '@/lib/types';

// GET /api/admin/users/[id] - Get detailed user information
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const userId = params.id;

    // Get user details with comprehensive stats
    const userQuery = `
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
    `;

    const userResult = await db.query(userQuery, [userId]);
    
    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      );
    }

    const user = userResult.rows[0];

    // Get user's badges
    const badgesQuery = `
      SELECT b.id, b.name, b.description, b.icon_url, ub.earned_at
      FROM user_badges ub
      JOIN badges b ON ub.badge_id = b.id
      WHERE ub.user_id = $1
      ORDER BY ub.earned_at DESC
    `;
    const badgesResult = await db.query(badgesQuery, [userId]);

    // Get user's recent activity
    const activityQuery = `
      SELECT type, description, data, created_at
      FROM activities
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 20
    `;
    const activityResult = await db.query(activityQuery, [userId]);

    // Get user's sanctions/warnings
    const sanctionsQuery = `
      SELECT 
        us.*,
        m.username as moderator_username
      FROM user_sanctions us
      JOIN users m ON us.moderator_id = m.id
      WHERE us.user_id = $1
      ORDER BY us.created_at DESC
    `;
    const sanctionsResult = await db.query(sanctionsQuery, [userId]);

    const userData = {
      ...user,
      badges: badgesResult.rows,
      recentActivity: activityResult.rows,
      sanctions: sanctionsResult.rows
    };

    return NextResponse.json({
      success: true,
      data: userData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin user detail error:', error);
    return NextResponse.json(
      { 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to fetch user details' 
        } 
      },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users/[id] - Update user role, status, or other admin fields
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const userId = params.id;
    const body = await request.json();
    
    const { role, isActive, domain, xp } = body;

    // Validate inputs
    const validRoles: UserRole[] = ['member', 'domain_lead', 'admin'];
    const validDomains: Domain[] = [
      'Game Development', 'Game Design', 'Game Art', 
      'AI for Game Development', 'Creative', 'Corporate'
    ];

    if (role && !validRoles.includes(role)) {
      return NextResponse.json(
        { error: { code: 'INVALID_ROLE', message: 'Invalid role specified' } },
        { status: 400 }
      );
    }

    if (domain && !validDomains.includes(domain)) {
      return NextResponse.json(
        { error: { code: 'INVALID_DOMAIN', message: 'Invalid domain specified' } },
        { status: 400 }
      );
    }

    if (xp !== undefined && (typeof xp !== 'number' || xp < 0)) {
      return NextResponse.json(
        { error: { code: 'INVALID_XP', message: 'XP must be a non-negative number' } },
        { status: 400 }
      );
    }

    // Prevent admin from demoting themselves
    if (userId === session.user.id && role && role !== 'admin') {
      return NextResponse.json(
        { error: { code: 'SELF_DEMOTION', message: 'Cannot change your own admin role' } },
        { status: 400 }
      );
    }

    // Build update query
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (role !== undefined) {
      updates.push(`role = $${paramIndex}`);
      params.push(role);
      paramIndex++;
    }

    if (isActive !== undefined) {
      updates.push(`is_active = $${paramIndex}`);
      params.push(isActive);
      paramIndex++;
    }

    if (domain !== undefined) {
      updates.push(`domain = $${paramIndex}`);
      params.push(domain);
      paramIndex++;
    }

    if (xp !== undefined) {
      updates.push(`xp = $${paramIndex}`);
      params.push(xp);
      paramIndex++;
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: { code: 'NO_UPDATES', message: 'No valid updates provided' } },
        { status: 400 }
      );
    }

    updates.push(`updated_at = NOW()`);
    params.push(userId);

    const updateQuery = `
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, username, email, domain, role, xp, level, is_active, updated_at
    `;

    const result = await db.query(updateQuery, params);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      );
    }

    // Log the admin action
    await db.query(`
      INSERT INTO moderation_actions (moderator_id, content_type, content_id, action, reason, notes)
      VALUES ($1, 'user', $2, 'update', 'Admin user update', $3)
    `, [
      session.user.id,
      userId,
      JSON.stringify({ updates: body, updatedBy: session.user.username })
    ]);

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin user update error:', error);
    return NextResponse.json(
      { 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to update user' 
        } 
      },
      { status: 500 }
    );
  }
}