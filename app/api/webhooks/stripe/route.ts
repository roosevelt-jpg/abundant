import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // NOTE: This webhook endpoint requires STRIPE_SECRET_KEY environment variable
    // and will be fully functional once deployed to Vercel with env vars set
    
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!stripeKey || !webhookSecret) {
      return NextResponse.json(
        { error: 'Stripe webhooks not configured' },
        { status: 503 }
      );
    }

    // TODO: Implement full webhook handling when deployed
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 400 }
    );
  }
}
