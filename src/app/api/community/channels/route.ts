import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withDomainLead, AuthenticatedRequest, canAccessDomain, canModerateContent } from '../../../../lib/auth-middleware';
import { db } from '../../../../lib/db';
import { Domain, Channel } from '../../../../lib/types';

// GET /api/community/channels - Get channels with filtering
export async function GET(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const domain = searchParams.get('domain') as Domain;
      const type = searchParams.get('type') as 'primary' | 'sub';
      const parentId = searchParams.get('parentId');
      const includeInactive = searchParams.get('includeInactive') === 'true';
      const page = parseInt(searchParams.get('page') || '1');
      const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
      
      const offset = (page - 1) * limit;
      const user = req.user!;

      // Build query conditions
      const whereConditions = [];
      const queryParams: any[] = [];
      let paramIndex = 1;

      // Active filter (unless admin/domain_lead requesting inactive)
      if (!includeInactive || (user.role !== 'admin' && user.role !== 'domain_lead')) {
        whereConditions.push(`c.is_active = true`);
      }

      // Domain filter
      if (domain) {
        const validDomains: Domain[] = [
          'Game Development', 'Game Design', 'Game Art',
          'AI for Game Development', 'Creative', 'Corporate'
        ];
        if (validDomains.includes(domain)) {
          whereConditions.push(`c.domain = $${paramIndex}`);
          queryParams.push(domain);
          paramIndex++;
        }
      }

      // Type filter
      if (type && (type === 'primary' || type === 'sub')) {
        whereConditions.push(`c.type = $${paramIndex}`);
        queryParams.push(type);
        paramIndex++;
      }

      // Parent ID filter for sub-channels
      if (parentId) {
        whereConditions.push(`c.parent_id = $${paramIndex}`);
        queryParams.push(parentId);
        paramIndex++;
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Get total count
      const countResult = await db.query(
        `SELECT COUNT(*) as total FROM channels c ${whereClause}`,
        queryParams
      );
      const total = parseInt(countResult.rows[0].total);

      // Get channels with lead information
      const channelsResult = await db.query(
        `SELECT 
           c.id, c.name, c.domain, c.type, c.parent_id, c.lead_id, 
           c.description, c.member_count, c.is_active, c.created_at, c.updated_at,
           u.username as lead_username, u.avatar_url as lead_avatar_url
         FROM channels c
         LEFT JOIN users u ON c.lead_id = u.id
         ${whereClause}
         ORDER BY c.type ASC, c.created_at ASC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...queryParams, limit, offset]
      );

      const totalPages = Math.ceil(total / limit);

      return NextResponse.json(
        {
          success: true,
          data: channelsResult.rows,
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
            type,
            parentId,
            includeInactive
          },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Channels fetch error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch channels'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}

// POST /api/community/channels - Create new channel (domain leads and admins only)
export async function POST(request: NextRequest) {
  return withDomainLead(request, async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      const { name, domain, type = 'sub', parent_id, description } = body;
      const user = req.user!;

      // Validation
      if (!name || name.trim().length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Channel name is required'
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

      // Validate domain
      const validDomains: Domain[] = [
        'Game Development', 'Game Design', 'Game Art',
        'AI for Game Development', 'Creative', 'Corporate'
      ];

      if (!domain || !validDomains.includes(domain)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Valid domain is required'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      // Check if user can create channels in this domain
      if (user.role !== 'admin' && user.domain !== domain) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'You can only create channels in your own domain'
            },
            timestamp: new Date().toISOString()
          },
          { status: 403 }
        );
      }

      // Validate type
      if (type !== 'primary' && type !== 'sub') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Channel type must be either "primary" or "sub"'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      // Only admins can create primary channels
      if (type === 'primary' && user.role !== 'admin') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Only admins can create primary channels'
            },
            timestamp: new Date().toISOString()
          },
          { status: 403 }
        );
      }

      // Validate parent channel for sub-channels
      if (type === 'sub') {
        if (!parent_id) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Parent channel ID is required for sub-channels'
              },
              timestamp: new Date().toISOString()
            },
            { status: 400 }
          );
        }

        // Check if parent channel exists and is in the same domain
        const parentResult = await db.query(
          `SELECT id, domain, type FROM channels WHERE id = $1 AND is_active = true`,
          [parent_id]
        );

        if (parentResult.rows.length === 0) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'NOT_FOUND',
                message: 'Parent channel not found'
              },
              timestamp: new Date().toISOString()
            },
            { status: 404 }
          );
        }

        const parentChannel = parentResult.rows[0];
        if (parentChannel.domain !== domain) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Sub-channel must be in the same domain as parent channel'
              },
              timestamp: new Date().toISOString()
            },
            { status: 400 }
          );
        }

        if (parentChannel.type !== 'primary') {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Sub-channels can only be created under primary channels'
              },
              timestamp: new Date().toISOString()
            },
            { status: 400 }
          );
        }
      }

      // Check for duplicate channel names in the same domain
      const duplicateResult = await db.query(
        `SELECT id FROM channels 
         WHERE LOWER(name) = LOWER($1) AND domain = $2 AND is_active = true`,
        [name.trim(), domain]
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

      // Create the channel
      const channelResult = await db.query(
        `INSERT INTO channels (name, domain, type, parent_id, lead_id, description)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, name, domain, type, parent_id, lead_id, description, 
                   member_count, is_active, created_at, updated_at`,
        [
          name.trim(),
          domain,
          type,
          type === 'sub' ? parent_id : null,
          user.id,
          description?.trim() || null
        ]
      );

      const newChannel = channelResult.rows[0];

      // Add the creator as a member
      await db.query(
        `INSERT INTO channel_members (channel_id, user_id) VALUES ($1, $2)`,
        [newChannel.id, user.id]
      );

      // Update member count
      await db.query(
        `UPDATE channels SET member_count = 1 WHERE id = $1`,
        [newChannel.id]
      );

      return NextResponse.json(
        {
          success: true,
          data: {
            ...newChannel,
            member_count: 1
          },
          timestamp: new Date().toISOString()
        },
        { status: 201 }
      );

    } catch (error) {
      console.error('Channel creation error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to create channel'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}