import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '../../../../../../lib/auth-middleware';
import { db } from '../../../../../../lib/db';

// POST /api/academy/modules/[id]/enroll - Enroll user in a learning module
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const moduleId = params.id;
      const userId = req.user!.id;

      // Check if module exists and is published
      const moduleResult = await db.query(`
        SELECT id, title, is_published, prerequisites FROM learning_modules WHERE id = $1
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
              message: 'Cannot enroll in unpublished module'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      // Check if user is already enrolled
      const existingProgressResult = await db.query(`
        SELECT id FROM user_module_progress 
        WHERE user_id = $1 AND module_id = $2
      `, [userId, moduleId]);

      if (existingProgressResult.rows.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'ALREADY_ENROLLED',
              message: 'User is already enrolled in this module'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      // Check prerequisites if any
      const prerequisites = module.prerequisites || [];
      if (prerequisites.length > 0) {
        const prerequisiteCheckResult = await db.query(`
          SELECT module_id 
          FROM user_module_progress 
          WHERE user_id = $1 
            AND module_id = ANY($2::uuid[]) 
            AND completed = true
        `, [userId, prerequisites]);

        const completedPrerequisites = prerequisiteCheckResult.rows.map(row => row.module_id);
        const missingPrerequisites = prerequisites.filter(
          (prereq: string) => !completedPrerequisites.includes(prereq)
        );

        if (missingPrerequisites.length > 0) {
          // Get titles of missing prerequisites
          const missingTitlesResult = await db.query(`
            SELECT id, title FROM learning_modules 
            WHERE id = ANY($1::uuid[])
          `, [missingPrerequisites]);

          const missingTitles = missingTitlesResult.rows.map(row => row.title);

          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'PREREQUISITES_NOT_MET',
                message: 'Prerequisites not completed',
                details: {
                  missing_prerequisites: missingTitles
                }
              },
              timestamp: new Date().toISOString()
            },
            { status: 400 }
          );
        }
      }

      // Create progress record (enrollment)
      const result = await db.query(`
        INSERT INTO user_module_progress (
          user_id, 
          module_id, 
          completed, 
          progress, 
          started_at,
          last_accessed
        )
        VALUES ($1, $2, false, 0, NOW(), NOW())
        RETURNING *
      `, [userId, moduleId]);

      // Create activity record
      await db.query(`
        INSERT INTO activities (user_id, type, description, data)
        VALUES ($1, 'module_enrolled', $2, $3)
      `, [
        userId,
        `Enrolled in learning module: ${module.title}`,
        JSON.stringify({
          module_id: moduleId,
          module_title: module.title
        })
      ]);

      return NextResponse.json(
        {
          success: true,
          data: { 
            progress: result.rows[0],
            message: 'Successfully enrolled in module'
          },
          timestamp: new Date().toISOString()
        },
        { status: 201 }
      );

    } catch (error) {
      console.error('Enroll in module error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to enroll in module'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}