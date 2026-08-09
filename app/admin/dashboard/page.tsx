'use client';

import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Users, Calendar, MessageSquare, Mail } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ActivityLog } from '@/lib/types';
import { EnablePushCard } from '@/components/enable-push-card';

interface DashboardStats {
  totalMembers: number;
  upcomingEvents: number;
  pendingTestimonials: number;
  newContactSubmissions: number;
}

function timeAgo(ts: number, t: (key: string, fallback?: string) => string): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('common.justNow', 'just now');
  if (mins < 60) return `${mins} ${t('common.minutesAgo', 'min ago')}`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ${t('common.hoursAgo', 'hr ago')}`;
  const days = Math.floor(hours / 24);
  return `${days} ${t('common.daysAgo', 'days ago')}`;
}

export default function AdminDashboard() {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;

    async function load() {
      try {
        const token = await currentUser!.getIdToken();
        const res = await fetch('/api/admin/dashboard', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(t('common.error', 'Failed to load dashboard data'));
        const data = await res.json();
        if (!cancelled) {
          setStats(data.stats);
          setActivity(data.activity || []);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : t('common.error', 'Failed to load'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [currentUser, t]);

  const statCards = stats
    ? [
        { icon: Users, label: t('admin.stats.members', 'Total Members'), value: String(stats.totalMembers), href: '/admin/members' },
        { icon: Calendar, label: t('admin.stats.events', 'Upcoming Events'), value: String(stats.upcomingEvents), href: '/admin/events' },
        { icon: MessageSquare, label: t('admin.stats.testimonials', 'Pending Testimonials'), value: String(stats.pendingTestimonials), href: '/admin/testimonials' },
        { icon: Mail, label: t('admin.stats.messages', 'New Contact Messages'), value: String(stats.newContactSubmissions), href: '/admin/contact' },
      ]
    : [];

  return (
    <div>
      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-6 bg-card rounded-xl border border-border animate-pulse h-32" />
            ))
          : statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Link
                  key={stat.label}
                  href={stat.href}
                  className="p-6 bg-card rounded-xl border border-border hover:border-accent transition-colors"
                >
                  <Icon className="w-8 h-8 text-accent mb-4" />
                  <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </Link>
              );
            })}
      </div>

      <div className="mb-8">
        <EnablePushCard />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-card rounded-xl border border-border">
          <h2 className="font-heading font-bold text-lg mb-4">Recent Activity</h2>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading activity...</p>
          ) : activity.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No recent activity yet. Actions across the admin panel will appear here.</p>
          ) : (
            <div className="space-y-3">
              {activity.map((item) => (
                <div key={item.id} className="p-4 bg-background rounded-lg border border-border text-sm">
                  <p className="font-medium mb-1">{item.description}</p>
                  <p className="text-muted-foreground text-xs">{timeAgo(item.createdAt, t)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 bg-card rounded-xl border border-border">
          <h2 className="font-heading font-bold text-lg mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link href="/admin/profile" className="block p-4 bg-background rounded-lg border border-border hover:border-accent transition-colors text-sm font-medium">
              → View Your Profile
            </Link>
            <Link href="/admin/members" className="block p-4 bg-background rounded-lg border border-border hover:border-accent transition-colors text-sm font-medium">
              → Manage Members
            </Link>
            <Link href="/admin/events" className="block p-4 bg-background rounded-lg border border-border hover:border-accent transition-colors text-sm font-medium">
              → Create Event
            </Link>
            <Link href="/admin/settings" className="block p-4 bg-background rounded-lg border border-border hover:border-accent transition-colors text-sm font-medium">
              → Configure Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
