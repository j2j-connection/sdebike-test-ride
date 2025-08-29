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
    console.log('Attempting to retrieve Stripe account...');
    
    const account = await stripe.accounts.retrieve();
    
    console.log('Account retrieved successfully:', {
      id: account.id,
      country: account.country,
      business_type: account.business_type,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      capabilities: account.capabilities
    });

    // Check if account is fully verified
    const isFullyVerified = account.charges_enabled && account.payouts_enabled;
    
    return NextResponse.json({
      success: true,
      accountId: account.id,
      country: account.country,
      business_type: account.business_type,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      fully_verified: isFullyVerified,
      capabilities: account.capabilities,
      requirements: account.requirements
    });
  } catch (error) {
    console.error('Stripe test error:', error);
    return NextResponse.json({
      error: 'Stripe test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}