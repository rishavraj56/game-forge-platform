import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withAdmin, AuthenticatedRequest } from '../../../../lib/auth-middleware';
import { db } from '../../../../lib/db';
import { Domain } from '../../../../lib/types';

// GET /api/gamification/badges - Get all badges (with user's earned status)
export async function GET(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const domain = searchParams.get('domain') as Domain | null;
      const earned = searchParams.get('earned'); // 'true' or 'false'
      const userId = req.user!.id;

      // Build query conditions
      const conditions: string[] = ['b.is_active = true'];
      const params: any[] = [];
      let paramIndex = 1;

      if (domain) {
        conditions.push(`(b.domain = $${paramIndex} OR b.domain IS NULL)`);
        params.push(domain);
        paramIndex++;
      }

      const whereClause = conditions.join(' AND ');

      // Get badges with user's earned status
      let query = `
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
        LEFT JOIN user_badges ub ON b.id = ub.badge_id AND ub.user_id = $${paramIndex}
        WHERE ${whereClause}
      `;

      params.push(userId);

      // Filter by earned status if specified
      if (earned === 'true') {
        query += ' AND ub.user_id IS NOT NULL';
      } else if (earned === 'false') {
        query += ' AND ub.user_id IS NULL';
      }

      query += ' ORDER BY b.xp_requirement ASC NULLS LAST, b.created_at ASC';

      const result = await db.query(query, params);

      return NextResponse.json(
        {
          success: true,
          data: { badges: result.rows },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Get badges error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch badges'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}

// POST /api/gamification/badges - Create new badge (admin only)
export async function POST(request: NextRequest) {
  return withAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      const { name, description, icon_url, xp_requirement, domain } = body;

      // Validate required fields
      if (!name) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'MISSING_NAME',
              message: 'Badge name is required'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      // Validate XP requirement if provided
      if (xp_requirement !== undefined && (typeof xp_requirement !== 'number' || xp_requirement < 0)) {
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

      // Check if badge name already exists
      const existingBadge = await db`
        SELECT id FROM badges WHERE name = ${name}
      `;

      if (existingBadge.rows.length > 0) {
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

      // Create badge
      const result = await db`
        INSERT INTO badges (name, description, icon_url, xp_requirement, domain, is_active)
        VALUES (${name}, ${description || null}, ${icon_url || null}, ${xp_requirement || null}, ${domain || null}, true)
        RETURNING *
      `;

      return NextResponse.json(
        {
          success: true,
          data: { badge: result.rows[0] },
          timestamp: new Date().toISOString()
        },
        { status: 201 }
      );

    } catch (error) {
      console.error('Create badge error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to create badge'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}