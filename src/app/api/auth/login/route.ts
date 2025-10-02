import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';

export async function POST(_request: NextRequest) {
  try {
    // This endpoint can be used for custom login logic if needed
    // For now, we'll just return the current session status
    const session = await getServerSession(authOptions);
    
    if (session) {
      return NextResponse.json(
        {
          success: true,
          data: { user: session.user },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'No active session found'
        },
        timestamp: new Date().toISOString()
      },
      { status: 401 }
    );

  } catch (error) {
    console.error('Login check error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Login check failed'
        },
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest) {
  // Get current session
  try {
    const session = await getServerSession(authOptions);
    
    if (session) {
      return NextResponse.json(
        {
          success: true,
          data: { user: session.user },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'No active session found'
        },
        timestamp: new Date().toISOString()
      },
      { status: 401 }
    );

  } catch (error) {
    console.error('Session check error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Session check failed'
        },
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}