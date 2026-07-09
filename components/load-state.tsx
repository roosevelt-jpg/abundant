'use client';

import { ReactNode } from 'react';

interface LoadStateProps {
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  loadingMessage?: string;
  children: ReactNode;
}

export function LoadState({
  loading,
  error,
  onRetry,
  loadingMessage = 'Loading...',
  children,
}: LoadStateProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">{loadingMessage}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center max-w-md">
          <p className="text-destructive mb-4">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-semibold hover:bg-accent/90"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
