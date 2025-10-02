import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '../../../../lib/auth-middleware';
import { db } from '../../../../lib/db';

// GET /api/events/test - Test events API functionality
export async function GET(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      // Test database connection
      const connectionTest = await db`SELECT 1 as test`;
      
      // Test events table exists and get sample data
      const eventsTest = await db`
        SELECT COUNT(*) as event_count FROM events WHERE is_active = true
      `;

      // Test event registrations table
      const registrationsTest = await db`
        SELECT COUNT(*) as registration_count FROM event_registrations
      `;

      // Get user info for testing
      const userInfo = {
        id: req.user!.id,
        username: req.user!.username,
        role: req.user!.role,
        domain: req.user!.domain
      };

      return NextResponse.json(
        {
          success: true,
          data: {
            message: 'Events API is working correctly',
            database_connection: connectionTest.rows.length > 0,
            events_table: {
              accessible: true,
              total_active_events: parseInt(eventsTest.rows[0].event_count)
            },
            registrations_table: {
              accessible: true,
              total_registrations: parseInt(registrationsTest.rows[0].registration_count)
            },
            user_context: userInfo,
            available_endpoints: {
              'GET /api/events': 'List all events with filtering',
              'POST /api/events': 'Create new event (domain leads/admins)',
              'GET /api/events/[id]': 'Get specific event details',
              'PUT /api/events/[id]': 'Update event (organizer/domain leads/admins)',
              'DELETE /api/events/[id]': 'Cancel event (organizer/domain leads/admins)',
              'POST /api/events/[id]/register': 'Register for event',
              'DELETE /api/events/[id]/register': 'Cancel registration',
              'POST /api/events/[id]/attendance': 'Mark attendance (organizers/admins)',
              'GET /api/events/[id]/attendance': 'Get attendance list (organizers/admins)',
              'POST /api/events/notifications': 'Send event reminders (admin)',
              'GET /api/events/notifications': 'Get events needing reminders (admin)',
              'GET /api/events/stats': 'Get event statistics'
            }
          },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Events API test error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TEST_ERROR',
            message: 'Events API test failed',
            details: error instanceof Error ? error.message : 'Unknown error'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}