import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withAdmin, AuthenticatedRequest } from '../../../../lib/auth-middleware';
import { db } from '../../../../lib/db';
import { Quest, QuestType, Domain, QuestRequirement } from '../../../../lib/types';

// GET /api/gamification/quests - Get all quests (with optional filtering)
export async function GET(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const type = searchParams.get('type') as QuestType | null;
      const domain = searchParams.get('domain') as Domain | null;
      const active = searchParams.get('active');
      const userId = req.user!.id;

      // Build query conditions
      const conditions: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (type) {
        conditions.push(`q.type = $${paramIndex}`);
        params.push(type);
        paramIndex++;
      }

      if (domain) {
        conditions.push(`(q.domain = $${paramIndex} OR q.domain IS NULL)`);
        params.push(domain);
        paramIndex++;
      }

      if (active !== null) {
        conditions.push(`q.is_active = $${paramIndex}`);
        params.push(active === 'true');
        paramIndex++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Get quests with user progress
      const result = await db.query(`
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
        LEFT JOIN user_quest_progress uqp ON q.id = uqp.quest_id AND uqp.user_id = $${paramIndex}
        ${whereClause}
        ORDER BY q.type, q.created_at DESC
      `, [...params, userId]);

      return NextResponse.json(
        {
          success: true,
          data: { quests: result.rows },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Get quests error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch quests'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}

// POST /api/gamification/quests - Create new quest (admin only)
export async function POST(request: NextRequest) {
  return withAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      const { title, description, type, xp_reward, domain, requirements } = body;

      // Validate required fields
      if (!title || !description || !type || !xp_reward || !requirements) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'MISSING_FIELDS',
              message: 'Title, description, type, xp_reward, and requirements are required'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      // Validate quest type
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

      // Validate XP reward
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

      // Validate requirements array
      if (!Array.isArray(requirements) || requirements.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_REQUIREMENTS',
              message: 'Requirements must be a non-empty array'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      // Create quest
      const result = await db`
        INSERT INTO quests (title, description, type, xp_reward, domain, requirements, is_active)
        VALUES (${title}, ${description}, ${type}, ${xp_reward}, ${domain || null}, ${JSON.stringify(requirements)}, true)
        RETURNING *
      `;

      return NextResponse.json(
        {
          success: true,
          data: { quest: result.rows[0] },
          timestamp: new Date().toISOString()
        },
        { status: 201 }
      );

    } catch (error) {
      console.error('Create quest error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to create quest'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}