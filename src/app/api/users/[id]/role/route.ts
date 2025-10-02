import { NextRequest, NextResponse } from 'next/server';
import { withAdmin, AuthenticatedRequest } from '../../../../../lib/auth-middleware';
import { db } from '../../../../../lib/db';
import { UserRole } from '../../../../../lib/types';

interface RouteParams {
  params: {
    id: string;
  };
}

const VALID_ROLES: UserRole[] = ['member', 'domain_lead', 'admin'];

// PUT /api/users/[id]/role - Update user role (admin only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const { id } = params;
      const { role }: { role: UserRole } = await req.json();

      // Validate role
      if (!role || !VALID_ROLES.includes(role)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_ROLE',
              message: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      // Prevent admin from changing their own role (safety measure)
      if (req.user!.id === id) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'SELF_ROLE_CHANGE',
              message: 'Cannot change your own role'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      // Update user role
      const result = await db`
        UPDATE users 
        SET role = ${role}, updated_at = ${new Date()}
        WHERE id = ${id} AND is_active = true
        RETURNING id, username, email, domain, role, xp, level, updated_at
      `;

      if (result.rows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'USER_NOT_FOUND',
              message: 'User not found'
            },
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          data: { 
            user: result.rows[0],
            message: `User role updated to ${role}`
          },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Update user role error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to update user role'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}