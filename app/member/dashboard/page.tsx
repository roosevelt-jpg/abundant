'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Calendar, Zap, LogOut, Clock } from 'lucide-react';

interface MemberDashboardData {
  membershipTier?: string;
  membershipStatus?: 'active' | 'inactive' | 'expired';
  renewalDate?: number;
  upcomingEvents: Array<{
    id: string;
    title: string;
    date: number;
    location?: string;
    description?: string;
  }>;
  benefits: string[];
}

export default function MemberDashboard() {
  const { currentUser, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<MemberDashboardData>({
    upcomingEvents: [],
    benefits: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
      return;
    }

    if (currentUser) {
      loadMemberData();
    }
  }, [currentUser, authLoading, router]);

  const loadMemberData = async () => {
    try {
      setLoading(true);
      
      // Fetch member's membership info
      const memberRes = await fetch(`/api/members/${currentUser?.uid}/subscription`);
      const subscriptionData = memberRes.ok ? await memberRes.json() : {};

      // Fetch upcoming events
      const eventsRes = await fetch('/api/events?status=upcoming&public=true');
      const events = eventsRes.ok ? await eventsRes.json() : [];

      // Fetch membership plan benefits if member is subscribed
      let benefits: string[] = [];
      if (subscriptionData.planId) {
        const plansRes = await fetch('/api/membership-plans');
        if (plansRes.ok) {
          const plans = await plansRes.json();
          const currentPlan = plans.find((p: any) => p.id === subscriptionData.planId);
          benefits = currentPlan?.features || [];
        }
      }

      setDashboardData({
        membershipTier: subscriptionData.planName || 'Free Member',
        membershipStatus: subscriptionData.status || 'active',
        renewalDate: subscriptionData.renewalDate,
        upcomingEvents: events.slice(0, 5),
        benefits
      });
    } catch (error) {
      console.error('[v0] Error loading member data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
    } catch (error) {
      console.error('[v0] Logout error:', error);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border border-accent border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const renewalDate = dashboardData.renewalDate 
    ? new Date(dashboardData.renewalDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-start justify-between mb-12">
          <div>
            <h1 className="font-heading text-4xl font-bold mb-2">Welcome, {currentUser?.displayName || 'Member'}</h1>
            <p className="text-muted-foreground">Manage your membership and events</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

        {/* Membership Status Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 bg-card rounded-xl border border-border">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-5 h-5 text-accent" />
              <h3 className="font-heading font-semibold">Membership Tier</h3>
            </div>
            <p className="text-2xl font-bold">{dashboardData.membershipTier}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Status: <span className={dashboardData.membershipStatus === 'active' ? 'text-green-600' : 'text-orange-600'}>
                {dashboardData.membershipStatus}
              </span>
            </p>
          </div>

          {renewalDate && (
            <div className="p-6 bg-card rounded-xl border border-border">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-5 h-5 text-accent" />
                <h3 className="font-heading font-semibold">Renewal Date</h3>
              </div>
              <p className="text-2xl font-bold">{renewalDate}</p>
              <p className="text-sm text-muted-foreground mt-2">Next billing cycle</p>
            </div>
          )}

          <div className="p-6 bg-card rounded-xl border border-border">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-5 h-5 text-accent" />
              <h3 className="font-heading font-semibold">Upcoming Events</h3>
            </div>
            <p className="text-2xl font-bold">{dashboardData.upcomingEvents.length}</p>
            <p className="text-sm text-muted-foreground mt-2">Available to join</p>
          </div>
        </div>

        {/* Member Benefits */}
        {dashboardData.benefits.length > 0 && (
          <div className="mb-8 p-6 bg-card rounded-xl border border-border">
            <h2 className="font-heading text-xl font-bold mb-4">Your Benefits</h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {dashboardData.benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-accent rounded-full"></span>
                  <span className="text-sm">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Upcoming Events */}
        <div className="p-6 bg-card rounded-xl border border-border">
          <h2 className="font-heading text-xl font-bold mb-6">Upcoming Events</h2>
          {dashboardData.upcomingEvents.length > 0 ? (
            <div className="space-y-4">
              {dashboardData.upcomingEvents.map((event) => (
                <div key={event.id} className="p-4 bg-background rounded-lg border border-border hover:border-accent transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold mb-1">{event.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {new Date(event.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      {event.location && (
                        <p className="text-sm text-muted-foreground">{event.location}</p>
                      )}
                    </div>
                    <button className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/90 transition-colors">
                      Learn More
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No upcoming events at this time.</p>
          )}
        </div>
      </div>
    </div>
  );
}
