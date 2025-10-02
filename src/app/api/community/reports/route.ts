import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '../../../../lib/auth-middleware';
import { db } from '../../../../lib/db';

// POST /api/community/reports - Report content
export async function POST(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      const { content_type, content_id, reason, description } = body;
      const user = req.user!;

      // Validation
      if (!content_type || !content_id || !reason) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Content type, content ID, and reason are required'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      if (!['post', 'comment'].includes(content_type)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Content type must be post or comment'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      const validReasons = [
        'spam',
        'harassment',
        'hate_speech',
        'inappropriate_content',
        'misinformation',
        'copyright_violation',
        'other'
      ];

      if (!validReasons.includes(reason)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: `Invalid reason. Must be one of: ${validReasons.join(', ')}`
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      if (description && description.length > 1000) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Description must be 1,000 characters or less'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      // Verify content exists and is accessible
      let contentQuery = '';
      if (content_type === 'post') {
        contentQuery = `
          SELECT p.id, p.author_id, p.is_deleted, ch.domain, ch.is_active 
          FROM posts p
          JOIN channels ch ON p.channel_id = ch.id
          WHERE p.id = $1
        `;
      } else {
        contentQuery = `
          SELECT c.id, c.author_id, c.is_deleted, ch.domain, ch.is_active 
          FROM comments c
          JOIN posts p ON c.post_id = p.id
          JOIN channels ch ON p.channel_id = ch.id
          WHERE c.id = $1
        `;
      }

      const contentResult = await db.query(contentQuery, [content_id]);

      if (contentResult.rows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Content not found'
            },
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        );
      }

      const content = contentResult.rows[0];

      // Check if content is deleted or channel is inactive
      if (content.is_deleted || !content.is_active) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Content not found'
            },
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        );
      }

      // Prevent users from reporting their own content
      if (content.author_id === user.id) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'You cannot report your own content'
            },
            timestamp: new Date().toISOString()
          },
          { status: 403 }
        );
      }

      // Check if user has already reported this content
      const existingReportResult = await db.query(
        `SELECT id FROM reports 
         WHERE content_type = $1 AND content_id = $2 AND reporter_id = $3`,
        [content_type, content_id, user.id]
      );

      if (existingReportResult.rows.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'CONFLICT',
              message: 'You have already reported this content'
            },
            timestamp: new Date().toISOString()
          },
          { status: 409 }
        );
      }

      // Check if user is a member of the channel (to prevent spam reports)
      const membershipResult = await db.query(
        `SELECT cm.user_id 
         FROM channel_members cm
         JOIN ${content_type === 'post' ? 'posts p ON p.channel_id = cm.channel_id WHERE p.id = $1' : 'comments c JOIN posts p ON c.post_id = p.id ON p.channel_id = cm.channel_id WHERE c.id = $1'}
         AND cm.user_id = $2`,
        [content_id, user.id]
      );

      if (membershipResult.rows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'You must be a member of the channel to report content'
            },
            timestamp: new Date().toISOString()
          },
          { status: 403 }
        );
      }

      // Create the report
      const reportResult = await db.query(
        `INSERT INTO reports (content_type, content_id, reporter_id, reason, description)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, content_type, content_id, reporter_id, reason, description, 
                   status, created_at`,
        [content_type, content_id, user.id, reason, description || null]
      );

      const newReport = reportResult.rows[0];

      // Create notification for moderators (domain leads and admins)
      const moderatorsResult = await db.query(
        `SELECT id FROM users 
         WHERE (role = 'admin' OR (role = 'domain_lead' AND domain = $1))
         AND is_active = true`,
        [content.domain]
      );

      // Insert notifications for moderators
      for (const moderator of moderatorsResult.rows) {
        await db.query(
          `INSERT INTO notifications (user_id, type, title, message, data)
           VALUES ($1, 'content_reported', 'Content Reported', $2, $3)`,
          [
            moderator.id,
            `A ${content_type} has been reported for ${reason}`,
            JSON.stringify({
              report_id: newReport.id,
              content_type,
              content_id,
              reason
            })
          ]
        );
      }

      return NextResponse.json(
        {
          success: true,
          data: {
            id: newReport.id,
            message: 'Content reported successfully. Moderators will review your report.'
          },
          timestamp: new Date().toISOString()
        },
        { status: 201 }
      );

    } catch (error) {
      console.error('Report creation error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to create report'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}

// GET /api/community/reports - Get user's reports (for users to track their reports)
export async function GET(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const status = searchParams.get('status') || 'all';
      const page = parseInt(searchParams.get('page') || '1');
      const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
      
      const offset = (page - 1) * limit;
      const user = req.user!;

      // Build query conditions
      const whereConditions = ['r.reporter_id = $1'];
      const queryParams = [user.id];
      let paramIndex = 2;

      if (status !== 'all') {
        whereConditions.push(`r.status = $${paramIndex}`);
        queryParams.push(status);
        paramIndex++;
      }

      const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

      // Get total count
      const countResult = await db.query(
        `SELECT COUNT(*) as total FROM reports r ${whereClause}`,
        queryParams
      );
      const total = parseInt(countResult.rows[0].total);

      // Get user's reports
      const reportsResult = await db.query(
        `SELECT 
           r.id, r.content_type, r.content_id, r.reason, r.description,
           r.status, r.created_at, r.resolved_at, r.resolution_notes,
           resolver.username as resolver_username,
           CASE 
             WHEN r.content_type = 'post' THEN LEFT(p.content, 100)
             WHEN r.content_type = 'comment' THEN LEFT(c.content, 100)
           END as content_preview,
           ch.name as channel_name
         FROM reports r
         LEFT JOIN users resolver ON r.resolved_by = resolver.id
         LEFT JOIN posts p ON r.content_id = p.id AND r.content_type = 'post'
         LEFT JOIN comments c ON r.content_id = c.id AND r.content_type = 'comment'
         LEFT JOIN channels ch ON (p.channel_id = ch.id OR (c.post_id IN (SELECT id FROM posts WHERE channel_id = ch.id)))
         ${whereClause}
         ORDER BY r.created_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...queryParams, limit, offset]
      );

      const totalPages = Math.ceil(total / limit);

      return NextResponse.json(
        {
          success: true,
          data: reportsResult.rows,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          },
          filters: {
            status
          },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Reports fetch error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch reports'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}