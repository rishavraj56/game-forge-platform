import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '../../../../lib/auth-middleware';
import { performanceMonitor } from '../../../../lib/performance-monitor';
import { cacheService } from '../../../../lib/cache-service';
import { LeaderboardService } from '../../../../lib/leaderboard-service';

// GET /api/admin/performance - Get performance metrics (Admin only)
export async function GET(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      // Check if user is admin
      if (req.user!.role !== 'admin') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Admin access required'
            },
            timestamp: new Date().toISOString()
          },
          { status: 403 }
        );
      }

      // Get performance statistics
      const performanceStats = performanceMonitor.getStats();
      const cacheStats = cacheService.getStats();
      const leaderboardCacheStats = LeaderboardService.getCacheStats();

      // Calculate cache efficiency
      const cacheEfficiency = {
        hitRate: performanceStats.apiStats.cacheHitRate,
        totalEntries: cacheStats.size,
        memoryUsage: `${(cacheStats.memoryUsage / 1024 / 1024).toFixed(2)} MB`,
        leaderboardCacheSize: leaderboardCacheStats.size,
      };

      // Get slow operations
      const slowOperations = performanceStats.slowestOperations.map(op => ({
        name: op.name,
        duration: `${op.duration.toFixed(2)}ms`,
        timestamp: new Date(op.timestamp).toISOString(),
        metadata: op.metadata,
      }));

      // Get slow API endpoints
      const slowEndpoints = performanceStats.apiStats.slowestEndpoints.map(endpoint => ({
        endpoint: endpoint.endpoint,
        method: endpoint.method,
        duration: `${endpoint.duration.toFixed(2)}ms`,
        statusCode: endpoint.statusCode,
        timestamp: new Date(endpoint.timestamp).toISOString(),
      }));

      // Performance recommendations
      const recommendations = [];

      if (performanceStats.apiStats.cacheHitRate < 50) {
        recommendations.push({
          type: 'cache',
          severity: 'high',
          message: 'Low cache hit rate detected. Consider increasing cache TTL or warming up cache.',
          metric: `${performanceStats.apiStats.cacheHitRate.toFixed(1)}% hit rate`,
        });
      }

      if (performanceStats.averageDuration > 200) {
        recommendations.push({
          type: 'performance',
          severity: 'medium',
          message: 'Average operation duration is high. Review slow operations.',
          metric: `${performanceStats.averageDuration.toFixed(2)}ms average`,
        });
      }

      if (cacheStats.size > 500) {
        recommendations.push({
          type: 'memory',
          severity: 'low',
          message: 'Large number of cache entries. Consider cache cleanup.',
          metric: `${cacheStats.size} entries`,
        });
      }

      return NextResponse.json(
        {
          success: true,
          data: {
            performance: {
              totalMetrics: performanceStats.totalMetrics,
              averageDuration: `${performanceStats.averageDuration.toFixed(2)}ms`,
              slowOperations: slowOperations.slice(0, 10),
            },
            api: {
              totalCalls: performanceStats.apiStats.totalCalls,
              averageDuration: `${performanceStats.apiStats.averageDuration.toFixed(2)}ms`,
              slowEndpoints: slowEndpoints.slice(0, 10),
            },
            cache: cacheEfficiency,
            recommendations,
            timestamp: new Date().toISOString(),
          },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Get performance metrics error:', error);

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch performance metrics'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}

// POST /api/admin/performance/clear - Clear performance metrics (Admin only)
export async function POST(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      // Check if user is admin
      if (req.user!.role !== 'admin') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Admin access required'
            },
            timestamp: new Date().toISOString()
          },
          { status: 403 }
        );
      }

      const { searchParams } = new URL(req.url);
      const clearType = searchParams.get('type') || 'all';

      switch (clearType) {
        case 'performance':
          performanceMonitor.clear();
          break;
        case 'cache':
          cacheService.clear();
          break;
        case 'all':
          performanceMonitor.clear();
          cacheService.clear();
          break;
        default:
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INVALID_TYPE',
                message: 'Invalid clear type. Use: performance, cache, or all'
              },
              timestamp: new Date().toISOString()
            },
            { status: 400 }
          );
      }

      return NextResponse.json(
        {
          success: true,
          data: {
            message: `${clearType} metrics cleared successfully`,
            clearedAt: new Date().toISOString(),
          },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Clear performance metrics error:', error);

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to clear performance metrics'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}

// PUT /api/admin/performance/warmup - Warm up caches (Admin only)
export async function PUT(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      // Check if user is admin
      if (req.user!.role !== 'admin') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Admin access required'
            },
            timestamp: new Date().toISOString()
          },
          { status: 403 }
        );
      }

      // Warm up leaderboard cache
      await LeaderboardService.warmupCache();

      return NextResponse.json(
        {
          success: true,
          data: {
            message: 'Cache warmup completed successfully',
            warmedUpAt: new Date().toISOString(),
          },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );

    } catch (error) {
      console.error('Cache warmup error:', error);

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to warm up cache'
          },
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  });
}