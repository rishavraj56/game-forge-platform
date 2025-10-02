import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '../../../../../../lib/auth-middleware';
import { db } from '../../../../../../lib/db';

interface RouteParams {
  params: {
    id: string;
  };
}

// POST /api/gamification/quests/[id]/complete - Complete a quest
export async function POST(request: NextRequest, { params }: RouteParams) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { id: questId } = params;
      const userId = req.user!.id;

      // Start transaction
      await db`BEGIN`;

      try {
        // Check if quest exists and is active
        const questResult = await db`
          SELECT id, title, type, xp_reward, domain, requirements, is_active
          FROM quests 
          WHERE id = ${questId} AND is_active = true
        `;

        if (questResult.rows.length === 0) {
          await db`ROLLBACK`;
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'QUEST_NOT_FOUND',
                message: 'Quest not found or inactive'
              },
              timestamp: new Date().toISOString()
            },
            { status: 404 }
          );
        }

        const quest = questResult.rows[0];

        // Check if user has already completed this quest
        const progressResult = await db`
          SELECT completed, completed_at
          FROM user_quest_progress 
          WHERE user_id = ${userId} AND quest_id = ${questId}
        `;

        if (progressResult.rows.length > 0 && progressResult.rows[0].completed) {
          await db`ROLLBACK`;
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'QUEST_ALREADY_COMPLETED',
                message: 'Quest has already been completed'
              },
              timestamp: new Date().toISOString()
            },
            { status: 409 }
          );
        }

        // For daily quests, check if user has already completed a daily quest today
        if (quest.type === 'daily') {
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          
          const todayEnd = new Date();
          todayEnd.setHours(23, 59, 59, 999);

          const dailyCompletedToday = await db`
            SELECT COUNT(*) as count
            FROM user_quest_progress uqp
            JOIN quests q ON uqp.quest_id = q.id
            WHERE uqp.user_id = ${userId} 
              AND q.type = 'daily'
              AND uqp.completed = true
              AND uqp.completed_at >= ${todayStart.toISOString()}
              AND uqp.completed_at <= ${todayEnd.toISOString()}
          `;

          if (parseInt(dailyCompletedToday.rows[0].count) > 0) {
            await db`ROLLBACK`;
            return NextResponse.json(
              {
                success: false,
                error: {
                  code: 'DAILY_QUEST_LIMIT_REACHED',
                  message: 'You have already completed a daily quest today'
                },
                timestamp: new Date().toISOString()
              },
              { status: 409 }
            );
          }
        }

        // For weekly quests, check if user has already completed a weekly quest this week
        if (quest.type === 'weekly') {
          const now = new Date();
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
          weekStart.setHours(0, 0, 0, 0);
          
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6); // End of week (Saturday)
          weekEnd.setHours(23, 59, 59, 999);

          const weeklyCompletedThisWeek = await db`
            SELECT COUNT(*) as count
            FROM user_quest_progress uqp
            JOIN quests q ON uqp.quest_id = q.id
            WHERE uqp.user_id = ${userId} 
              AND q.type = 'weekly'
              AND uqp.completed = true
              AND uqp.completed_at >= ${weekStart.toISOString()}
              AND uqp.completed_at <= ${weekEnd.toISOString()}
          `;

          if (parseInt(weeklyCompletedThisWeek.rows[0].count) > 0) {
            await db`ROLLBACK`;
            return NextResponse.json(
              {
                success: false,
                error: {
                  code: 'WEEKLY_QUEST_LIMIT_REACHED',
                  message: 'You have already completed a weekly quest this week'
                },
                timestamp: new Date().toISOString()
              },
              { status: 409 }
            );
          }
        }

        const completedAt = new Date();

        // Update or insert quest progress
        if (progressResult.rows.length > 0) {
          await db`
            UPDATE user_quest_progress 
            SET completed = true, progress = 100, completed_at = ${completedAt.toISOString()}, updated_at = ${completedAt.toISOString()}
            WHERE user_id = ${userId} AND quest_id = ${questId}
          `;
        } else {
          await db`
            INSERT INTO user_quest_progress (user_id, quest_id, completed, progress, completed_at, created_at, updated_at)
            VALUES (${userId}, ${questId}, true, 100, ${completedAt.toISOString()}, ${completedAt.toISOString()}, ${completedAt.toISOString()})
          `;
        }

        // Award XP to user
        const userUpdateResult = await db`
          UPDATE users 
          SET xp = xp + ${quest.xp_reward}, updated_at = ${completedAt.toISOString()}
          WHERE id = ${userId}
          RETURNING xp, level
        `;

        const newXp = userUpdateResult.rows[0].xp;
        const currentLevel = userUpdateResult.rows[0].level;

        // Calculate new level based on XP (simple formula: level = floor(xp / 1000) + 1)
        const newLevel = Math.floor(newXp / 1000) + 1;
        let leveledUp = false;

        // Update level if it changed
        if (newLevel > currentLevel) {
          await db`
            UPDATE users 
            SET level = ${newLevel}, updated_at = ${completedAt.toISOString()}
            WHERE id = ${userId}
          `;
          leveledUp = true;
        }

        // Create activity record
        await db`
          INSERT INTO activities (user_id, type, description, data, created_at)
          VALUES (
            ${userId}, 
            'quest_completed', 
            ${`Completed quest: ${quest.title}`},
            ${JSON.stringify({ 
              quest_id: questId, 
              quest_title: quest.title, 
              xp_earned: quest.xp_reward,
              new_xp: newXp,
              leveled_up: leveledUp,
              new_level: leveledUp ? newLevel : currentLevel
            })},
            ${completedAt.toISOString()}
          )
        `;

        // If leveled up, create level up activity
        if (leveledUp) {
          await db`
            INSERT INTO activities (user_id, type, description, data, created_at)
            VALUES (
              ${userId}, 
              'level_up', 
              ${`Reached level ${newLevel}!`},
              ${JSON.stringify({ 
                old_level: currentLevel, 
                new_level: newLevel,
                total_xp: newXp
              })},
              ${completedAt.toISOString()}
            )
          `;
        }

        await db`COMMIT`;

        return NextResponse.json(
          {
            success: true,
            data: { 
              quest: quest,
              xp_earned: quest.xp_reward,
              new_xp: newXp,
              leveled_up: leveledUp,
              new_level: leveledUp ? newLevel : currentLevel,
              completed_at: completedAt
            },
            timestamp: new Date().toISOString()
          },
          { status: 200 }
        );

      } catch (error) {
        await db`ROLLBACK`;
        throw error;
      }

    } catch (error) {
      console.error('Complete quest error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to complete quest'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}