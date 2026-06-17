'use client';

import { useAuth } from '@/context/AuthContext';
import { Copy, Check, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

export default function CredentialsPage() {
  const { currentUser, userData } = useAuth();
  const [copied, setCopied] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold mb-2">Your Credentials</h1>
        <p className="text-muted-foreground">View your account information and security details</p>
      </div>

      {/* Account Credentials */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="bg-muted px-6 py-4 border-b border-border">
          <h2 className="font-heading font-bold">Account Credentials</h2>
        </div>
        
        <div className="p-6 space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Email Address
            </label>
            <div className="flex items-center gap-2">
              <input
                type="email"
                value={currentUser?.email || ''}
                readOnly
                className="flex-1 px-4 py-2 rounded-lg border border-border bg-muted text-foreground font-mono text-sm"
              />
              <button
                onClick={() => handleCopy(currentUser?.email || '', 'email')}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                title="Copy email"
              >
                {copied === 'email' ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Your primary login email address
            </p>
          </div>

          {/* User ID */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              User ID
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={currentUser?.uid || ''}
                readOnly
                className="flex-1 px-4 py-2 rounded-lg border border-border bg-muted text-foreground font-mono text-sm"
              />
              <button
                onClick={() => handleCopy(currentUser?.uid || '', 'uid')}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                title="Copy User ID"
              >
                {copied === 'uid' ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Unique identifier for your account
            </p>
          </div>

          {/* API Key (masked) */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              API Access Key
            </label>
            <div className="flex items-center gap-2">
              <input
                type={showPassword ? 'text' : 'password'}
                value={currentUser?.uid ? `key_${currentUser.uid.substring(0, 12)}${'*'.repeat(20)}` : 'Not available'}
                readOnly
                className="flex-1 px-4 py-2 rounded-lg border border-border bg-muted text-foreground font-mono text-sm"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                title={showPassword ? 'Hide' : 'Show'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Eye className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Used for secure API authentication
            </p>
          </div>
        </div>
      </div>

      {/* Membership Details */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="bg-muted px-6 py-4 border-b border-border">
          <h2 className="font-heading font-bold">Membership Details</h2>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Membership Tier</p>
              <p className="text-lg font-semibold capitalize text-accent">{userData?.membershipTier || 'Member'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Account Status</p>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  userData?.status === 'active' ? 'bg-green-500' :
                  userData?.status === 'inactive' ? 'bg-gray-500' :
                  'bg-red-500'
                }`}></div>
                <p className="text-lg font-semibold capitalize">{userData?.status || 'Active'}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Member Since</p>
              <p className="text-lg font-semibold">
                {userData?.joinedAt ? new Date(userData.joinedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'Recently'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Last Updated</p>
              <p className="text-lg font-semibold">
                {userData?.updatedAt ? new Date(userData.updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Security Information */}
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-6">
        <h3 className="font-heading font-bold text-blue-900 dark:text-blue-300 mb-3">Security Tips</h3>
        <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-400">
          <li className="flex gap-2">
            <span className="text-blue-600 dark:text-blue-300 font-bold">•</span>
            <span>Never share your User ID or API Key with anyone</span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-600 dark:text-blue-300 font-bold">•</span>
            <span>Always use a strong, unique password for your account</span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-600 dark:text-blue-300 font-bold">•</span>
            <span>Keep your email address up to date for account recovery</span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-600 dark:text-blue-300 font-bold">•</span>
            <span>Log out of your account on shared devices</span>
          </li>
        </ul>
      </div>

      {/* Change Password */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="bg-muted px-6 py-4 border-b border-border">
          <h2 className="font-heading font-bold">Change Password</h2>
        </div>
        
        <div className="p-6">
          <p className="text-sm text-muted-foreground mb-4">
            To change your password, please use the account settings or contact support.
          </p>
          <button className="px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded-lg text-sm font-medium transition-colors">
            Reset Password
          </button>
        </div>
      </div>
    </div>
  );
}
