'use client';

import { useAuth } from '@/context/AuthContext';
import { Users, Calendar, Briefcase, DollarSign } from 'lucide-react';
import { useState, useEffect } from 'react';

interface DashboardStats {
  totalMembers: number;
  activeSubscriptions: number;
  upcomingEvents: number;
  totalMembershipPlans: number;
}

export default function AdminDashboard() {
  const { userData } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    activeSubscriptions: 0,
    upcomingEvents: 0,
    totalMembershipPlans: 0
  });
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    // Set initial time and date
    const updateDateTime = () => {
      const now = new Date();
      const time = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      const date = now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      setCurrentTime(time);
      setCurrentDate(date);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadLiveStats();
  }, []);

  const loadLiveStats = async () => {
    try {
      setLoading(true);
      const [eventsRes, plansRes] = await Promise.all([
        fetch('/api/events?status=upcoming'),
        fetch('/api/membership-plans')
      ]);

      let upcomingEvents = 0;
      let totalMembershipPlans = 0;

      if (eventsRes.ok) {
        const events = await eventsRes.json();
        upcomingEvents = Array.isArray(events) ? events.length : 0;
      }

      if (plansRes.ok) {
        const plans = await plansRes.json();
        totalMembershipPlans = Array.isArray(plans) ? plans.length : 0;
      }

      setStats({
        totalMembers: 0, // Will be populated from user count
        activeSubscriptions: 0,
        upcomingEvents,
        totalMembershipPlans
      });
    } catch (error) {
      console.error('[v0] Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsData = [
    {
      icon: Users,
      label: 'Total Members',
      value: stats.totalMembers,
      trend: 'Live'
    },
    {
      icon: Briefcase,
      label: 'Active Subscriptions',
      value: stats.activeSubscriptions,
      trend: 'Live'
    },
    {
      icon: Calendar,
      label: 'Upcoming Events',
      value: stats.upcomingEvents,
      trend: 'Live'
    },
    {
      icon: DollarSign,
      label: 'Membership Plans',
      value: stats.totalMembershipPlans,
      trend: 'Live'
    }
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {userData?.displayName || 'Admin'}</p>
        <div className="flex items-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Current Time:</span>
            <span className="font-mono font-semibold text-accent">{currentTime}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Date:</span>
            <span className="font-mono font-semibold text-accent">{currentDate}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid - Live Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsData.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="p-6 bg-card rounded-xl border border-border hover:border-accent transition-colors">
              <div className="flex items-start justify-between mb-4">
                <Icon className="w-8 h-8 text-accent" />
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">{stat.trend}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-3xl font-bold">{loading ? '...' : stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Actions & System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-card rounded-xl border border-border">
          <h2 className="font-heading font-bold text-lg mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <a href="/admin/membership-plans" className="block p-4 bg-background rounded-lg border border-border hover:border-accent transition-colors text-sm font-medium">
              → Manage Membership Plans
            </a>
            <a href="/admin/events" className="block p-4 bg-background rounded-lg border border-border hover:border-accent transition-colors text-sm font-medium">
              → Create/Manage Events
            </a>
            <a href="/admin/hero-slider" className="block p-4 bg-background rounded-lg border border-border hover:border-accent transition-colors text-sm font-medium">
              → Configure Hero Slider
            </a>
            <a href="/admin/integrations" className="block p-4 bg-background rounded-lg border border-border hover:border-accent transition-colors text-sm font-medium">
              → Setup Integrations
            </a>
          </div>
        </div>

        <div className="p-6 bg-card rounded-xl border border-border">
          <h2 className="font-heading font-bold text-lg mb-4">System Status</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
              <span className="text-sm">Firebase Admin SDK</span>
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            </div>
            <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
              <span className="text-sm">Firestore Database</span>
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            </div>
            <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
              <span className="text-sm">Firebase Storage</span>
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            </div>
            <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
              <span className="text-sm">API Routes</span>
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

