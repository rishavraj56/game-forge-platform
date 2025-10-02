import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { UserRole } from './types';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    username: string;
    email: string;
    role: UserRole;
    domain: string;
  };
}

// Middleware to verify authentication
export async function withAuth(
  request: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          },
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      );
    }

    // Add user info to request
    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.user = {
      id: token.id as string,
      username: token.username as string,
      email: token.email as string,
      role: token.role as UserRole,
      domain: token.domain as string,
    };

    return handler(authenticatedRequest);
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message: 'Authentication verification failed'
        },
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Middleware to verify specific roles
export function withRole(
  allowedRoles: UserRole[]
) {
  return async (
    request: NextRequest,
    handler: (req: AuthenticatedRequest) => Promise<NextResponse>
  ): Promise<NextResponse> => {
    return withAuth(request, async (req: AuthenticatedRequest) => {
      if (!req.user) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication required'
            },
            timestamp: new Date().toISOString()
          },
          { status: 401 }
        );
      }

      if (!allowedRoles.includes(req.user.role)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
            },
            timestamp: new Date().toISOString()
          },
          { status: 403 }
        );
      }

      return handler(req);
    });
  };
}

// Middleware for admin-only routes
export const withAdmin = withRole(['admin']);

// Middleware for domain lead and admin routes
export const withDomainLead = withRole(['domain_lead', 'admin']);

// Middleware for any authenticated user
export const withMember = withRole(['member', 'domain_lead', 'admin']);

// Helper function to check if user can access domain-specific content
export function canAccessDomain(userRole: UserRole, userDomain: string, targetDomain?: string): boolean {
  // Admins can access everything
  if (userRole === 'admin') {
    return true;
  }

  // Domain leads can access their own domain
  if (userRole === 'domain_lead' && userDomain === targetDomain) {
    return true;
  }

  // Members can access their own domain or public content
  if (userRole === 'member' && (!targetDomain || userDomain === targetDomain)) {
    return true;
  }

  return false;
}

// Helper function to check if user can moderate content
export function canModerateContent(userRole: UserRole, userDomain: string, contentDomain?: string): boolean {
  // Admins can moderate everything
  if (userRole === 'admin') {
    return true;
  }

  // Domain leads can moderate their domain
  if (userRole === 'domain_lead' && userDomain === contentDomain) {
    return true;
  }

  return false;
}

// Helper function to check if user can manage users
export function canManageUsers(userRole: UserRole): boolean {
  return userRole === 'admin';
}

// Helper function to check if user can create events
export function canCreateEvents(userRole: UserRole): boolean {
  return userRole === 'domain_lead' || userRole === 'admin';
}

// Helper function to check if user can manage gamification
export function canManageGamification(userRole: UserRole): boolean {
  return userRole === 'admin';
}