import Stripe from 'stripe';

let stripe: Stripe | null = null;

function getStripeClient(): Stripe {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-10.acacia' as any,
    });
  }
  return stripe as any;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  description: string;
  features: string[];
}

// Get or create Stripe customer
export async function getOrCreateStripeCustomer(userId: string, email: string, name?: string) {
  try {
    const stripeClient = getStripeClient();
    if (!stripeClient) throw new Error('Stripe not configured');
    
    // Search for existing customer
    const customers = await stripeClient.customers.list({
      email,
      limit: 1
    });

    if (customers.data.length > 0) {
      return customers.data[0];
    }

    // Create new customer
    return await stripeClient.customers.create({
      email,
      name: name || 'Member',
      metadata: { userId }
    });
  } catch (error) {
    console.error('Error getting/creating Stripe customer:', error);
    throw error;
  }
}

// Create subscription checkout session
export async function createSubscriptionCheckout(
  customerId: string,
  priceId: string,
  returnUrl: string
) {
  try {
    const stripeClient = getStripeClient();
    if (!stripeClient) throw new Error('Stripe not configured');
    
    const session = await stripeClient.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: returnUrl,
      subscription_data: {
        trial_period_days: 7
      }
    });

    return session;
  } catch (error) {
    console.error('Error creating subscription checkout:', error);
    throw error;
  }
}

// Get subscription status
export async function getSubscriptionStatus(subscriptionId: string) {
  try {
    const stripeClient = getStripeClient();
    if (!stripeClient) throw new Error('Stripe not configured');
    
    return await stripeClient.subscriptions.retrieve(subscriptionId);
  } catch (error) {
    console.error('Error getting subscription status:', error);
    throw error;
  }
}

// Cancel subscription
export async function cancelSubscription(subscriptionId: string) {
  try {
    const stripeClient = getStripeClient();
    if (!stripeClient) throw new Error('Stripe not configured');
    
    return await stripeClient.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }
}

// Get customer subscriptions
export async function getCustomerSubscriptions(customerId: string) {
  try {
    const stripeClient = getStripeClient();
    if (!stripeClient) throw new Error('Stripe not configured');
    
    const subscriptions = await stripeClient.subscriptions.list({
      customer: customerId,
      status: 'all'
    });
    return subscriptions.data;
  } catch (error) {
    console.error('Error getting customer subscriptions:', error);
    throw error;
  }
}

// Get product and prices
export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  try {
    const stripeClient = getStripeClient();
    if (!stripeClient) return [];
    
    const products = await stripeClient.products.list({
      active: true,
      limit: 100
    });

    const plans: SubscriptionPlan[] = [];

    for (const product of products.data) {
      const prices = await stripeClient.prices.list({
        product: product.id,
        active: true
      });

      for (const price of prices.data) {
        if (price.recurring) {
          const plan: SubscriptionPlan = {
            id: price.id,
            name: product.name,
            price: price.unit_amount ? price.unit_amount / 100 : 0,
            currency: price.currency,
            interval: price.recurring.interval as 'month' | 'year',
            description: product.description || '',
            features: product.metadata?.features ? JSON.parse(product.metadata.features) : []
          };
          plans.push(plan);
        }
      }
    }

    return plans;
  } catch (error) {
    console.error('Error getting subscription plans:', error);
    return [];
  }
}

// Create or update subscription product
export async function createSubscriptionProduct(
  name: string,
  price: number,
  interval: 'month' | 'year',
  description?: string,
  features?: string[]
) {
  try {
    const stripeClient = getStripeClient();
    if (!stripeClient) throw new Error('Stripe not configured');
    
    const product = await stripeClient.products.create({
      name,
      description,
      metadata: {
        features: JSON.stringify(features || [])
      }
    });

    const stripePrice = await stripeClient.prices.create({
      product: product.id,
      unit_amount: Math.round(price * 100),
      currency: 'usd',
      recurring: {
        interval,
        interval_count: 1
      }
    });

    return {
      product,
      price: stripePrice
    };
  } catch (error) {
    console.error('Error creating subscription product:', error);
    throw error;
  }
}

// Handle webhook events
export async function handleStripeWebhook(event: Stripe.Event) {
  switch (event.type) {
    case 'customer.subscription.updated':
      // Handle subscription updated
      const updatedSub = event.data.object as Stripe.Subscription;
      console.log('[v0] Subscription updated:', updatedSub.id);
      break;

    case 'customer.subscription.deleted':
      // Handle subscription cancelled
      const deletedSub = event.data.object as Stripe.Subscription;
      console.log('[v0] Subscription deleted:', deletedSub.id);
      break;

    case 'invoice.payment_succeeded':
      // Handle successful payment
      const invoice = event.data.object as Stripe.Invoice;
      console.log('[v0] Payment succeeded:', invoice.id);
      break;

    case 'invoice.payment_failed':
      // Handle failed payment
      const failedInvoice = event.data.object as Stripe.Invoice;
      console.log('[v0] Payment failed:', failedInvoice.id);
      break;

    default:
      console.log('[v0] Unhandled event type:', event.type);
  }
}
