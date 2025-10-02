import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest, canModerateContent } from '../../../../lib/auth-middleware';
import { db } from '../../../../lib/db';

// GET /api/community/posts - Get posts with filtering
export async function GET(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const channelId = searchParams.get('channelId');
      const authorId = searchParams.get('authorId');
      const page = parseInt(searchParams.get('page') || '1');
      const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
      const includeDeleted = searchParams.get('includeDeleted') === 'true';
      const pinnedOnly = searchParams.get('pinnedOnly') === 'true';
      
      const offset = (page - 1) * limit;
      const user = req.user!;

      // Build query conditions
      const whereConditions = [];
      const queryParams: any[] = [];
      let paramIndex = 1;

      // Channel filter
      if (channelId) {
        // Verify channel exists and user has access
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

        whereConditions.push(`p.channel_id = $${paramIndex}`);
        queryParams.push(channelId);
        paramIndex++;
      }

      // Author filter
      if (authorId) {
        whereConditions.push(`p.author_id = $${paramIndex}`);
        queryParams.push(authorId);
        paramIndex++;
      }

      // Deleted filter (only moderators can see deleted posts)
      if (!includeDeleted || !canModerateContent(user.role, user.domain)) {
        whereConditions.push(`p.is_deleted = false`);
      }

      // Pinned filter
      if (pinnedOnly) {
        whereConditions.push(`p.is_pinned = true`);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Get total count
      const countResult = await db.query(
        `SELECT COUNT(*) as total 
         FROM posts p
         JOIN channels c ON p.channel_id = c.id
         ${whereClause}`,
        queryParams
      );
      const total = parseInt(countResult.rows[0].total);

      // Get posts with author and channel information
      const postsResult = await db.query(
        `SELECT 
           p.id, p.channel_id, p.author_id, p.content, p.attachments, 
           p.reaction_counts, p.is_pinned, p.is_deleted, p.created_at, p.updated_at,
           u.username as author_username, u.avatar_url as author_avatar_url,
           u.domain as author_domain, u.role as author_role, u.level as author_level,
           c.name as channel_name, c.domain as channel_domain
         FROM posts p
         JOIN users u ON p.author_id = u.id
         JOIN channels c ON p.channel_id = c.id
         ${whereClause}
         ORDER BY p.is_pinned DESC, p.created_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...queryParams, limit, offset]
      );

      const totalPages = Math.ceil(total / limit);

      // Get comment counts for each post
      const postIds = postsResult.rows.map(post => post.id);
      let commentCounts: Record<string, number> = {};

      if (postIds.length > 0) {
        const commentCountsResult = await db.query(
          `SELECT post_id, COUNT(*) as comment_count
           FROM comments
           WHERE post_id = ANY($1) AND is_deleted = false
           GROUP BY post_id`,
          [postIds]
        );

        commentCounts = commentCountsResult.rows.reduce((acc, row) => {
          acc[row.post_id] = parseInt(row.comment_count);
          return acc;
        }, {} as Record<string, number>);
      }

      // Add comment counts to posts
      const postsWithCounts = postsResult.rows.map(post => ({
        ...post,
        comment_count: commentCounts[post.id] || 0
      }));

      return NextResponse.json(
        {
          success: true,
          data: postsWithCounts,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          },
          filters: {
            channelId,
            authorId,
            includeDeleted,
            pinnedOnly
          },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Posts fetch error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch posts'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}

// POST /api/community/posts - Create new post
export async function POST(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      const { channel_id, content, attachments = [] } = body;
      const user = req.user!;

      // Validation
      if (!channel_id) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Channel ID is required'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      if (!content || content.trim().length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Post content is required'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      if (content.length > 10000) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Post content must be 10,000 characters or less'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      // Verify channel exists and is active
      const channelResult = await db.query(
        `SELECT id, domain, is_active FROM channels WHERE id = $1 AND is_active = true`,
        [channel_id]
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

      // Check if user is a member of the channel
      const membershipResult = await db.query(
        `SELECT user_id FROM channel_members WHERE channel_id = $1 AND user_id = $2`,
        [channel_id, user.id]
      );

      if (membershipResult.rows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'You must be a member of the channel to post'
            },
            timestamp: new Date().toISOString()
          },
          { status: 403 }
        );
      }

      // Validate attachments
      if (attachments && Array.isArray(attachments)) {
        if (attachments.length > 10) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Maximum 10 attachments allowed per post'
              },
              timestamp: new Date().toISOString()
            },
            { status: 400 }
          );
        }

        for (const attachment of attachments) {
          if (!attachment.type || !attachment.url) {
            return NextResponse.json(
              {
                success: false,
                error: {
                  code: 'VALIDATION_ERROR',
                  message: 'Each attachment must have type and url'
                },
                timestamp: new Date().toISOString()
              },
              { status: 400 }
            );
          }

          if (!['image', 'file', 'link'].includes(attachment.type)) {
            return NextResponse.json(
              {
                success: false,
                error: {
                  code: 'VALIDATION_ERROR',
                  message: 'Attachment type must be image, file, or link'
                },
                timestamp: new Date().toISOString()
              },
              { status: 400 }
            );
          }
        }
      }

      // Create the post
      const postResult = await db.query(
        `INSERT INTO posts (channel_id, author_id, content, attachments)
         VALUES ($1, $2, $3, $4)
         RETURNING id, channel_id, author_id, content, attachments, 
                   reaction_counts, is_pinned, is_deleted, created_at, updated_at`,
        [channel_id, user.id, content.trim(), JSON.stringify(attachments)]
      );

      const newPost = postResult.rows[0];

      // Get author and channel information for response
      const postWithDetailsResult = await db.query(
        `SELECT 
           p.id, p.channel_id, p.author_id, p.content, p.attachments, 
           p.reaction_counts, p.is_pinned, p.is_deleted, p.created_at, p.updated_at,
           u.username as author_username, u.avatar_url as author_avatar_url,
           u.domain as author_domain, u.role as author_role, u.level as author_level,
           c.name as channel_name, c.domain as channel_domain
         FROM posts p
         JOIN users u ON p.author_id = u.id
         JOIN channels c ON p.channel_id = c.id
         WHERE p.id = $1`,
        [newPost.id]
      );

      return NextResponse.json(
        {
          success: true,
          data: {
            ...postWithDetailsResult.rows[0],
            comment_count: 0
          },
          timestamp: new Date().toISOString()
        },
        { status: 201 }
      );

    } catch (error) {
      console.error('Post creation error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to create post'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}