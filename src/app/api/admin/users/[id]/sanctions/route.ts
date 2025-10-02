import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// POST /api/admin/users/[id]/sanctions - Create user sanction (warning, ban, etc.)
export async function POST(
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
    
    const { type, reason, description, duration } = body;

    // Validate sanction type
    const validTypes = ['warning', 'temporary_ban', 'permanent_ban'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: { code: 'INVALID_TYPE', message: 'Invalid sanction type' } },
        { status: 400 }
      );
    }

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { error: { code: 'MISSING_REASON', message: 'Reason is required' } },
        { status: 400 }
      );
    }

    // Prevent admin from sanctioning themselves
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: { code: 'SELF_SANCTION', message: 'Cannot sanction yourself' } },
        { status: 400 }
      );
    }

    // Check if user exists
    const userCheck = await db.query('SELECT id, username FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      );
    }

    // Calculate expiration for temporary bans
    let expiresAt = null;
    if (type === 'temporary_ban' && duration) {
      const durationHours = parseInt(duration);
      if (isNaN(durationHours) || durationHours <= 0) {
        return NextResponse.json(
          { error: { code: 'INVALID_DURATION', message: 'Invalid duration for temporary ban' } },
          { status: 400 }
        );
      }
      expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);
    }

    // Create sanction
    const sanctionQuery = `
      INSERT INTO user_sanctions (user_id, moderator_id, type, reason, description, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const sanctionResult = await db.query(sanctionQuery, [
      userId,
      session.user.id,
      type,
      reason,
      description || null,
      expiresAt
    ]);

    // If it's a ban, deactivate the user
    if (type === 'temporary_ban' || type === 'permanent_ban') {
      await db.query('UPDATE users SET is_active = false WHERE id = $1', [userId]);
    }

    // Log the moderation action
    await db.query(`
      INSERT INTO moderation_actions (moderator_id, content_type, content_id, action, reason, notes)
      VALUES ($1, 'user', $2, $3, $4, $5)
    `, [
      session.user.id,
      userId,
      type,
      reason,
      JSON.stringify({ 
        description, 
        duration: duration || null,
        expiresAt: expiresAt?.toISOString() || null 
      })
    ]);

    return NextResponse.json({
      success: true,
      data: sanctionResult.rows[0],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin sanction creation error:', error);
    return NextResponse.json(
      { 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to create sanction' 
        } 
      },
      { status: 500 }
    );
  }
}

// GET /api/admin/users/[id]/sanctions - Get user sanctions
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

    const sanctionsQuery = `
      SELECT 
        us.*,
        m.username as moderator_username,
        m.avatar_url as moderator_avatar
      FROM user_sanctions us
      JOIN users m ON us.moderator_id = m.id
      WHERE us.user_id = $1
      ORDER BY us.created_at DESC
    `;

    const result = await db.query(sanctionsQuery, [userId]);

    return NextResponse.json({
      success: true,
      data: result.rows,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin sanctions fetch error:', error);
    return NextResponse.json(
      { 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to fetch sanctions' 
        } 
      },
      { status: 500 }
    );
  }
}