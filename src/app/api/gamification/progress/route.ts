import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '../../../../lib/auth-middleware';
import { db } from '../../../../lib/db';

// GET /api/gamification/progress - Get user's quest progress
export async function GET(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const userId = req.user!.id;
      const type = searchParams.get('type'); // 'daily' or 'weekly'
      const completed = searchParams.get('completed'); // 'true' or 'false'

      // Build query conditions
      const conditions: string[] = ['uqp.user_id = $1'];
      const params: any[] = [userId];
      let paramIndex = 2;

      if (type) {
        conditions.push(`q.type = $${paramIndex}`);
        params.push(type);
        paramIndex++;
      }

      if (completed !== null) {
        conditions.push(`uqp.completed = $${paramIndex}`);
        params.push(completed === 'true');
        paramIndex++;
      }

      const whereClause = conditions.join(' AND ');

      const result = await db.query(`
        SELECT 
          uqp.id,
          uqp.user_id,
          uqp.quest_id,
          uqp.completed,
          uqp.progress,
          uqp.completed_at,
          uqp.created_at,
          uqp.updated_at,
          q.title as quest_title,
          q.description as quest_description,
          q.type as quest_type,
          q.xp_reward as quest_xp_reward,
          q.domain as quest_domain,
          q.requirements as quest_requirements
        FROM user_quest_progress uqp
        JOIN quests q ON uqp.quest_id = q.id
        WHERE ${whereClause}
        ORDER BY uqp.completed_at DESC NULLS LAST, uqp.created_at DESC
      `, params);

      return NextResponse.json(
        {
          success: true,
          data: { progress: result.rows },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Get quest progress error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch quest progress'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}