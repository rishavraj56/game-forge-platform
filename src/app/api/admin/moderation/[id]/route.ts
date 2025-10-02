import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// PUT /api/admin/moderation/[id] - Resolve a report
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

    const reportId = params.id;
    const body = await request.json();
    
    const { action, resolutionNotes } = body;

    // Validate action
    const validActions = ['dismiss', 'resolve_delete', 'resolve_warn', 'resolve_ban'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: { code: 'INVALID_ACTION', message: 'Invalid moderation action' } },
        { status: 400 }
      );
    }

    // Get the report details
    const reportQuery = `
      SELECT r.*, 
        CASE 
          WHEN r.content_type = 'post' THEN (
            SELECT json_build_object(
              'id', p.id,
              'author_id', p.author_id,
              'channel_id', p.channel_id,
              'content', p.content
            )
            FROM posts p WHERE p.id = r.content_id
          )
          WHEN r.content_type = 'comment' THEN (
            SELECT json_build_object(
              'id', c.id,
              'author_id', c.author_id,
              'post_id', c.post_id,
              'content', c.content
            )
            FROM comments c WHERE c.id = r.content_id
          )
        END as content_details
      FROM reports r
      WHERE r.id = $1 AND r.status = 'pending'
    `;

    const reportResult = await db.query(reportQuery, [reportId]);
    
    if (reportResult.rows.length === 0) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Report not found or already resolved' } },
        { status: 404 }
      );
    }

    const report = reportResult.rows[0];
    const contentDetails = report.content_details;

    // Start transaction
    await db.query('BEGIN');

    try {
      // Update report status
      const status = action === 'dismiss' ? 'dismissed' : 'resolved';
      await db.query(`
        UPDATE reports 
        SET status = $1, resolved_by = $2, resolved_at = NOW(), resolution_notes = $3
        WHERE id = $4
      `, [status, session.user.id, resolutionNotes, reportId]);

      // Perform the moderation action
      let moderationAction = '';
      
      if (action === 'resolve_delete' && contentDetails) {
        // Delete the content
        if (report.content_type === 'post') {
          await db.query('UPDATE posts SET is_deleted = true WHERE id = $1', [contentDetails.id]);
          moderationAction = 'delete';
        } else if (report.content_type === 'comment') {
          await db.query('UPDATE comments SET is_deleted = true WHERE id = $1', [contentDetails.id]);
          moderationAction = 'delete';
        }
      } else if (action === 'resolve_warn' && contentDetails) {
        // Create a warning for the content author
        await db.query(`
          INSERT INTO user_sanctions (user_id, moderator_id, type, reason, description)
          VALUES ($1, $2, 'warning', $3, $4)
        `, [
          contentDetails.author_id,
          session.user.id,
          `Content violation: ${report.reason}`,
          `Warning issued for reported content. Report ID: ${reportId}`
        ]);
        moderationAction = 'warn';
      } else if (action === 'resolve_ban' && contentDetails) {
        // Create a temporary ban for the content author
        const banExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        await db.query(`
          INSERT INTO user_sanctions (user_id, moderator_id, type, reason, description, expires_at)
          VALUES ($1, $2, 'temporary_ban', $3, $4, $5)
        `, [
          contentDetails.author_id,
          session.user.id,
          `Content violation: ${report.reason}`,
          `Temporary ban issued for reported content. Report ID: ${reportId}`,
          banExpiry
        ]);
        
        // Deactivate user temporarily
        await db.query('UPDATE users SET is_active = false WHERE id = $1', [contentDetails.author_id]);
        moderationAction = 'ban';
      }

      // Log the moderation action
      if (moderationAction) {
        await db.query(`
          INSERT INTO moderation_actions (moderator_id, content_type, content_id, action, reason, notes)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          session.user.id,
          report.content_type,
          report.content_id,
          moderationAction,
          `Report resolution: ${report.reason}`,
          JSON.stringify({ reportId, action, resolutionNotes })
        ]);
      }

      await db.query('COMMIT');

      return NextResponse.json({
        success: true,
        data: { reportId, action, status },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Admin moderation resolution error:', error);
    return NextResponse.json(
      { 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to resolve report' 
        } 
      },
      { status: 500 }
    );
  }
}

// GET /api/admin/moderation/[id] - Get detailed report information
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

    const reportId = params.id;

    const reportQuery = `
      SELECT 
        r.*,
        reporter.username as reporter_username,
        reporter.avatar_url as reporter_avatar,
        resolver.username as resolver_username,
        CASE 
          WHEN r.content_type = 'post' THEN (
            SELECT json_build_object(
              'id', p.id,
              'content', p.content,
              'author_id', p.author_id,
              'author_username', author.username,
              'channel_id', p.channel_id,
              'channel_name', ch.name,
              'created_at', p.created_at,
              'is_deleted', p.is_deleted
            )
            FROM posts p
            JOIN users author ON p.author_id = author.id
            JOIN channels ch ON p.channel_id = ch.id
            WHERE p.id = r.content_id
          )
          WHEN r.content_type = 'comment' THEN (
            SELECT json_build_object(
              'id', c.id,
              'content', c.content,
              'author_id', c.author_id,
              'author_username', author.username,
              'post_id', c.post_id,
              'created_at', c.created_at,
              'is_deleted', c.is_deleted
            )
            FROM comments c
            JOIN users author ON c.author_id = author.id
            WHERE c.id = r.content_id
          )
        END as content_details
      FROM reports r
      JOIN users reporter ON r.reporter_id = reporter.id
      LEFT JOIN users resolver ON r.resolved_by = resolver.id
      WHERE r.id = $1
    `;

    const result = await db.query(reportQuery, [reportId]);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Report not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin report detail error:', error);
    return NextResponse.json(
      { 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to fetch report details' 
        } 
      },
      { status: 500 }
    );
  }
}