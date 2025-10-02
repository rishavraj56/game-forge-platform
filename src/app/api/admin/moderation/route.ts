import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/admin/moderation - Get moderation queue and reports
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
    
    const status = searchParams.get('status') || 'pending';
    const contentType = searchParams.get('contentType');
    const reason = searchParams.get('reason');

    // Build WHERE clause
    const conditions = ['1=1'];
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      conditions.push(`r.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (contentType) {
      conditions.push(`r.content_type = $${paramIndex}`);
      params.push(contentType);
      paramIndex++;
    }

    if (reason) {
      conditions.push(`r.reason = $${paramIndex}`);
      params.push(reason);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM reports r
      WHERE ${whereClause}
    `;
    const countResult = await db.query(countQuery, params.slice(0, paramIndex - 1));
    const total = parseInt(countResult.rows[0].total);

    // Get reports with content and user details
    const reportsQuery = `
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
              'created_at', p.created_at
            )
            FROM posts p
            JOIN users author ON p.author_id = author.id
            WHERE p.id = r.content_id
          )
          WHEN r.content_type = 'comment' THEN (
            SELECT json_build_object(
              'id', c.id,
              'content', c.content,
              'author_id', c.author_id,
              'author_username', author.username,
              'post_id', c.post_id,
              'created_at', c.created_at
            )
            FROM comments c
            JOIN users author ON c.author_id = author.id
            WHERE c.id = r.content_id
          )
        END as content_details
      FROM reports r
      JOIN users reporter ON r.reporter_id = reporter.id
      LEFT JOIN users resolver ON r.resolved_by = resolver.id
      WHERE ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    params.push(limit, offset);
    const reportsResult = await db.query(reportsQuery, params);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
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
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin moderation fetch error:', error);
    return NextResponse.json(
      { 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to fetch moderation queue' 
        } 
      },
      { status: 500 }
    );
  }
}