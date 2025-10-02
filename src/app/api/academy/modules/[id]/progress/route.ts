import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '../../../../../../lib/auth-middleware';
import { db } from '../../../../../../lib/db';

// GET /api/academy/modules/[id]/progress - Get user's progress for a specific module
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const moduleId = params.id;
      const userId = req.user!.id;

      // Check if module exists
      const moduleResult = await db.query(`
        SELECT id, title, is_published FROM learning_modules WHERE id = $1
      `, [moduleId]);

      if (moduleResult.rows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'MODULE_NOT_FOUND',
              message: 'Learning module not found'
            },
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        );
      }

      // Get user progress
      const progressResult = await db.query(`
        SELECT 
          id,
          user_id,
          module_id,
          completed,
          progress,
          started_at,
          completed_at,
          last_accessed
        FROM user_module_progress 
        WHERE user_id = $1 AND module_id = $2
      `, [userId, moduleId]);

      const progress = progressResult.rows[0] || {
        user_id: userId,
        module_id: moduleId,
        completed: false,
        progress: 0,
        started_at: null,
        completed_at: null,
        last_accessed: null
      };

      return NextResponse.json(
        {
          success: true,
          data: { progress },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Get module progress error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch module progress'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}

// PUT /api/academy/modules/[id]/progress - Update user's progress for a module
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const moduleId = params.id;
      const userId = req.user!.id;
      const body = await req.json();
      const { progress, completed } = body;

      // Validate progress
      if (progress !== undefined && (typeof progress !== 'number' || progress < 0 || progress > 100)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_PROGRESS',
              message: 'Progress must be a number between 0 and 100'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      // Check if module exists and is published
      const moduleResult = await db.query(`
        SELECT id, title, is_published, xp_reward FROM learning_modules WHERE id = $1
      `, [moduleId]);

      if (moduleResult.rows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'MODULE_NOT_FOUND',
              message: 'Learning module not found'
            },
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        );
      }

      const module = moduleResult.rows[0];

      if (!module.is_published) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'MODULE_NOT_PUBLISHED',
              message: 'Cannot track progress for unpublished module'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      // Get current progress
      const currentProgressResult = await db.query(`
        SELECT * FROM user_module_progress 
        WHERE user_id = $1 AND module_id = $2
      `, [userId, moduleId]);

      const currentProgress = currentProgressResult.rows[0];
      const isNewProgress = !currentProgress;
      const wasCompleted = currentProgress?.completed || false;

      // Determine if module is being completed
      const isCompleting = (completed === true || progress === 100) && !wasCompleted;

      // Update or insert progress
      let result;
      if (isNewProgress) {
        // Insert new progress record
        result = await db.query(`
          INSERT INTO user_module_progress (
            user_id, 
            module_id, 
            completed, 
            progress, 
            started_at,
            completed_at,
            last_accessed
          )
          VALUES ($1, $2, $3, $4, NOW(), $5, NOW())
          RETURNING *
        `, [
          userId, 
          moduleId, 
          completed || (progress === 100), 
          progress || 0,
          isCompleting ? new Date() : null
        ]);
      } else {
        // Update existing progress
        const updates: string[] = [];
        const params: any[] = [];
        let paramIndex = 1;

        if (progress !== undefined) {
          updates.push(`progress = $${paramIndex}`);
          params.push(progress);
          paramIndex++;
        }

        if (completed !== undefined) {
          updates.push(`completed = $${paramIndex}`);
          params.push(completed);
          paramIndex++;
        }

        if (isCompleting) {
          updates.push(`completed_at = NOW()`);
        }

        updates.push(`last_accessed = NOW()`);

        result = await db.query(`
          UPDATE user_module_progress 
          SET ${updates.join(', ')}
          WHERE user_id = $${paramIndex} AND module_id = $${paramIndex + 1}
          RETURNING *
        `, [...params, userId, moduleId]);
      }

      // Award XP if module is being completed
      if (isCompleting) {
        await db.query(`
          UPDATE users 
          SET xp = xp + $1, updated_at = NOW()
          WHERE id = $2
        `, [module.xp_reward, userId]);

        // Create activity record
        await db.query(`
          INSERT INTO activities (user_id, type, description, data)
          VALUES ($1, 'module_completed', $2, $3)
        `, [
          userId,
          `Completed learning module: ${module.title}`,
          JSON.stringify({
            module_id: moduleId,
            module_title: module.title,
            xp_earned: module.xp_reward
          })
        ]);

        // Create notification
        await db.query(`
          INSERT INTO notifications (user_id, type, title, message, data)
          VALUES ($1, 'module_completed', 'Module Completed!', $2, $3)
        `, [
          userId,
          `You've completed "${module.title}" and earned ${module.xp_reward} XP!`,
          JSON.stringify({
            module_id: moduleId,
            module_title: module.title,
            xp_earned: module.xp_reward
          })
        ]);
      }

      return NextResponse.json(
        {
          success: true,
          data: { 
            progress: result.rows[0],
            xp_awarded: isCompleting ? module.xp_reward : 0
          },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Update module progress error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to update module progress'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}