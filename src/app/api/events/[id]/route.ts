import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest, canCreateEvents } from '../../../../lib/auth-middleware';
import { db } from '../../../../lib/db';

// GET /api/events/[id] - Get specific event details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const eventId = params.id;

      // Get event with organizer info and registration details
      const eventResult = await db`
        SELECT 
          e.id,
          e.title,
          e.description,
          e.domain,
          e.event_type,
          e.start_date,
          e.end_date,
          e.max_participants,
          e.current_participants,
          e.organizer_id,
          e.location,
          e.is_virtual,
          e.xp_reward,
          e.is_active,
          e.created_at,
          e.updated_at,
          u.username as organizer_username,
          u.avatar_url as organizer_avatar,
          u.domain as organizer_domain,
          CASE WHEN er.user_id IS NOT NULL THEN true ELSE false END as user_registered,
          er.status as registration_status,
          er.registered_at as user_registered_at
        FROM events e
        LEFT JOIN users u ON e.organizer_id = u.id
        LEFT JOIN event_registrations er ON e.id = er.event_id AND er.user_id = ${req.user!.id}
        WHERE e.id = ${eventId} AND e.is_active = true
      `;

      if (eventResult.rows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Event not found'
            },
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        );
      }

      const event = eventResult.rows[0];

      // Get registered participants (limited info for privacy)
      const participantsResult = await db`
        SELECT 
          u.id,
          u.username,
          u.avatar_url,
          u.domain,
          er.status,
          er.registered_at
        FROM event_registrations er
        JOIN users u ON er.user_id = u.id
        WHERE er.event_id = ${eventId} AND er.status != 'cancelled'
        ORDER BY er.registered_at ASC
      `;

      return NextResponse.json(
        {
          success: true,
          data: {
            event,
            participants: participantsResult.rows
          },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Get event error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch event'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}

// PUT /api/events/[id] - Update event (organizer, domain leads, or admins only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const eventId = params.id;
      const body = await req.json();

      // First, get the current event to check permissions
      const currentEventResult = await db`
        SELECT * FROM events 
        WHERE id = ${eventId} AND is_active = true
      `;

      if (currentEventResult.rows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Event not found'
            },
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        );
      }

      const currentEvent = currentEventResult.rows[0];

      // Check permissions
      const canEdit = 
        req.user!.role === 'admin' ||
        (req.user!.role === 'domain_lead' && req.user!.domain === currentEvent.domain) ||
        req.user!.id === currentEvent.organizer_id;

      if (!canEdit) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'You can only edit events you organize or events in your domain'
            },
            timestamp: new Date().toISOString()
          },
          { status: 403 }
        );
      }

      const { 
        title, 
        description, 
        domain, 
        event_type, 
        start_date, 
        end_date, 
        max_participants, 
        location,
        is_virtual,
        xp_reward
      } = body;

      // Validate dates if provided
      if (start_date || end_date) {
        const startDate = new Date(start_date || currentEvent.start_date);
        const endDate = new Date(end_date || currentEvent.end_date);
        const now = new Date();

        if (startDate <= now) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INVALID_DATE',
                message: 'Start date must be in the future'
              },
              timestamp: new Date().toISOString()
            },
            { status: 400 }
          );
        }

        if (endDate <= startDate) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INVALID_DATE',
                message: 'End date must be after start date'
              },
              timestamp: new Date().toISOString()
            },
            { status: 400 }
          );
        }
      }

      // Validate domain if provided
      if (domain && domain !== currentEvent.domain) {
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

        // Check if domain lead can move event to this domain
        if (req.user!.role === 'domain_lead' && req.user!.domain !== domain) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'FORBIDDEN',
                message: 'Domain leads can only move events to their own domain'
              },
              timestamp: new Date().toISOString()
            },
            { status: 403 }
          );
        }
      }

      // Validate max_participants if provided
      if (max_participants !== undefined && max_participants !== null) {
        if (typeof max_participants !== 'number' || max_participants < 1) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INVALID_PARTICIPANTS',
                message: 'Max participants must be a positive number'
              },
              timestamp: new Date().toISOString()
            },
            { status: 400 }
          );
        }

        // Check if reducing capacity below current registrations
        if (max_participants < currentEvent.current_participants) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'CAPACITY_CONFLICT',
                message: `Cannot reduce capacity below current registrations (${currentEvent.current_participants})`
              },
              timestamp: new Date().toISOString()
            },
            { status: 400 }
          );
        }
      }

      // Update event
      const result = await db`
        UPDATE events SET
          title = ${title || currentEvent.title},
          description = ${description || currentEvent.description},
          domain = ${domain || currentEvent.domain},
          event_type = ${event_type || currentEvent.event_type},
          start_date = ${start_date || currentEvent.start_date},
          end_date = ${end_date || currentEvent.end_date},
          max_participants = ${max_participants !== undefined ? max_participants : currentEvent.max_participants},
          location = ${location !== undefined ? location : currentEvent.location},
          is_virtual = ${is_virtual !== undefined ? is_virtual : currentEvent.is_virtual},
          xp_reward = ${xp_reward !== undefined ? xp_reward : currentEvent.xp_reward},
          updated_at = NOW()
        WHERE id = ${eventId}
        RETURNING *
      `;

      // Notify registered participants of significant changes
      if (start_date || end_date || location !== undefined) {
        await db`
          INSERT INTO notifications (user_id, type, title, message, data)
          SELECT 
            er.user_id,
            'event_updated',
            'Event Updated',
            ${`The event "${title || currentEvent.title}" has been updated`},
            ${JSON.stringify({ event_id: eventId, changes: { start_date, end_date, location } })}
          FROM event_registrations er
          WHERE er.event_id = ${eventId} AND er.status = 'registered'
        `;
      }

      return NextResponse.json(
        {
          success: true,
          data: { event: result.rows[0] },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Update event error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to update event'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}

// DELETE /api/events/[id] - Delete/cancel event (organizer, domain leads, or admins only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const eventId = params.id;

      // First, get the current event to check permissions
      const currentEventResult = await db`
        SELECT * FROM events 
        WHERE id = ${eventId} AND is_active = true
      `;

      if (currentEventResult.rows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Event not found'
            },
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        );
      }

      const currentEvent = currentEventResult.rows[0];

      // Check permissions
      const canDelete = 
        req.user!.role === 'admin' ||
        (req.user!.role === 'domain_lead' && req.user!.domain === currentEvent.domain) ||
        req.user!.id === currentEvent.organizer_id;

      if (!canDelete) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'You can only delete events you organize or events in your domain'
            },
            timestamp: new Date().toISOString()
          },
          { status: 403 }
        );
      }

      // Soft delete the event
      await db`
        UPDATE events SET
          is_active = false,
          updated_at = NOW()
        WHERE id = ${eventId}
      `;

      // Cancel all registrations
      await db`
        UPDATE event_registrations SET
          status = 'cancelled'
        WHERE event_id = ${eventId} AND status = 'registered'
      `;

      // Notify all registered participants
      await db`
        INSERT INTO notifications (user_id, type, title, message, data)
        SELECT 
          er.user_id,
          'event_cancelled',
          'Event Cancelled',
          ${`The event "${currentEvent.title}" has been cancelled`},
          ${JSON.stringify({ event_id: eventId, event_title: currentEvent.title })}
        FROM event_registrations er
        WHERE er.event_id = ${eventId}
      `;

      return NextResponse.json(
        {
          success: true,
          data: { message: 'Event cancelled successfully' },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Delete event error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to cancel event'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}