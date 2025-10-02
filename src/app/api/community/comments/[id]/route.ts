import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest, canModerateContent } from '../../../../../lib/auth-middleware';
import { db } from '../../../../../lib/db';

// GET /api/community/comments/[id] - Get specific comment details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const commentId = params.id;
      const user = req.user!;

      // Get comment with author and post information
      const commentResult = await db.query(
        `SELECT 
           c.id, c.post_id, c.author_id, c.content, c.parent_id, 
           c.is_deleted, c.created_at, c.updated_at,
           u.username as author_username, u.avatar_url as author_avatar_url,
           u.domain as author_domain, u.role as author_role, u.level as author_level,
           p.is_deleted as post_deleted, ch.domain as channel_domain, ch.is_active as channel_active
         FROM comments c
         JOIN users u ON c.author_id = u.id
         JOIN posts p ON c.post_id = p.id
         JOIN channels ch ON p.channel_id = ch.id
         WHERE c.id = $1`,
        [commentId]
      );

      if (commentResult.rows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Comment not found'
            },
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        );
      }

      const comment = commentResult.rows[0];

      // Check if comment is deleted (only moderators can see deleted comments)
      if (comment.is_deleted && !canModerateContent(user.role, user.domain, comment.channel_domain)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Comment not found'
            },
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        );
      }

      // Check if post is deleted (only moderators can see deleted posts)
      if (comment.post_deleted && !canModerateContent(user.role, user.domain, comment.channel_domain)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Comment not found'
            },
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        );
      }

      // Check if channel is active (unless user can moderate)
      if (!comment.channel_active && !canModerateContent(user.role, user.domain, comment.channel_domain)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Comment not found'
            },
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        );
      }

      // Get reply count if this is a top-level comment
      let replyCount = 0;
      if (!comment.parent_id) {
        const replyCountResult = await db.query(
          `SELECT COUNT(*) as count FROM comments WHERE parent_id = $1 AND is_deleted = false`,
          [commentId]
        );
        replyCount = parseInt(replyCountResult.rows[0].count);
      }

      return NextResponse.json(
        {
          success: true,
          data: {
            ...comment,
            reply_count: replyCount,
            can_edit: comment.author_id === user.id || canModerateContent(user.role, user.domain, comment.channel_domain),
            can_delete: comment.author_id === user.id || canModerateContent(user.role, user.domain, comment.channel_domain)
          },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Comment fetch error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch comment'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}

// PUT /api/community/comments/[id] - Update comment
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const commentId = params.id;
      const body = await req.json();
      const { content } = body;
      const user = req.user!;

      // Validation
      if (!content || content.trim().length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Comment content cannot be empty'
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

      // Get current comment
      const commentResult = await db.query(
        `SELECT c.id, c.author_id, c.is_deleted, ch.domain as channel_domain
         FROM comments c
         JOIN posts p ON c.post_id = p.id
         JOIN channels ch ON p.channel_id = ch.id
         WHERE c.id = $1`,
        [commentId]
      );

      if (commentResult.rows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Comment not found'
            },
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        );
      }

      const comment = commentResult.rows[0];

      // Check if comment is deleted
      if (comment.is_deleted) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'CONFLICT',
              message: 'Cannot edit deleted comment'
            },
            timestamp: new Date().toISOString()
          },
          { status: 409 }
        );
      }

      // Check permissions
      const canModerate = canModerateContent(user.role, user.domain, comment.channel_domain);
      const isAuthor = comment.author_id === user.id;

      if (!isAuthor && !canModerate) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'You can only edit your own comments'
            },
            timestamp: new Date().toISOString()
          },
          { status: 403 }
        );
      }

      // Update the comment
      const updateResult = await db.query(
        `UPDATE comments 
         SET content = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING id, post_id, author_id, content, parent_id, 
                   is_deleted, created_at, updated_at`,
        [content.trim(), commentId]
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
      console.error('Comment update error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to update comment'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}

// DELETE /api/community/comments/[id] - Delete comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const commentId = params.id;
      const user = req.user!;

      // Get current comment
      const commentResult = await db.query(
        `SELECT c.id, c.author_id, c.is_deleted, ch.domain as channel_domain
         FROM comments c
         JOIN posts p ON c.post_id = p.id
         JOIN channels ch ON p.channel_id = ch.id
         WHERE c.id = $1`,
        [commentId]
      );

      if (commentResult.rows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Comment not found'
            },
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        );
      }

      const comment = commentResult.rows[0];

      // Check if comment is already deleted
      if (comment.is_deleted) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'CONFLICT',
              message: 'Comment is already deleted'
            },
            timestamp: new Date().toISOString()
          },
          { status: 409 }
        );
      }

      // Check permissions
      const canModerate = canModerateContent(user.role, user.domain, comment.channel_domain);
      const isAuthor = comment.author_id === user.id;

      if (!isAuthor && !canModerate) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'You can only delete your own comments'
            },
            timestamp: new Date().toISOString()
          },
          { status: 403 }
        );
      }

      // Soft delete the comment
      await db.query(
        `UPDATE comments SET is_deleted = true, updated_at = NOW() WHERE id = $1`,
        [commentId]
      );

      return NextResponse.json(
        {
          success: true,
          message: 'Comment deleted successfully',
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Comment deletion error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to delete comment'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}