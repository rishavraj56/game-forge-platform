import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withAdmin, AuthenticatedRequest } from '../../../../lib/auth-middleware';
import { 
  archiveWeeklyLeaderboard, 
  getWeeklyLeaderboardHistory,
  getAvailableWeeks,
  getUserWeeklyHistory,
  cleanupWeeklyArchive
} from '../../../../lib/leaderboard-reset';
import { Domain } from '../../../../lib/types';

// GET /api/leaderboards/weekly - Get weekly leaderboard data and history
export async function GET(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const action = searchParams.get('action') || 'current';
      const weekEnding = searchParams.get('weekEnding');
      const domain = searchParams.get('domain') as Domain | null;
      const limit = parseInt(searchParams.get('limit') || '10');
      const userId = searchParams.get('userId');

      switch (action) {
        case 'history':
          // Get historical weekly leaderboard data
          const weekEndingDate = weekEnding ? new Date(weekEnding) : undefined;
          const history = await getWeeklyLeaderboardHistory(weekEndingDate, domain || undefined, limit);
          
          return NextResponse.json(
            {
              success: true,
              data: {
                history,
                weekEnding: weekEndingDate,
                domain,
                limit
              },
              timestamp: new Date().toISOString()
            },
            { status: 200 }
          );

        case 'weeks':
          // Get available weeks for historical data
          const availableWeeks = await getAvailableWeeks();
          
          return NextResponse.json(
            {
              success: true,
              data: {
                availableWeeks,
                totalWeeks: availableWeeks.length
              },
              timestamp: new Date().toISOString()
            },
            { status: 200 }
          );

        case 'user-history':
          // Get user's weekly performance history
          if (!userId) {
            return NextResponse.json(
              {
                success: false,
                error: {
                  code: 'MISSING_USER_ID',
                  message: 'User ID is required for user history'
                },
                timestamp: new Date().toISOString()
              },
              { status: 400 }
            );
          }

          const weeks = parseInt(searchParams.get('weeks') || '12');
          const userHistory = await getUserWeeklyHistory(userId, weeks);
          
          return NextResponse.json(
            {
              success: true,
              data: {
                userHistory,
                userId,
                weeks
              },
              timestamp: new Date().toISOString()
            },
            { status: 200 }
          );

        default:
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INVALID_ACTION',
                message: 'Invalid action. Use: history, weeks, or user-history'
              },
              timestamp: new Date().toISOString()
            },
            { status: 400 }
          );
      }

    } catch (error) {
      console.error('Get weekly leaderboard data error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch weekly leaderboard data'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}

// POST /api/leaderboards/weekly - Archive current week and reset (admin only)
export async function POST(request: NextRequest) {
  return withAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      const { action } = body;

      switch (action) {
        case 'archive':
          // Archive current weekly leaderboard
          const archiveResult = await archiveWeeklyLeaderboard();
          
          return NextResponse.json(
            {
              success: archiveResult.success,
              data: archiveResult,
              timestamp: new Date().toISOString()
            },
            { status: archiveResult.success ? 200 : 500 }
          );

        case 'cleanup':
          // Clean up old weekly archive data
          const deletedCount = await cleanupWeeklyArchive();
          
          return NextResponse.json(
            {
              success: true,
              data: {
                message: `Cleaned up ${deletedCount} old weekly archive entries`,
                deletedCount
              },
              timestamp: new Date().toISOString()
            },
            { status: 200 }
          );

        default:
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INVALID_ACTION',
                message: 'Invalid action. Use: archive or cleanup'
              },
              timestamp: new Date().toISOString()
            },
            { status: 400 }
          );
      }

    } catch (error) {
      console.error('Weekly leaderboard management error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to manage weekly leaderboard'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}