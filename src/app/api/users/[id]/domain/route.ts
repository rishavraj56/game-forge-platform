import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withAdmin, AuthenticatedRequest } from '../../../../../lib/auth-middleware';
import { db } from '../../../../../lib/db';
import { Domain } from '../../../../../lib/types';

interface RouteParams {
  params: {
    id: string;
  };
}

// PUT /api/users/[id]/domain - Update user domain (Admin only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const { id } = params;
      const { domain }: { domain: Domain } = await req.json();

      if (!domain) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'MISSING_DOMAIN',
              message: 'Domain is required'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      // Validate domain
      const validDomains: Domain[] = [
        'Game Development',
        'Game Design', 
        'Game Art',
        'AI for Game Development',
        'Creative',
        'Corporate'
      ];

      if (!validDomains.includes(domain)) {
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

      // Check if user exists
      const userCheck = await db`
        SELECT id, domain, username FROM users 
        WHERE id = ${id} AND is_active = true
      `;

      if (userCheck.rows.length === 0) {
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

      const currentUser = userCheck.rows[0];

      // Update user domain
      const result = await db`
        UPDATE users 
        SET domain = ${domain}, updated_at = NOW()
        WHERE id = ${id} AND is_active = true
        RETURNING id, username, email, domain, role, updated_at
      `;

      // Log the domain change for audit purposes
      await db`
        INSERT INTO activities (user_id, type, description, data)
        VALUES (
          ${id}, 
          'domain_changed',
          'User domain changed by administrator',
          ${JSON.stringify({
            previous_domain: currentUser.domain,
            new_domain: domain,
            changed_by: req.user!.id,
            changed_by_username: req.user!.username
          })}
        )
      `;

      return NextResponse.json(
        {
          success: true,
          data: {
            user: result.rows[0],
            message: `User domain changed from "${currentUser.domain}" to "${domain}"`
          },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Update user domain error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to update user domain'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}

// GET /api/users/[id]/domain - Get user domain info with statistics
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { id } = params;

      // Get user domain information
      const userResult = await db`
        SELECT id, username, domain, role, created_at
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

      // Get domain statistics
      const domainStatsResult = await db`
        SELECT 
          COUNT(DISTINCT u.id) as total_members,
          COUNT(DISTINCT CASE WHEN u.role = 'domain_lead' THEN u.id END) as domain_leads,
          COUNT(DISTINCT c.id) as channels,
          COUNT(DISTINCT lm.id) as learning_modules,
          COUNT(DISTINCT e.id) as upcoming_events
        FROM users u
        LEFT JOIN channels c ON u.domain = c.domain AND c.is_active = true
        LEFT JOIN learning_modules lm ON u.domain = lm.domain AND lm.is_published = true
        LEFT JOIN events e ON u.domain = e.domain AND e.is_active = true AND e.start_date > NOW()
        WHERE u.domain = ${user.domain} AND u.is_active = true
        GROUP BY u.domain
      `;

      const domainStats = domainStatsResult.rows[0] || {
        total_members: 0,
        domain_leads: 0,
        channels: 0,
        learning_modules: 0,
        upcoming_events: 0
      };

      // Get user's rank within domain
      const rankResult = await db`
        SELECT COUNT(*) + 1 as domain_rank
        FROM users 
        WHERE domain = ${user.domain} 
          AND is_active = true 
          AND xp > (SELECT xp FROM users WHERE id = ${id})
      `;

      const domainRank = parseInt(rankResult.rows[0]?.domain_rank || '1');

      return NextResponse.json(
        {
          success: true,
          data: {
            user: {
              id: user.id,
              username: user.username,
              domain: user.domain,
              role: user.role,
              domain_rank: domainRank
            },
            domain_stats: {
              total_members: parseInt(domainStats.total_members),
              domain_leads: parseInt(domainStats.domain_leads),
              channels: parseInt(domainStats.channels),
              learning_modules: parseInt(domainStats.learning_modules),
              upcoming_events: parseInt(domainStats.upcoming_events)
            }
          },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Get user domain error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch user domain information'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}