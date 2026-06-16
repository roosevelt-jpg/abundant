import { NextRequest, NextResponse } from 'next/server';
import { createSubscriptionCheckout, getOrCreateStripeCustomer } from '@/lib/stripe-service';
import { auth } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const { priceId } = await req.json();

    // Get the session/user info from headers or auth
    const userId = req.headers.get('x-user-id');
    const userEmail = req.headers.get('x-user-email');
    const userName = req.headers.get('x-user-name');

    if (!userId || !userEmail || !priceId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    const customer = await getOrCreateStripeCustomer(userId, userEmail, userName);

    // Create checkout session
    const origin = req.headers.get('origin') || process.env.VERCEL_URL || 'http://localhost:3000';
    const session = await createSubscriptionCheckout(
      customer.id,
      priceId,
      `${origin}/billing`
    );

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
