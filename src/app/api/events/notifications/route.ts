import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withAdmin, AuthenticatedRequest } from '../../../../lib/auth-middleware';
import { db } from '../../../../lib/db';

// POST /api/events/notifications - Send event reminders (admin only - typically called by cron job)
export async function POST(request: NextRequest) {
  return withAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      const { reminder_type = '24h', event_ids } = body;

      // Define reminder timeframes
      const reminderTimeframes = {
        '1h': 1, // 1 hour before
        '24h': 24, // 24 hours before
        '1w': 168 // 1 week before
      };

      const hoursBeforeEvent = reminderTimeframes[reminder_type as keyof typeof reminderTimeframes] || 24;

      let eventsQuery;
      let params: any[] = [];

      if (event_ids && Array.isArray(event_ids)) {
        // Send reminders for specific events
        eventsQuery = `
          SELECT 
            e.id,
            e.title,
            e.description,
            e.start_date,
            e.end_date,
            e.location,
            e.is_virtual,
            e.organizer_id
          FROM events e
          WHERE e.id = ANY($1) AND e.is_active = true
        `;
        params = [event_ids];
      } else {
        // Send reminders for events starting in the specified timeframe
        eventsQuery = `
          SELECT 
            e.id,
            e.title,
            e.description,
            e.start_date,
            e.end_date,
            e.location,
            e.is_virtual,
            e.organizer_id
          FROM events e
          WHERE e.is_active = true 
            AND e.start_date > NOW()
            AND e.start_date <= NOW() + INTERVAL '${hoursBeforeEvent} hours'
            AND e.start_date > NOW() + INTERVAL '${hoursBeforeEvent - 1} hours'
        `;
      }

      const eventsResult = await db.query(eventsQuery, params);
      const events = eventsResult.rows;

      if (events.length === 0) {
        return NextResponse.json(
          {
            success: true,
            data: {
              message: 'No events found for reminder notifications',
              events_processed: 0
            },
            timestamp: new Date().toISOString()
          },
          { status: 200 }
        );
      }

      let totalNotificationsSent = 0;

      // Process each event
      for (const event of events) {
        // Get all registered participants for this event
        const participantsResult = await db`
          SELECT 
            u.id,
            u.username,
            u.email,
            er.registered_at
          FROM event_registrations er
          JOIN users u ON er.user_id = u.id
          WHERE er.event_id = ${event.id} AND er.status = 'registered'
        `;

        const participants = participantsResult.rows;

        if (participants.length === 0) {
          continue;
        }

        // Create reminder message
        const timeUntilEvent = Math.round((new Date(event.start_date).getTime() - new Date().getTime()) / (1000 * 60 * 60));
        let reminderMessage;

        if (timeUntilEvent <= 1) {
          reminderMessage = `Your event "${event.title}" is starting soon!`;
        } else if (timeUntilEvent <= 24) {
          reminderMessage = `Reminder: Your event "${event.title}" starts in ${timeUntilEvent} hour${timeUntilEvent > 1 ? 's' : ''}`;
        } else {
          const daysUntil = Math.round(timeUntilEvent / 24);
          reminderMessage = `Reminder: Your event "${event.title}" starts in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`;
        }

        // Send notifications to all participants
        for (const participant of participants) {
          await db`
            INSERT INTO notifications (user_id, type, title, message, data)
            VALUES (
              ${participant.id},
              'event_reminder',
              'Event Reminder',
              ${reminderMessage},
              ${JSON.stringify({
                event_id: event.id,
                event_title: event.title,
                start_date: event.start_date,
                end_date: event.end_date,
                location: event.location,
                is_virtual: event.is_virtual,
                reminder_type,
                hours_until_event: timeUntilEvent
              })}
            )
          `;

          totalNotificationsSent++;
        }

        // Also notify the organizer
        await db`
          INSERT INTO notifications (user_id, type, title, message, data)
          VALUES (
            ${event.organizer_id},
            'event_organizer_reminder',
            'Event Organizer Reminder',
            ${`Your event "${event.title}" starts in ${timeUntilEvent <= 1 ? 'less than an hour' : timeUntilEvent <= 24 ? `${timeUntilEvent} hours` : `${Math.round(timeUntilEvent / 24)} days`}. ${participants.length} participant${participants.length !== 1 ? 's are' : ' is'} registered.`},
            ${JSON.stringify({
              event_id: event.id,
              event_title: event.title,
              start_date: event.start_date,
              participant_count: participants.length,
              reminder_type,
              hours_until_event: timeUntilEvent
            })}
          )
        `;

        totalNotificationsSent++;
      }

      return NextResponse.json(
        {
          success: true,
          data: {
            message: `Successfully sent ${totalNotificationsSent} reminder notifications`,
            events_processed: events.length,
            notifications_sent: totalNotificationsSent,
            reminder_type
          },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Send event reminders error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to send event reminders'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}

// GET /api/events/notifications - Get upcoming events that need reminders (admin only)
export async function GET(request: NextRequest) {
  return withAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const reminder_type = searchParams.get('reminder_type') || '24h';

      // Define reminder timeframes
      const reminderTimeframes = {
        '1h': 1,
        '24h': 24,
        '1w': 168
      };

      const hoursBeforeEvent = reminderTimeframes[reminder_type as keyof typeof reminderTimeframes] || 24;

      // Get events that need reminders
      const eventsResult = await db`
        SELECT 
          e.id,
          e.title,
          e.description,
          e.start_date,
          e.end_date,
          e.location,
          e.is_virtual,
          e.organizer_id,
          e.current_participants,
          u.username as organizer_username,
          COUNT(er.user_id) as registered_count
        FROM events e
        LEFT JOIN users u ON e.organizer_id = u.id
        LEFT JOIN event_registrations er ON e.id = er.event_id AND er.status = 'registered'
        WHERE e.is_active = true 
          AND e.start_date > NOW()
          AND e.start_date <= NOW() + INTERVAL '${hoursBeforeEvent} hours'
          AND e.start_date > NOW() + INTERVAL '${hoursBeforeEvent - 1} hours'
        GROUP BY e.id, u.username
        ORDER BY e.start_date ASC
      `;

      const events = eventsResult.rows.map(event => ({
        ...event,
        hours_until_start: Math.round((new Date(event.start_date).getTime() - new Date().getTime()) / (1000 * 60 * 60)),
        registered_count: parseInt(event.registered_count)
      }));

      return NextResponse.json(
        {
          success: true,
          data: {
            events,
            reminder_type,
            total_events: events.length,
            total_participants: events.reduce((sum, event) => sum + event.registered_count, 0)
          },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Get events for reminders error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to get events for reminders'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}