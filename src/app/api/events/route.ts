import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withDomainLead, AuthenticatedRequest, canCreateEvents } from '../../../lib/auth-middleware';
import { db } from '../../../lib/db';
import { Event, Domain } from '../../../lib/types';

// GET /api/events - Get all events (with optional filtering)
export async function GET(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const domain = searchParams.get('domain') as Domain | null;
      const eventType = searchParams.get('event_type');
      const upcoming = searchParams.get('upcoming') === 'true';
      const organizer = searchParams.get('organizer');
      const page = parseInt(searchParams.get('page') || '1');
      const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
      const offset = (page - 1) * limit;

      // Build query conditions
      const conditions: string[] = ['e.is_active = true'];
      const params: any[] = [];
      let paramIndex = 1;

      if (domain) {
        conditions.push(`e.domain = $${paramIndex}`);
        params.push(domain);
        paramIndex++;
      }

      if (eventType) {
        conditions.push(`e.event_type = $${paramIndex}`);
        params.push(eventType);
        paramIndex++;
      }

      if (upcoming) {
        conditions.push(`e.start_date > NOW()`);
      }

      if (organizer) {
        conditions.push(`e.organizer_id = $${paramIndex}`);
        params.push(organizer);
        paramIndex++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Get events with organizer info and registration status
      const eventsResult = await db.query(`
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
          CASE WHEN er.user_id IS NOT NULL THEN true ELSE false END as user_registered,
          er.status as registration_status
        FROM events e
        LEFT JOIN users u ON e.organizer_id = u.id
        LEFT JOIN event_registrations er ON e.id = er.event_id AND er.user_id = $${paramIndex}
        ${whereClause}
        ORDER BY e.start_date ASC
        LIMIT $${paramIndex + 1} OFFSET $${paramIndex + 2}
      `, [...params, req.user!.id, limit, offset]);

      // Get total count for pagination
      const countResult = await db.query(`
        SELECT COUNT(*) as total
        FROM events e
        ${whereClause}
      `, params);

      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      return NextResponse.json(
        {
          success: true,
          data: {
            events: eventsResult.rows,
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
      console.error('Get events error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch events'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}

// POST /api/events - Create new event (domain leads and admins only)
export async function POST(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      // Check if user can create events
      if (!canCreateEvents(req.user!.role)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Only domain leads and admins can create events'
            },
            timestamp: new Date().toISOString()
          },
          { status: 403 }
        );
      }

      const body = await req.json();
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

      // Validate required fields
      if (!title || !description || !event_type || !start_date || !end_date) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'MISSING_FIELDS',
              message: 'Title, description, event_type, start_date, and end_date are required'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      // Validate dates
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
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

      // Validate domain if provided
      if (domain) {
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

        // Check if domain lead can create events for this domain
        if (req.user!.role === 'domain_lead' && req.user!.domain !== domain) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'FORBIDDEN',
                message: 'Domain leads can only create events for their own domain'
              },
              timestamp: new Date().toISOString()
            },
            { status: 403 }
          );
        }
      }

      // Validate max_participants
      if (max_participants !== null && max_participants !== undefined) {
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
      }

      // Validate XP reward
      if (xp_reward !== null && xp_reward !== undefined) {
        if (typeof xp_reward !== 'number' || xp_reward < 0 || xp_reward > 10000) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INVALID_XP_REWARD',
                message: 'XP reward must be a number between 0 and 10000'
              },
              timestamp: new Date().toISOString()
            },
            { status: 400 }
          );
        }
      }

      // Create event
      const result = await db`
        INSERT INTO events (
          title, 
          description, 
          domain, 
          event_type, 
          start_date, 
          end_date, 
          max_participants, 
          organizer_id,
          location,
          is_virtual,
          xp_reward
        )
        VALUES (
          ${title}, 
          ${description}, 
          ${domain || null}, 
          ${event_type}, 
          ${start_date}, 
          ${end_date}, 
          ${max_participants || null}, 
          ${req.user!.id},
          ${location || null},
          ${is_virtual !== undefined ? is_virtual : true},
          ${xp_reward || 0}
        )
        RETURNING *
      `;

      const event = result.rows[0];

      // Create notification for event creation (if domain-specific)
      if (domain) {
        await db`
          INSERT INTO notifications (user_id, type, title, message, data)
          SELECT 
            u.id,
            'event_created',
            'New Event in Your Domain',
            ${`New event "${title}" has been created in ${domain}`},
            ${JSON.stringify({ event_id: event.id, event_type, domain })}
          FROM users u
          WHERE u.domain = ${domain} AND u.id != ${req.user!.id} AND u.is_active = true
        `;
      }

      return NextResponse.json(
        {
          success: true,
          data: { event },
          timestamp: new Date().toISOString()
        },
        { status: 201 }
      );

    } catch (error) {
      console.error('Create event error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to create event'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}