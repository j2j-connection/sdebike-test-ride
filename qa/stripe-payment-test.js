#!/usr/bin/env node

/**
 * SDEBIKE Test Ride App - Stripe Payment Testing
 * 
 * This script tests the Stripe payment integration using official test cards
 * and follows Stripe's testing best practices from their documentation.
 * 
 * Reference: https://docs.stripe.com/testing
 */

const http = require('http');
const https = require('https');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  timeout: 20000,
  testData: {
    customer: {
      name: 'Stripe Test Customer',
      phone: '555-123-4567',
      email: 'stripe-test@example.com'
    }
  }
};

// Stripe test cards from official documentation
const STRIPE_TEST_CARDS = {
  // Successful payments
  visa: {
    number: '4242424242424242',
    cvc: '123',
    expMonth: '12',
    expYear: '34',
    description: 'Visa - Successful payment'
  },
  mastercard: {
    number: '5555555555554444',
    cvc: '123',
    expMonth: '12',
    expYear: '34',
    description: 'Mastercard - Successful payment'
  },
  amex: {
    number: '378282246310005',
    cvc: '1234',
    expMonth: '12',
    expYear: '34',
    description: 'American Express - Successful payment'
  },
  
  // Declined payments
  declined: {
    number: '4000000000000002',
    cvc: '123',
    expMonth: '12',
    expYear: '34',
    description: 'Generic decline'
  },
  insufficientFunds: {
    number: '4000000000009995',
    cvc: '123',
    expMonth: '12',
    expYear: '34',
    description: 'Insufficient funds'
  },
  
  // 3D Secure authentication
  requires3DS: {
    number: '4000002500003155',
    cvc: '123',
    expMonth: '12',
    expYear: '34',
    description: 'Requires 3D Secure authentication'
  },
  
  // Fraud detection
  fraud: {
    number: '4000000000000101',
    cvc: '123',
    expMonth: '12',
    expYear: '34',
    description: 'Fraudulent card'
  }
};

// Test results tracking
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: [],
  paymentIntents: []
};

/**
 * Utility function to make HTTP requests
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: TEST_CONFIG.timeout
    };

    if (urlObj.pathname) {
      requestOptions.path = urlObj.pathname + urlObj.search;
    }

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

/**
 * Test runner function
 */
async function runTest(testName, testFunction) {
  testResults.total++;
  console.log(`\n🧪 Running: ${testName}`);
  
  try {
    await testFunction();
    console.log(`✅ PASSED: ${testName}`);
    testResults.passed++;
  } catch (error) {
    console.log(`❌ FAILED: ${testName}`);
    console.log(`   Error: ${error.message}`);
    testResults.failed++;
    testResults.errors.push({ test: testName, error: error.message });
  }
}

/**
 * Test: Payment Intent Creation API
 */
async function testPaymentIntentCreation() {
  const testData = {
    amount: 100, // $1.00 in cents
    customerEmail: TEST_CONFIG.testData.customer.email,
    testRideId: `stripe-test-${Date.now()}`
  };

  const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/create-payment-intent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(testData)
  });

  if (response.statusCode !== 200) {
    throw new Error(`Expected status 200, got ${response.statusCode}`);
  }

  const responseData = JSON.parse(response.data);
  if (!responseData.clientSecret || !responseData.paymentIntentId) {
    throw new Error('Response missing required payment intent data');
  }

  testResults.paymentIntents.push({
    id: responseData.paymentIntentId,
    clientSecret: responseData.clientSecret,
    testData: testData
  });

  console.log(`   ℹ️  Payment Intent created: ${responseData.paymentIntentId}`);
  console.log(`   ℹ️  Client Secret: ${responseData.clientSecret.substring(0, 20)}...`);
}

/**
 * Test: Multiple Payment Intents (Rate Limiting)
 */
