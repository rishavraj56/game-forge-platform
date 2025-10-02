import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/admin/analytics - Get comprehensive platform analytics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '30d'; // 7d, 30d, 90d, 1y
    const domain = searchParams.get('domain');

    // Calculate date range based on timeframe
    let dateFilter = '';
    switch (timeframe) {
      case '7d':
        dateFilter = "AND created_at >= NOW() - INTERVAL '7 days'";
        break;
      case '30d':
        dateFilter = "AND created_at >= NOW() - INTERVAL '30 days'";
        break;
      case '90d':
        dateFilter = "AND created_at >= NOW() - INTERVAL '90 days'";
        break;
      case '1y':
        dateFilter = "AND created_at >= NOW() - INTERVAL '1 year'";
        break;
      default:
        dateFilter = "AND created_at >= NOW() - INTERVAL '30 days'";
    }

    // Domain filter
    const domainFilter = domain ? `AND domain = '${domain}'` : '';

    const [
      userGrowth,
      contentMetrics,
      engagementMetrics,
      gamificationMetrics,
      domainBreakdown,
      topUsers,
      recentActivity
    ] = await Promise.all([
      // User growth over time
      db.query(`
        SELECT 
          DATE_TRUNC('day', created_at) as date,
          COUNT(*) as new_users,
          SUM(COUNT(*)) OVER (ORDER BY DATE_TRUNC('day', created_at)) as total_users
        FROM users 
        WHERE 1=1 ${dateFilter.replace('created_at', 'users.created_at')} ${domainFilter}
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY date
      `),

      // Content creation metrics
      db.query(`
        SELECT 
          (SELECT COUNT(*) FROM posts WHERE is_deleted = false ${dateFilter}) as posts_created,
          (SELECT COUNT(*) FROM comments WHERE is_deleted = false ${dateFilter}) as comments_created,
          (SELECT COUNT(*) FROM learning_modules WHERE is_published = true ${dateFilter}) as modules_created,
          (SELECT COUNT(*) FROM events WHERE is_active = true ${dateFilter}) as events_created
      `),

      // Engagement metrics
      db.query(`
        SELECT 
          (SELECT COUNT(*) FROM user_quest_progress WHERE completed = true ${dateFilter}) as quests_completed,
          (SELECT COUNT(*) FROM user_badges ${dateFilter.replace('created_at', 'earned_at')}) as badges_earned,
          (SELECT COUNT(*) FROM user_module_progress WHERE completed = true ${dateFilter.replace('created_at', 'completed_at')}) as modules_completed,
          (SELECT COUNT(*) FROM event_registrations ${dateFilter.replace('created_at', 'registered_at')}) as event_registrations,
          (SELECT COUNT(*) FROM post_reactions ${dateFilter}) as reactions_given
      `),

      // Gamification metrics
      db.query(`
        SELECT 
          AVG(xp) as avg_xp,
          MAX(xp) as max_xp,
          COUNT(CASE WHEN xp > 1000 THEN 1 END) as high_xp_users,
          COUNT(CASE WHEN level >= 5 THEN 1 END) as high_level_users
        FROM users 
        WHERE is_active = true ${domainFilter}
      `),

      // Domain breakdown
      db.query(`
        SELECT 
          domain,
          COUNT(*) as user_count,
          AVG(xp) as avg_xp,
          COUNT(CASE WHEN role = 'domain_lead' THEN 1 END) as domain_leads,
          (SELECT COUNT(*) FROM posts p JOIN users u ON p.author_id = u.id WHERE u.domain = users.domain AND p.is_deleted = false ${dateFilter.replace('created_at', 'p.created_at')}) as posts_count,
          (SELECT COUNT(*) FROM events e WHERE e.domain = users.domain AND e.is_active = true ${dateFilter.replace('created_at', 'e.created_at')}) as events_count
        FROM users 
        WHERE is_active = true
        GROUP BY domain
        ORDER BY user_count DESC
      `),

      // Top users by XP
      db.query(`
        SELECT 
          id, username, domain, xp, level, avatar_url,
          (SELECT COUNT(*) FROM posts WHERE author_id = users.id AND is_deleted = false) as post_count,
          (SELECT COUNT(*) FROM user_quest_progress WHERE user_id = users.id AND completed = true) as completed_quests
        FROM users 
        WHERE is_active = true ${domainFilter}
        ORDER BY xp DESC 
        LIMIT 10
      `),

      // Recent platform activity
      db.query(`
        SELECT 
          type,
          COUNT(*) as count,
          DATE_TRUNC('day', created_at) as date
        FROM activities 
        WHERE created_at >= NOW() - INTERVAL '7 days'
        GROUP BY type, DATE_TRUNC('day', created_at)
        ORDER BY date DESC, count DESC
      `)
    ]);

    // Calculate growth rates
    const calculateGrowthRate = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    // Get comparison data for growth rates
    const previousPeriodFilter = timeframe === '7d' 
      ? "AND created_at >= NOW() - INTERVAL '14 days' AND created_at < NOW() - INTERVAL '7 days'"
      : timeframe === '30d'
      ? "AND created_at >= NOW() - INTERVAL '60 days' AND created_at < NOW() - INTERVAL '30 days'"
      : "AND created_at >= NOW() - INTERVAL '180 days' AND created_at < NOW() - INTERVAL '90 days'";

    const previousMetrics = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE 1=1 ${previousPeriodFilter} ${domainFilter}) as prev_users,
        (SELECT COUNT(*) FROM posts WHERE is_deleted = false ${previousPeriodFilter}) as prev_posts,
        (SELECT COUNT(*) FROM user_quest_progress WHERE completed = true ${previousPeriodFilter}) as prev_quests
    `);

    const prev = previousMetrics.rows[0];
    const current = {
      users: userGrowth.rows.length > 0 ? userGrowth.rows[userGrowth.rows.length - 1].new_users : 0,
      posts: contentMetrics.rows[0].posts_created,
      quests: engagementMetrics.rows[0].quests_completed
    };

    const analytics = {
      overview: {
        userGrowth: userGrowth.rows,
        growthRates: {
          users: calculateGrowthRate(current.users, prev.prev_users),
          posts: calculateGrowthRate(current.posts, prev.prev_posts),
          quests: calculateGrowthRate(current.quests, prev.prev_quests)
        }
      },
      content: contentMetrics.rows[0],
      engagement: engagementMetrics.rows[0],
      gamification: gamificationMetrics.rows[0],
      domains: domainBreakdown.rows,
      topUsers: topUsers.rows,
      recentActivity: recentActivity.rows,
      timeframe,
      generatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin analytics error:', error);
    return NextResponse.json(
      { 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to fetch analytics data' 
        } 
      },
      { status: 500 }
    );
  }
}