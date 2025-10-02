import { NextResponse } from 'next/server';
import { testConnection } from '@/lib/db';
import { getPlatformStats } from '@/lib/db-utils';

export async function GET() {
  try {
    // Test database connection
    const isConnected = await testConnection();
    
    if (!isConnected) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_CONNECTION_FAILED',
            message: 'Unable to connect to database'
          },
          timestamp: new Date().toISOString()
        },
        { status: 503 }
      );
    }

    // Get basic platform stats if connection is successful
    let stats = null;
    try {
      stats = await getPlatformStats();
    } catch (error) {
      // Stats are optional for health check
      console.warn('Could not fetch platform stats:', error);
    }

    return NextResponse.json({
      success: true,
      data: {
        status: 'healthy',
        database: 'connected',
        timestamp: new Date().toISOString(),
        stats
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'HEALTH_CHECK_FAILED',
          message: 'Health check failed',
          details: process.env.NODE_ENV === 'development' ? error : undefined
        },
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}