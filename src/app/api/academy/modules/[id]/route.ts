import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withDomainLead, AuthenticatedRequest } from '../../../../../lib/auth-middleware';
import { db } from '../../../../../lib/db';

// GET /api/academy/modules/[id] - Get specific learning module
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const moduleId = params.id;

      // Get module with user progress
      const result = await db.query(`
        SELECT 
          lm.id,
          lm.title,
          lm.description,
          lm.domain,
          lm.difficulty,
          lm.xp_reward,
          lm.content,
          lm.prerequisites,
          lm.estimated_duration,
          lm.is_published,
          lm.created_by,
          lm.created_at,
          lm.updated_at,
          u.username as creator_username,
          COALESCE(ump.completed, false) as user_completed,
          COALESCE(ump.progress, 0) as user_progress,
          ump.started_at as user_started_at,
          ump.completed_at as user_completed_at,
          ump.last_accessed as user_last_accessed
        FROM learning_modules lm
        LEFT JOIN users u ON lm.created_by = u.id
        LEFT JOIN user_module_progress ump ON lm.id = ump.module_id AND ump.user_id = $1
        WHERE lm.id = $2
      `, [req.user!.id, moduleId]);

      if (result.rows.length === 0) {
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

      const module = result.rows[0];

      // Check if user can access this module (published or creator/admin)
      if (!module.is_published && 
          module.created_by !== req.user!.id && 
          req.user!.role !== 'admin') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Access denied to unpublished module'
            },
            timestamp: new Date().toISOString()
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          data: { module },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Get learning module error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch learning module'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}

// PUT /api/academy/modules/[id] - Update learning module
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withDomainLead(request, async (req: AuthenticatedRequest) => {
    try {
      const moduleId = params.id;
      const body = await req.json();
      const { 
        title, 
        description, 
        domain, 
        difficulty, 
        xp_reward, 
        content, 
        prerequisites, 
        estimated_duration,
        is_published 
      } = body;

      // Check if module exists and user can edit it
      const existingResult = await db.query(`
        SELECT * FROM learning_modules WHERE id = $1
      `, [moduleId]);

      if (existingResult.rows.length === 0) {
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

      const existingModule = existingResult.rows[0];

      // Check permissions
      if (req.user!.role !== 'admin' && 
          existingModule.created_by !== req.user!.id) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'You can only edit your own modules'
            },
            timestamp: new Date().toISOString()
          },
          { status: 403 }
        );
      }

      // Validate fields if provided
      if (difficulty && !['beginner', 'intermediate', 'advanced'].includes(difficulty)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_DIFFICULTY',
              message: 'Difficulty must be beginner, intermediate, or advanced'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      if (xp_reward && (typeof xp_reward !== 'number' || xp_reward < 1 || xp_reward > 5000)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_XP_REWARD',
              message: 'XP reward must be a number between 1 and 5000'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      if (content && (!Array.isArray(content) || content.length === 0)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_CONTENT',
              message: 'Content must be a non-empty array'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      // Build update query
      const updates: string[] = [];
      const updateParams: any[] = [];
      let paramIndex = 1;

      if (title !== undefined) {
        updates.push(`title = $${paramIndex}`);
        updateParams.push(title);
        paramIndex++;
      }

      if (description !== undefined) {
        updates.push(`description = $${paramIndex}`);
        updateParams.push(description);
        paramIndex++;
      }

      if (domain !== undefined) {
        updates.push(`domain = $${paramIndex}`);
        updateParams.push(domain);
        paramIndex++;
      }

      if (difficulty !== undefined) {
        updates.push(`difficulty = $${paramIndex}`);
        updateParams.push(difficulty);
        paramIndex++;
      }

      if (xp_reward !== undefined) {
        updates.push(`xp_reward = $${paramIndex}`);
        updateParams.push(xp_reward);
        paramIndex++;
      }

      if (content !== undefined) {
        updates.push(`content = $${paramIndex}`);
        updateParams.push(JSON.stringify(content));
        paramIndex++;
      }

      if (prerequisites !== undefined) {
        updates.push(`prerequisites = $${paramIndex}`);
        updateParams.push(JSON.stringify(prerequisites));
        paramIndex++;
      }

      if (estimated_duration !== undefined) {
        updates.push(`estimated_duration = $${paramIndex}`);
        updateParams.push(estimated_duration);
        paramIndex++;
      }

      if (is_published !== undefined) {
        updates.push(`is_published = $${paramIndex}`);
        updateParams.push(is_published);
        paramIndex++;
      }

      updates.push(`updated_at = NOW()`);

      if (updates.length === 1) { // Only updated_at was added
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NO_UPDATES',
              message: 'No fields to update'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      // Update module
      const result = await db.query(`
        UPDATE learning_modules 
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `, [...updateParams, moduleId]);

      return NextResponse.json(
        {
          success: true,
          data: { module: result.rows[0] },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Update learning module error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to update learning module'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}

// DELETE /api/academy/modules/[id] - Delete learning module
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withDomainLead(request, async (req: AuthenticatedRequest) => {
    try {
      const moduleId = params.id;

      // Check if module exists and user can delete it
      const existingResult = await db.query(`
        SELECT * FROM learning_modules WHERE id = $1
      `, [moduleId]);

      if (existingResult.rows.length === 0) {
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

      const existingModule = existingResult.rows[0];

      // Check permissions
      if (req.user!.role !== 'admin' && 
          existingModule.created_by !== req.user!.id) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'You can only delete your own modules'
            },
            timestamp: new Date().toISOString()
          },
          { status: 403 }
        );
      }

      // Delete module (this will cascade to user_module_progress)
      await db.query(`
        DELETE FROM learning_modules WHERE id = $1
      `, [moduleId]);

      return NextResponse.json(
        {
          success: true,
          data: { message: 'Learning module deleted successfully' },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Delete learning module error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to delete learning module'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}