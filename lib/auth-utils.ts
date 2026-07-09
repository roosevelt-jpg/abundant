import { User, UserRole } from '@/lib/types';
import { AdminPermission } from '@/lib/types';
import { hasPermission as checkPermission, isSuperAdmin as checkSuperAdmin } from '@/lib/permissions';
import { PRIMARY_ADMIN_EMAIL } from '@/lib/constants';

export function isPrimaryAdmin(email?: string | null): boolean {
  return email?.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase();
}

export function isAdminRole(role?: UserRole): boolean {
  return role === 'admin' || role === 'super_admin';
}

export function isSuperAdmin(role?: UserRole): boolean {
  return checkSuperAdmin(role);
}

export function canAccessAdmin(user?: User | null): boolean {
  return !!user && isAdminRole(user.role);
}

export function canManageInvites(role?: UserRole, email?: string | null): boolean {
  return role === 'super_admin' || isPrimaryAdmin(email);
}

export function hasPermission(
  user: Pick<User, 'role' | 'permissions'> | null | undefined,
  permission: AdminPermission
): boolean {
  return checkPermission(user, permission);
}
