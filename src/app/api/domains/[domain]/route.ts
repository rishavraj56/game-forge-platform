import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '../../../../lib/auth-middleware';
import { db } from '../../../../lib/db';
import { Domain } from '../../../../lib/types';

interface RouteParams {
  params: {
    domain: string;
  };
}

// GET /api/domains/[domain] - Get detailed domain information
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { domain } = params;
      const decodedDomain = decodeURIComponent(domain);

      // Validate domain
      const validDomains: Domain[] = [
        'Game Development',
        'Game Design', 
        'Game Art',
        'AI for Game Development',
        'Creative',
        'Corporate'
      ];

      if (!validDomains.includes(decodedDomain as Domain)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_DOMAIN',
              message: `Invalid domain. Must be one of: ${validDomains.join(', ')}`
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      // Get comprehensive domain statistics
      const statsResult = await db`
        SELECT 
          COUNT(DISTINCT CASE WHEN u.is_active = true THEN u.id END) as total_members,
          COUNT(DISTINCT CASE WHEN u.role = 'member' AND u.is_active = true THEN u.id END) as members,
          COUNT(DISTINCT CASE WHEN u.role = 'domain_lead' AND u.is_active = true THEN u.id END) as domain_leads,
          COUNT(DISTINCT CASE WHEN c.is_active = true THEN c.id END) as channels,
          COUNT(DISTINCT CASE WHEN lm.is_published = true THEN lm.id END) as learning_modules,
          COUNT(DISTINCT CASE WHEN e.is_active = true AND e.start_date > NOW() THEN e.id END) as upcoming_events,
          COUNT(DISTINCT CASE WHEN e.is_active = true AND e.end_date < NOW() THEN e.id END) as past_events,
          AVG(CASE WHEN u.is_active = true THEN u.xp END) as avg_xp,
          MAX(CASE WHEN u.is_active = true THEN u.xp END) as max_xp,
          MIN(CASE WHEN u.is_active = true THEN u.xp END) as min_xp,
          COUNT(DISTINCT p.id) as total_posts,
          COUNT(DISTINCT CASE WHEN uqp.completed = true THEN uqp.id END) as completed_quests
        FROM (SELECT ${decodedDomain} as domain_name) d
        LEFT JOIN users u ON u.domain = d.domain_name
        LEFT JOIN channels c ON c.domain = d.domain_name
        LEFT JOIN learning_modules lm ON lm.domain = d.domain_name
        LEFT JOIN events e ON e.domain = d.domain_name
        LEFT JOIN posts p ON p.author_id = u.id AND p.is_deleted = false
        LEFT JOIN user_quest_progress uqp ON uqp.user_id = u.id
      `;

      const stats = statsResult.rows[0];

      // Get domain leads with their information
      const leadsResult = await db`
        SELECT id, username, avatar_url, xp, level, bio, created_at
        FROM users 
        WHERE domain = ${decodedDomain} AND role = 'domain_lead' AND is_active = true
        ORDER BY xp DESC
      `;

      // Get top members by XP
      const topMembersResult = await db`
        SELECT id, username, avatar_url, xp, level, 
               COUNT(DISTINCT ub.badge_id) as badge_count
        FROM users u
        LEFT JOIN user_badges ub ON u.id = ub.user_id
        WHERE u.domain = ${decodedDomain} AND u.is_active = true
        GROUP BY u.id, u.username, u.avatar_url, u.xp, u.level
        ORDER BY u.xp DESC
        LIMIT 10
      `;

      // Get recent activities in the domain
      const recentActivitiesResult = await db`
        SELECT a.type, a.description, a.created_at, a.data,
               u.username, u.avatar_url
        FROM activities a
        JOIN users u ON a.user_id = u.id
        WHERE u.domain = ${decodedDomain} AND u.is_active = true
        ORDER BY a.created_at DESC
        LIMIT 20
      `;

      // Get domain channels
      const channelsResult = await db`
        SELECT id, name, type, description, member_count, created_at
        FROM channels 
        WHERE domain = ${decodedDomain} AND is_active = true
        ORDER BY type, member_count DESC
      `;

      // Get learning modules
      const modulesResult = await db`
        SELECT id, title, description, difficulty, xp_reward, estimated_duration
        FROM learning_modules 
        WHERE domain = ${decodedDomain} AND is_published = true
        ORDER BY difficulty, created_at DESC
        LIMIT 10
      `;

      // Get upcoming events
      const eventsResult = await db`
        SELECT id, title, description, event_type, start_date, end_date, 
               max_participants, current_participants
        FROM events 
        WHERE domain = ${decodedDomain} AND is_active = true AND start_date > NOW()
        ORDER BY start_date ASC
        LIMIT 5
      `;

      // Calculate growth metrics (last 30 days)
      const growthResult = await db`
        SELECT 
          COUNT(DISTINCT CASE WHEN u.created_at > NOW() - INTERVAL '30 days' THEN u.id END) as new_members_30d,
          COUNT(DISTINCT CASE WHEN p.created_at > NOW() - INTERVAL '30 days' THEN p.id END) as new_posts_30d,
          COUNT(DISTINCT CASE WHEN uqp.completed_at > NOW() - INTERVAL '30 days' THEN uqp.id END) as quests_completed_30d
        FROM users u
        LEFT JOIN posts p ON p.author_id = u.id AND p.is_deleted = false
        LEFT JOIN user_quest_progress uqp ON uqp.user_id = u.id AND uqp.completed = true
        WHERE u.domain = ${decodedDomain} AND u.is_active = true
      `;

      const growth = growthResult.rows[0];

      const domainData = {
        name: decodedDomain,
        stats: {
          total_members: parseInt(stats.total_members) || 0,
          members: parseInt(stats.members) || 0,
          domain_leads: parseInt(stats.domain_leads) || 0,
          channels: parseInt(stats.channels) || 0,
          learning_modules: parseInt(stats.learning_modules) || 0,
          upcoming_events: parseInt(stats.upcoming_events) || 0,
          past_events: parseInt(stats.past_events) || 0,
          total_posts: parseInt(stats.total_posts) || 0,
          completed_quests: parseInt(stats.completed_quests) || 0,
          avg_xp: Math.round(parseFloat(stats.avg_xp) || 0),
          max_xp: parseInt(stats.max_xp) || 0,
          min_xp: parseInt(stats.min_xp) || 0
        },
        growth: {
          new_members_30d: parseInt(growth.new_members_30d) || 0,
          new_posts_30d: parseInt(growth.new_posts_30d) || 0,
          quests_completed_30d: parseInt(growth.quests_completed_30d) || 0
        },
        leads: leadsResult.rows.map(lead => ({
          id: lead.id,
          username: lead.username,
          avatar_url: lead.avatar_url,
          xp: lead.xp,
          level: lead.level,
          bio: lead.bio,
          created_at: lead.created_at
        })),
        top_members: topMembersResult.rows.map(member => ({
          id: member.id,
          username: member.username,
          avatar_url: member.avatar_url,
          xp: member.xp,
          level: member.level,
          badge_count: parseInt(member.badge_count)
        })),
        recent_activities: recentActivitiesResult.rows.map(activity => ({
          type: activity.type,
          description: activity.description,
          created_at: activity.created_at,
          data: activity.data,
          user: {
            username: activity.username,
            avatar_url: activity.avatar_url
          }
        })),
        channels: channelsResult.rows.map(channel => ({
          id: channel.id,
          name: channel.name,
          type: channel.type,
          description: channel.description,
          member_count: channel.member_count,
          created_at: channel.created_at
        })),
        learning_modules: modulesResult.rows.map(module => ({
          id: module.id,
          title: module.title,
          description: module.description,
          difficulty: module.difficulty,
          xp_reward: module.xp_reward,
          estimated_duration: module.estimated_duration
        })),
        upcoming_events: eventsResult.rows.map(event => ({
          id: event.id,
          title: event.title,
          description: event.description,
          event_type: event.event_type,
          start_date: event.start_date,
          end_date: event.end_date,
          max_participants: event.max_participants,
          current_participants: event.current_participants
        }))
      };

      return NextResponse.json(
        {
          success: true,
          data: domainData,
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Get domain details error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch domain details'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}