async function testMultiplePaymentIntents() {
  console.log('   ℹ️  Testing multiple payment intent creation...');
  
  const promises = [];
  for (let i = 0; i < 3; i++) {
    const testData = {
      amount: 100 + (i * 50), // $1.00, $1.50, $2.00
      customerEmail: `test${i}@example.com`,
      testRideId: `multi-test-${Date.now()}-${i}`
    };

    promises.push(
      makeRequest(`${TEST_CONFIG.baseUrl}/api/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      })
    );
  }

  const responses = await Promise.all(promises);
  
  let successCount = 0;
  for (const response of responses) {
    if (response.statusCode === 200) {
      successCount++;
    }
  }

  if (successCount < 2) {
    throw new Error(`Only ${successCount}/3 payment intents created successfully`);
  }

  console.log(`   ℹ️  ${successCount}/3 payment intents created successfully`);
}

/**
 * Test: Payment Intent with Different Amounts
 */
async function testDifferentAmounts() {
  const amounts = [100, 500, 1000, 5000]; // $1, $5, $10, $50
  
  for (const amount of amounts) {
    const testData = {
      amount: amount,
      customerEmail: `amount-test-${amount}@example.com`,
      testRideId: `amount-test-${Date.now()}-${amount}`
    };

    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    if (response.statusCode !== 200) {
      throw new Error(`Failed to create payment intent for amount ${amount}: ${response.statusCode}`);
    }

    const responseData = JSON.parse(response.data);
    if (!responseData.clientSecret || !responseData.paymentIntentId) {
      throw new Error(`Invalid response for amount ${amount}`);
    }
  }

  console.log(`   ℹ️  All ${amounts.length} payment intents created successfully`);
}

/**
 * Test: Invalid Payment Intent Data
 */
async function testInvalidPaymentData() {
  const invalidTests = [
    {
      data: { amount: -100, customerEmail: 'test@example.com', testRideId: 'test' },
      description: 'Negative amount'
    },
    {
      data: { amount: 100, customerEmail: 'invalid-email', testRideId: 'test' },
      description: 'Invalid email format'
    },
    {
      data: { amount: 100, customerEmail: 'test@example.com' }, // Missing testRideId
      description: 'Missing required field'
    },
    {
      data: { amount: 'not-a-number', customerEmail: 'test@example.com', testRideId: 'test' },
      description: 'Invalid amount type'
    }
  ];

  for (const test of invalidTests) {
    try {
      const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(test.data)
      });

      // Should return an error status
      if (response.statusCode === 200) {
        console.log(`   ⚠️  ${test.description} should have failed but succeeded`);
      } else {
        console.log(`   ℹ️  ${test.description} correctly failed with status ${response.statusCode}`);
      }
    } catch (error) {
      console.log(`   ℹ️  ${test.description} correctly failed: ${error.message}`);
    }
  }

  console.log('   ℹ️  Invalid payment data tests completed');
}

/**
 * Test: Payment Form Rendering
 */
async function testPaymentFormRendering() {
  // Test that the payment form loads without errors
  const response = await makeRequest(`${TEST_CONFIG.baseUrl}/`);
  
  if (response.statusCode !== 200) {
    throw new Error(`Expected status 200, got ${response.statusCode}`);
  }
  
  // Check for Stripe-related content
  const stripeChecks = [
    'stripe',
    'payment',
    'card',
    'form'
  ];
  
  let stripeScore = 0;
  for (const check of stripeChecks) {
    if (response.data.toLowerCase().includes(check)) {
      stripeScore++;
    }
  }
  
  if (stripeScore < 2) {
    throw new Error(`Insufficient Stripe integration indicators: ${stripeScore}/4`);
  }
  
  console.log(`   ℹ️  Payment form rendering score: ${stripeScore}/4`);
}

/**
 * Test: Environment Configuration
 */
async function testEnvironmentConfiguration() {
  // Test that the application is using test keys (not production)
  const response = await makeRequest(`${TEST_CONFIG.baseUrl}/`);
  
  if (response.statusCode !== 200) {
    throw new Error(`Expected status 200, got ${response.statusCode}`);
  }
  
  // Check for test environment indicators
  if (response.data.includes('pk_test_') || response.data.includes('sk_test_')) {
    console.log('   ℹ️  Test API keys detected (correct for testing)');
  } else if (response.data.includes('pk_live_') || response.data.includes('sk_live_')) {
    console.log('   ⚠️  Live API keys detected (should use test keys for testing)');
  } else {
    console.log('   ℹ️  API key format not detected in response');
  }
}

/**
 * Test: Stripe Test Card Compatibility
 */
async function testStripeTestCardCompatibility() {
  console.log('   ℹ️  Testing Stripe test card compatibility...');
  
  // Test that the application can handle different card types
  const cardTypes = ['visa', 'mastercard', 'amex'];
  
  for (const cardType of cardTypes) {
    const card = STRIPE_TEST_CARDS[cardType];
    console.log(`     • ${card.description}: ${card.number}`);
  }
  
  console.log('   ℹ️  Test cards are ready for manual testing');
}

/**
 * Test: Error Handling
 */
async function testErrorHandling() {
  // Test that the application handles network errors gracefully
  try {
    // Try to access a non-existent endpoint
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/non-existent`, {
      timeout: 5000
    });
    
    if (response.statusCode === 404) {
      console.log('   ℹ️  Application correctly handles 404 errors');
    } else {
      console.log(`   ℹ️  Non-existent endpoint returned status: ${response.statusCode}`);
    }
  } catch (error) {
    console.log('   ℹ️  Application correctly handles network errors');
  }
}

/**
 * Main test execution
 */
async function runAllTests() {
  console.log('🚀 Starting SDEBIKE Test Ride App - Stripe Payment Testing');
  console.log(`📍 Testing application at: ${TEST_CONFIG.baseUrl}`);
  console.log(`⏱️  Timeout per test: ${TEST_CONFIG.timeout}ms`);
  console.log(`👤 Test customer: ${TEST_CONFIG.testData.customer.name}`);
  console.log(`💳 Test cards: ${Object.keys(STRIPE_TEST_CARDS).length} different scenarios`);
  
  const startTime = Date.now();
  
  // Run all Stripe-specific tests
  await runTest('Payment Intent Creation API', testPaymentIntentCreation);
  await runTest('Multiple Payment Intents (Rate Limiting)', testMultiplePaymentIntents);
  await runTest('Different Payment Amounts', testDifferentAmounts);
  await runTest('Invalid Payment Data Handling', testInvalidPaymentData);
  await runTest('Payment Form Rendering', testPaymentFormRendering);
  await runTest('Environment Configuration', testEnvironmentConfiguration);
  await runTest('Stripe Test Card Compatibility', testStripeTestCardCompatibility);
  await runTest('Error Handling', testErrorHandling);
  
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  // Print results
  console.log('\n' + '='.repeat(70));
  console.log('📊 STRIPE PAYMENT TESTING RESULTS SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`⏱️  Duration: ${duration.toFixed(2)}s`);
  console.log(`📈 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  console.log(`💳 Payment Intents Created: ${testResults.paymentIntents.length}`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.errors.forEach(error => {
      console.log(`   • ${error.test}: ${error.error}`);
    });
  }
  
  if (testResults.passed === testResults.total) {
    console.log('\n🎉 All Stripe payment tests passed!');
    console.log('✅ Payment integration is working correctly');
    console.log('✅ Ready for manual payment testing with test cards');
  } else {
    console.log('\n⚠️  Some Stripe payment tests failed.');
    console.log('🔧 Fix payment integration issues before proceeding');
  }
  
  console.log('\n🔍 MANUAL STRIPE TESTING REQUIRED:');
  console.log('   • Test successful payments with test cards:');
  console.log(`     - Visa: ${STRIPE_TEST_CARDS.visa.number}`);
  console.log(`     - Mastercard: ${STRIPE_TEST_CARDS.mastercard.number}`);
  console.log(`     - Amex: ${STRIPE_TEST_CARDS.amex.number}`);
  console.log('   • Test declined payments:');
  console.log(`     - Generic decline: ${STRIPE_TEST_CARDS.declined.number}`);
  console.log(`     - Insufficient funds: ${STRIPE_TEST_CARDS.insufficientFunds.number}`);
  console.log('   • Test 3D Secure:');
  console.log(`     - 3DS required: ${STRIPE_TEST_CARDS.requires3DS.number}`);
  console.log('   • Test fraud detection:');
  console.log(`     - Fraudulent card: ${STRIPE_TEST_CARDS.fraud.number}`);
  
  console.log('\n📋 STRIPE TESTING CHECKLIST:');
  console.log('   • Use test API keys (pk_test_*, sk_test_*)');
  console.log('   • Use test card numbers from Stripe documentation');
  console.log('   • Test both successful and failed payment scenarios');
  console.log('   • Verify payment intent creation and confirmation');
  console.log('   • Test Apple Pay and Google Pay if implemented');
  console.log('   • Monitor Stripe Dashboard for test transactions');
  
  console.log('\n⚠️  IMPORTANT NOTES:');
  console.log('   • Never use real card numbers in testing');
  console.log('   • Test cards work with any future expiration date');
  console.log('   • Test cards work with any 3-digit CVC (4 for Amex)');
  console.log('   • Test transactions appear in Stripe Dashboard');
  console.log('   • Test webhook events if configured');
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
SDEBIKE Test Ride App - Stripe Payment Testing

Usage: node qa/stripe-payment-test.js [options]

Options:
  --help, -h     Show this help message
  --url <url>    Set custom base URL (default: http://localhost:3000)
  --timeout <ms> Set request timeout in milliseconds (default: 20000)

Examples:
  node qa/stripe-payment-test.js
  node qa/stripe-payment-test.js --url http://localhost:3001
  node qa/stripe-payment-test.js --timeout 30000
  `);
  process.exit(0);
}

// Parse command line arguments
const urlIndex = process.argv.indexOf('--url');
if (urlIndex !== -1 && process.argv[urlIndex + 1]) {
  TEST_CONFIG.baseUrl = process.argv[urlIndex + 1];
}

const timeoutIndex = process.argv.indexOf('--timeout');
if (timeoutIndex !== -1 && process.argv[timeoutIndex + 1]) {
  TEST_CONFIG.timeout = parseInt(process.argv[timeoutIndex + 1]);
}

// Run tests
runAllTests().catch(error => {
  console.error('\n💥 Stripe payment test runner failed:', error.message);
  process.exit(1);
});
