import { NextResponse } from 'next/server';

export async function GET() {
  const tests = [];
  
  try {
    // Test 1: Basic HTTP request to a reliable service
    console.log('Testing basic HTTP connectivity...');
    const httpTest = await fetch('https://httpbin.org/ip', {
      method: 'GET',
      headers: { 'User-Agent': 'Test-Network-Connectivity' }
    });
    tests.push({
      test: 'httpbin.org',
      status: httpTest.status,
      success: httpTest.ok
    });
  } catch (error) {
    tests.push({
      test: 'httpbin.org',
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false
    });
  }

  try {
    // Test 2: Try to reach Stripe's API directly
    console.log('Testing Stripe API connectivity...');
    const stripeTest = await fetch('https://api.stripe.com/v1/account', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'User-Agent': 'Test-Stripe-Connectivity'
      }
    });
    tests.push({
      test: 'api.stripe.com',
      status: stripeTest.status,
      success: stripeTest.ok,
      response: stripeTest.ok ? 'Connected' : await stripeTest.text()
    });
  } catch (error) {
    tests.push({
      test: 'api.stripe.com',
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false
    });
  }

  try {
    // Test 3: Try alternative external API
    console.log('Testing alternative external API...');
    const altTest = await fetch('https://jsonplaceholder.typicode.com/posts/1', {
      method: 'GET'
    });
    tests.push({
      test: 'jsonplaceholder.typicode.com',
      status: altTest.status,
      success: altTest.ok
    });
  } catch (error) {
    tests.push({
      test: 'jsonplaceholder.typicode.com',
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false
    });
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    tests,
    environment: {
      vercel: !!process.env.VERCEL,
      region: process.env.VERCEL_REGION,
      stripe_key_present: !!process.env.STRIPE_SECRET_KEY
    }
  });
}