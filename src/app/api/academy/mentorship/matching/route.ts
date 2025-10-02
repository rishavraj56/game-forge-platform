import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '../../../../../lib/auth-middleware';
import { db } from '../../../../../lib/db';
import { Domain } from '../../../../../lib/types';

// GET /api/academy/mentorship/matching - Find potential mentors or mentees
export async function GET(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const userId = req.user!.id;
      const userDomain = req.user!.domain;
      const role = searchParams.get('role'); // 'mentor' or 'mentee'
      const programId = searchParams.get('program_id');
      const page = parseInt(searchParams.get('page') || '1');
      const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
      const offset = (page - 1) * limit;

      // Validate role parameter
      if (!role || !['mentor', 'mentee'].includes(role)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_ROLE',
              message: 'Role must be either "mentor" or "mentee"'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      // Validate program if provided
      let programDomain = userDomain;
      if (programId) {
        const programResult = await db.query(`
          SELECT domain, is_active FROM mentorship_programs WHERE id = $1
        `, [programId]);

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
                message: 'Cannot find matches for inactive program'
              },
              timestamp: new Date().toISOString()
            },
            { status: 400 }
          );
        }

        programDomain = program.domain;
      }

      // Build matching criteria based on role
      let matchingQuery = '';
      let queryParams: any[] = [];
      let paramIndex = 1;

      if (role === 'mentor') {
        // Looking for potential mentors (users with higher XP in same domain)
        matchingQuery = `
          SELECT 
            u.id,
            u.username,
            u.avatar_url,
            u.xp,
            u.level,
            u.bio,
            u.domain,
            u.created_at,
            COUNT(DISTINCT mr_mentor.id) as mentoring_count,
            COUNT(DISTINCT mr_mentee.id) as mentee_count,
            COALESCE(AVG(CASE WHEN mr_mentor.status = 'completed' THEN 1.0 ELSE 0.0 END), 0) as completion_rate
          FROM users u
          LEFT JOIN mentorship_relationships mr_mentor ON u.id = mr_mentor.mentor_id
          LEFT JOIN mentorship_relationships mr_mentee ON u.id = mr_mentee.mentee_id
          WHERE u.domain = $${paramIndex}
            AND u.id != $${paramIndex + 1}
            AND u.is_active = true
            AND u.xp > (SELECT xp FROM users WHERE id = $${paramIndex + 1})
            AND NOT EXISTS (
              SELECT 1 FROM mentorship_relationships mr_existing
              WHERE mr_existing.mentor_id = u.id 
                AND mr_existing.mentee_id = $${paramIndex + 1}
                ${programId ? `AND mr_existing.program_id = $${paramIndex + 2}` : ''}
            )
          GROUP BY u.id, u.username, u.avatar_url, u.xp, u.level, u.bio, u.domain, u.created_at
          ORDER BY u.xp DESC, completion_rate DESC
          LIMIT $${programId ? paramIndex + 3 : paramIndex + 2} OFFSET $${programId ? paramIndex + 4 : paramIndex + 3}
        `;
        
        queryParams = [programDomain, userId];
        if (programId) {
          queryParams.push(programId);
          paramIndex += 3;
        } else {
          paramIndex += 2;
        }
        queryParams.push(limit, offset);
      } else {
        // Looking for potential mentees (users with lower XP in same domain)
        matchingQuery = `
          SELECT 
            u.id,
            u.username,
            u.avatar_url,
            u.xp,
            u.level,
            u.bio,
            u.domain,
            u.created_at,
            COUNT(DISTINCT mr_mentor.id) as mentoring_count,
            COUNT(DISTINCT mr_mentee.id) as mentee_count
          FROM users u
          LEFT JOIN mentorship_relationships mr_mentor ON u.id = mr_mentor.mentor_id
          LEFT JOIN mentorship_relationships mr_mentee ON u.id = mr_mentee.mentee_id
          WHERE u.domain = $${paramIndex}
            AND u.id != $${paramIndex + 1}
            AND u.is_active = true
            AND u.xp < (SELECT xp FROM users WHERE id = $${paramIndex + 1})
            AND NOT EXISTS (
              SELECT 1 FROM mentorship_relationships mr_existing
              WHERE mr_existing.mentor_id = $${paramIndex + 1}
                AND mr_existing.mentee_id = u.id
                ${programId ? `AND mr_existing.program_id = $${paramIndex + 2}` : ''}
            )
          GROUP BY u.id, u.username, u.avatar_url, u.xp, u.level, u.bio, u.domain, u.created_at
          ORDER BY u.xp DESC, u.created_at DESC
          LIMIT $${programId ? paramIndex + 3 : paramIndex + 2} OFFSET $${programId ? paramIndex + 4 : paramIndex + 3}
        `;
        
        queryParams = [programDomain, userId];
        if (programId) {
          queryParams.push(programId);
          paramIndex += 3;
        } else {
          paramIndex += 2;
        }
        queryParams.push(limit, offset);
      }

      // Execute matching query
      const matchesResult = await db.query(matchingQuery, queryParams);

      // Get total count for pagination
      const countQuery = role === 'mentor' 
        ? `
          SELECT COUNT(*) as total
          FROM users u
          WHERE u.domain = $1
            AND u.id != $2
            AND u.is_active = true
            AND u.xp > (SELECT xp FROM users WHERE id = $2)
            AND NOT EXISTS (
              SELECT 1 FROM mentorship_relationships mr_existing
              WHERE mr_existing.mentor_id = u.id 
                AND mr_existing.mentee_id = $2
                ${programId ? 'AND mr_existing.program_id = $3' : ''}
            )
        `
        : `
          SELECT COUNT(*) as total
          FROM users u
          WHERE u.domain = $1
            AND u.id != $2
            AND u.is_active = true
            AND u.xp < (SELECT xp FROM users WHERE id = $2)
            AND NOT EXISTS (
              SELECT 1 FROM mentorship_relationships mr_existing
              WHERE mr_existing.mentor_id = $2
                AND mr_existing.mentee_id = u.id
                ${programId ? 'AND mr_existing.program_id = $3' : ''}
            )
        `;

      const countParams = programId ? [programDomain, userId, programId] : [programDomain, userId];
      const countResult = await db.query(countQuery, countParams);

      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      return NextResponse.json(
        {
          success: true,
          data: {
            matches: matchesResult.rows,
            pagination: {
              page,
              limit,
              total,
              totalPages,
              hasNext: page < totalPages,
              hasPrev: page > 1
            },
            criteria: {
              role,
              domain: programDomain,
              program_id: programId
            }
          },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Get mentorship matches error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to find mentorship matches'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}