import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withAdmin, AuthenticatedRequest } from '../../../../../../lib/auth-middleware';
import { db } from '../../../../../../lib/db';

interface RouteParams {
  params: {
    id: string;
  };
}

// POST /api/gamification/badges/[id]/earn - Award badge to user (admin only or automatic system)
export async function POST(request: NextRequest, { params }: RouteParams) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { id: badgeId } = params;
      const body = await req.json();
      const { user_id, auto_award = false } = body;

      // Only admins can manually award badges, or system can auto-award
      if (!auto_award && req.user!.role !== 'admin') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Only administrators can manually award badges'
            },
            timestamp: new Date().toISOString()
          },
          { status: 403 }
        );
      }

      const targetUserId = user_id || req.user!.id;

      // Start transaction
      await db`BEGIN`;

      try {
        // Check if badge exists and is active
        const badgeResult = await db`
          SELECT id, name, description, xp_requirement, domain, is_active
          FROM badges 
          WHERE id = ${badgeId} AND is_active = true
        `;

        if (badgeResult.rows.length === 0) {
          await db`ROLLBACK`;
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'BADGE_NOT_FOUND',
                message: 'Badge not found or inactive'
              },
              timestamp: new Date().toISOString()
            },
            { status: 404 }
          );
        }

        const badge = badgeResult.rows[0];

        // Check if user exists
        const userResult = await db`
          SELECT id, username, xp, domain FROM users WHERE id = ${targetUserId} AND is_active = true
        `;

        if (userResult.rows.length === 0) {
          await db`ROLLBACK`;
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'USER_NOT_FOUND',
                message: 'User not found'
              },
              timestamp: new Date().toISOString()
            },
            { status: 404 }
          );
        }

        const user = userResult.rows[0];

        // Check if user already has this badge
        const existingBadge = await db`
          SELECT earned_at FROM user_badges 
          WHERE user_id = ${targetUserId} AND badge_id = ${badgeId}
        `;

        if (existingBadge.rows.length > 0) {
          await db`ROLLBACK`;
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'BADGE_ALREADY_EARNED',
                message: 'User has already earned this badge'
              },
              timestamp: new Date().toISOString()
            },
            { status: 409 }
          );
        }

        // Check XP requirement if badge has one
        if (badge.xp_requirement && user.xp < badge.xp_requirement) {
          await db`ROLLBACK`;
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INSUFFICIENT_XP',
                message: `User needs ${badge.xp_requirement} XP to earn this badge (current: ${user.xp})`
              },
              timestamp: new Date().toISOString()
            },
            { status: 400 }
          );
        }

        // Check domain requirement if badge has one
        if (badge.domain && user.domain !== badge.domain) {
          await db`ROLLBACK`;
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'DOMAIN_MISMATCH',
                message: `This badge is only available for ${badge.domain} domain members`
              },
              timestamp: new Date().toISOString()
            },
            { status: 400 }
          );
        }

        const earnedAt = new Date();

        // Award badge to user
        await db`
          INSERT INTO user_badges (user_id, badge_id, earned_at)
          VALUES (${targetUserId}, ${badgeId}, ${earnedAt.toISOString()})
        `;

        // Create activity record
        await db`
          INSERT INTO activities (user_id, type, description, data, created_at)
          VALUES (
            ${targetUserId}, 
            'badge_earned', 
            ${`Earned badge: ${badge.name}`},
            ${JSON.stringify({ 
              badge_id: badgeId, 
              badge_name: badge.name,
              auto_awarded: auto_award,
              awarded_by: auto_award ? 'system' : req.user!.id
            })},
            ${earnedAt.toISOString()}
          )
        `;

        await db`COMMIT`;

        return NextResponse.json(
          {
            success: true,
            data: { 
              badge: badge,
              earned_at: earnedAt,
              user: {
                id: user.id,
                username: user.username
              }
            },
            timestamp: new Date().toISOString()
          },
          { status: 200 }
        );

      } catch (error) {
        await db`ROLLBACK`;
        throw error;
      }

    } catch (error) {
      console.error('Award badge error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to award badge'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}