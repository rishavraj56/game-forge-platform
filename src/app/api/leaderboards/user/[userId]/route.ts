import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '../../../../../lib/auth-middleware';
import { LeaderboardService } from '../../../../../lib/leaderboard-service';
import { Domain } from '../../../../../lib/types';

interface RouteParams {
  params: {
    userId: string;
  };
}

// GET /api/leaderboards/user/[userId] - Get user's leaderboard position and nearby rankings
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { userId } = params;
      const { searchParams } = new URL(req.url);
      const type = searchParams.get('type') || 'all-time';
      const domain = searchParams.get('domain') as Domain | null;
      const context = parseInt(searchParams.get('context') || '5'); // Number of users above/below

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

      if (context < 0 || context > 20) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_CONTEXT',
              message: 'Context must be between 0 and 20'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      // Get user's rank
      const userRankData = await LeaderboardService.getUserRank(
        userId,
        type as 'all-time' | 'weekly',
        domain
      );

      if (!userRankData) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'USER_NOT_FOUND',
              message: 'User not found in leaderboard'
            },
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        );
      }

      const { rank, entry } = userRankData;

      // Get context around user's position
      const startOffset = Math.max(0, rank - context - 1);
      const limit = (context * 2) + 1;

      const { leaderboard: contextLeaderboard } = await LeaderboardService.getLeaderboard(
        type as 'all-time' | 'weekly',
        domain,
        limit,
        startOffset
      );

      // Get top 3 for reference
      const { leaderboard: topThree } = await LeaderboardService.getLeaderboard(
        type as 'all-time' | 'weekly',
        domain,
        3,
        0
      );

      return NextResponse.json(
        {
          success: true,
          data: {
            user: entry,
            rank,
            context: contextLeaderboard,
            topThree,
            type,
            domain
          },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Get user leaderboard position error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch user leaderboard position'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}