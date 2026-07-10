import { NextRequest, NextResponse } from 'next/server';

/**
 * Admin routes are protected client-side by AdminProtectedLayout (Firebase Auth).
 * A soft session cookie is still set for convenience, but we no longer hard-block
 * here — a missing cookie was bouncing signed-in users back to /login forever.
 */
export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
