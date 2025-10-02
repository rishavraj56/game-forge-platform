import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '../../../../../../lib/auth-middleware';
import { db } from '../../../../../../lib/db';

interface RouteParams {
  params: {
    id: string;
  };
}

// POST /api/gamification/titles/[id]/activate - Set title as active for user
export async function POST(request: NextRequest, { params }: RouteParams) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { id: titleId } = params;
      const userId = req.user!.id;

      // Start transaction
      await db`BEGIN`;

      try {
        // Check if user has earned this title
        const userTitleResult = await db`
          SELECT ut.earned_at, t.name, t.description
          FROM user_titles ut
          JOIN titles t ON ut.title_id = t.id
          WHERE ut.user_id = ${userId} AND ut.title_id = ${titleId}
        `;

        if (userTitleResult.rows.length === 0) {
          await db`ROLLBACK`;
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'TITLE_NOT_EARNED',
                message: 'You have not earned this title'
              },
              timestamp: new Date().toISOString()
            },
            { status: 403 }
          );
        }

        const title = userTitleResult.rows[0];

        // Deactivate all current active titles for this user
        await db`
          UPDATE user_titles 
          SET is_active = false
          WHERE user_id = ${userId} AND is_active = true
        `;

        // Activate the selected title
        await db`
          UPDATE user_titles 
          SET is_active = true
          WHERE user_id = ${userId} AND title_id = ${titleId}
        `;

        // Create activity record
        await db`
          INSERT INTO activities (user_id, type, description, data, created_at)
          VALUES (
            ${userId}, 
            'title_activated', 
            ${`Activated title: ${title.name}`},
            ${JSON.stringify({ 
              title_id: titleId, 
              title_name: title.name
            })},
            NOW()
          )
        `;

        await db`COMMIT`;

        return NextResponse.json(
          {
            success: true,
            data: { 
              title: {
                id: titleId,
                name: title.name,
                description: title.description,
                is_active: true,
                earned_at: title.earned_at
              },
              message: 'Title activated successfully'
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
      console.error('Activate title error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to activate title'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}

// DELETE /api/gamification/titles/[id]/activate - Deactivate title for user
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { id: titleId } = params;
      const userId = req.user!.id;

      // Check if user has this title active
      const userTitleResult = await db`
        SELECT ut.is_active, t.name
        FROM user_titles ut
        JOIN titles t ON ut.title_id = t.id
        WHERE ut.user_id = ${userId} AND ut.title_id = ${titleId} AND ut.is_active = true
      `;

      if (userTitleResult.rows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'TITLE_NOT_ACTIVE',
              message: 'This title is not currently active'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      const title = userTitleResult.rows[0];

      // Deactivate the title
      await db`
        UPDATE user_titles 
        SET is_active = false
        WHERE user_id = ${userId} AND title_id = ${titleId}
      `;

      // Create activity record
      await db`
        INSERT INTO activities (user_id, type, description, data, created_at)
        VALUES (
          ${userId}, 
          'title_deactivated', 
          ${`Deactivated title: ${title.name}`},
          ${JSON.stringify({ 
            title_id: titleId, 
            title_name: title.name
          })},
          NOW()
        )
      `;

      return NextResponse.json(
        {
          success: true,
          data: { message: 'Title deactivated successfully' },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Deactivate title error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to deactivate title'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}