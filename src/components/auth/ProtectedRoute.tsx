'use client';

import React, { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useAuthorization } from '@/hooks/use-authorization';
import { UserRole } from '@/lib/types';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  requiredDomain?: string;
  fallback?: ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  allowedRoles = ['member', 'domain_lead', 'admin'],
  requiredDomain,
  fallback,
  redirectTo = '/auth/login'
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const { hasRole, canAccessDomain } = useAuthorization();
  const router = useRouter();

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    if (typeof window !== 'undefined') {
      router.push(redirectTo);
    }
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600">Please log in to access this page.</p>
        </div>
      </div>
    );
  }

  // Check role permissions
  if (!hasRole(allowedRoles)) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">
            You don't have permission to access this page.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Required roles: {allowedRoles.join(', ')}
          </p>
        </div>
      </div>
    );
  }

  // Check domain access if required
  if (requiredDomain && !canAccessDomain(requiredDomain)) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Domain Access Denied</h2>
          <p className="text-gray-600">
            You don't have access to the {requiredDomain} domain.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Convenience components for common protection patterns
export function AdminRoute({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['admin']} fallback={fallback}>
      {children}
    </ProtectedRoute>
  );
}

export function DomainLeadRoute({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['domain_lead', 'admin']} fallback={fallback}>
      {children}
    </ProtectedRoute>
  );
}

export function MemberRoute({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['member', 'domain_lead', 'admin']} fallback={fallback}>
      {children}
    </ProtectedRoute>
  );
}