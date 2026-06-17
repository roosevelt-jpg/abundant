'use client';

import { useAuth } from '@/context/AuthContext';
import { Calendar, AlertCircle, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import MemberUpcomingEvents from '@/components/member-upcoming-events';

export default function DashboardHome() {
  const { userData } = useAuth();

  const displayName = userData?.displayName || 'Member';
  const joinedDate = userData?.joinedAt ? new Date(userData.joinedAt).toLocaleDateString() : 'Recently';
  const status = userData?.status || 'active';
  const membershipTier = userData?.membershipTier || 'member';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold mb-2">Welcome back, {displayName}!</h1>
        <p className="text-muted-foreground">Member since {joinedDate}</p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 bg-card rounded-lg border border-border hover:border-accent/50 transition-colors">
          <div className="flex items-start justify-between mb-4">
            <h3 className="font-heading font-semibold text-sm">Account Status</h3>
            <div className={`w-3 h-3 rounded-full ${
              status === 'active' ? 'bg-green-500' :
              status === 'inactive' ? 'bg-gray-500' :
              'bg-red-500'
            }`}></div>
          </div>
          <p className="text-2xl font-bold capitalize mb-2">{status}</p>
          <p className="text-xs text-muted-foreground">
            {status === 'active' && 'Your account is in good standing'}
            {status === 'inactive' && 'Your account is currently inactive'}
            {status === 'suspended' && 'Your account has been suspended'}
          </p>
        </div>

        <div className="p-6 bg-card rounded-lg border border-border hover:border-accent/50 transition-colors">
          <div className="flex items-start justify-between mb-4">
            <h3 className="font-heading font-semibold text-sm">Membership Tier</h3>
            <TrendingUp className="w-4 h-4 text-accent" />
          </div>
          <p className="text-2xl font-bold capitalize mb-2">{membershipTier}</p>
          <Link href="/membership" className="text-xs text-accent hover:text-accent/80 transition-colors">
            View plans →
          </Link>
        </div>

        <div className="p-6 bg-card rounded-lg border border-border hover:border-accent/50 transition-colors">
          <div className="flex items-start justify-between mb-4">
            <h3 className="font-heading font-semibold text-sm">Upcoming</h3>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-bold mb-2">Check Below</p>
          <p className="text-xs text-muted-foreground">
            Your registered events
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-6 bg-card rounded-lg border border-border">
        <h2 className="font-heading font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link 
            href="/dashboard/profile"
            className="p-4 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-sm font-medium text-center"
          >
            Edit Profile
          </Link>
          <Link 
            href="/dashboard/credentials"
            className="p-4 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-sm font-medium text-center"
          >
            View Credentials
          </Link>
          <Link 
            href="/events"
            className="p-4 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-sm font-medium text-center"
          >
            Browse Events
          </Link>
          <Link 
            href="/dashboard/settings"
            className="p-4 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-sm font-medium text-center"
          >
            Account Settings
          </Link>
        </div>
      </div>

      {/* Upcoming Events Section */}
      <div className="p-6 bg-card rounded-lg border border-border">
        <MemberUpcomingEvents />
      </div>

      {/* Info Box */}
      {status === 'active' && membershipTier === 'member' && (
        <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900 dark:text-blue-300">
            <p className="font-semibold mb-1">Upgrade Your Membership</p>
            <p>Unlock premium features by upgrading to Elite or Inner Circle tier.</p>
          </div>
        </div>
      )}
    </div>
  );
}
