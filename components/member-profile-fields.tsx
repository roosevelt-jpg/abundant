'use client';

import { MemberProfile } from '@/lib/types';

interface Props {
  value: MemberProfile;
  onChange: (profile: MemberProfile) => void;
}

export function MemberProfileFields({ value, onChange }: Props) {
  const set = (key: keyof MemberProfile, val: string) => onChange({ ...value, [key]: val });

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-muted-foreground">About You</p>

      <div>
        <label className="block text-sm font-medium mb-2">Date of Birth</label>
        <input
          type="date"
          value={value.dateOfBirth || ''}
          onChange={(e) => set('dateOfBirth', e.target.value)}
          className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Gender</label>
        <select
          value={value.gender || ''}
          onChange={(e) => set('gender', e.target.value)}
          className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
          required
        >
          <option value="">Select gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
          <option value="prefer_not_to_say">Prefer not to say</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Profession</label>
        <input
          type="text"
          value={value.profession || ''}
          onChange={(e) => set('profession', e.target.value)}
          placeholder="e.g. Entrepreneur, Investor, Consultant"
          className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Why did you join?</label>
        <textarea
          value={value.joinReason || ''}
          onChange={(e) => set('joinReason', e.target.value)}
          placeholder="Tell us what brought you to Abundant Global Club..."
          rows={3}
          className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
          required
        />
      </div>
    </div>
  );
}
