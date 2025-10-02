import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest, canModerateContent } from '../../../../../../lib/auth-middleware';
import { db } from '../../../../../../lib/db';

// GET /api/community/posts/[id]/comments - Get post comments
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const postId = params.id;
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
      const includeDeleted = searchParams.get('includeDeleted') === 'true';
      const parentId = searchParams.get('parentId'); // For threaded comments
      
      const offset = (page - 1) * limit;
      const user = req.user!;

      // Check if post exists and is accessible
      const postResult = await db.query(
        `SELECT p.id, p.is_deleted, c.domain as channel_domain, c.is_active as channel_active
         FROM posts p
         JOIN channels c ON p.channel_id = c.id
         WHERE p.id = $1`,
        [postId]
      );

      if (postResult.rows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Post not found'
            },
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        );
      }

      const post = postResult.rows[0];

      // Check if post is deleted (only moderators can see deleted posts)
      if (post.is_deleted && !canModerateContent(user.role, user.domain, post.channel_domain)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Post not found'
            },
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        );
      }

      // Check if channel is active (unless user can moderate)
      if (!post.channel_active && !canModerateContent(user.role, user.domain, post.channel_domain)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Post not found'
            },
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        );
      }

      // Build query conditions
      const whereConditions = ['c.post_id = $1'];
      const queryParams: any[] = [postId];
      let paramIndex = 2;

      // Parent filter for threaded comments
      if (parentId) {
        whereConditions.push(`c.parent_id = $${paramIndex}`);
        queryParams.push(parentId);
        paramIndex++;
      } else {
        // Top-level comments only
        whereConditions.push(`c.parent_id IS NULL`);
      }

      // Deleted filter (only moderators can see deleted comments)
      if (!includeDeleted || !canModerateContent(user.role, user.domain, post.channel_domain)) {
        whereConditions.push(`c.is_deleted = false`);
      }

      const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

      // Get total count
      const countResult = await db.query(
        `SELECT COUNT(*) as total 
         FROM comments c
         ${whereClause}`,
        queryParams
      );
      const total = parseInt(countResult.rows[0].total);

      // Get comments with author information
      const commentsResult = await db.query(
        `SELECT 
           c.id, c.post_id, c.author_id, c.content, c.parent_id, 
           c.is_deleted, c.created_at, c.updated_at,
           u.username as author_username, u.avatar_url as author_avatar_url,
           u.domain as author_domain, u.role as author_role, u.level as author_level
         FROM comments c
         JOIN users u ON c.author_id = u.id
         ${whereClause}
         ORDER BY c.created_at ASC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...queryParams, limit, offset]
      );

      const totalPages = Math.ceil(total / limit);

      // Get reply counts for each comment (if they are top-level comments)
      let replyCounts: Record<string, number> = {};
      if (!parentId && commentsResult.rows.length > 0) {
        const commentIds = commentsResult.rows.map(comment => comment.id);
        const replyCountsResult = await db.query(
          `SELECT parent_id, COUNT(*) as reply_count
           FROM comments
           WHERE parent_id = ANY($1) AND is_deleted = false
           GROUP BY parent_id`,
          [commentIds]
        );

        replyCounts = replyCountsResult.rows.reduce((acc, row) => {
          acc[row.parent_id] = parseInt(row.reply_count);
          return acc;
        }, {} as Record<string, number>);
      }

      // Add reply counts and permissions to comments
      const commentsWithCounts = commentsResult.rows.map(comment => ({
        ...comment,
        reply_count: replyCounts[comment.id] || 0,
        can_edit: comment.author_id === user.id || canModerateContent(user.role, user.domain, post.channel_domain),
        can_delete: comment.author_id === user.id || canModerateContent(user.role, user.domain, post.channel_domain)
      }));

      return NextResponse.json(
        {
          success: true,
          data: commentsWithCounts,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          },
          filters: {
            parentId,
            includeDeleted
          },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Comments fetch error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch comments'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}

// POST /api/community/posts/[id]/comments - Create new comment
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const postId = params.id;
      const body = await req.json();
      const { content, parent_id } = body;
      const user = req.user!;

      // Validation
      if (!content || content.trim().length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Comment content is required'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      if (content.length > 2000) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Comment content must be 2,000 characters or less'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      // Check if post exists and is accessible
      const postResult = await db.query(
        `SELECT p.id, p.is_deleted, p.channel_id, c.is_active as channel_active
         FROM posts p
         JOIN channels c ON p.channel_id = c.id
         WHERE p.id = $1`,
        [postId]
      );

      if (postResult.rows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Post not found'
            },
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        );
      }

      const post = postResult.rows[0];

      // Check if post is deleted
      if (post.is_deleted) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'CONFLICT',
              message: 'Cannot comment on deleted post'
            },
            timestamp: new Date().toISOString()
          },
          { status: 409 }
        );
      }

      // Check if channel is active
      if (!post.channel_active) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Post not found'
            },
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        );
      }

      // Check if user is a member of the channel
      const membershipResult = await db.query(
        `SELECT user_id FROM channel_members WHERE channel_id = $1 AND user_id = $2`,
        [post.channel_id, user.id]
      );

      if (membershipResult.rows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'You must be a member of the channel to comment'
            },
            timestamp: new Date().toISOString()
          },
          { status: 403 }
        );
      }

      // Validate parent comment if provided
      if (parent_id) {
        const parentResult = await db.query(
          `SELECT id, post_id, parent_id FROM comments WHERE id = $1 AND is_deleted = false`,
          [parent_id]
        );

        if (parentResult.rows.length === 0) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'NOT_FOUND',
                message: 'Parent comment not found'
              },
              timestamp: new Date().toISOString()
            },
            { status: 404 }
          );
        }

        const parentComment = parentResult.rows[0];

        // Check if parent comment belongs to the same post
        if (parentComment.post_id !== postId) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Parent comment must belong to the same post'
              },
              timestamp: new Date().toISOString()
            },
            { status: 400 }
          );
        }

        // Prevent nested replies (only allow one level of threading)
        if (parentComment.parent_id) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Cannot reply to a reply. Please reply to the original comment.'
              },
              timestamp: new Date().toISOString()
            },
            { status: 400 }
          );
        }
      }

      // Create the comment
      const commentResult = await db.query(
        `INSERT INTO comments (post_id, author_id, content, parent_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id, post_id, author_id, content, parent_id, 
                   is_deleted, created_at, updated_at`,
        [postId, user.id, content.trim(), parent_id || null]
      );

      const newComment = commentResult.rows[0];

      // Get author information for response
      const commentWithAuthorResult = await db.query(
        `SELECT 
           c.id, c.post_id, c.author_id, c.content, c.parent_id, 
           c.is_deleted, c.created_at, c.updated_at,
           u.username as author_username, u.avatar_url as author_avatar_url,
           u.domain as author_domain, u.role as author_role, u.level as author_level
         FROM comments c
         JOIN users u ON c.author_id = u.id
         WHERE c.id = $1`,
        [newComment.id]
      );

      return NextResponse.json(
        {
          success: true,
          data: {
            ...commentWithAuthorResult.rows[0],
            reply_count: 0,
            can_edit: true,
            can_delete: true
          },
          timestamp: new Date().toISOString()
        },
        { status: 201 }
      );

    } catch (error) {
      console.error('Comment creation error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to create comment'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}