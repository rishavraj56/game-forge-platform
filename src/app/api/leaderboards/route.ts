import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '../../../lib/auth-middleware';
import { LeaderboardService } from '../../../lib/leaderboard-service';
import { Domain } from '../../../lib/types';
import { withAPITiming, performanceMonitor } from '../../../lib/performance-monitor';
import { cacheService } from '../../../lib/cache-service';

// GET /api/leaderboards - Get leaderboard data with performance monitoring
export async function GET(request: NextRequest) {
  return withAPITiming(async (req: NextRequest) => {
    return withAuth(req, async (authReq: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const type = searchParams.get('type') || 'all-time'; // 'all-time' or 'weekly'
      const domain = searchParams.get('domain') as Domain | null;
      const limit = parseInt(searchParams.get('limit') || '10');
      const offset = parseInt(searchParams.get('offset') || '0');

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

      if (limit < 1 || limit > 100) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_LIMIT',
              message: 'Limit must be between 1 and 100'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      // Get leaderboard data using the service with performance tracking
      const { leaderboard, total } = await performanceMonitor.timeFunction(
        'leaderboard-fetch',
        () => LeaderboardService.getLeaderboard(
          type as 'all-time' | 'weekly',
          domain || undefined,
          limit,
          offset
        ),
        { type, domain, limit, offset }
      );

      // Get current user's rank if they're not in the top results
      const currentUserId = authReq.user!.id;
      let userRank = null;
      let userEntry = null;

      const userInResults = leaderboard.find(entry => entry.id === currentUserId);
      if (!userInResults) {
        const userRankData = await performanceMonitor.timeFunction(
          'user-rank-fetch',
          () => LeaderboardService.getUserRank(
            currentUserId,
            type as 'all-time' | 'weekly',
            domain || undefined
          ),
          { userId: currentUserId, type, domain }
        );

        if (userRankData) {
          userRank = userRankData.rank;
          userEntry = userRankData.entry;
        }
      }

      // Check if this was a cache hit
      const cacheKey = `leaderboard:${type}:${domain || 'all'}:${limit}:${offset}`;
      const wasCacheHit = cacheService.has(cacheKey);

      const response = NextResponse.json(
        {
          success: true,
          data: {
            leaderboard,
            pagination: {
              limit,
              offset,
              total,
              hasNext: offset + limit < total,
              hasPrev: offset > 0
            },
            type,
            domain,
            userRank,
            userEntry
          },
          timestamp: new Date().toISOString(),
          cached: wasCacheHit
        },
        { status: 200 }
      );

      // Add cache headers
      if (wasCacheHit) {
        response.headers.set('X-Cache', 'HIT');
      } else {
        response.headers.set('X-Cache', 'MISS');
      }

      return response;

    } catch (error) {
      console.error('Get leaderboard error:', error);

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch leaderboard data'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
    });
  })(request);
}