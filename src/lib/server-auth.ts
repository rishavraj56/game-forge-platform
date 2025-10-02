import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { UserRole } from './types';

// Get current user session on server side
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user || null;
}

// Check if user is authenticated
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

// Check if user has required role
export async function requireRole(allowedRoles: UserRole[]) {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    throw new Error(`Access denied. Required roles: ${allowedRoles.join(', ')}`);
  }
  return user;
}

// Check if user is admin
export async function requireAdmin() {
  return requireRole(['admin']);
}

// Check if user is domain lead or admin
export async function requireDomainLead() {
  return requireRole(['domain_lead', 'admin']);
}

// Check if user can access domain-specific content
export async function requireDomainAccess(targetDomain?: string) {
  const user = await requireAuth();
  
  // Admins can access everything
  if (user.role === 'admin') {
    return user;
  }

  // Domain leads can access their own domain
  if (user.role === 'domain_lead' && user.domain === targetDomain) {
    return user;
  }

  // Members can access their own domain or public content
  if (user.role === 'member' && (!targetDomain || user.domain === targetDomain)) {
    return user;
  }

  throw new Error('Access denied to this domain');
}

// Check if user can moderate content in a domain
export async function requireModerationAccess(contentDomain?: string) {
  const user = await requireAuth();
  
  // Admins can moderate everything
  if (user.role === 'admin') {
    return user;
  }

  // Domain leads can moderate their domain
  if (user.role === 'domain_lead' && user.domain === contentDomain) {
    return user;
  }

  throw new Error('Insufficient permissions to moderate this content');
}