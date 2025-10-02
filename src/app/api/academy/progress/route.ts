import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '../../../../lib/auth-middleware';
import { db } from '../../../../lib/db';

// GET /api/academy/progress - Get user's learning progress overview
export async function GET(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const userId = req.user!.id;
      const status = searchParams.get('status'); // 'completed', 'in_progress', 'not_started'
      const domain = searchParams.get('domain');
      const page = parseInt(searchParams.get('page') || '1');
      const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
      const offset = (page - 1) * limit;

      // Build query conditions
      const conditions: string[] = ['lm.is_published = true'];
      const params: any[] = [userId];
      let paramIndex = 2;

      if (domain) {
        conditions.push(`lm.domain = $${paramIndex}`);
        params.push(domain);
        paramIndex++;
      }

      // Handle status filtering
      if (status === 'completed') {
        conditions.push('ump.completed = true');
      } else if (status === 'in_progress') {
        conditions.push('ump.id IS NOT NULL AND ump.completed = false');
      } else if (status === 'not_started') {
        conditions.push('ump.id IS NULL');
      }

      const whereClause = `WHERE ${conditions.join(' AND ')}`;

      // Get user's learning progress
      const progressResult = await db.query(`
        SELECT 
          lm.id,
          lm.title,
          lm.description,
          lm.domain,
          lm.difficulty,
          lm.xp_reward,
          lm.estimated_duration,
          lm.created_at,
          COALESCE(ump.completed, false) as completed,
          COALESCE(ump.progress, 0) as progress,
          ump.started_at,
          ump.completed_at,
          ump.last_accessed,
          CASE 
            WHEN ump.id IS NULL THEN 'not_started'
            WHEN ump.completed = true THEN 'completed'
            ELSE 'in_progress'
          END as status
        FROM learning_modules lm
        LEFT JOIN user_module_progress ump ON lm.id = ump.module_id AND ump.user_id = $1
        ${whereClause}
        ORDER BY 
          CASE 
            WHEN ump.completed = true THEN ump.completed_at
            WHEN ump.id IS NOT NULL THEN ump.last_accessed
            ELSE lm.created_at
          END DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `, [...params, limit, offset]);

      // Get total count for pagination
      const countResult = await db.query(`
        SELECT COUNT(*) as total
        FROM learning_modules lm
        LEFT JOIN user_module_progress ump ON lm.id = ump.module_id AND ump.user_id = $1
        ${whereClause}
      `, params);

      // Get summary statistics
      const statsResult = await db.query(`
        SELECT 
          COUNT(DISTINCT lm.id) as total_modules,
          COUNT(DISTINCT CASE WHEN ump.id IS NOT NULL THEN lm.id END) as enrolled_modules,
          COUNT(DISTINCT CASE WHEN ump.completed = true THEN lm.id END) as completed_modules,
          COALESCE(SUM(CASE WHEN ump.completed = true THEN lm.xp_reward END), 0) as total_xp_earned,
          COALESCE(AVG(CASE WHEN ump.completed = false AND ump.id IS NOT NULL THEN ump.progress END), 0) as avg_progress
        FROM learning_modules lm
        LEFT JOIN user_module_progress ump ON lm.id = ump.module_id AND ump.user_id = $1
        WHERE lm.is_published = true
      `, [userId]);

      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);
      const stats = statsResult.rows[0];

      return NextResponse.json(
        {
          success: true,
          data: {
            modules: progressResult.rows,
            pagination: {
              page,
              limit,
              total,
              totalPages,
              hasNext: page < totalPages,
              hasPrev: page > 1
            },
            stats: {
              total_modules: parseInt(stats.total_modules),
              enrolled_modules: parseInt(stats.enrolled_modules),
              completed_modules: parseInt(stats.completed_modules),
              total_xp_earned: parseInt(stats.total_xp_earned),
              avg_progress: Math.round(parseFloat(stats.avg_progress)),
              completion_rate: stats.enrolled_modules > 0 
                ? Math.round((stats.completed_modules / stats.enrolled_modules) * 100)
                : 0
            }
          },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Get learning progress error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch learning progress'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}