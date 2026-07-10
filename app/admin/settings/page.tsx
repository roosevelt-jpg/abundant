'use client';

import { Suspense } from 'react';
import SettingsEditor from './editor';

export default function AdminSettings() {
  return (
    <Suspense fallback={<div className="text-muted-foreground text-sm">Loading settings...</div>}>
      <SettingsEditor />
    </Suspense>
  );
}

