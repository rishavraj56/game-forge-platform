import { useAuth } from '@/contexts/auth-context';
import { UserRole } from '@/lib/types';

export function useAuthorization() {
  const { user } = useAuth();

  const hasRole = (allowedRoles: UserRole[]): boolean => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  const isAdmin = (): boolean => {
    return hasRole(['admin']);
  };

  const isDomainLead = (): boolean => {
    return hasRole(['domain_lead', 'admin']);
  };

  const isMember = (): boolean => {
    return hasRole(['member', 'domain_lead', 'admin']);
  };

  const canAccessDomain = (targetDomain?: string): boolean => {
    if (!user) return false;

    // Admins can access everything
    if (user.role === 'admin') {
      return true;
    }

    // Domain leads can access their own domain
    if (user.role === 'domain_lead' && user.domain === targetDomain) {
      return true;
    }

    // Members can access their own domain or public content
    if (user.role === 'member' && (!targetDomain || user.domain === targetDomain)) {
      return true;
    }

    return false;
  };

  const canModerateContent = (contentDomain?: string): boolean => {
    if (!user) return false;

    // Admins can moderate everything
    if (user.role === 'admin') {
      return true;
    }

    // Domain leads can moderate their domain
    if (user.role === 'domain_lead' && user.domain === contentDomain) {
      return true;
    }

    return false;
  };

  const canManageUsers = (): boolean => {
    return isAdmin();
  };

  const canCreateEvents = (): boolean => {
    return isDomainLead();
  };

  const canManageGamification = (): boolean => {
    return isAdmin();
  };

  const canEditProfile = (profileUserId: string): boolean => {
    if (!user) return false;
    
    // Users can edit their own profile, admins can edit any profile
    return user.id === profileUserId || user.role === 'admin';
  };

  const canDeletePost = (postAuthorId: string, postDomain?: string): boolean => {
    if (!user) return false;

    // Post author can delete their own post
    if (user.id === postAuthorId) {
      return true;
    }

    // Admins can delete any post
    if (user.role === 'admin') {
      return true;
    }

    // Domain leads can delete posts in their domain
    if (user.role === 'domain_lead' && user.domain === postDomain) {
      return true;
    }

    return false;
  };

  return {
    user,
    hasRole,
    isAdmin,
    isDomainLead,
    isMember,
    canAccessDomain,
    canModerateContent,
    canManageUsers,
    canCreateEvents,
    canManageGamification,
    canEditProfile,
    canDeletePost,
  };
}