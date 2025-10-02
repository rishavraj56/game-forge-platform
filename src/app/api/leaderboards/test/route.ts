import { NextRequest, NextResponse } from 'next/server';
import { withAdmin, AuthenticatedRequest } from '../../../../lib/auth-middleware';
import { LeaderboardService } from '../../../../lib/leaderboard-service';
import { testConnection } from '../../../../lib/db';

// GET /api/leaderboards/test - Test leaderboard system (admin only)
export async function GET(request: NextRequest) {
  return withAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const testResults = {
        timestamp: new Date().toISOString(),
        tests: [] as Array<{ name: string; success: boolean; data?: any; error?: string }>
      };

      // Test 1: Database connection
      try {
        const dbConnected = await testConnection();
        testResults.tests.push({
          name: 'Database Connection',
          success: dbConnected,
          data: { connected: dbConnected }
        });
      } catch (error) {
        testResults.tests.push({
          name: 'Database Connection',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Test 2: All-time leaderboard
      try {
        const { leaderboard: allTime, total: allTimeTotal } = await LeaderboardService.getLeaderboard('all-time', undefined, 5, 0);
        testResults.tests.push({
          name: 'All-time Leaderboard',
          success: true,
          data: { 
            count: allTime.length, 
            total: allTimeTotal,
            topUser: allTime[0] || null
          }
        });
      } catch (error) {
        testResults.tests.push({
          name: 'All-time Leaderboard',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Test 3: Weekly leaderboard
      try {
        const { leaderboard: weekly, total: weeklyTotal } = await LeaderboardService.getLeaderboard('weekly', undefined, 5, 0);
        testResults.tests.push({
          name: 'Weekly Leaderboard',
          success: true,
          data: { 
            count: weekly.length, 
            total: weeklyTotal,
            topUser: weekly[0] || null
          }
        });
      } catch (error) {
        testResults.tests.push({
          name: 'Weekly Leaderboard',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Test 4: Domain-specific leaderboard
      try {
        const { leaderboard: domainLeaderboard } = await LeaderboardService.getLeaderboard('all-time', 'Game Development', 3, 0);
        testResults.tests.push({
          name: 'Domain-specific Leaderboard',
          success: true,
          data: { 
            domain: 'Game Development',
            count: domainLeaderboard.length,
            users: domainLeaderboard.map(u => ({ username: u.username, xp: u.xp }))
          }
        });
      } catch (error) {
        testResults.tests.push({
          name: 'Domain-specific Leaderboard',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Test 5: User rank lookup
      try {
        const userId = req.user!.id;
        const userRank = await LeaderboardService.getUserRank(userId, 'all-time');
        testResults.tests.push({
          name: 'User Rank Lookup',
          success: true,
          data: { 
            userId,
            rank: userRank?.rank || null,
            entry: userRank?.entry || null
          }
        });
      } catch (error) {
        testResults.tests.push({
          name: 'User Rank Lookup',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Test 6: Cache functionality
      try {
        // Clear cache and measure performance
        LeaderboardService.invalidateCache();
        
        const start1 = Date.now();
        await LeaderboardService.getLeaderboard('all-time', undefined, 10, 0);
        const time1 = Date.now() - start1;

        const start2 = Date.now();
        await LeaderboardService.getLeaderboard('all-time', undefined, 10, 0);
        const time2 = Date.now() - start2;

        testResults.tests.push({
          name: 'Cache Performance',
          success: true,
          data: { 
            firstCallMs: time1,
            cachedCallMs: time2,
            cacheEffective: time2 < time1
          }
        });
      } catch (error) {
        testResults.tests.push({
          name: 'Cache Performance',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      const successCount = testResults.tests.filter(t => t.success).length;
      const totalTests = testResults.tests.length;

      return NextResponse.json(
        {
          success: successCount === totalTests,
          data: {
            ...testResults,
            summary: {
              passed: successCount,
              total: totalTests,
              allPassed: successCount === totalTests
            }
          },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Leaderboard test error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TEST_ERROR',
            message: 'Failed to run leaderboard tests'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}