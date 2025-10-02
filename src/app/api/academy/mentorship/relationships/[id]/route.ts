import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withDomainLead, AuthenticatedRequest } from '../../../../../../lib/auth-middleware';
import { db } from '../../../../../../lib/db';

// GET /api/academy/mentorship/relationships/[id] - Get specific mentorship relationship
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const relationshipId = params.id;
      const userId = req.user!.id;

      // Get relationship with full details
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
          mp.description as program_description,
          mp.domain as program_domain,
          mentor.username as mentor_username,
          mentor.avatar_url as mentor_avatar_url,
          mentor.xp as mentor_xp,
          mentor.level as mentor_level,
          mentor.bio as mentor_bio,
          mentee.username as mentee_username,
          mentee.avatar_url as mentee_avatar_url,
          mentee.xp as mentee_xp,
          mentee.level as mentee_level,
          mentee.bio as mentee_bio,
          CASE 
            WHEN mr.mentor_id = $1 THEN 'mentor'
            WHEN mr.mentee_id = $1 THEN 'mentee'
            ELSE 'observer'
          END as user_role
        FROM mentorship_relationships mr
        JOIN mentorship_programs mp ON mr.program_id = mp.id
        JOIN users mentor ON mr.mentor_id = mentor.id
        JOIN users mentee ON mr.mentee_id = mentee.id
        WHERE mr.id = $2
      `, [userId, relationshipId]);

      if (result.rows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'RELATIONSHIP_NOT_FOUND',
              message: 'Mentorship relationship not found'
            },
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        );
      }

      const relationship = result.rows[0];

      // Check if user can access this relationship
      if (relationship.user_role === 'observer' && 
          req.user!.role !== 'admin' && 
          req.user!.domain !== relationship.program_domain) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Access denied to this mentorship relationship'
            },
            timestamp: new Date().toISOString()
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          data: { relationship },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Get mentorship relationship error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch mentorship relationship'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}

// PUT /api/academy/mentorship/relationships/[id] - Update mentorship relationship status
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const relationshipId = params.id;
      const userId = req.user!.id;
      const body = await req.json();
      const { status } = body;

      // Validate status
      if (!status || !['active', 'completed', 'cancelled'].includes(status)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_STATUS',
              message: 'Status must be active, completed, or cancelled'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      // Get current relationship
      const currentResult = await db.query(`
        SELECT 
          mr.*,
          mp.domain as program_domain,
          mp.name as program_name,
          mentor.username as mentor_username,
          mentee.username as mentee_username
        FROM mentorship_relationships mr
        JOIN mentorship_programs mp ON mr.program_id = mp.id
        JOIN users mentor ON mr.mentor_id = mentor.id
        JOIN users mentee ON mr.mentee_id = mentee.id
        WHERE mr.id = $1
      `, [relationshipId]);

      if (currentResult.rows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'RELATIONSHIP_NOT_FOUND',
              message: 'Mentorship relationship not found'
            },
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        );
      }

      const relationship = currentResult.rows[0];

      // Check permissions
      const canUpdate = (
        // Users in the relationship can update it
        relationship.mentor_id === userId || 
        relationship.mentee_id === userId ||
        // Domain leads can manage relationships in their domain
        (req.user!.role === 'domain_lead' && req.user!.domain === relationship.program_domain) ||
        // Admins can manage all relationships
        req.user!.role === 'admin'
      );

      if (!canUpdate) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'You cannot update this mentorship relationship'
            },
            timestamp: new Date().toISOString()
          },
          { status: 403 }
        );
      }

      // Update relationship
      const result = await db.query(`
        UPDATE mentorship_relationships 
        SET 
          status = $1,
          ended_at = CASE WHEN $1 IN ('completed', 'cancelled') THEN NOW() ELSE ended_at END
        WHERE id = $2
        RETURNING *
      `, [status, relationshipId]);

      // Create notifications if status changed
      if (relationship.status !== status) {
        let notificationMessage = '';
        let activityDescription = '';

        switch (status) {
          case 'completed':
            notificationMessage = `Your mentorship in ${relationship.program_name} has been completed`;
            activityDescription = `Completed mentorship in ${relationship.program_name}`;
            break;
          case 'cancelled':
            notificationMessage = `Your mentorship in ${relationship.program_name} has been cancelled`;
            activityDescription = `Cancelled mentorship in ${relationship.program_name}`;
            break;
          case 'active':
            notificationMessage = `Your mentorship in ${relationship.program_name} has been reactivated`;
            activityDescription = `Reactivated mentorship in ${relationship.program_name}`;
            break;
        }

        // Send notifications to both users
        await db.query(`
          INSERT INTO notifications (user_id, type, title, message, data)
          VALUES 
            ($1, 'mentorship_update', 'Mentorship Status Update', $2, $3),
            ($4, 'mentorship_update', 'Mentorship Status Update', $5, $6)
        `, [
          relationship.mentor_id,
          notificationMessage,
          JSON.stringify({
            relationship_id: relationshipId,
            program_name: relationship.program_name,
            new_status: status,
            partner_username: relationship.mentee_username,
            role: 'mentor'
          }),
          relationship.mentee_id,
          notificationMessage,
          JSON.stringify({
            relationship_id: relationshipId,
            program_name: relationship.program_name,
            new_status: status,
            partner_username: relationship.mentor_username,
            role: 'mentee'
          })
        ]);

        // Create activity records
        await db.query(`
          INSERT INTO activities (user_id, type, description, data)
          VALUES 
            ($1, 'mentorship_update', $2, $3),
            ($4, 'mentorship_update', $5, $6)
        `, [
          relationship.mentor_id,
          activityDescription,
          JSON.stringify({
            relationship_id: relationshipId,
            program_name: relationship.program_name,
            new_status: status,
            role: 'mentor'
          }),
          relationship.mentee_id,
          activityDescription,
          JSON.stringify({
            relationship_id: relationshipId,
            program_name: relationship.program_name,
            new_status: status,
            role: 'mentee'
          })
        ]);
      }

      return NextResponse.json(
        {
          success: true,
          data: { relationship: result.rows[0] },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Update mentorship relationship error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to update mentorship relationship'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}