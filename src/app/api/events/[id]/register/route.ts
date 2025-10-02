import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '../../../../../lib/auth-middleware';
import { db } from '../../../../../lib/db';

// POST /api/events/[id]/register - Register for an event
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const eventId = params.id;
      const userId = req.user!.id;

      // Get event details
      const eventResult = await db`
        SELECT * FROM events 
        WHERE id = ${eventId} AND is_active = true
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

      // Check if event has already started
      if (new Date(event.start_date) <= new Date()) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'EVENT_STARTED',
              message: 'Cannot register for an event that has already started'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      // Check if event is at capacity
      if (event.max_participants && event.current_participants >= event.max_participants) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'EVENT_FULL',
              message: 'Event is at maximum capacity'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      // Check if user is already registered
      const existingRegistration = await db`
        SELECT * FROM event_registrations 
        WHERE event_id = ${eventId} AND user_id = ${userId}
      `;

      if (existingRegistration.rows.length > 0) {
        const registration = existingRegistration.rows[0];
        
        if (registration.status === 'registered') {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'ALREADY_REGISTERED',
                message: 'You are already registered for this event'
              },
              timestamp: new Date().toISOString()
            },
            { status: 400 }
          );
        }

        // If previously cancelled, re-register
        if (registration.status === 'cancelled') {
          await db`
            UPDATE event_registrations SET
              status = 'registered',
              registered_at = NOW()
            WHERE event_id = ${eventId} AND user_id = ${userId}
          `;

          // Update participant count
          await db`
            UPDATE events SET
              current_participants = current_participants + 1,
              updated_at = NOW()
            WHERE id = ${eventId}
          `;

          // Create notification
          await db`
            INSERT INTO notifications (user_id, type, title, message, data)
            VALUES (
              ${userId},
              'event_registered',
              'Event Registration Confirmed',
              ${`You have successfully registered for "${event.title}"`},
              ${JSON.stringify({ event_id: eventId, event_title: event.title, start_date: event.start_date })}
            )
          `;

          return NextResponse.json(
            {
              success: true,
              data: { 
                message: 'Successfully re-registered for event',
                registration: {
                  event_id: eventId,
                  user_id: userId,
                  status: 'registered',
                  registered_at: new Date().toISOString()
                }
              },
              timestamp: new Date().toISOString()
            },
            { status: 200 }
          );
        }
      }

      // Create new registration
      const registrationResult = await db`
        INSERT INTO event_registrations (event_id, user_id, status)
        VALUES (${eventId}, ${userId}, 'registered')
        RETURNING *
      `;

      // Update participant count
      await db`
        UPDATE events SET
          current_participants = current_participants + 1,
          updated_at = NOW()
        WHERE id = ${eventId}
      `;

      // Create notification for user
      await db`
        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES (
          ${userId},
          'event_registered',
          'Event Registration Confirmed',
          ${`You have successfully registered for "${event.title}"`},
          ${JSON.stringify({ event_id: eventId, event_title: event.title, start_date: event.start_date })}
        )
      `;

      // Create notification for organizer
      await db`
        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES (
          ${event.organizer_id},
          'event_registration',
          'New Event Registration',
          ${`Someone registered for your event "${event.title}"`},
          ${JSON.stringify({ event_id: eventId, event_title: event.title, participant_count: event.current_participants + 1 })}
        )
      `;

      return NextResponse.json(
        {
          success: true,
          data: { 
            message: 'Successfully registered for event',
            registration: registrationResult.rows[0]
          },
          timestamp: new Date().toISOString()
        },
        { status: 201 }
      );

    } catch (error) {
      console.error('Event registration error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to register for event'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}

// DELETE /api/events/[id]/register - Cancel event registration
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const eventId = params.id;
      const userId = req.user!.id;

      // Check if user is registered
      const registrationResult = await db`
        SELECT er.*, e.title, e.start_date, e.organizer_id
        FROM event_registrations er
        JOIN events e ON er.event_id = e.id
        WHERE er.event_id = ${eventId} AND er.user_id = ${userId} AND er.status = 'registered'
      `;

      if (registrationResult.rows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NOT_REGISTERED',
              message: 'You are not registered for this event'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      const registration = registrationResult.rows[0];

      // Check if event has already started (optional - you might want to allow cancellation even after start)
      if (new Date(registration.start_date) <= new Date()) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'EVENT_STARTED',
              message: 'Cannot cancel registration for an event that has already started'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      // Cancel registration
      await db`
        UPDATE event_registrations SET
          status = 'cancelled'
        WHERE event_id = ${eventId} AND user_id = ${userId}
      `;

      // Update participant count
      await db`
        UPDATE events SET
          current_participants = current_participants - 1,
          updated_at = NOW()
        WHERE id = ${eventId}
      `;

      // Create notification for user
      await db`
        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES (
          ${userId},
          'event_cancelled_registration',
          'Event Registration Cancelled',
          ${`You have cancelled your registration for "${registration.title}"`},
          ${JSON.stringify({ event_id: eventId, event_title: registration.title })}
        )
      `;

      // Create notification for organizer
      await db`
        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES (
          ${registration.organizer_id},
          'event_registration_cancelled',
          'Event Registration Cancelled',
          ${`Someone cancelled their registration for "${registration.title}"`},
          ${JSON.stringify({ event_id: eventId, event_title: registration.title })}
        )
      `;

      return NextResponse.json(
        {
          success: true,
          data: { message: 'Successfully cancelled event registration' },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Cancel event registration error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to cancel event registration'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}