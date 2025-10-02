import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '../../../../../lib/auth-middleware';
import { db } from '../../../../../lib/db';
import { ProfileUpdateData, User } from '../../../../../lib/types';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/users/[id]/profile - Get detailed user profile with achievements
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { id } = params;

      // Get user profile with badges and titles
      const userResult = await db`
        SELECT id, username, email, domain, role, xp, level, avatar_url, bio,
               is_active, email_verified, created_at, updated_at
        FROM users 
        WHERE id = ${id} AND is_active = true
      `;

      if (userResult.rows.length === 0) {
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

      const user = userResult.rows[0];

      // Get user badges
      const badgesResult = await db`
        SELECT b.id, b.name, b.description, b.icon_url, ub.earned_at
        FROM badges b
        JOIN user_badges ub ON b.id = ub.badge_id
        WHERE ub.user_id = ${id} AND b.is_active = true
        ORDER BY ub.earned_at DESC
      `;

      // Get user titles (including active status)
      const titlesResult = await db`
        SELECT t.id, t.name, t.description, ut.is_active, ut.earned_at
        FROM titles t
        JOIN user_titles ut ON t.id = ut.title_id
        WHERE ut.user_id = ${id} AND t.is_active = true
        ORDER BY ut.earned_at DESC
      `;

      // Get user statistics
      const statsResult = await db`
        SELECT 
          COUNT(DISTINCT uqp.quest_id) as completed_quests,
          COUNT(DISTINCT ump.module_id) as completed_modules,
          COUNT(DISTINCT p.id) as total_posts,
          COUNT(DISTINCT er.event_id) as events_attended
        FROM users u
        LEFT JOIN user_quest_progress uqp ON u.id = uqp.user_id AND uqp.completed = true
        LEFT JOIN user_module_progress ump ON u.id = ump.user_id AND ump.completed = true
        LEFT JOIN posts p ON u.id = p.author_id AND p.is_deleted = false
        LEFT JOIN event_registrations er ON u.id = er.user_id AND er.status = 'attended'
        WHERE u.id = ${id}
        GROUP BY u.id
      `;

      const stats = statsResult.rows[0] || {
        completed_quests: 0,
        completed_modules: 0,
        total_posts: 0,
        events_attended: 0
      };

      // Check if requesting user can see private information
      const canSeePrivateInfo = req.user!.id === id || req.user!.role === 'admin';

      const profileData = {
        user: {
          ...user,
          // Hide email for other users unless admin
          email: canSeePrivateInfo ? user.email : undefined
        },
        badges: badgesResult.rows,
        titles: titlesResult.rows,
        stats: {
          completed_quests: parseInt(stats.completed_quests),
          completed_modules: parseInt(stats.completed_modules),
          total_posts: parseInt(stats.total_posts),
          events_attended: parseInt(stats.events_attended)
        }
      };

      return NextResponse.json(
        {
          success: true,
          data: profileData,
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Get user profile error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch user profile'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}

// PUT /api/users/[id]/profile - Update user profile with validation
export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { id } = params;
      const body: ProfileUpdateData & { domain?: string } = await req.json();

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
      const { username, bio, avatar_url, domain } = body;
      
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

      // Validate domain if provided (only admins can change domains)
      if (domain && req.user!.role !== 'admin') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Only administrators can change user domains'
            },
            timestamp: new Date().toISOString()
          },
          { status: 403 }
        );
      }

      const validDomains = [
        'Game Development',
        'Game Design', 
        'Game Art',
        'AI for Game Development',
        'Creative',
        'Corporate'
      ];

      if (domain && !validDomains.includes(domain)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_DOMAIN',
              message: `Invalid domain. Must be one of: ${validDomains.join(', ')}`
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

      // Build update query dynamically
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      if (username !== undefined) {
        updateFields.push('username = $' + (updateValues.length + 1));
        updateValues.push(username);
      }

      if (bio !== undefined) {
        updateFields.push('bio = $' + (updateValues.length + 1));
        updateValues.push(bio);
      }

      if (avatar_url !== undefined) {
        updateFields.push('avatar_url = $' + (updateValues.length + 1));
        updateValues.push(avatar_url);
      }

      if (domain !== undefined) {
        updateFields.push('domain = $' + (updateValues.length + 1));
        updateValues.push(domain);
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

      updateFields.push('updated_at = $' + (updateValues.length + 1));
      updateValues.push(new Date());
      updateValues.push(id);

      const result = await db.query(
        `UPDATE users 
         SET ${updateFields.join(', ')}
         WHERE id = $${updateValues.length} AND is_active = true
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
      console.error('Update user profile error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to update user profile'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}