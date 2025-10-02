import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '../../../../lib/auth-middleware';
import { LeaderboardService } from '../../../../lib/leaderboard-service';
import { Domain } from '../../../../lib/types';

// GET /api/leaderboards/widget - Get leaderboard data for dashboard widgets
export async function GET(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const type = searchParams.get('type') || 'all-time';
      const domain = searchParams.get('domain') as Domain | null;
      const limit = parseInt(searchParams.get('limit') || '5');
      const includeUser = searchParams.get('includeUser') === 'true';

      // Validate parameters
      if (!['all-time', 'weekly'].includes(type)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_TYPE',
              message: 'Type must be either "all-time" or "weekly"'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      if (limit < 1 || limit > 20) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_LIMIT',
              message: 'Limit must be between 1 and 20'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      // Get leaderboard data
      const { leaderboard } = await LeaderboardService.getLeaderboard(
        type as 'all-time' | 'weekly',
        domain || undefined,
        limit,
        0
      );

      let userRank = null;
      let userEntry = null;

      // Include current user's position if requested
      if (includeUser) {
        const userId = req.user!.id;
        const userRankData = await LeaderboardService.getUserRank(
          userId,
          type as 'all-time' | 'weekly',
          domain || undefined
        );

        if (userRankData) {
          userRank = userRankData.rank;
          userEntry = userRankData.entry;
        }
      }

      // Format response for widget consumption
      const widgetData = {
        title: type === 'weekly' ? 'Weekly Leaders' : 'Forge Masters',
        subtitle: domain ? `${domain} Domain` : 'All Domains',
        leaderboard: leaderboard.map((entry, index) => ({
          ...entry,
          position: index + 1,
          displayXp: type === 'weekly' ? entry.weekly_xp : entry.xp,
          xpLabel: type === 'weekly' ? 'Weekly XP' : 'Total XP'
        })),
        userPosition: userRank ? {
          rank: userRank,
          entry: userEntry,
          isInTop: userRank <= limit
        } : null,
        type,
        domain,
        lastUpdated: new Date().toISOString()
      };

      return NextResponse.json(
        {
          success: true,
          data: widgetData,
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Get leaderboard widget error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch leaderboard widget data'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}