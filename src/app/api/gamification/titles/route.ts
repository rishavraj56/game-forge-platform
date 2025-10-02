import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withAdmin, AuthenticatedRequest } from '../../../../lib/auth-middleware';
import { db } from '../../../../lib/db';
import { Domain } from '../../../../lib/types';

// GET /api/gamification/titles - Get all titles (with user's earned status)
export async function GET(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const domain = searchParams.get('domain') as Domain | null;
      const earned = searchParams.get('earned'); // 'true' or 'false'
      const userId = req.user!.id;

      // Build query conditions
      const conditions: string[] = ['t.is_active = true'];
      const params: any[] = [];
      let paramIndex = 1;

      if (domain) {
        conditions.push(`(t.domain = $${paramIndex} OR t.domain IS NULL)`);
        params.push(domain);
        paramIndex++;
      }

      const whereClause = conditions.join(' AND ');

      // Get titles with user's earned status
      let query = `
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
        LEFT JOIN user_titles ut ON t.id = ut.title_id AND ut.user_id = $${paramIndex}
        WHERE ${whereClause}
      `;

      params.push(userId);

      // Filter by earned status if specified
      if (earned === 'true') {
        query += ' AND ut.user_id IS NOT NULL';
      } else if (earned === 'false') {
        query += ' AND ut.user_id IS NULL';
      }

      query += ' ORDER BY t.xp_requirement ASC NULLS LAST, t.created_at ASC';

      const result = await db.query(query, params);

      return NextResponse.json(
        {
          success: true,
          data: { titles: result.rows },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Get titles error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch titles'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}

// POST /api/gamification/titles - Create new title (admin only)
export async function POST(request: NextRequest) {
  return withAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      const { name, description, xp_requirement, domain } = body;

      // Validate required fields
      if (!name) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'MISSING_NAME',
              message: 'Title name is required'
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

      // Check if title name already exists
      const existingTitle = await db`
        SELECT id FROM titles WHERE name = ${name}
      `;

      if (existingTitle.rows.length > 0) {
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

      // Create title
      const result = await db`
        INSERT INTO titles (name, description, xp_requirement, domain, is_active)
        VALUES (${name}, ${description || null}, ${xp_requirement || null}, ${domain || null}, true)
        RETURNING *
      `;

      return NextResponse.json(
        {
          success: true,
          data: { title: result.rows[0] },
          timestamp: new Date().toISOString()
        },
        { status: 201 }
      );

    } catch (error) {
      console.error('Create title error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to create title'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}