'use client';

import { useAuth } from '@/context/AuthContext';
import { Users, Calendar, MessageSquare, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function AdminDashboard() {
  const { userData } = useAuth();
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

  const stats = [
    {
      icon: Users,
      label: 'Total Members',
      value: '1,234',
      trend: '+12%'
    },
    {
      icon: Calendar,
      label: 'Upcoming Events',
      value: '8',
      trend: '+2'
    },
    {
      icon: MessageSquare,
      label: 'Pending Testimonials',
      value: '24',
      trend: '+5'
    },
    {
      icon: Settings,
      label: 'System Health',
      value: 'Excellent',
      trend: '↑'
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="p-6 bg-card rounded-xl border border-border hover:border-accent transition-colors">
              <div className="flex items-start justify-between mb-4">
                <Icon className="w-8 h-8 text-accent" />
                <span className="text-xs font-semibold text-green-600">{stat.trend}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-3xl font-bold">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-card rounded-xl border border-border">
          <h2 className="font-heading font-bold text-lg mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <div className="p-4 bg-background rounded-lg border border-border text-sm">
              <p className="font-medium mb-1">New Member Signup</p>
              <p className="text-muted-foreground text-xs">John Doe joined 2 hours ago</p>
            </div>
            <div className="p-4 bg-background rounded-lg border border-border text-sm">
              <p className="font-medium mb-1">Event Registered</p>
              <p className="text-muted-foreground text-xs">5 members registered for Global Summit</p>
            </div>
            <div className="p-4 bg-background rounded-lg border border-border text-sm">
              <p className="font-medium mb-1">Testimonial Submitted</p>
              <p className="text-muted-foreground text-xs">3 new testimonials awaiting approval</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-card rounded-xl border border-border">
          <h2 className="font-heading font-bold text-lg mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <a href="/admin/profile" className="block p-4 bg-background rounded-lg border border-border hover:border-accent transition-colors text-sm font-medium">
              → View Your Profile
            </a>
            <a href="/admin/members" className="block p-4 bg-background rounded-lg border border-border hover:border-accent transition-colors text-sm font-medium">
              → Manage Members
            </a>
            <a href="/admin/events" className="block p-4 bg-background rounded-lg border border-border hover:border-accent transition-colors text-sm font-medium">
              → Create Event
            </a>
            <a href="/admin/settings" className="block p-4 bg-background rounded-lg border border-border hover:border-accent transition-colors text-sm font-medium">
              → Configure Settings
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

