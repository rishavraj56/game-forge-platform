import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/admin - Admin dashboard overview
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    // Get platform overview statistics
    const [
      userStats,
      contentStats,
      gamificationStats,
      recentActivity
    ] = await Promise.all([
      // User statistics
      db.query(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as new_users_week,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_users_month,
          COUNT(CASE WHEN role = 'domain_lead' THEN 1 END) as domain_leads,
          COUNT(CASE WHEN is_active = true THEN 1 END) as active_users
        FROM users
      `),
      
      // Content statistics
      db.query(`
        SELECT 
          (SELECT COUNT(*) FROM posts WHERE is_deleted = false) as total_posts,
          (SELECT COUNT(*) FROM posts WHERE is_deleted = false AND created_at >= NOW() - INTERVAL '7 days') as posts_week,
          (SELECT COUNT(*) FROM comments WHERE is_deleted = false) as total_comments,
          (SELECT COUNT(*) FROM learning_modules WHERE is_published = true) as published_modules,
          (SELECT COUNT(*) FROM events WHERE is_active = true) as active_events
      `),
      
      // Gamification statistics
      db.query(`
        SELECT 
          (SELECT COUNT(*) FROM quests WHERE is_active = true) as active_quests,
          (SELECT COUNT(*) FROM user_quest_progress WHERE completed = true) as completed_quests,
          (SELECT COUNT(*) FROM user_badges) as badges_earned,
          (SELECT AVG(xp) FROM users WHERE is_active = true) as avg_user_xp
      `),
      
      // Recent activity (last 10 activities)
      db.query(`
        SELECT 
          a.id,
          a.type,
          a.description,
          a.created_at,
          u.username,
          u.avatar_url
        FROM activities a
        JOIN users u ON a.user_id = u.id
        ORDER BY a.created_at DESC
        LIMIT 10
      `)
    ]);

    const dashboardData = {
      users: userStats.rows[0],
      content: contentStats.rows[0],
      gamification: gamificationStats.rows[0],
      recentActivity: recentActivity.rows
    };

    return NextResponse.json({
      success: true,
      data: dashboardData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin dashboard error:', error);
    return NextResponse.json(
      { 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to fetch admin dashboard data' 
        } 
      },
      { status: 500 }
    );
  }
}