import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withAdmin, AuthenticatedRequest } from '../../../../../lib/auth-middleware';
import { db } from '../../../../../lib/db';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/gamification/quests/[id] - Get specific quest
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { id } = params;
      const userId = req.user!.id;

      const result = await db`
        SELECT 
          q.id,
          q.title,
          q.description,
          q.type,
          q.xp_reward,
          q.domain,
          q.requirements,
          q.is_active,
          q.created_at,
          q.updated_at,
          COALESCE(uqp.completed, false) as user_completed,
          COALESCE(uqp.progress, 0) as user_progress,
          uqp.completed_at as user_completed_at
        FROM quests q
        LEFT JOIN user_quest_progress uqp ON q.id = uqp.quest_id AND uqp.user_id = ${userId}
        WHERE q.id = ${id}
      `;

      if (result.rows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'QUEST_NOT_FOUND',
              message: 'Quest not found'
            },
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          data: { quest: result.rows[0] },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Get quest error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch quest'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}

// PUT /api/gamification/quests/[id] - Update quest (admin only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const { id } = params;
      const body = await req.json();
      const { title, description, type, xp_reward, domain, requirements, is_active } = body;

      // Validate quest exists
      const existingQuest = await db`
        SELECT id FROM quests WHERE id = ${id}
      `;

      if (existingQuest.rows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'QUEST_NOT_FOUND',
              message: 'Quest not found'
            },
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        );
      }

      // Build update query
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramIndex = 1;

      if (title !== undefined) {
        updateFields.push(`title = $${paramIndex}`);
        updateValues.push(title);
        paramIndex++;
      }

      if (description !== undefined) {
        updateFields.push(`description = $${paramIndex}`);
        updateValues.push(description);
        paramIndex++;
      }

      if (type !== undefined) {
        if (!['daily', 'weekly'].includes(type)) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INVALID_TYPE',
                message: 'Quest type must be either "daily" or "weekly"'
              },
              timestamp: new Date().toISOString()
            },
            { status: 400 }
          );
        }
        updateFields.push(`type = $${paramIndex}`);
        updateValues.push(type);
        paramIndex++;
      }

      if (xp_reward !== undefined) {
        if (typeof xp_reward !== 'number' || xp_reward < 1 || xp_reward > 10000) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INVALID_XP_REWARD',
                message: 'XP reward must be a number between 1 and 10000'
              },
              timestamp: new Date().toISOString()
            },
            { status: 400 }
          );
        }
        updateFields.push(`xp_reward = $${paramIndex}`);
        updateValues.push(xp_reward);
        paramIndex++;
      }

      if (domain !== undefined) {
        updateFields.push(`domain = $${paramIndex}`);
        updateValues.push(domain);
        paramIndex++;
      }

      if (requirements !== undefined) {
        if (!Array.isArray(requirements)) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INVALID_REQUIREMENTS',
                message: 'Requirements must be an array'
              },
              timestamp: new Date().toISOString()
            },
            { status: 400 }
          );
        }
        updateFields.push(`requirements = $${paramIndex}`);
        updateValues.push(JSON.stringify(requirements));
        paramIndex++;
      }

      if (is_active !== undefined) {
        updateFields.push(`is_active = $${paramIndex}`);
        updateValues.push(is_active);
        paramIndex++;
      }

      if (updateFields.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NO_UPDATES',
              message: 'No valid fields to update'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      updateFields.push(`updated_at = $${paramIndex}`);
      updateValues.push(new Date());
      updateValues.push(id);

      const result = await db.query(
        `UPDATE quests 
         SET ${updateFields.join(', ')}
         WHERE id = $${paramIndex + 1}
         RETURNING *`,
        updateValues
      );

      return NextResponse.json(
        {
          success: true,
          data: { quest: result.rows[0] },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Update quest error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to update quest'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}

// DELETE /api/gamification/quests/[id] - Delete quest (admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const { id } = params;

      // Check if quest exists
      const existingQuest = await db`
        SELECT id FROM quests WHERE id = ${id}
      `;

      if (existingQuest.rows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'QUEST_NOT_FOUND',
              message: 'Quest not found'
            },
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        );
      }

      // Delete quest (this will cascade delete user progress due to foreign key constraints)
      await db`
        DELETE FROM quests WHERE id = ${id}
      `;

      return NextResponse.json(
        {
          success: true,
          data: { message: 'Quest deleted successfully' },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Delete quest error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to delete quest'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}