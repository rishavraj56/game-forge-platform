import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withDomainLead, AuthenticatedRequest } from '../../../../../lib/auth-middleware';
import { db } from '../../../../../lib/db';

// GET /api/academy/mentorship/relationships - Get mentorship relationships
export async function GET(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const userId = req.user!.id;
      const programId = searchParams.get('program_id');
      const status = searchParams.get('status');
      const role = searchParams.get('role'); // 'mentor' or 'mentee'
      const page = parseInt(searchParams.get('page') || '1');
      const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
      const offset = (page - 1) * limit;

      // Build query conditions
      const conditions: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      // Filter by user role in relationship
      if (role === 'mentor') {
        conditions.push(`mr.mentor_id = $${paramIndex}`);
        params.push(userId);
        paramIndex++;
      } else if (role === 'mentee') {
        conditions.push(`mr.mentee_id = $${paramIndex}`);
        params.push(userId);
        paramIndex++;
      } else {
        // Show relationships where user is either mentor or mentee
        conditions.push(`(mr.mentor_id = $${paramIndex} OR mr.mentee_id = $${paramIndex})`);
        params.push(userId);
        paramIndex++;
      }

      if (programId) {
        conditions.push(`mr.program_id = $${paramIndex}`);
        params.push(programId);
        paramIndex++;
      }

      if (status) {
        conditions.push(`mr.status = $${paramIndex}`);
        params.push(status);
        paramIndex++;
      }

      const whereClause = `WHERE ${conditions.join(' AND ')}`;

      // Get relationships with user and program details
      const result = await db.query(`
        SELECT 
          mr.id,
          mr.program_id,
          mr.mentor_id,
          mr.mentee_id,
          mr.status,
          mr.started_at,
          mr.ended_at,
          mp.name as program_name,
          mp.domain as program_domain,
          mentor.username as mentor_username,
          mentor.avatar_url as mentor_avatar_url,
          mentor.xp as mentor_xp,
          mentor.level as mentor_level,
          mentee.username as mentee_username,
          mentee.avatar_url as mentee_avatar_url,
          mentee.xp as mentee_xp,
          mentee.level as mentee_level,
          CASE 
            WHEN mr.mentor_id = $${paramIndex} THEN 'mentor'
            WHEN mr.mentee_id = $${paramIndex} THEN 'mentee'
            ELSE 'observer'
          END as user_role
        FROM mentorship_relationships mr
        JOIN mentorship_programs mp ON mr.program_id = mp.id
        JOIN users mentor ON mr.mentor_id = mentor.id
        JOIN users mentee ON mr.mentee_id = mentee.id
        ${whereClause}
        ORDER BY mr.started_at DESC
        LIMIT $${paramIndex + 1} OFFSET $${paramIndex + 2}
      `, [...params, userId, limit, offset]);

      // Get total count for pagination
      const countResult = await db.query(`
        SELECT COUNT(*) as total
        FROM mentorship_relationships mr
        ${whereClause}
      `, params);

      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      return NextResponse.json(
        {
          success: true,
          data: {
            relationships: result.rows,
            pagination: {
              page,
              limit,
              total,
              totalPages,
              hasNext: page < totalPages,
              hasPrev: page > 1
            }
          },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Get mentorship relationships error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch mentorship relationships'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}

// POST /api/academy/mentorship/relationships - Create new mentorship relationship
export async function POST(request: NextRequest) {
  return withDomainLead(request, async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      const { program_id, mentor_id, mentee_id } = body;

      // Validate required fields
      if (!program_id || !mentor_id || !mentee_id) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'MISSING_FIELDS',
              message: 'Program ID, mentor ID, and mentee ID are required'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      // Validate that mentor and mentee are different users
      if (mentor_id === mentee_id) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_RELATIONSHIP',
              message: 'Mentor and mentee must be different users'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      // Check if program exists and is active
      const programResult = await db.query(`
        SELECT id, name, domain, is_active FROM mentorship_programs WHERE id = $1
      `, [program_id]);

      if (programResult.rows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'PROGRAM_NOT_FOUND',
              message: 'Mentorship program not found'
            },
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        );
      }

      const program = programResult.rows[0];

      if (!program.is_active) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'PROGRAM_INACTIVE',
              message: 'Cannot create relationships for inactive program'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      // Check if user can manage this program
      if (req.user!.role !== 'admin' && req.user!.domain !== program.domain) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'You can only manage relationships for your own domain'
            },
            timestamp: new Date().toISOString()
          },
          { status: 403 }
        );
      }

      // Verify mentor and mentee exist and are in the same domain
      const usersResult = await db.query(`
        SELECT id, username, domain, is_active 
        FROM users 
        WHERE id IN ($1, $2)
      `, [mentor_id, mentee_id]);

      if (usersResult.rows.length !== 2) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'USERS_NOT_FOUND',
              message: 'One or both users not found'
            },
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        );
      }

      const users = usersResult.rows;
      const mentor = users.find(u => u.id === mentor_id);
      const mentee = users.find(u => u.id === mentee_id);

      // Check if both users are active
      if (!mentor?.is_active || !mentee?.is_active) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INACTIVE_USERS',
              message: 'Both mentor and mentee must be active users'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      // Check if both users are in the program domain
      if (mentor.domain !== program.domain || mentee.domain !== program.domain) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DOMAIN_MISMATCH',
              message: 'Both users must be in the same domain as the program'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      // Check if relationship already exists
      const existingResult = await db.query(`
        SELECT id FROM mentorship_relationships 
        WHERE program_id = $1 AND mentor_id = $2 AND mentee_id = $3
      `, [program_id, mentor_id, mentee_id]);

      if (existingResult.rows.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'RELATIONSHIP_EXISTS',
              message: 'Mentorship relationship already exists'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      // Create mentorship relationship
      const result = await db`
        INSERT INTO mentorship_relationships (program_id, mentor_id, mentee_id, status, started_at)
        VALUES (${program_id}, ${mentor_id}, ${mentee_id}, 'active', NOW())
        RETURNING *
      `;

      // Create notifications for both users
      await db.query(`
        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES 
          ($1, 'mentorship_match', 'New Mentorship Match!', $2, $3),
          ($4, 'mentorship_match', 'New Mentorship Match!', $5, $6)
      `, [
        mentor_id,
        `You've been matched as a mentor with ${mentee.username} in ${program.name}`,
        JSON.stringify({
          relationship_id: result.rows[0].id,
          program_id: program_id,
          program_name: program.name,
          partner_id: mentee_id,
          partner_username: mentee.username,
          role: 'mentor'
        }),
        mentee_id,
        `You've been matched with mentor ${mentor.username} in ${program.name}`,
        JSON.stringify({
          relationship_id: result.rows[0].id,
          program_id: program_id,
          program_name: program.name,
          partner_id: mentor_id,
          partner_username: mentor.username,
          role: 'mentee'
        })
      ]);

      // Create activity records
      await db.query(`
        INSERT INTO activities (user_id, type, description, data)
        VALUES 
          ($1, 'mentorship_match', $2, $3),
          ($4, 'mentorship_match', $5, $6)
      `, [
        mentor_id,
        `Matched as mentor with ${mentee.username} in ${program.name}`,
        JSON.stringify({
          relationship_id: result.rows[0].id,
          program_name: program.name,
          role: 'mentor'
        }),
        mentee_id,
        `Matched with mentor ${mentor.username} in ${program.name}`,
        JSON.stringify({
          relationship_id: result.rows[0].id,
          program_name: program.name,
          role: 'mentee'
        })
      ]);

      return NextResponse.json(
        {
          success: true,
          data: { relationship: result.rows[0] },
          timestamp: new Date().toISOString()
        },
        { status: 201 }
      );

    } catch (error) {
      console.error('Create mentorship relationship error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to create mentorship relationship'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}