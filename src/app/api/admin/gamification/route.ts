import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { QuestType, Domain } from '@/lib/types';

// GET /api/admin/gamification - Get gamification management data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const [quests, badges, titles, questStats] = await Promise.all([
      // Get all quests with completion stats
      db.query(`
        SELECT 
          q.*,
          COUNT(uqp.id) as total_attempts,
          COUNT(CASE WHEN uqp.completed = true THEN 1 END) as completions,
          ROUND(
            CASE 
              WHEN COUNT(uqp.id) > 0 
              THEN (COUNT(CASE WHEN uqp.completed = true THEN 1 END)::float / COUNT(uqp.id)) * 100 
              ELSE 0 
            END, 2
          ) as completion_rate
        FROM quests q
        LEFT JOIN user_quest_progress uqp ON q.id = uqp.quest_id
        GROUP BY q.id
        ORDER BY q.created_at DESC
      `),

      // Get all badges with earning stats
      db.query(`
        SELECT 
          b.*,
          COUNT(ub.user_id) as times_earned,
          COUNT(DISTINCT ub.user_id) as unique_earners
        FROM badges b
        LEFT JOIN user_badges ub ON b.id = ub.badge_id
        GROUP BY b.id
        ORDER BY b.created_at DESC
      `),

      // Get all titles with usage stats
      db.query(`
        SELECT 
          t.*,
          COUNT(ut.user_id) as times_earned,
          COUNT(CASE WHEN ut.is_active = true THEN 1 END) as active_users
        FROM titles t
        LEFT JOIN user_titles ut ON t.id = ut.title_id
        GROUP BY t.id
        ORDER BY t.created_at DESC
      `),

      // Get quest completion statistics
      db.query(`
        SELECT 
          type,
          domain,
          COUNT(*) as quest_count,
          AVG(xp_reward) as avg_xp_reward,
          SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active_count
        FROM quests
        GROUP BY type, domain
        ORDER BY type, domain
      `)
    ]);

    return NextResponse.json({
      success: true,
      data: {
        quests: quests.rows,
        badges: badges.rows,
        titles: titles.rows,
        questStats: questStats.rows
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin gamification fetch error:', error);
    return NextResponse.json(
      { 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to fetch gamification data' 
        } 
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/gamification - Create new quest, badge, or title
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { itemType, ...itemData } = body;

    if (!['quest', 'badge', 'title'].includes(itemType)) {
      return NextResponse.json(
        { error: { code: 'INVALID_TYPE', message: 'Invalid item type' } },
        { status: 400 }
      );
    }

    let result;

    if (itemType === 'quest') {
      const { title, description, type, xpReward, domain, requirements } = itemData;

      // Validate quest data
      if (!title || !description || !type || !xpReward || !requirements) {
        return NextResponse.json(
          { error: { code: 'MISSING_FIELDS', message: 'Missing required quest fields' } },
          { status: 400 }
        );
      }

      const validTypes: QuestType[] = ['daily', 'weekly'];
      if (!validTypes.includes(type)) {
        return NextResponse.json(
          { error: { code: 'INVALID_QUEST_TYPE', message: 'Invalid quest type' } },
          { status: 400 }
        );
      }

      result = await db.query(`
        INSERT INTO quests (title, description, type, xp_reward, domain, requirements)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [title, description, type, xpReward, domain || null, JSON.stringify(requirements)]);

    } else if (itemType === 'badge') {
      const { name, description, iconUrl, xpRequirement, domain } = itemData;

      if (!name) {
        return NextResponse.json(
          { error: { code: 'MISSING_NAME', message: 'Badge name is required' } },
          { status: 400 }
        );
      }

      result = await db.query(`
        INSERT INTO badges (name, description, icon_url, xp_requirement, domain)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [name, description || null, iconUrl || null, xpRequirement || null, domain || null]);

    } else if (itemType === 'title') {
      const { name, description, xpRequirement, domain } = itemData;

      if (!name) {
        return NextResponse.json(
          { error: { code: 'MISSING_NAME', message: 'Title name is required' } },
          { status: 400 }
        );
      }

      result = await db.query(`
        INSERT INTO titles (name, description, xp_requirement, domain)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [name, description || null, xpRequirement || null, domain || null]);
    }

    // Log the admin action
    await db.query(`
      INSERT INTO moderation_actions (moderator_id, content_type, content_id, action, reason, notes)
      VALUES ($1, $2, $3, 'create', 'Admin gamification creation', $4)
    `, [
      session.user.id,
      itemType,
      result!.rows[0].id,
      JSON.stringify({ itemType, createdBy: session.user.username })
    ]);

    return NextResponse.json({
      success: true,
      data: result!.rows[0],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin gamification creation error:', error);
    return NextResponse.json(
      { 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to create gamification item' 
        } 
      },
      { status: 500 }
    );
  }
}