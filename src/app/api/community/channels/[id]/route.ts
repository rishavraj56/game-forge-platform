import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withDomainLead, AuthenticatedRequest, canModerateContent } from '../../../../../lib/auth-middleware';
import { db } from '../../../../../lib/db';
import { Domain } from '../../../../../lib/types';

// GET /api/community/channels/[id] - Get specific channel details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const channelId = params.id;
      const user = req.user!;

      // Get channel with lead information
      const channelResult = await db.query(
        `SELECT 
           c.id, c.name, c.domain, c.type, c.parent_id, c.lead_id, 
           c.description, c.member_count, c.is_active, c.created_at, c.updated_at,
           u.username as lead_username, u.avatar_url as lead_avatar_url,
           parent.name as parent_name
         FROM channels c
         LEFT JOIN users u ON c.lead_id = u.id
         LEFT JOIN channels parent ON c.parent_id = parent.id
         WHERE c.id = $1`,
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

      // Check if user is a member of this channel
      const membershipResult = await db.query(
        `SELECT joined_at FROM channel_members WHERE channel_id = $1 AND user_id = $2`,
        [channelId, user.id]
      );

      const isMember = membershipResult.rows.length > 0;
      const joinedAt = isMember ? membershipResult.rows[0].joined_at : null;

      // Get sub-channels if this is a primary channel
      let subChannels = [];
      if (channel.type === 'primary') {
        const subChannelsResult = await db.query(
          `SELECT 
             c.id, c.name, c.description, c.member_count, c.is_active, c.created_at,
             u.username as lead_username, u.avatar_url as lead_avatar_url
           FROM channels c
           LEFT JOIN users u ON c.lead_id = u.id
           WHERE c.parent_id = $1 AND c.is_active = true
           ORDER BY c.created_at ASC`,
          [channelId]
        );
        subChannels = subChannelsResult.rows;
      }

      return NextResponse.json(
        {
          success: true,
          data: {
            ...channel,
            is_member: isMember,
            joined_at: joinedAt,
            sub_channels: subChannels,
            can_moderate: canModerateContent(user.role, user.domain, channel.domain)
          },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Channel fetch error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch channel'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}

// PUT /api/community/channels/[id] - Update channel (lead or admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const channelId = params.id;
      const body = await req.json();
      const { name, description, is_active } = body;
      const user = req.user!;

      // Get current channel
      const channelResult = await db.query(
        `SELECT id, name, domain, type, lead_id, is_active FROM channels WHERE id = $1`,
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

      // Check permissions
      const canModerate = canModerateContent(user.role, user.domain, channel.domain);
      const isChannelLead = channel.lead_id === user.id;

      if (!canModerate && !isChannelLead) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'You do not have permission to modify this channel'
            },
            timestamp: new Date().toISOString()
          },
          { status: 403 }
        );
      }

      // Only admins can modify primary channels or change active status
      if ((channel.type === 'primary' || is_active !== undefined) && user.role !== 'admin') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Only admins can modify primary channels or change active status'
            },
            timestamp: new Date().toISOString()
          },
          { status: 403 }
        );
      }

      // Validate name if provided
      if (name !== undefined) {
        if (!name || name.trim().length === 0) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Channel name cannot be empty'
              },
              timestamp: new Date().toISOString()
            },
            { status: 400 }
          );
        }

        if (name.length > 100) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Channel name must be 100 characters or less'
              },
              timestamp: new Date().toISOString()
            },
            { status: 400 }
          );
        }

        // Check for duplicate names in the same domain (excluding current channel)
        const duplicateResult = await db.query(
          `SELECT id FROM channels 
           WHERE LOWER(name) = LOWER($1) AND domain = $2 AND id != $3 AND is_active = true`,
          [name.trim(), channel.domain, channelId]
        );

        if (duplicateResult.rows.length > 0) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'CONFLICT',
                message: 'A channel with this name already exists in this domain'
              },
              timestamp: new Date().toISOString()
            },
            { status: 409 }
          );
        }
      }

      // Build update query
      const updateFields = [];
      const updateParams = [];
      let paramIndex = 1;

      if (name !== undefined) {
        updateFields.push(`name = $${paramIndex}`);
        updateParams.push(name.trim());
        paramIndex++;
      }

      if (description !== undefined) {
        updateFields.push(`description = $${paramIndex}`);
        updateParams.push(description?.trim() || null);
        paramIndex++;
      }

      if (is_active !== undefined && user.role === 'admin') {
        updateFields.push(`is_active = $${paramIndex}`);
        updateParams.push(is_active);
        paramIndex++;
      }

      if (updateFields.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'No valid fields to update'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      updateFields.push(`updated_at = NOW()`);
      updateParams.push(channelId);

      // Update the channel
      const updateResult = await db.query(
        `UPDATE channels 
         SET ${updateFields.join(', ')}
         WHERE id = $${paramIndex}
         RETURNING id, name, domain, type, parent_id, lead_id, description, 
                   member_count, is_active, created_at, updated_at`,
        updateParams
      );

      return NextResponse.json(
        {
          success: true,
          data: updateResult.rows[0],
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Channel update error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to update channel'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}

// DELETE /api/community/channels/[id] - Delete/deactivate channel (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const channelId = params.id;
      const user = req.user!;

      // Only admins can delete channels
      if (user.role !== 'admin') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Only admins can delete channels'
            },
            timestamp: new Date().toISOString()
          },
          { status: 403 }
        );
      }

      // Check if channel exists
      const channelResult = await db.query(
        `SELECT id, name, type FROM channels WHERE id = $1`,
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

      // Check if channel has sub-channels (for primary channels)
      if (channel.type === 'primary') {
        const subChannelsResult = await db.query(
          `SELECT COUNT(*) as count FROM channels WHERE parent_id = $1 AND is_active = true`,
          [channelId]
        );

        if (parseInt(subChannelsResult.rows[0].count) > 0) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'CONFLICT',
                message: 'Cannot delete primary channel with active sub-channels'
              },
              timestamp: new Date().toISOString()
            },
            { status: 409 }
          );
        }
      }

      // Soft delete by setting is_active to false
      await db.query(
        `UPDATE channels SET is_active = false, updated_at = NOW() WHERE id = $1`,
        [channelId]
      );

      return NextResponse.json(
        {
          success: true,
          message: 'Channel deleted successfully',
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Channel deletion error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to delete channel'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}