import { AdminPermission, User, UserRole } from '@/lib/types';

export const ADMIN_PERMISSION_DEFS: {
  id: AdminPermission;
  label: string;
  description: string;
}[] = [
  { id: 'dashboard', label: 'Dashboard', description: 'View stats and activity' },
  { id: 'members', label: 'Members', description: 'Manage member accounts' },
  { id: 'events', label: 'Events', description: 'Create and manage events' },
  { id: 'testimonials', label: 'Testimonials', description: 'Manage testimonials' },
  { id: 'billing', label: 'Membership Plans', description: 'Manage pricing plans' },
  { id: 'pages', label: 'Pages', description: 'CMS pages' },
  { id: 'about', label: 'About Page', description: 'Edit about page content' },
  { id: 'forms', label: 'Forms', description: 'Custom forms' },
  { id: 'hero', label: 'Hero Slider', description: 'Homepage hero slides' },
  { id: 'contact', label: 'Contact Submissions', description: 'View and reply to messages' },
  { id: 'chatbot', label: 'Chatbot', description: 'Chatbot settings and logs' },
  { id: 'faq', label: 'FAQ', description: 'Manage FAQ questions and answers' },
  { id: 'resources', label: 'Resources', description: 'Resource library page and items' },
  { id: 'careers', label: 'Careers', description: 'Job postings and applications' },
  { id: 'press', label: 'Press', description: 'Press mentions and media kit' },
  { id: 'legal', label: 'Legal', description: 'Privacy Policy and Terms of Service' },
  { id: 'applications', label: 'Applications', description: 'Membership application review queue' },
  { id: 'invites', label: 'Invite Admins', description: 'Invite and manage admins (super admin only)' },
  { id: 'settings', label: 'Settings', description: 'Platform settings and integrations' },
  { id: 'hosting', label: 'Hosting', description: 'Purchase Hostinger hosting plans' },
];

export const ALL_ADMIN_PERMISSIONS = ADMIN_PERMISSION_DEFS.map((p) => p.id);

export const ROUTE_PERMISSIONS: Record<string, AdminPermission> = {
  '/admin/dashboard': 'dashboard',
  '/admin/members': 'members',
  '/admin/events': 'events',
  '/admin/testimonials': 'testimonials',
  '/admin/billing': 'billing',
  '/admin/membership-tiers': 'billing',
  '/admin/pages': 'pages',
  '/admin/about': 'about',
  '/admin/forms': 'forms',
  '/admin/contact': 'contact',
  '/admin/chatbot': 'chatbot',
  '/admin/faq': 'faq',
  '/admin/resources': 'resources',
  '/admin/resource-submissions': 'resources',
  '/admin/careers': 'careers',
  '/admin/press': 'press',
  '/admin/legal': 'legal',
  '/admin/applications': 'applications',
  '/admin/invites': 'invites',
  '/admin/settings': 'settings',
  '/admin/hosting': 'hosting',
};

export function getPermissionForPath(pathname: string): AdminPermission | null {
  const base = pathname.split('?')[0];
  if (base === '/admin/settings' && pathname.includes('tab=hero')) return 'hero';
  if (base.startsWith('/admin/hosting')) return 'hosting';
  return ROUTE_PERMISSIONS[base] || null;
}

export function isSuperAdmin(role?: UserRole): boolean {
  return role === 'super_admin';
}

export function hasPermission(
  user: Pick<User, 'role' | 'permissions'> | null | undefined,
  permission: AdminPermission
): boolean {
  if (!user) return false;
  if (user.role === 'super_admin') return true;
  if (user.role !== 'admin') return false;
  // Legacy admins created before permissions — full access except invites
  if (!user.permissions || user.permissions.length === 0) {
    return permission !== 'invites';
  }
  return user.permissions.includes(permission);
}

export function getPermissionLabel(id: AdminPermission): string {
  return ADMIN_PERMISSION_DEFS.find((p) => p.id === id)?.label || id;
}
