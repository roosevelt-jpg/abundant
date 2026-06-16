import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // NOTE: This endpoint requires STRIPE_SECRET_KEY environment variable
    // and will be fully functional once deployed to Vercel with env vars set
    
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 503 }
      );
    }

    const { priceId } = await req.json();

    // Get the session/user info from headers
    const userId = req.headers.get('x-user-id');
    const userEmail = req.headers.get('x-user-email');

    if (!userId || !userEmail || !priceId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // TODO: Implement Stripe integration when deployed
    return NextResponse.json({ 
      url: null,
      message: 'Stripe integration will be available in production'
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
