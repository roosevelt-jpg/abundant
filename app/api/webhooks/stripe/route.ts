import { NextRequest, NextResponse } from 'next/server';
import { getStripe, getWebhookSecret } from '@/lib/stripe-server';
import { getAdminDb } from '@/lib/firebase-admin';
import { generateEventCode } from '@/lib/event-checkin';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature');

    if (!sig) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const stripe = await getStripe();
    const webhookSecret = await getWebhookSecret();

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const db = getAdminDb();

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { userId, planId, eventId, type } = session.metadata || {};

        if (type === 'subscription' && userId && planId) {
          const subscriptionId = typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription?.id;

          const planDoc = await db.collection('membershipPlans').doc(planId).get();
          const tier = planDoc.data()?.tier || 'member';

          await db.collection('users').doc(userId).update({
            subscriptionId,
            subscriptionStatus: 'active',
            planId,
            membershipTier: tier,
            stripeCustomerId: session.customer,
            updatedAt: Date.now(),
          });

          // Activate member record for event access / discounts
          const memberRef = db.collection('members').doc(userId);
          const memberSnap = await memberRef.get();
          const mappedTier =
            tier === 'elite' || tier === 'founding_circle'
              ? 'founding_circle'
              : tier === 'inner-circle' || tier === 'private'
                ? 'private'
                : tier === 'global' || tier === 'member'
                  ? 'global'
                  : 'global';
          if (memberSnap.exists) {
            await memberRef.update({
              tier: mappedTier,
              tierStatus: 'active',
              updatedAt: Date.now(),
            });
          } else {
            await memberRef.set({
              uid: userId,
              tier: mappedTier,
              tierStatus: 'active',
              expertiseTags: [],
              directoryVisibility: 'members_only',
              socialLinks: {},
              availableForIntros: true,
              notificationPrefs: { eventInvites: true, weeklyDigest: true, introRequests: true },
              createdAt: Date.now(),
              updatedAt: Date.now(),
            });
          }
        }

        if (type === 'event' && userId && eventId) {
          const userDoc = await db.collection('users').doc(userId).get();
          const eventDoc = await db.collection('events').doc(eventId).get();

          if (eventDoc.exists) {
            const discountCodeId = session.metadata?.discountCodeId;
            const discountCode = session.metadata?.discountCode;
            const discountAmount = parseFloat(session.metadata?.discountAmount || '0');

            const regRef = db.collection('eventRegistrations').doc();
            await regRef.set({
              id: regRef.id,
              eventId,
              userId,
              userName: userDoc.data()?.displayName || session.customer_email,
              userEmail: session.customer_email,
              registeredAt: Date.now(),
              status: 'registered',
              paymentStatus: 'paid',
              stripePaymentId: session.payment_intent,
              amountPaid: (session.amount_total || 0) / 100,
              discountCode: discountCode || undefined,
              discountAmount: discountAmount || undefined,
              ticketTierId: session.metadata?.ticketTierId || undefined,
              ticketTierName: session.metadata?.ticketTierName || undefined,
              checkInCode: generateEventCode(8),
            });

            const ev = eventDoc.data()!;
            await eventDoc.ref.update({ registered: (ev.registered || 0) + 1 });

            if (discountCodeId) {
              const codeRef = db.collection('eventDiscountCodes').doc(discountCodeId);
              const codeDoc = await codeRef.get();
              if (codeDoc.exists) {
                const codeData = codeDoc.data()!;
                await codeRef.update({ usedCount: (codeData.usedCount || 0) + 1 });
              }
            }
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const users = await db.collection('users').where('subscriptionId', '==', sub.id).get();
        for (const doc of users.docs) {
          await doc.ref.update({
            subscriptionStatus: sub.status,
            updatedAt: Date.now(),
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const users = await db.collection('users').where('subscriptionId', '==', sub.id).get();
        for (const doc of users.docs) {
          await doc.ref.update({
            subscriptionStatus: 'canceled',
            updatedAt: Date.now(),
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = typeof (invoice as Stripe.Invoice & { subscription?: string | Stripe.Subscription }).subscription === 'string'
          ? (invoice as Stripe.Invoice & { subscription?: string }).subscription
          : undefined;
        if (subId) {
          const users = await db.collection('users').where('subscriptionId', '==', subId).get();
          for (const doc of users.docs) {
            await doc.ref.update({ subscriptionStatus: 'past_due', updatedAt: Date.now() });
          }
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
