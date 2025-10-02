import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest, canModerateContent } from '../../../../lib/auth-middleware';
import { db } from '../../../../lib/db';

// GET /api/community/moderation - Get moderation queue and reports
export async function GET(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const type = searchParams.get('type') || 'all'; // 'posts', 'comments', 'reports', 'all'
      const status = searchParams.get('status') || 'pending'; // 'pending', 'resolved', 'all'
      const domain = searchParams.get('domain');
      const page = parseInt(searchParams.get('page') || '1');
      const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
      
      const offset = (page - 1) * limit;
      const user = req.user!;

      // Check if user has moderation permissions
      if (user.role !== 'admin' && user.role !== 'domain_lead') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Insufficient permissions for moderation'
            },
            timestamp: new Date().toISOString()
          },
          { status: 403 }
        );
      }

      let moderationData: any = {};

      // Get reported posts
      if (type === 'posts' || type === 'all') {
        const postsQuery = `
          SELECT 
            p.id, p.content, p.is_deleted, p.created_at, p.updated_at,
            u.username as author_username, u.domain as author_domain,
            ch.name as channel_name, ch.domain as channel_domain,
            COUNT(r.id) as report_count,
            ARRAY_AGG(DISTINCT r.reason) as report_reasons
          FROM posts p
          JOIN users u ON p.author_id = u.id
          JOIN channels ch ON p.channel_id = ch.id
          LEFT JOIN reports r ON r.content_id = p.id AND r.content_type = 'post'
          WHERE (r.id IS NOT NULL OR p.is_deleted = true)
          ${domain && user.role === 'domain_lead' ? 'AND ch.domain = $1' : ''}
          GROUP BY p.id, u.username, u.domain, ch.name, ch.domain
          ORDER BY COUNT(r.id) DESC, p.created_at DESC
          LIMIT $${domain && user.role === 'domain_lead' ? '2' : '1'} 
          OFFSET $${domain && user.role === 'domain_lead' ? '3' : '2'}
        `;

        const postsParams = domain && user.role === 'domain_lead' 
          ? [domain, limit, offset] 
          : [limit, offset];

        const postsResult = await db.query(postsQuery, postsParams);
        moderationData.posts = postsResult.rows;
      }

      // Get reported comments
      if (type === 'comments' || type === 'all') {
        const commentsQuery = `
          SELECT 
            c.id, c.content, c.is_deleted, c.created_at, c.updated_at,
            u.username as author_username, u.domain as author_domain,
            ch.name as channel_name, ch.domain as channel_domain,
            p.id as post_id,
            COUNT(r.id) as report_count,
            ARRAY_AGG(DISTINCT r.reason) as report_reasons
          FROM comments c
          JOIN users u ON c.author_id = u.id
          JOIN posts p ON c.post_id = p.id
          JOIN channels ch ON p.channel_id = ch.id
          LEFT JOIN reports r ON r.content_id = c.id AND r.content_type = 'comment'
          WHERE (r.id IS NOT NULL OR c.is_deleted = true)
          ${domain && user.role === 'domain_lead' ? 'AND ch.domain = $1' : ''}
          GROUP BY c.id, u.username, u.domain, ch.name, ch.domain, p.id
          ORDER BY COUNT(r.id) DESC, c.created_at DESC
          LIMIT $${domain && user.role === 'domain_lead' ? '2' : '1'} 
          OFFSET $${domain && user.role === 'domain_lead' ? '3' : '2'}
        `;

        const commentsParams = domain && user.role === 'domain_lead' 
          ? [domain, limit, offset] 
          : [limit, offset];

        const commentsResult = await db.query(commentsQuery, commentsParams);
        moderationData.comments = commentsResult.rows;
      }

      // Get recent reports
      if (type === 'reports' || type === 'all') {
        const reportsQuery = `
          SELECT 
            r.id, r.content_type, r.content_id, r.reason, r.description,
            r.status, r.created_at, r.resolved_at,
            reporter.username as reporter_username,
            resolver.username as resolver_username,
            CASE 
              WHEN r.content_type = 'post' THEN p.content
              WHEN r.content_type = 'comment' THEN c.content
            END as content,
            CASE 
              WHEN r.content_type = 'post' THEN pu.username
              WHEN r.content_type = 'comment' THEN cu.username
            END as content_author,
            ch.name as channel_name, ch.domain as channel_domain
          FROM reports r
          JOIN users reporter ON r.reporter_id = reporter.id
          LEFT JOIN users resolver ON r.resolved_by = resolver.id
          LEFT JOIN posts p ON r.content_id = p.id AND r.content_type = 'post'
          LEFT JOIN users pu ON p.author_id = pu.id
          LEFT JOIN comments c ON r.content_id = c.id AND r.content_type = 'comment'
          LEFT JOIN users cu ON c.author_id = cu.id
          LEFT JOIN channels ch ON (p.channel_id = ch.id OR (c.post_id IN (SELECT id FROM posts WHERE channel_id = ch.id)))
          WHERE 1=1
          ${status !== 'all' ? `AND r.status = '${status}'` : ''}
          ${domain && user.role === 'domain_lead' ? 'AND ch.domain = $1' : ''}
          ORDER BY r.created_at DESC
          LIMIT $${domain && user.role === 'domain_lead' ? '2' : '1'} 
          OFFSET $${domain && user.role === 'domain_lead' ? '3' : '2'}
        `;

        const reportsParams = domain && user.role === 'domain_lead' 
          ? [domain, limit, offset] 
          : [limit, offset];

        const reportsResult = await db.query(reportsQuery, reportsParams);
        moderationData.reports = reportsResult.rows;
      }

      // Get moderation statistics
      const statsQuery = `
        SELECT 
          COUNT(CASE WHEN r.status = 'pending' THEN 1 END) as pending_reports,
          COUNT(CASE WHEN r.status = 'resolved' THEN 1 END) as resolved_reports,
          COUNT(CASE WHEN p.is_deleted = true THEN 1 END) as deleted_posts,
          COUNT(CASE WHEN c.is_deleted = true THEN 1 END) as deleted_comments
        FROM reports r
        LEFT JOIN posts p ON r.content_id = p.id AND r.content_type = 'post'
        LEFT JOIN comments c ON r.content_id = c.id AND r.content_type = 'comment'
        LEFT JOIN channels ch ON (p.channel_id = ch.id OR (c.post_id IN (SELECT id FROM posts WHERE channel_id = ch.id)))
        WHERE 1=1
        ${domain && user.role === 'domain_lead' ? 'AND ch.domain = $1' : ''}
      `;

      const statsParams = domain && user.role === 'domain_lead' ? [domain] : [];
      const statsResult = await db.query(statsQuery, statsParams);

      return NextResponse.json(
        {
          success: true,
          data: {
            ...moderationData,
            statistics: statsResult.rows[0]
          },
          pagination: {
            page,
            limit,
            hasNext: true, // Simplified for now
            hasPrev: page > 1
          },
          filters: {
            type,
            status,
            domain
          },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Moderation fetch error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch moderation data'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}

// POST /api/community/moderation - Take moderation action
export async function POST(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      const { 
        action, // 'delete', 'restore', 'resolve_report', 'dismiss_report'
        content_type, // 'post', 'comment'
        content_id,
        report_id,
        reason,
        notes
      } = body;
      const user = req.user!;

      // Check if user has moderation permissions
      if (user.role !== 'admin' && user.role !== 'domain_lead') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Insufficient permissions for moderation'
            },
            timestamp: new Date().toISOString()
          },
          { status: 403 }
        );
      }

      // Validation
      if (!action) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Action is required'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      const validActions = ['delete', 'restore', 'resolve_report', 'dismiss_report'];
      if (!validActions.includes(action)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: `Invalid action. Must be one of: ${validActions.join(', ')}`
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      let result: any = {};

      if (action === 'delete' || action === 'restore') {
        if (!content_type || !content_id) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Content type and ID are required for delete/restore actions'
              },
              timestamp: new Date().toISOString()
            },
            { status: 400 }
          );
        }

        // Verify content exists and check permissions
        let contentQuery = '';
        if (content_type === 'post') {
          contentQuery = `
            SELECT p.id, p.is_deleted, ch.domain 
            FROM posts p
            JOIN channels ch ON p.channel_id = ch.id
            WHERE p.id = $1
          `;
        } else if (content_type === 'comment') {
          contentQuery = `
            SELECT c.id, c.is_deleted, ch.domain 
            FROM comments c
            JOIN posts p ON c.post_id = p.id
            JOIN channels ch ON p.channel_id = ch.id
            WHERE c.id = $1
          `;
        } else {
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

        // Check domain permissions for domain leads
        if (user.role === 'domain_lead' && !canModerateContent(user.role, user.domain, content.domain)) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'FORBIDDEN',
                message: 'You can only moderate content in your domain'
              },
              timestamp: new Date().toISOString()
            },
            { status: 403 }
          );
        }

        // Perform the action
        const isDeleted = action === 'delete';
        const table = content_type === 'post' ? 'posts' : 'comments';
        
        await db.query(
          `UPDATE ${table} SET is_deleted = $1, updated_at = NOW() WHERE id = $2`,
          [isDeleted, content_id]
        );

        // Log the moderation action
        await db.query(
          `INSERT INTO moderation_actions (moderator_id, content_type, content_id, action, reason, notes)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [user.id, content_type, content_id, action, reason || null, notes || null]
        );

        result = {
          action,
          content_type,
          content_id,
          status: isDeleted ? 'deleted' : 'restored'
        };

      } else if (action === 'resolve_report' || action === 'dismiss_report') {
        if (!report_id) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Report ID is required for report actions'
              },
              timestamp: new Date().toISOString()
            },
            { status: 400 }
          );
        }

        // Verify report exists and check permissions
        const reportResult = await db.query(
          `SELECT r.id, r.status, ch.domain
           FROM reports r
           LEFT JOIN posts p ON r.content_id = p.id AND r.content_type = 'post'
           LEFT JOIN comments c ON r.content_id = c.id AND r.content_type = 'comment'
           LEFT JOIN channels ch ON (p.channel_id = ch.id OR (c.post_id IN (SELECT id FROM posts WHERE channel_id = ch.id)))
           WHERE r.id = $1`,
          [report_id]
        );

        if (reportResult.rows.length === 0) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'NOT_FOUND',
                message: 'Report not found'
              },
              timestamp: new Date().toISOString()
            },
            { status: 404 }
          );
        }

        const report = reportResult.rows[0];

        // Check domain permissions for domain leads
        if (user.role === 'domain_lead' && !canModerateContent(user.role, user.domain, report.domain)) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'FORBIDDEN',
                message: 'You can only moderate reports in your domain'
              },
              timestamp: new Date().toISOString()
            },
            { status: 403 }
          );
        }

        if (report.status !== 'pending') {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'CONFLICT',
                message: 'Report has already been processed'
              },
              timestamp: new Date().toISOString()
            },
            { status: 409 }
          );
        }

        // Update report status
        const newStatus = action === 'resolve_report' ? 'resolved' : 'dismissed';
        await db.query(
          `UPDATE reports 
           SET status = $1, resolved_by = $2, resolved_at = NOW(), resolution_notes = $3
           WHERE id = $4`,
          [newStatus, user.id, notes || null, report_id]
        );

        result = {
          action,
          report_id,
          status: newStatus
        };
      }

      return NextResponse.json(
        {
          success: true,
          data: result,
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Moderation action error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to perform moderation action'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}