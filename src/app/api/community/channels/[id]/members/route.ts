import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest, canModerateContent } from '../../../../../../lib/auth-middleware';
import { db } from '../../../../../../lib/db';

// GET /api/community/channels/[id]/members - Get channel members
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const channelId = params.id;
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
      const search = searchParams.get('search');
      
      const offset = (page - 1) * limit;
      const user = req.user!;

      // Check if channel exists and user has access
      const channelResult = await db.query(
        `SELECT id, domain, is_active FROM channels WHERE id = $1`,
        [channelId]
      );

      if (channelResult.rows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Channel not found'
            },
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        );
      }

      const channel = channelResult.rows[0];

      // Check if channel is active (unless user can moderate)
      if (!channel.is_active && !canModerateContent(user.role, user.domain, channel.domain)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Channel not found'
            },
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        );
      }

      // Build query conditions
      const whereConditions = ['cm.channel_id = $1', 'u.is_active = true'];
      const queryParams: any[] = [channelId];
      let paramIndex = 2;

      // Search filter
      if (search && search.trim().length > 0) {
        const searchTerm = `%${search.trim().toLowerCase()}%`;
        whereConditions.push(`LOWER(u.username) LIKE $${paramIndex}`);
        queryParams.push(searchTerm);
        paramIndex++;
      }

      const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

      // Get total count
      const countResult = await db.query(
        `SELECT COUNT(*) as total 
         FROM channel_members cm
         JOIN users u ON cm.user_id = u.id
         ${whereClause}`,
        queryParams
      );
      const total = parseInt(countResult.rows[0].total);

      // Get members with user information
      const membersResult = await db.query(
        `SELECT 
           u.id, u.username, u.domain, u.role, u.xp, u.level, u.avatar_url,
           cm.joined_at
         FROM channel_members cm
         JOIN users u ON cm.user_id = u.id
         ${whereClause}
         ORDER BY cm.joined_at ASC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...queryParams, limit, offset]
      );

      const totalPages = Math.ceil(total / limit);

      return NextResponse.json(
        {
          success: true,
          data: membersResult.rows,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Channel members fetch error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch channel members'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}

// POST /api/community/channels/[id]/members - Join channel
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const channelId = params.id;
      const user = req.user!;

      // Check if channel exists and is active
      const channelResult = await db.query(
        `SELECT id, domain, is_active FROM channels WHERE id = $1 AND is_active = true`,
        [channelId]
      );

      if (channelResult.rows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Channel not found'
            },
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        );
      }

      // Check if user is already a member
      const membershipResult = await db.query(
        `SELECT user_id FROM channel_members WHERE channel_id = $1 AND user_id = $2`,
        [channelId, user.id]
      );

      if (membershipResult.rows.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'CONFLICT',
              message: 'You are already a member of this channel'
            },
            timestamp: new Date().toISOString()
          },
          { status: 409 }
        );
      }

      // Add user to channel
      await db.query(
        `INSERT INTO channel_members (channel_id, user_id) VALUES ($1, $2)`,
        [channelId, user.id]
      );

      // Update member count
      await db.query(
        `UPDATE channels 
         SET member_count = member_count + 1, updated_at = NOW() 
         WHERE id = $1`,
        [channelId]
      );

      return NextResponse.json(
        {
          success: true,
          message: 'Successfully joined channel',
          timestamp: new Date().toISOString()
        },
        { status: 201 }
      );

    } catch (error) {
      console.error('Channel join error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to join channel'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}

// DELETE /api/community/channels/[id]/members - Leave channel
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const channelId = params.id;
      const { searchParams } = new URL(req.url);
      const targetUserId = searchParams.get('userId');
      const user = req.user!;

      // Determine which user to remove (self or target user for moderators)
      const userIdToRemove = targetUserId || user.id;

      // Check if channel exists
      const channelResult = await db.query(
        `SELECT id, domain, lead_id, is_active FROM channels WHERE id = $1`,
        [channelId]
      );

      if (channelResult.rows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Channel not found'
            },
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        );
      }

      const channel = channelResult.rows[0];

      // Check permissions for removing other users
      if (targetUserId && targetUserId !== user.id) {
        const canModerate = canModerateContent(user.role, user.domain, channel.domain);
        const isChannelLead = channel.lead_id === user.id;

        if (!canModerate && !isChannelLead) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'FORBIDDEN',
                message: 'You do not have permission to remove other users from this channel'
              },
              timestamp: new Date().toISOString()
            },
            { status: 403 }
          );
        }
      }

      // Check if user is a member
      const membershipResult = await db.query(
        `SELECT user_id FROM channel_members WHERE channel_id = $1 AND user_id = $2`,
        [channelId, userIdToRemove]
      );

      if (membershipResult.rows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'User is not a member of this channel'
            },
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        );
      }

      // Prevent channel lead from leaving their own channel
      if (channel.lead_id === userIdToRemove && !targetUserId) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'CONFLICT',
              message: 'Channel leads cannot leave their own channel. Transfer leadership first.'
            },
            timestamp: new Date().toISOString()
          },
          { status: 409 }
        );
      }

      // Remove user from channel
      await db.query(
        `DELETE FROM channel_members WHERE channel_id = $1 AND user_id = $2`,
        [channelId, userIdToRemove]
      );

      // Update member count
      await db.query(
        `UPDATE channels 
         SET member_count = GREATEST(member_count - 1, 0), updated_at = NOW() 
         WHERE id = $1`,
        [channelId]
      );

      const message = targetUserId && targetUserId !== user.id 
        ? 'User removed from channel successfully'
        : 'Successfully left channel';

      return NextResponse.json(
        {
          success: true,
          message,
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Channel leave error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to leave channel'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}