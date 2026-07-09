'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { MemberLocationFields } from '@/components/member-location-fields';
import { MemberProfileFields } from '@/components/member-profile-fields';
import { MemberProfile } from '@/lib/types';
import Link from 'next/link';
import { Mail, Lock, User } from 'lucide-react';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [profile, setProfile] = useState<MemberProfile>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!profile.dateOfBirth) {
      setError('Please enter your date of birth');
      return;
    }
    if (!profile.gender) {
      setError('Please select your gender');
      return;
    }
    if (!profile.profession?.trim()) {
      setError('Please enter your profession');
      return;
    }
    if (!profile.joinReason?.trim()) {
      setError('Please tell us why you joined');
      return;
    }
    if (!profile.country) {
      setError('Please select your country');
      return;
    }
    if (!profile.nationality) {
      setError('Please select your nationality');
      return;
    }
    if (!profile.city) {
      setError('Please select your city');
      return;
    }
    if (!profile.address) {
      setError('Please enter your address');
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password, displayName, profile);
      router.push('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to sign up';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-lg bg-card rounded-xl border border-border p-8">
          <div className="text-center mb-8">
            <h1 className="font-heading text-3xl font-bold mb-2">Join Abundant</h1>
            <p className="text-muted-foreground">Create your member account and start your journey</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="pt-2 border-t border-border">
              <MemberProfileFields value={profile} onChange={setProfile} />
            </div>

            <div className="pt-2 border-t border-border">
              <p className="text-sm font-medium mb-4 text-muted-foreground">Location Details</p>
              <MemberLocationFields value={profile} onChange={setProfile} />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-accent text-accent-foreground rounded-lg font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm space-y-2">
            <p>
              Already have an account?{' '}
              <Link href="/login" className="text-accent hover:text-accent/80 font-semibold">
                Sign In
              </Link>
            </p>
            <p className="text-muted-foreground">
              Invited as an admin?{' '}
              <Link href="/join-admin" className="text-accent hover:text-accent/80 font-semibold">
                Create admin account
              </Link>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
