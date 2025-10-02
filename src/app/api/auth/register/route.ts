import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { hashPassword } from '../../../../lib/auth';
import { RegisterData, Domain } from '../../../../lib/types';

const VALID_DOMAINS: Domain[] = [
  'Game Development',
  'Game Design', 
  'Game Art',
  'AI for Game Development',
  'Creative',
  'Corporate'
];

export async function POST(request: NextRequest) {
  try {
    const body: RegisterData = await request.json();
    const { username, email, password, domain } = body;

    // Validation
    if (!username || !email || !password || !domain) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'All fields are required' 
          } 
        },
        { status: 400 }
      );
    }

    // Validate domain
    if (!VALID_DOMAINS.includes(domain)) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'INVALID_DOMAIN', 
            message: 'Invalid domain selected' 
          } 
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'INVALID_EMAIL', 
            message: 'Invalid email format' 
          } 
        },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'WEAK_PASSWORD', 
            message: 'Password must be at least 8 characters long' 
          } 
        },
        { status: 400 }
      );
    }

    // Validate username format (alphanumeric and underscores, 3-30 chars)
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'INVALID_USERNAME', 
            message: 'Username must be 3-30 characters and contain only letters, numbers, and underscores' 
          } 
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { username: username }
        ]
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'USER_EXISTS', 
            message: 'User with this email or username already exists' 
          } 
        },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        domain,
        role: 'member',
        xp: 0,
        level: 1,
        isActive: true,
        emailVerified: false
      },
      select: {
        id: true,
        username: true,
        email: true,
        domain: true,
        role: true,
        xp: true,
        level: true,
        createdAt: true
      }
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            domain: newUser.domain,
            role: newUser.role,
            xp: newUser.xp,
            level: newUser.level,
            createdAt: newUser.createdAt
          }
        },
        timestamp: new Date().toISOString()
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Registration error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Registration failed. Please try again.'
        },
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}