import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withAdmin, AuthenticatedRequest } from '../../../../../lib/auth-middleware';
import { db } from '../../../../../lib/db';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/gamification/titles/[id] - Get specific title
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { id } = params;
      const userId = req.user!.id;

      const result = await db`
        SELECT 
          t.id,
          t.name,
          t.description,
          t.xp_requirement,
          t.domain,
          t.is_active,
          t.created_at,
          CASE WHEN ut.user_id IS NOT NULL THEN true ELSE false END as user_earned,
          ut.is_active as user_title_active,
          ut.earned_at as user_earned_at
        FROM titles t
        LEFT JOIN user_titles ut ON t.id = ut.title_id AND ut.user_id = ${userId}
        WHERE t.id = ${id}
      `;

      if (result.rows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'TITLE_NOT_FOUND',
              message: 'Title not found'
            },
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          data: { title: result.rows[0] },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Get title error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch title'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}

// PUT /api/gamification/titles/[id] - Update title (admin only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const { id } = params;
      const body = await req.json();
      const { name, description, xp_requirement, domain, is_active } = body;

      // Validate title exists
      const existingTitle = await db`
        SELECT id FROM titles WHERE id = ${id}
      `;

      if (existingTitle.rows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'TITLE_NOT_FOUND',
              message: 'Title not found'
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

      if (name !== undefined) {
        // Check if new name conflicts with existing title
        const nameConflict = await db`
          SELECT id FROM titles WHERE name = ${name} AND id != ${id}
        `;

        if (nameConflict.rows.length > 0) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'TITLE_NAME_EXISTS',
                message: 'A title with this name already exists'
              },
              timestamp: new Date().toISOString()
            },
            { status: 409 }
          );
        }

        updateFields.push(`name = $${paramIndex}`);
        updateValues.push(name);
        paramIndex++;
      }

      if (description !== undefined) {
        updateFields.push(`description = $${paramIndex}`);
        updateValues.push(description);
        paramIndex++;
      }

      if (xp_requirement !== undefined) {
        if (xp_requirement !== null && (typeof xp_requirement !== 'number' || xp_requirement < 0)) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INVALID_XP_REQUIREMENT',
                message: 'XP requirement must be a non-negative number'
              },
              timestamp: new Date().toISOString()
            },
            { status: 400 }
          );
        }
        updateFields.push(`xp_requirement = $${paramIndex}`);
        updateValues.push(xp_requirement);
        paramIndex++;
      }

      if (domain !== undefined) {
        updateFields.push(`domain = $${paramIndex}`);
        updateValues.push(domain);
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

      updateValues.push(id);

      const result = await db.query(
        `UPDATE titles 
         SET ${updateFields.join(', ')}
         WHERE id = $${paramIndex}
         RETURNING *`,
        updateValues
      );

      return NextResponse.json(
        {
          success: true,
          data: { title: result.rows[0] },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Update title error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to update title'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}

// DELETE /api/gamification/titles/[id] - Delete title (admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const { id } = params;

      // Check if title exists
      const existingTitle = await db`
        SELECT id FROM titles WHERE id = ${id}
      `;

      if (existingTitle.rows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'TITLE_NOT_FOUND',
              message: 'Title not found'
            },
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        );
      }

      // Delete title (this will cascade delete user titles due to foreign key constraints)
      await db`
        DELETE FROM titles WHERE id = ${id}
      `;

      return NextResponse.json(
        {
          success: true,
          data: { message: 'Title deleted successfully' },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Delete title error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to delete title'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}