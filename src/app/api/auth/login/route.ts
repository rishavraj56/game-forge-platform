import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '../../../../lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email and password are required'
          }
        },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        username: true,
        email: true,
        passwordHash: true,
        domain: true,
        role: true,
        xp: true,
        level: true,
        isActive: true
      }
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password'
          }
        },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ACCOUNT_DISABLED',
            message: 'Your account has been disabled'
          }
        },
        { status: 403 }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash);

    if (!isValidPassword) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password'
          }
        },
        { status: 401 }
      );
    }

    // Login successful - return user data (without password hash)
    const { passwordHash, ...userData } = user;

    return NextResponse.json(
      {
        success: true,
        data: { user: userData },
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Login error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Login failed. Please try again.'
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