import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/admin/test - Test admin API endpoints
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    // Test basic admin functionality
    const testResults = {
      authentication: {
        status: 'success',
        user: {
          id: session.user.id,
          username: session.user.username,
          role: session.user.role
        }
      },
      endpoints: {
        dashboard: '/api/admin',
        users: '/api/admin/users',
        userDetails: '/api/admin/users/[id]',
        userSanctions: '/api/admin/users/[id]/sanctions',
        moderation: '/api/admin/moderation',
        moderationDetails: '/api/admin/moderation/[id]',
        analytics: '/api/admin/analytics',
        gamification: '/api/admin/gamification',
        gamificationItems: '/api/admin/gamification/[type]/[id]'
      },
      features: [
        'User management with role updates',
        'Content moderation and reporting',
        'User sanctions (warnings, bans)',
        'Platform analytics and metrics',
        'Gamification system management',
        'Real-time dashboard statistics'
      ]
    };

    return NextResponse.json({
      success: true,
      message: 'Admin backend API is operational',
      data: testResults,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin test error:', error);
    return NextResponse.json(
      { 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Admin test failed' 
        } 
      },
      { status: 500 }
    );
  }
}