import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '../../../../lib/auth-middleware';
import { db } from '../../../../lib/db';
import { ProfileUpdateData } from '../../../../lib/types';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/users/[id] - Get user profile (authenticated users only)
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { id } = params;

      // Users can view their own profile, admins can view any profile
      if (req.user!.id !== id && req.user!.role !== 'admin') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Access denied to this user profile'
            },
            timestamp: new Date().toISOString()
          },
          { status: 403 }
        );
      }

      const result = await db`
        SELECT id, username, email, domain, role, xp, level, avatar_url, bio,
               is_active, email_verified, created_at, updated_at
        FROM users 
        WHERE id = ${id} AND is_active = true
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
          data: { user: result.rows[0] },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Get user error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch user'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}

// PUT /api/users/[id] - Update user profile
export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { id } = params;
      const body: ProfileUpdateData = await req.json();

      // Users can update their own profile, admins can update any profile
      if (req.user!.id !== id && req.user!.role !== 'admin') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Access denied to update this user profile'
            },
            timestamp: new Date().toISOString()
          },
          { status: 403 }
        );
      }

      // Validate input
      const { username, bio, avatar_url } = body;
      
      if (username && !/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_USERNAME',
              message: 'Username must be 3-30 characters and contain only letters, numbers, and underscores'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      if (bio && bio.length > 500) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'BIO_TOO_LONG',
              message: 'Bio must be 500 characters or less'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      // Check if username is already taken (if updating username)
      if (username) {
        const existingUser = await db`
          SELECT id FROM users 
          WHERE username = ${username} AND id != ${id}
        `;

        if (existingUser.rows.length > 0) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'USERNAME_TAKEN',
                message: 'Username is already taken'
              },
              timestamp: new Date().toISOString()
            },
            { status: 409 }
          );
        }
      }

      // Build update query
      const updateFields: string[] = [];
      const updateValues: (string | Date)[] = [];
      let paramIndex = 1;

      if (username !== undefined) {
        updateFields.push(`username = $${paramIndex}`);
        updateValues.push(username);
        paramIndex++;
      }

      if (bio !== undefined) {
        updateFields.push(`bio = $${paramIndex}`);
        updateValues.push(bio);
        paramIndex++;
      }

      if (avatar_url !== undefined) {
        updateFields.push(`avatar_url = $${paramIndex}`);
        updateValues.push(avatar_url);
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
        `UPDATE users 
         SET ${updateFields.join(', ')}
         WHERE id = $${paramIndex + 1} AND is_active = true
         RETURNING id, username, email, domain, role, xp, level, avatar_url, bio, updated_at`,
        updateValues
      );

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
          data: { user: result.rows[0] },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Update user error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to update user'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}