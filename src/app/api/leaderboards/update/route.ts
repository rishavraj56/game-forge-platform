import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withAdmin, AuthenticatedRequest } from '../../../../lib/auth-middleware';
import { LeaderboardService } from '../../../../lib/leaderboard-service';
import { Domain } from '../../../../lib/types';

// POST /api/leaderboards/update - Trigger leaderboard cache refresh (admin only)
export async function POST(request: NextRequest) {
  return withAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      const { type, domain, userId } = body;

      // Validate type if provided
      if (type && !['all-time', 'weekly'].includes(type)) {
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

      // Validate domain if provided
      const validDomains = [
        'Game Development',
        'Game Design', 
        'Game Art',
        'AI for Game Development',
        'Creative',
        'Corporate'
      ];

      if (domain && !validDomains.includes(domain)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_DOMAIN',
              message: 'Invalid domain specified'
            },
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      }

      if (userId) {
        // Update leaderboards for specific user (simulates XP change)
        await LeaderboardService.updateLeaderboardsForUser(userId, 0, 0);
      } else {
        // Invalidate cache based on parameters
        LeaderboardService.invalidateCache(
          type as 'all-time' | 'weekly' | undefined,
          domain as Domain | undefined
        );
      }

      return NextResponse.json(
        {
          success: true,
          data: {
            message: 'Leaderboard cache updated successfully',
            type: type || 'all',
            domain: domain || 'all',
            userId: userId || null
          },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Update leaderboard error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to update leaderboard cache'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}

// GET /api/leaderboards/update - Get cache status (admin only)
export async function GET(request: NextRequest) {
  return withAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      // Clean up expired cache entries
      LeaderboardService.cleanupCache();

      return NextResponse.json(
        {
          success: true,
          data: {
            message: 'Cache cleanup completed',
            timestamp: new Date().toISOString()
          },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Get cache status error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to get cache status'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}