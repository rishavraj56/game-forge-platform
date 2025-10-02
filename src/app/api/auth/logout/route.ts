import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';

export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_AUTHENTICATED',
            message: 'No active session to logout'
          },
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      );
    }

    // NextAuth handles the actual logout through its signOut function on the client
    // This endpoint can be used for any server-side cleanup if needed
    
    return NextResponse.json(
      {
        success: true,
        data: { message: 'Logout successful' },
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Logout error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Logout failed'
        },
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}