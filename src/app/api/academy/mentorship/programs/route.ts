import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withDomainLead, AuthenticatedRequest } from '../../../../../lib/auth-middleware';
import { db } from '../../../../../lib/db';
import { Domain } from '../../../../../lib/types';

// GET /api/academy/mentorship/programs - Get all mentorship programs
export async function GET(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const domain = searchParams.get('domain') as Domain | null;
      const active = searchParams.get('active');

      // Build query conditions
      const conditions: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (domain) {
        conditions.push(`mp.domain = $${paramIndex}`);
        params.push(domain);
        paramIndex++;
      }

      if (active !== null) {
        conditions.push(`mp.is_active = $${paramIndex}`);
        params.push(active === 'true');
        paramIndex++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Get programs with statistics
      const result = await db.query(`
        SELECT 
          mp.id,
          mp.name,
          mp.description,
          mp.domain,
          mp.is_active,
          mp.created_at,
          COUNT(DISTINCT mr.id) as total_relationships,
          COUNT(DISTINCT CASE WHEN mr.status = 'active' THEN mr.id END) as active_relationships,
          COUNT(DISTINCT CASE WHEN mr.status = 'completed' THEN mr.id END) as completed_relationships
        FROM mentorship_programs mp
        LEFT JOIN mentorship_relationships mr ON mp.id = mr.program_id
        ${whereClause}
        GROUP BY mp.id, mp.name, mp.description, mp.domain, mp.is_active, mp.created_at
        ORDER BY mp.created_at DESC
      `, params);

      return NextResponse.json(
        {
          success: true,
          data: { programs: result.rows },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Get mentorship programs error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch mentorship programs'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}

// POST /api/academy/mentorship/programs - Create new mentorship program (domain leads and admins only)
export async function POST(request: NextRequest) {
  return withDomainLead(request, async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      const { name, description, domain } = body;

      // Validate required fields
      if (!name || !domain) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'MISSING_FIELDS',
              message: 'Name and domain are required'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      // Validate domain
      const validDomains = ['Game Development', 'Game Design', 'Game Art', 'AI for Game Development', 'Creative', 'Corporate'];
      if (!validDomains.includes(domain)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_DOMAIN',
              message: 'Invalid domain specified'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      // Check if user can create programs for this domain
      if (req.user!.role !== 'admin' && req.user!.domain !== domain) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'You can only create programs for your own domain'
            },
            timestamp: new Date().toISOString()
          },
          { status: 403 }
        );
      }

      // Check if program with same name exists in domain
      const existingResult = await db.query(`
        SELECT id FROM mentorship_programs 
        WHERE name = $1 AND domain = $2
      `, [name, domain]);

      if (existingResult.rows.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'PROGRAM_EXISTS',
              message: 'A program with this name already exists in this domain'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      // Create mentorship program
      const result = await db`
        INSERT INTO mentorship_programs (name, description, domain, is_active)
        VALUES (${name}, ${description || null}, ${domain}, true)
        RETURNING *
      `;

      return NextResponse.json(
        {
          success: true,
          data: { program: result.rows[0] },
          timestamp: new Date().toISOString()
        },
        { status: 201 }
      );

    } catch (error) {
      console.error('Create mentorship program error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to create mentorship program'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}