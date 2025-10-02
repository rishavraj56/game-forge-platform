import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '../../../../../lib/auth-middleware';
import { db } from '../../../../../lib/db';

// GET /api/academy/mentorship/dashboard - Get mentorship dashboard data for user
export async function GET(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const userId = req.user!.id;
      const userDomain = req.user!.domain;

      // Get user's mentorship statistics
      const statsResult = await db.query(`
        SELECT 
          COUNT(DISTINCT CASE WHEN mr.mentor_id = $1 THEN mr.id END) as mentoring_count,
          COUNT(DISTINCT CASE WHEN mr.mentee_id = $1 THEN mr.id END) as mentee_count,
          COUNT(DISTINCT CASE WHEN mr.mentor_id = $1 AND mr.status = 'active' THEN mr.id END) as active_mentoring,
          COUNT(DISTINCT CASE WHEN mr.mentee_id = $1 AND mr.status = 'active' THEN mr.id END) as active_mentee,
          COUNT(DISTINCT CASE WHEN mr.mentor_id = $1 AND mr.status = 'completed' THEN mr.id END) as completed_mentoring,
          COUNT(DISTINCT CASE WHEN mr.mentee_id = $1 AND mr.status = 'completed' THEN mr.id END) as completed_mentee
        FROM mentorship_relationships mr
        WHERE mr.mentor_id = $1 OR mr.mentee_id = $1
      `, [userId]);

      // Get active relationships with details
      const activeRelationshipsResult = await db.query(`
        SELECT 
          mr.id,
          mr.program_id,
          mr.status,
          mr.started_at,
          mp.name as program_name,
          mp.domain as program_domain,
          CASE 
            WHEN mr.mentor_id = $1 THEN 'mentor'
            ELSE 'mentee'
          END as user_role,
          CASE 
            WHEN mr.mentor_id = $1 THEN mentee.username
            ELSE mentor.username
          END as partner_username,
          CASE 
            WHEN mr.mentor_id = $1 THEN mentee.avatar_url
            ELSE mentor.avatar_url
          END as partner_avatar_url,
          CASE 
            WHEN mr.mentor_id = $1 THEN mentee.xp
            ELSE mentor.xp
          END as partner_xp,
          CASE 
            WHEN mr.mentor_id = $1 THEN mentee.level
            ELSE mentor.level
          END as partner_level
        FROM mentorship_relationships mr
        JOIN mentorship_programs mp ON mr.program_id = mp.id
        JOIN users mentor ON mr.mentor_id = mentor.id
        JOIN users mentee ON mr.mentee_id = mentee.id
        WHERE (mr.mentor_id = $1 OR mr.mentee_id = $1)
          AND mr.status = 'active'
        ORDER BY mr.started_at DESC
      `, [userId]);

      // Get available programs in user's domain
      const programsResult = await db.query(`
        SELECT 
          mp.id,
          mp.name,
          mp.description,
          mp.domain,
          COUNT(DISTINCT mr.id) as total_relationships,
          COUNT(DISTINCT CASE WHEN mr.status = 'active' THEN mr.id END) as active_relationships
        FROM mentorship_programs mp
        LEFT JOIN mentorship_relationships mr ON mp.id = mr.program_id
        WHERE mp.domain = $1 AND mp.is_active = true
        GROUP BY mp.id, mp.name, mp.description, mp.domain
        ORDER BY mp.name
      `, [userDomain]);

      // Get recent mentorship activities
      const activitiesResult = await db.query(`
        SELECT 
          a.id,
          a.type,
          a.description,
          a.data,
          a.created_at,
          u.username,
          u.avatar_url
        FROM activities a
        JOIN users u ON a.user_id = u.id
        WHERE a.type IN ('mentorship_match', 'mentorship_update')
          AND (
            a.user_id = $1 OR 
            EXISTS (
              SELECT 1 FROM mentorship_relationships mr 
              WHERE (mr.mentor_id = $1 OR mr.mentee_id = $1)
                AND (mr.mentor_id = a.user_id OR mr.mentee_id = a.user_id)
            )
          )
        ORDER BY a.created_at DESC
        LIMIT 10
      `, [userId]);

      // Get domain mentorship statistics
      const domainStatsResult = await db.query(`
        SELECT 
          COUNT(DISTINCT mp.id) as total_programs,
          COUNT(DISTINCT mr.id) as total_relationships,
          COUNT(DISTINCT CASE WHEN mr.status = 'active' THEN mr.id END) as active_relationships,
          COUNT(DISTINCT mr.mentor_id) as unique_mentors,
          COUNT(DISTINCT mr.mentee_id) as unique_mentees
        FROM mentorship_programs mp
        LEFT JOIN mentorship_relationships mr ON mp.id = mr.program_id
        WHERE mp.domain = $1 AND mp.is_active = true
      `, [userDomain]);

      const stats = statsResult.rows[0];
      const domainStats = domainStatsResult.rows[0];

      return NextResponse.json(
        {
          success: true,
          data: {
            user_stats: {
              total_mentoring: parseInt(stats.mentoring_count),
              total_mentee: parseInt(stats.mentee_count),
              active_mentoring: parseInt(stats.active_mentoring),
              active_mentee: parseInt(stats.active_mentee),
              completed_mentoring: parseInt(stats.completed_mentoring),
              completed_mentee: parseInt(stats.completed_mentee),
              total_active: parseInt(stats.active_mentoring) + parseInt(stats.active_mentee),
              total_completed: parseInt(stats.completed_mentoring) + parseInt(stats.completed_mentee)
            },
            active_relationships: activeRelationshipsResult.rows,
            available_programs: programsResult.rows.map(program => ({
              ...program,
              total_relationships: parseInt(program.total_relationships),
              active_relationships: parseInt(program.active_relationships)
            })),
            recent_activities: activitiesResult.rows,
            domain_stats: {
              total_programs: parseInt(domainStats.total_programs),
              total_relationships: parseInt(domainStats.total_relationships),
              active_relationships: parseInt(domainStats.active_relationships),
              unique_mentors: parseInt(domainStats.unique_mentors),
              unique_mentees: parseInt(domainStats.unique_mentees)
            }
          },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Get mentorship dashboard error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch mentorship dashboard'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}