import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function GET() {
  try {
    console.log('Testing Stripe integration...');
    console.log('STRIPE_SECRET_KEY exists:', !!process.env.STRIPE_SECRET_KEY);
    console.log('Key starts with:', process.env.STRIPE_SECRET_KEY?.substring(0, 10));
    
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'No Stripe secret key found' }, { status: 500 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20', // Match the payment intent endpoint
      timeout: 20000, // 20 second timeout
      maxNetworkRetries: 2, // Enable retries like payment endpoint
    });

    // First test: Try creating a payment intent (same as main endpoint)
    console.log('Testing payment intent creation...');
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 100, // $1.00 in cents
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        testRideId: 'stripe-test-endpoint',
        customerEmail: 'test@stripe-endpoint.com',
        type: 'test_ride_hold',
      },
      capture_method: 'manual',
      description: 'Stripe Test Endpoint - Payment Intent Creation Test',
    });
    
    console.log('Payment intent created successfully:', paymentIntent.id);

    // Also test account retrieval
    const account = await stripe.accounts.retrieve();
    
    return NextResponse.json({
      success: true,
      payment_intent_test: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        client_secret: paymentIntent.client_secret ? 'present' : 'missing'
      },
      account_test: {
        id: account.id,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled
      }
    });
  } catch (error) {
    console.error('Stripe test error:', error);
    return NextResponse.json({
      error: 'Stripe test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}