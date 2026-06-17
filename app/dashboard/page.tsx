'use client';

import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Dashboard() {
  const { currentUser, userData, loading } = useAuth();
  const router = useRouter();
  const [showTimeout, setShowTimeout] = useState(false);

  useEffect(() => {
    // If auth has finished loading and no user, redirect to login
    if (!loading && !currentUser) {
      console.log('[v0] No current user, redirecting to login');
      router.push('/login');
    }
  }, [currentUser, loading, router]);

  // If admin, redirect to admin dashboard
  useEffect(() => {
    if (!loading && currentUser) {
      // Check both role and email to ensure admin detection works
      const isAdmin = userData?.role === 'admin' || currentUser.email === 'admin@abundantglobalclub.com';
      if (isAdmin) {
        console.log('[v0] Admin user detected, redirecting to /admin/dashboard');
        router.push('/admin/dashboard');
      }
    }
  }, [currentUser, userData, loading, router]);

  // Show timeout message if loading takes too long
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        setShowTimeout(true);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [loading]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
          {showTimeout && (
            <div className="text-sm text-orange-600 mt-4">
              <p>Taking longer than expected.</p>
              <button 
                onClick={() => window.location.reload()}
                className="text-accent hover:underline mt-2"
              >
                Try refreshing the page
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // If still not logged in after loading completes, return nothing (redirect will happen)
  if (!currentUser) {
    return null;
  }

  // User is authenticated - show dashboard
  const displayName = userData?.displayName || currentUser.email || 'Member';
  const joinedDate = userData?.joinedAt ? new Date(userData.joinedAt).toLocaleDateString() : 'Recently';
  const status = userData?.status || 'active';
  const membershipTier = userData?.membershipTier || 'member';

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <h1 className="font-heading text-4xl font-bold mb-2">Welcome, {displayName}!</h1>
            <p className="text-muted-foreground">Member since {joinedDate}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="p-6 bg-card rounded-xl border border-border">
              <h3 className="font-heading font-bold mb-4">Your Status</h3>
              <p className="text-sm text-muted-foreground mb-2">
                <span className="font-semibold text-foreground capitalize">{status}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {status === 'active' && 'Your account is active'}
                {status === 'inactive' && 'Your account is inactive'}
                {status === 'suspended' && 'Your account is suspended - contact support'}
              </p>
            </div>

            <div className="p-6 bg-card rounded-xl border border-border">
              <h3 className="font-heading font-bold mb-4">Membership Tier</h3>
              <p className="text-sm text-muted-foreground mb-2">
                <span className="font-semibold text-accent capitalize">{membershipTier}</span>
              </p>
              <Link href="/membership" className="text-xs text-accent hover:text-accent/80">
                Upgrade →
              </Link>
            </div>

            <div className="p-6 bg-card rounded-xl border border-border">
              <h3 className="font-heading font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/dashboard/profile" className="text-accent hover:text-accent/80">Edit Profile</Link></li>
                <li><Link href="/events" className="text-accent hover:text-accent/80">View Events</Link></li>
                <li><Link href="/dashboard/testimonials" className="text-accent hover:text-accent/80">Share Testimonial</Link></li>
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-card rounded-xl border border-border">
              <h3 className="font-heading text-lg font-bold mb-4">Upcoming Events</h3>
              <p className="text-muted-foreground text-sm">No events scheduled yet</p>
            </div>

            <div className="p-6 bg-card rounded-xl border border-border">
              <h3 className="font-heading text-lg font-bold mb-4">Recent Activity</h3>
              <p className="text-muted-foreground text-sm">Your activity will appear here</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
