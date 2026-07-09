import { Globe, Calendar, Users, Zap, Star, Heart, Shield, Target, LucideIcon } from 'lucide-react';
import { HomeFeatureIcon } from '@/lib/types';

export const HOME_FEATURE_ICONS: { id: HomeFeatureIcon; label: string }[] = [
  { id: 'globe', label: 'Globe' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'users', label: 'Users' },
  { id: 'zap', label: 'Lightning' },
  { id: 'star', label: 'Star' },
  { id: 'heart', label: 'Heart' },
  { id: 'shield', label: 'Shield' },
  { id: 'target', label: 'Target' },
];

const ICON_MAP: Record<HomeFeatureIcon, LucideIcon> = {
  globe: Globe,
  calendar: Calendar,
  users: Users,
  zap: Zap,
  star: Star,
  heart: Heart,
  shield: Shield,
  target: Target,
};

export function HomeFeatureIconComponent({ icon, className }: { icon: HomeFeatureIcon; className?: string }) {
  const Icon = ICON_MAP[icon] || Globe;
  return <Icon className={className} />;
}
