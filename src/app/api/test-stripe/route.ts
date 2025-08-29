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
      apiVersion: '2023-10-16',
      timeout: 20000, // 20 second timeout
      maxNetworkRetries: 0, // No retries for debugging
    });

    // First test: Just retrieve account info (simpler API call)
    const account = await stripe.accounts.retrieve();

    return NextResponse.json({
      success: true,
      accountId: account.id,
      country: account.country,
      capabilities: account.capabilities
    });
  } catch (error) {
    console.error('Stripe test error:', error);
    return NextResponse.json({
      error: 'Stripe test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}