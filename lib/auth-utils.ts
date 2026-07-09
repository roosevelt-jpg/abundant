import { User, UserRole } from '@/lib/types';
import { AdminPermission } from '@/lib/types';
import { hasPermission as checkPermission, isSuperAdmin as checkSuperAdmin } from '@/lib/permissions';

export function isAdminRole(role?: UserRole): boolean {
  return role === 'admin' || role === 'super_admin';
}

export function isSuperAdmin(role?: UserRole): boolean {
  return checkSuperAdmin(role);
}

export function canAccessAdmin(user?: User | null): boolean {
  return !!user && isAdminRole(user.role);
}

export function canManageInvites(role?: UserRole): boolean {
  return role === 'super_admin';
}

export function hasPermission(
  user: Pick<User, 'role' | 'permissions'> | null | undefined,
  permission: AdminPermission
): boolean {
  return checkPermission(user, permission);
}
