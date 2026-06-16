'use client';

import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function Dashboard() {
  const { currentUser, userData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block px-4 py-2 bg-card rounded-lg">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!currentUser || !userData) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <h1 className="font-heading text-4xl font-bold mb-2">Welcome, {userData.displayName}!</h1>
            <p className="text-muted-foreground">Member since {new Date(userData.joinedAt).toLocaleDateString()}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="p-6 bg-card rounded-xl border border-border">
              <h3 className="font-heading font-bold mb-4">Your Status</h3>
              <p className="text-sm text-muted-foreground mb-2">
                <span className="font-semibold text-foreground capitalize">{userData.status}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {userData.status === 'active' && 'Your account is active'}
                {userData.status === 'inactive' && 'Your account is inactive'}
                {userData.status === 'suspended' && 'Your account is suspended - contact support'}
              </p>
            </div>

            <div className="p-6 bg-card rounded-xl border border-border">
              <h3 className="font-heading font-bold mb-4">Membership Tier</h3>
              <p className="text-sm text-muted-foreground mb-2">
                <span className="font-semibold text-accent capitalize">{userData.membershipTier}</span>
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
