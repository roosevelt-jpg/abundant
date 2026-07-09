import { User, UserRole } from '@/lib/types';

export function isAdminRole(role?: UserRole): boolean {
  return role === 'admin' || role === 'super_admin';
}

export function isSuperAdmin(role?: UserRole): boolean {
  return role === 'super_admin';
}

export function canAccessAdmin(user?: User | null): boolean {
  return !!user && isAdminRole(user.role);
}

export function canManageInvites(role?: UserRole): boolean {
  return role === 'super_admin';
}
