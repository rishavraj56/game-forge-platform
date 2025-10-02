import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest, canCreateEvents } from '../../../../../lib/auth-middleware';
import { db } from '../../../../../lib/db';

// POST /api/events/[id]/attendance - Mark attendance and award XP (organizers and admins only)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const eventId = params.id;
      const body = await req.json();
      const { user_ids } = body; // Array of user IDs to mark as attended

      if (!Array.isArray(user_ids) || user_ids.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_INPUT',
              message: 'user_ids must be a non-empty array'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      // Get event details and check permissions
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

      // Check permissions - only organizer, domain leads, or admins can mark attendance
      const canMarkAttendance = 
        req.user!.role === 'admin' ||
        (req.user!.role === 'domain_lead' && req.user!.domain === event.domain) ||
        req.user!.id === event.organizer_id;

      if (!canMarkAttendance) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Only event organizers, domain leads, and admins can mark attendance'
            },
            timestamp: new Date().toISOString()
          },
          { status: 403 }
        );
      }

      // Validate that all users are registered for the event
      const registeredUsersResult = await db.query(`
        SELECT user_id FROM event_registrations 
        WHERE event_id = $1 AND user_id = ANY($2) AND status = 'registered'
      `, [eventId, user_ids]);

      const registeredUserIds = registeredUsersResult.rows.map(row => row.user_id);
      const unregisteredUsers = user_ids.filter(id => !registeredUserIds.includes(id));

      if (unregisteredUsers.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'USERS_NOT_REGISTERED',
              message: `Some users are not registered for this event: ${unregisteredUsers.join(', ')}`
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      // Check which users are already marked as attended
      const alreadyAttendedResult = await db.query(`
        SELECT user_id FROM event_registrations 
        WHERE event_id = $1 AND user_id = ANY($2) AND status = 'attended'
      `, [eventId, user_ids]);

      const alreadyAttendedIds = alreadyAttendedResult.rows.map(row => row.user_id);
      const newAttendeeIds = user_ids.filter(id => !alreadyAttendedIds.includes(id));

      if (newAttendeeIds.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'ALREADY_ATTENDED',
              message: 'All specified users are already marked as attended'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      // Begin transaction for attendance marking and XP awarding
      const results = [];

      for (const userId of newAttendeeIds) {
        // Mark attendance
        await db`
          UPDATE event_registrations SET
            status = 'attended'
          WHERE event_id = ${eventId} AND user_id = ${userId}
        `;

        // Award XP if event has XP reward
        if (event.xp_reward > 0) {
          // Update user XP
          const userUpdateResult = await db`
            UPDATE users SET
              xp = xp + ${event.xp_reward},
              updated_at = NOW()
            WHERE id = ${userId}
            RETURNING xp, level
          `;

          const updatedUser = userUpdateResult.rows[0];

          // Calculate new level (assuming 1000 XP per level)
          const newLevel = Math.floor(updatedUser.xp / 1000) + 1;
          const leveledUp = newLevel > updatedUser.level;

          if (leveledUp) {
            await db`
              UPDATE users SET
                level = ${newLevel}
              WHERE id = ${userId}
            `;
          }

          // Create XP notification
          await db`
            INSERT INTO notifications (user_id, type, title, message, data)
            VALUES (
              ${userId},
              'xp_earned',
              'XP Earned from Event',
              ${`You earned ${event.xp_reward} XP for attending "${event.title}"`},
              ${JSON.stringify({ 
                event_id: eventId, 
                event_title: event.title, 
                xp_earned: event.xp_reward,
                total_xp: updatedUser.xp,
                leveled_up: leveledUp,
                new_level: leveledUp ? newLevel : undefined
              })}
            )
          `;

          // Create level up notification if applicable
          if (leveledUp) {
            await db`
              INSERT INTO notifications (user_id, type, title, message, data)
              VALUES (
                ${userId},
                'level_up',
                'Level Up!',
                ${`Congratulations! You've reached level ${newLevel}`},
                ${JSON.stringify({ new_level: newLevel, total_xp: updatedUser.xp })}
              )
            `;

            // Create activity record for level up
            await db`
              INSERT INTO activities (user_id, type, description, data)
              VALUES (
                ${userId},
                'level_up',
                ${`Reached level ${newLevel}`},
                ${JSON.stringify({ new_level: newLevel, total_xp: updatedUser.xp })}
              )
            `;
          }

          // Create activity record for event attendance
          await db`
            INSERT INTO activities (user_id, type, description, data)
            VALUES (
              ${userId},
              'event_attended',
              ${`Attended event: ${event.title}`},
              ${JSON.stringify({ 
                event_id: eventId, 
                event_title: event.title, 
                xp_earned: event.xp_reward 
              })}
            )
          `;

          results.push({
            user_id: userId,
            xp_earned: event.xp_reward,
            total_xp: updatedUser.xp,
            leveled_up: leveledUp,
            new_level: leveledUp ? newLevel : undefined
          });
        } else {
          // No XP reward, just mark attendance
          await db`
            INSERT INTO activities (user_id, type, description, data)
            VALUES (
              ${userId},
              'event_attended',
              ${`Attended event: ${event.title}`},
              ${JSON.stringify({ event_id: eventId, event_title: event.title })}
            )
          `;

          results.push({
            user_id: userId,
            xp_earned: 0
          });
        }
      }

      return NextResponse.json(
        {
          success: true,
          data: {
            message: `Successfully marked attendance for ${newAttendeeIds.length} users`,
            results,
            already_attended: alreadyAttendedIds
          },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Mark attendance error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to mark attendance'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}

// GET /api/events/[id]/attendance - Get attendance list (organizers and admins only)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const eventId = params.id;

      // Get event details and check permissions
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

      // Check permissions
      const canViewAttendance = 
        req.user!.role === 'admin' ||
        (req.user!.role === 'domain_lead' && req.user!.domain === event.domain) ||
        req.user!.id === event.organizer_id;

      if (!canViewAttendance) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Only event organizers, domain leads, and admins can view attendance'
            },
            timestamp: new Date().toISOString()
          },
          { status: 403 }
        );
      }

      // Get attendance data
      const attendanceResult = await db`
        SELECT 
          u.id,
          u.username,
          u.avatar_url,
          u.domain,
          er.status,
          er.registered_at
        FROM event_registrations er
        JOIN users u ON er.user_id = u.id
        WHERE er.event_id = ${eventId}
        ORDER BY er.status, er.registered_at ASC
      `;

      const attendance = {
        registered: attendanceResult.rows.filter(row => row.status === 'registered'),
        attended: attendanceResult.rows.filter(row => row.status === 'attended'),
        cancelled: attendanceResult.rows.filter(row => row.status === 'cancelled')
      };

      return NextResponse.json(
        {
          success: true,
          data: {
            event: {
              id: event.id,
              title: event.title,
              start_date: event.start_date,
              end_date: event.end_date,
              max_participants: event.max_participants,
              current_participants: event.current_participants,
              xp_reward: event.xp_reward
            },
            attendance,
            summary: {
              total_registered: attendance.registered.length,
              total_attended: attendance.attended.length,
              total_cancelled: attendance.cancelled.length,
              attendance_rate: attendance.registered.length > 0 
                ? Math.round((attendance.attended.length / (attendance.registered.length + attendance.attended.length)) * 100)
                : 0
            }
          },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Get attendance error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to get attendance data'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}