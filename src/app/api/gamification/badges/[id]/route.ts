import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withAdmin, AuthenticatedRequest } from '../../../../../lib/auth-middleware';
import { db } from '../../../../../lib/db';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/gamification/badges/[id] - Get specific badge
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { id } = params;
      const userId = req.user!.id;

      const result = await db`
        SELECT 
          b.id,
          b.name,
          b.description,
          b.icon_url,
          b.xp_requirement,
          b.domain,
          b.is_active,
          b.created_at,
          CASE WHEN ub.user_id IS NOT NULL THEN true ELSE false END as user_earned,
          ub.earned_at as user_earned_at
        FROM badges b
        LEFT JOIN user_badges ub ON b.id = ub.badge_id AND ub.user_id = ${userId}
        WHERE b.id = ${id}
      `;

      if (result.rows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'BADGE_NOT_FOUND',
              message: 'Badge not found'
            },
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          data: { badge: result.rows[0] },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Get badge error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch badge'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}

// PUT /api/gamification/badges/[id] - Update badge (admin only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const { id } = params;
      const body = await req.json();
      const { name, description, icon_url, xp_requirement, domain, is_active } = body;

      // Validate badge exists
      const existingBadge = await db`
        SELECT id FROM badges WHERE id = ${id}
      `;

      if (existingBadge.rows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'BADGE_NOT_FOUND',
              message: 'Badge not found'
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
        // Check if new name conflicts with existing badge
        const nameConflict = await db`
          SELECT id FROM badges WHERE name = ${name} AND id != ${id}
        `;

        if (nameConflict.rows.length > 0) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'BADGE_NAME_EXISTS',
                message: 'A badge with this name already exists'
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

      if (icon_url !== undefined) {
        updateFields.push(`icon_url = $${paramIndex}`);
        updateValues.push(icon_url);
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
        `UPDATE badges 
         SET ${updateFields.join(', ')}
         WHERE id = $${paramIndex}
         RETURNING *`,
        updateValues
      );

      return NextResponse.json(
        {
          success: true,
          data: { badge: result.rows[0] },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Update badge error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to update badge'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}

// DELETE /api/gamification/badges/[id] - Delete badge (admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const { id } = params;

      // Check if badge exists
      const existingBadge = await db`
        SELECT id FROM badges WHERE id = ${id}
      `;

      if (existingBadge.rows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'BADGE_NOT_FOUND',
              message: 'Badge not found'
            },
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        );
      }

      // Delete badge (this will cascade delete user badges due to foreign key constraints)
      await db`
        DELETE FROM badges WHERE id = ${id}
      `;

      return NextResponse.json(
        {
          success: true,
          data: { message: 'Badge deleted successfully' },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Delete badge error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to delete badge'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}