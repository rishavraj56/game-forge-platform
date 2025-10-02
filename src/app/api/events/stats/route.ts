import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '../../../../lib/auth-middleware';
import { db } from '../../../../lib/db';
import { Domain } from '../../../../lib/types';

// GET /api/events/stats - Get event statistics
export async function GET(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const domain = searchParams.get('domain') as Domain | null;
      const organizer_id = searchParams.get('organizer_id');
      const timeframe = searchParams.get('timeframe') || '30d'; // 7d, 30d, 90d, 1y, all

      // Build time condition
      let timeCondition = '';
      switch (timeframe) {
        case '7d':
          timeCondition = "AND e.created_at >= NOW() - INTERVAL '7 days'";
          break;
        case '30d':
          timeCondition = "AND e.created_at >= NOW() - INTERVAL '30 days'";
          break;
        case '90d':
          timeCondition = "AND e.created_at >= NOW() - INTERVAL '90 days'";
          break;
        case '1y':
          timeCondition = "AND e.created_at >= NOW() - INTERVAL '1 year'";
          break;
        case 'all':
        default:
          timeCondition = '';
          break;
      }

      // Build domain condition
      let domainCondition = '';
      let domainParam = null;
      if (domain) {
        domainCondition = 'AND e.domain = $1';
        domainParam = domain;
      }

      // Build organizer condition
      let organizerCondition = '';
      let organizerParam = null;
      if (organizer_id) {
        organizerCondition = domainParam ? 'AND e.organizer_id = $2' : 'AND e.organizer_id = $1';
        organizerParam = organizer_id;
      }

      const params = [domainParam, organizerParam].filter(p => p !== null);

      // Get overall event statistics
      const overallStatsResult = await db.query(`
        SELECT 
          COUNT(*) as total_events,
          COUNT(CASE WHEN e.start_date > NOW() THEN 1 END) as upcoming_events,
          COUNT(CASE WHEN e.start_date <= NOW() AND e.end_date >= NOW() THEN 1 END) as ongoing_events,
          COUNT(CASE WHEN e.end_date < NOW() THEN 1 END) as past_events,
          AVG(e.current_participants) as avg_participants,
          SUM(e.current_participants) as total_participants,
          AVG(e.xp_reward) as avg_xp_reward,
          SUM(e.xp_reward * 
            (SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = e.id AND er.status = 'attended')
          ) as total_xp_awarded
        FROM events e
        WHERE e.is_active = true ${timeCondition} ${domainCondition} ${organizerCondition}
      `, params);

      const overallStats = overallStatsResult.rows[0];

      // Get event type breakdown
      const eventTypeStatsResult = await db.query(`
        SELECT 
          e.event_type,
          COUNT(*) as count,
          AVG(e.current_participants) as avg_participants,
          SUM(e.current_participants) as total_participants
        FROM events e
        WHERE e.is_active = true ${timeCondition} ${domainCondition} ${organizerCondition}
        GROUP BY e.event_type
        ORDER BY count DESC
      `, params);

      // Get domain breakdown (if not filtering by specific domain)
      let domainStatsResult = { rows: [] };
      if (!domain) {
        domainStatsResult = await db.query(`
          SELECT 
            e.domain,
            COUNT(*) as count,
            AVG(e.current_participants) as avg_participants,
            SUM(e.current_participants) as total_participants
          FROM events e
          WHERE e.is_active = true AND e.domain IS NOT NULL ${timeCondition} ${organizerCondition}
          GROUP BY e.domain
          ORDER BY count DESC
        `, organizerParam ? [organizerParam] : []);
      }

      // Get monthly event creation trend
      const monthlyTrendResult = await db.query(`
        SELECT 
          DATE_TRUNC('month', e.created_at) as month,
          COUNT(*) as events_created,
          SUM(e.current_participants) as total_participants
        FROM events e
        WHERE e.is_active = true ${timeCondition} ${domainCondition} ${organizerCondition}
        GROUP BY DATE_TRUNC('month', e.created_at)
        ORDER BY month DESC
        LIMIT 12
      `, params);

      // Get top organizers (if not filtering by specific organizer)
      let topOrganizersResult = { rows: [] };
      if (!organizer_id) {
        topOrganizersResult = await db.query(`
          SELECT 
            u.id,
            u.username,
            u.avatar_url,
            u.domain,
            COUNT(e.id) as events_organized,
            SUM(e.current_participants) as total_participants,
            AVG(e.current_participants) as avg_participants_per_event
          FROM events e
          JOIN users u ON e.organizer_id = u.id
          WHERE e.is_active = true ${timeCondition} ${domainCondition}
          GROUP BY u.id, u.username, u.avatar_url, u.domain
          ORDER BY events_organized DESC, total_participants DESC
          LIMIT 10
        `, domainParam ? [domainParam] : []);
      }

      // Get attendance statistics
      const attendanceStatsResult = await db.query(`
        SELECT 
          COUNT(CASE WHEN er.status = 'registered' THEN 1 END) as total_registered,
          COUNT(CASE WHEN er.status = 'attended' THEN 1 END) as total_attended,
          COUNT(CASE WHEN er.status = 'cancelled' THEN 1 END) as total_cancelled,
          CASE 
            WHEN COUNT(CASE WHEN er.status IN ('registered', 'attended') THEN 1 END) > 0 
            THEN ROUND(
              COUNT(CASE WHEN er.status = 'attended' THEN 1 END)::numeric / 
              COUNT(CASE WHEN er.status IN ('registered', 'attended') THEN 1 END)::numeric * 100, 
              2
            )
            ELSE 0 
          END as attendance_rate
        FROM event_registrations er
        JOIN events e ON er.event_id = e.id
        WHERE e.is_active = true ${timeCondition} ${domainCondition} ${organizerCondition}
      `, params);

      const attendanceStats = attendanceStatsResult.rows[0];

      // Get upcoming events summary
      const upcomingEventsResult = await db.query(`
        SELECT 
          e.id,
          e.title,
          e.start_date,
          e.current_participants,
          e.max_participants,
          e.event_type,
          e.domain
        FROM events e
        WHERE e.is_active = true 
          AND e.start_date > NOW() 
          ${domainCondition} ${organizerCondition}
        ORDER BY e.start_date ASC
        LIMIT 5
      `, params);

      return NextResponse.json(
        {
          success: true,
          data: {
            timeframe,
            domain,
            organizer_id,
            overall_stats: {
              total_events: parseInt(overallStats.total_events),
              upcoming_events: parseInt(overallStats.upcoming_events),
              ongoing_events: parseInt(overallStats.ongoing_events),
              past_events: parseInt(overallStats.past_events),
              avg_participants: parseFloat(overallStats.avg_participants) || 0,
              total_participants: parseInt(overallStats.total_participants) || 0,
              avg_xp_reward: parseFloat(overallStats.avg_xp_reward) || 0,
              total_xp_awarded: parseInt(overallStats.total_xp_awarded) || 0
            },
            event_types: eventTypeStatsResult.rows.map(row => ({
              event_type: row.event_type,
              count: parseInt(row.count),
              avg_participants: parseFloat(row.avg_participants) || 0,
              total_participants: parseInt(row.total_participants) || 0
            })),
            domains: domainStatsResult.rows.map((row: any) => ({
              domain: row.domain,
              count: parseInt(row.count),
              avg_participants: parseFloat(row.avg_participants) || 0,
              total_participants: parseInt(row.total_participants) || 0
            })),
            monthly_trend: monthlyTrendResult.rows.map(row => ({
              month: row.month,
              events_created: parseInt(row.events_created),
              total_participants: parseInt(row.total_participants) || 0
            })),
            top_organizers: topOrganizersResult.rows.map((row: any) => ({
              id: row.id,
              username: row.username,
              avatar_url: row.avatar_url,
              domain: row.domain,
              events_organized: parseInt(row.events_organized),
              total_participants: parseInt(row.total_participants) || 0,
              avg_participants_per_event: parseFloat(row.avg_participants_per_event) || 0
            })),
            attendance_stats: {
              total_registered: parseInt(attendanceStats.total_registered) || 0,
              total_attended: parseInt(attendanceStats.total_attended) || 0,
              total_cancelled: parseInt(attendanceStats.total_cancelled) || 0,
              attendance_rate: parseFloat(attendanceStats.attendance_rate) || 0
            },
            upcoming_events: upcomingEventsResult.rows
          },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Get event statistics error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to get event statistics'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}