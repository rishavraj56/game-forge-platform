import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '../../../../../../lib/auth-middleware';
import { db } from '../../../../../../lib/db';

// GET /api/community/posts/[id]/reactions - Get post reactions
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const postId = params.id;
      const { searchParams } = new URL(req.url);
      const reactionType = searchParams.get('type');
      const user = req.user!;

      // Verify post exists and is accessible
      const postResult = await db.query(
        `SELECT p.id, p.is_deleted, ch.domain, ch.is_active 
         FROM posts p
         JOIN channels ch ON p.channel_id = ch.id
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

      // Check if post is deleted or channel is inactive
      if (post.is_deleted || !post.is_active) {
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

      // Build query for reactions
      let reactionsQuery = `
        SELECT 
          pr.id, pr.reaction_type, pr.created_at,
          u.id as user_id, u.username, u.avatar_url, u.domain, u.level
        FROM post_reactions pr
        JOIN users u ON pr.user_id = u.id
        WHERE pr.post_id = $1
      `;
      const queryParams = [postId];

      if (reactionType) {
        reactionsQuery += ` AND pr.reaction_type = $2`;
        queryParams.push(reactionType);
      }

      reactionsQuery += ` ORDER BY pr.created_at DESC`;

      const reactionsResult = await db.query(reactionsQuery, queryParams);

      // Get reaction counts
      const countsResult = await db.query(
        `SELECT reaction_type, COUNT(*) as count
         FROM post_reactions
         WHERE post_id = $1
         GROUP BY reaction_type`,
        [postId]
      );

      const reactionCounts = countsResult.rows.reduce((acc, row) => {
        acc[row.reaction_type] = parseInt(row.count);
        return acc;
      }, {} as Record<string, number>);

      // Get user's reactions
      const userReactionsResult = await db.query(
        `SELECT reaction_type FROM post_reactions WHERE post_id = $1 AND user_id = $2`,
        [postId, user.id]
      );

      const userReactions = userReactionsResult.rows.map(row => row.reaction_type);

      return NextResponse.json(
        {
          success: true,
          data: {
            reactions: reactionsResult.rows,
            counts: reactionCounts,
            user_reactions: userReactions,
            total_reactions: Object.values(reactionCounts).reduce((sum: number, count) => sum + (count as number), 0)
          },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Post reactions fetch error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch post reactions'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}

// POST /api/community/posts/[id]/reactions - Add or remove reaction
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const postId = params.id;
      const body = await req.json();
      const { reaction_type, action = 'toggle' } = body;
      const user = req.user!;

      // Validation
      if (!reaction_type) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Reaction type is required'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      // Validate reaction type
      const validReactions = ['like', 'love', 'laugh', 'wow', 'sad', 'angry'];
      if (!validReactions.includes(reaction_type)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: `Invalid reaction type. Must be one of: ${validReactions.join(', ')}`
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      // Validate action
      if (!['add', 'remove', 'toggle'].includes(action)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Action must be add, remove, or toggle'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      // Verify post exists and is accessible
      const postResult = await db.query(
        `SELECT p.id, p.is_deleted, ch.domain, ch.is_active 
         FROM posts p
         JOIN channels ch ON p.channel_id = ch.id
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

      // Check if post is deleted or channel is inactive
      if (post.is_deleted || !post.is_active) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Cannot react to this post'
            },
            timestamp: new Date().toISOString()
          },
          { status: 403 }
        );
      }

      // Check if user is a member of the channel
      const membershipResult = await db.query(
        `SELECT cm.user_id 
         FROM channel_members cm
         JOIN posts p ON p.channel_id = cm.channel_id
         WHERE p.id = $1 AND cm.user_id = $2`,
        [postId, user.id]
      );

      if (membershipResult.rows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'You must be a member of the channel to react'
            },
            timestamp: new Date().toISOString()
          },
          { status: 403 }
        );
      }

      // Check if user already has this reaction
      const existingReactionResult = await db.query(
        `SELECT id FROM post_reactions WHERE post_id = $1 AND user_id = $2 AND reaction_type = $3`,
        [postId, user.id, reaction_type]
      );

      const hasReaction = existingReactionResult.rows.length > 0;
      let actionTaken = '';

      if (action === 'add' || (action === 'toggle' && !hasReaction)) {
        if (hasReaction) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'CONFLICT',
                message: 'You have already reacted with this type'
              },
              timestamp: new Date().toISOString()
            },
            { status: 409 }
          );
        }

        // Add reaction
        await db.query(
          `INSERT INTO post_reactions (post_id, user_id, reaction_type)
           VALUES ($1, $2, $3)`,
          [postId, user.id, reaction_type]
        );
        actionTaken = 'added';

      } else if (action === 'remove' || (action === 'toggle' && hasReaction)) {
        if (!hasReaction) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'NOT_FOUND',
                message: 'Reaction not found'
              },
              timestamp: new Date().toISOString()
            },
            { status: 404 }
          );
        }

        // Remove reaction
        await db.query(
          `DELETE FROM post_reactions WHERE post_id = $1 AND user_id = $2 AND reaction_type = $3`,
          [postId, user.id, reaction_type]
        );
        actionTaken = 'removed';
      }

      // Update reaction counts in posts table
      const countsResult = await db.query(
        `SELECT reaction_type, COUNT(*) as count
         FROM post_reactions
         WHERE post_id = $1
         GROUP BY reaction_type`,
        [postId]
      );

      const reactionCounts = countsResult.rows.reduce((acc, row) => {
        acc[row.reaction_type] = parseInt(row.count);
        return acc;
      }, {} as Record<string, number>);

      await db.query(
        `UPDATE posts SET reaction_counts = $1, updated_at = NOW() WHERE id = $2`,
        [JSON.stringify(reactionCounts), postId]
      );

      // Get updated user reactions
      const userReactionsResult = await db.query(
        `SELECT reaction_type FROM post_reactions WHERE post_id = $1 AND user_id = $2`,
        [postId, user.id]
      );

      const userReactions = userReactionsResult.rows.map(row => row.reaction_type);

      return NextResponse.json(
        {
          success: true,
          data: {
            action: actionTaken,
            reaction_type,
            counts: reactionCounts,
            user_reactions: userReactions,
            total_reactions: Object.values(reactionCounts).reduce((sum: number, count) => sum + (count as number), 0)
          },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Post reaction error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to process reaction'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}