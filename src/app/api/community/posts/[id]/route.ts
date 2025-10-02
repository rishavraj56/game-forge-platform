import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest, canModerateContent } from '../../../../../lib/auth-middleware';
import { db } from '../../../../../lib/db';

// GET /api/community/posts/[id] - Get specific post details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const postId = params.id;
      const user = req.user!;

      // Get post with author and channel information
      const postResult = await db.query(
        `SELECT 
           p.id, p.channel_id, p.author_id, p.content, p.attachments, 
           p.reaction_counts, p.is_pinned, p.is_deleted, p.created_at, p.updated_at,
           u.username as author_username, u.avatar_url as author_avatar_url,
           u.domain as author_domain, u.role as author_role, u.level as author_level,
           c.name as channel_name, c.domain as channel_domain, c.is_active as channel_active
         FROM posts p
         JOIN users u ON p.author_id = u.id
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

      // Get comment count
      const commentCountResult = await db.query(
        `SELECT COUNT(*) as comment_count
         FROM comments
         WHERE post_id = $1 AND is_deleted = false`,
        [postId]
      );

      const commentCount = parseInt(commentCountResult.rows[0].comment_count);

      // Check if user has reacted to this post
      const userReactionsResult = await db.query(
        `SELECT reaction_type FROM post_reactions WHERE post_id = $1 AND user_id = $2`,
        [postId, user.id]
      );

      const userReactions = userReactionsResult.rows.map(row => row.reaction_type);

      return NextResponse.json(
        {
          success: true,
          data: {
            ...post,
            comment_count: commentCount,
            user_reactions: userReactions,
            can_edit: post.author_id === user.id || canModerateContent(user.role, user.domain, post.channel_domain),
            can_delete: post.author_id === user.id || canModerateContent(user.role, user.domain, post.channel_domain),
            can_pin: canModerateContent(user.role, user.domain, post.channel_domain)
          },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Post fetch error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch post'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}

// PUT /api/community/posts/[id] - Update post
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const postId = params.id;
      const body = await req.json();
      const { content, attachments, is_pinned } = body;
      const user = req.user!;

      // Get current post
      const postResult = await db.query(
        `SELECT p.id, p.author_id, p.content, p.is_deleted, c.domain as channel_domain
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
              message: 'Cannot edit deleted post'
            },
            timestamp: new Date().toISOString()
          },
          { status: 409 }
        );
      }

      // Check permissions
      const canModerate = canModerateContent(user.role, user.domain, post.channel_domain);
      const isAuthor = post.author_id === user.id;

      // Content editing - only author or moderators
      if (content !== undefined && !isAuthor && !canModerate) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'You can only edit your own posts'
            },
            timestamp: new Date().toISOString()
          },
          { status: 403 }
        );
      }

      // Pinning - only moderators
      if (is_pinned !== undefined && !canModerate) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Only moderators can pin/unpin posts'
            },
            timestamp: new Date().toISOString()
          },
          { status: 403 }
        );
      }

      // Validate content if provided
      if (content !== undefined) {
        if (!content || content.trim().length === 0) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Post content cannot be empty'
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
      }

      // Validate attachments if provided
      if (attachments !== undefined) {
        if (Array.isArray(attachments)) {
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
      }

      // Build update query
      const updateFields = [];
      const updateParams = [];
      let paramIndex = 1;

      if (content !== undefined) {
        updateFields.push(`content = $${paramIndex}`);
        updateParams.push(content.trim());
        paramIndex++;
      }

      if (attachments !== undefined) {
        updateFields.push(`attachments = $${paramIndex}`);
        updateParams.push(JSON.stringify(attachments));
        paramIndex++;
      }

      if (is_pinned !== undefined) {
        updateFields.push(`is_pinned = $${paramIndex}`);
        updateParams.push(is_pinned);
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
      updateParams.push(postId);

      // Update the post
      const updateResult = await db.query(
        `UPDATE posts 
         SET ${updateFields.join(', ')}
         WHERE id = $${paramIndex}
         RETURNING id, channel_id, author_id, content, attachments, 
                   reaction_counts, is_pinned, is_deleted, created_at, updated_at`,
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
      console.error('Post update error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to update post'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}

// DELETE /api/community/posts/[id] - Delete post
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const postId = params.id;
      const user = req.user!;

      // Get current post
      const postResult = await db.query(
        `SELECT p.id, p.author_id, p.is_deleted, c.domain as channel_domain
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

      // Check if post is already deleted
      if (post.is_deleted) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'CONFLICT',
              message: 'Post is already deleted'
            },
            timestamp: new Date().toISOString()
          },
          { status: 409 }
        );
      }

      // Check permissions
      const canModerate = canModerateContent(user.role, user.domain, post.channel_domain);
      const isAuthor = post.author_id === user.id;

      if (!isAuthor && !canModerate) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'You can only delete your own posts'
            },
            timestamp: new Date().toISOString()
          },
          { status: 403 }
        );
      }

      // Soft delete the post
      await db.query(
        `UPDATE posts SET is_deleted = true, updated_at = NOW() WHERE id = $1`,
        [postId]
      );

      return NextResponse.json(
        {
          success: true,
          message: 'Post deleted successfully',
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Post deletion error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to delete post'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}