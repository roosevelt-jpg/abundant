'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

interface User {
  uid: string;
  email: string;
  role: string;
  createdAt?: any;
}

export default function AdminManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      const usersData = snapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
      })) as User[];
      setUsers(usersData);
      console.log('[v0] Loaded users:', usersData);
    } catch (err: any) {
      console.error('[v0] Error loading users:', err);
      setError('Failed to load users from Firestore');
    } finally {
      setLoading(false);
    }
  };

  const makeUserAdmin = async (userId: string, email: string) => {
    try {
      setError('');
      setMessage('');
      console.log('[v0] Setting admin role for:', email);
      
      await updateDoc(doc(db, 'users', userId), {
        role: 'admin',
      });
      
      console.log('[v0] User made admin:', email);
      setMessage(`✓ ${email} is now an admin`);
      await loadUsers();
    } catch (err: any) {
      console.error('[v0] Error:', err);
      setError('Failed to update user role: ' + err.message);
    }
  };

  const makeUserMember = async (userId: string, email: string) => {
    try {
      setError('');
      setMessage('');
      console.log('[v0] Setting member role for:', email);
      
      await updateDoc(doc(db, 'users', userId), {
        role: 'member',
      });
      
      console.log('[v0] User made member:', email);
      setMessage(`✓ ${email} is now a member`);
      await loadUsers();
    } catch (err: any) {
      console.error('[v0] Error:', err);
      setError('Failed to update user role: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card rounded-xl border border-border p-8">
            <h1 className="font-heading text-3xl font-bold mb-2">User & Admin Manager</h1>
            <p className="text-muted-foreground mb-8">
              View all users and manage their admin roles. Use this to promote members to admin or demote admins to members.
            </p>

            {/* Messages */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500">
                {error}
              </div>
            )}
            {message && (
              <div className="mb-6 p-4 bg-green-500/10 border border-green-500 rounded-lg text-green-500">
                {message}
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading users...</p>
              </div>
            )}

            {/* Users Table */}
            {!loading && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold">Email</th>
                      <th className="text-left py-3 px-4 font-semibold">Current Role</th>
                      <th className="text-left py-3 px-4 font-semibold">User ID</th>
                      <th className="text-left py-3 px-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 px-4 text-center text-muted-foreground">
                          No users found
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => (
                        <tr key={user.uid} className="border-b border-border hover:bg-background/50">
                          <td className="py-3 px-4 font-medium">{user.email}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                user.role === 'admin'
                                  ? 'bg-accent/20 text-accent'
                                  : 'bg-muted/50 text-muted-foreground'
                              }`}
                            >
                              {user.role || 'member'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs text-muted-foreground font-mono">
                            {user.uid.substring(0, 8)}...
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              {user.role !== 'admin' ? (
                                <button
                                  onClick={() => makeUserAdmin(user.uid, user.email)}
                                  className="px-3 py-1 bg-accent/20 text-accent rounded text-sm hover:bg-accent/30 transition-colors"
                                >
                                  Make Admin
                                </button>
                              ) : (
                                <button
                                  onClick={() => makeUserMember(user.uid, user.email)}
                                  className="px-3 py-1 bg-red-500/20 text-red-500 rounded text-sm hover:bg-red-500/30 transition-colors"
                                >
                                  Remove Admin
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Instructions */}
            <div className="mt-8 pt-8 border-t border-border space-y-4">
              <div>
                <h3 className="font-semibold mb-2">How to promote a user to admin:</h3>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Find the user in the table above</li>
                  <li>Click "Make Admin" button</li>
                  <li>The user will now have admin access</li>
                  <li>They will see the admin dashboard when they next login</li>
                </ol>
              </div>

              <div className="p-4 bg-blue-500/10 border border-blue-500 rounded-lg text-sm text-blue-500">
                <strong>Note:</strong> For amara@abundantglobalclub.com, click "Make Admin" to give them admin access.
                After that, they can login and will be taken to the admin dashboard.
              </div>

              <div className="mt-4 space-y-2">
                <a href="/login" className="block text-accent hover:underline">
                  → Go to Login Page
                </a>
                <a href="/admin" className="block text-accent hover:underline">
                  → Go to Admin Dashboard
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
