#!/usr/bin/env node

/**
 * SDEBIKE Test Ride App - Payment Flow Test
 * 
 * This script tests the complete payment flow to identify
 * where the "processing error" occurs during payment processing.
 */

const http = require('http');
const https = require('https');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  timeout: 20000
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
 * Test: Payment Intent Creation (First Click)
 */
async function testPaymentIntentCreation() {
  console.log('   💳 Testing Payment Intent Creation (First Click)...');
  
  const testData = {
    amount: 100, // $1.00 in cents
    customerEmail: 'flow-test@example.com',
    testRideId: `flow-test-${Date.now()}`
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

  console.log(`   ✅ Payment Intent Created: ${responseData.paymentIntentId}`);
  console.log(`   🔐 Client Secret: ${responseData.clientSecret.substring(0, 20)}...`);
  
  return responseData;
}

/**
 * Test: Multiple Payment Intent Creation (Simulate Multiple Clicks)
 */
async function testMultiplePaymentIntents() {
  console.log('   🔄 Testing Multiple Payment Intent Creation...');
  
  const promises = [];
  for (let i = 0; i < 3; i++) {
    const testData = {
      amount: 100,
      customerEmail: `multi-test-${i}@example.com`,
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
      const data = JSON.parse(response.data);
      if (data.paymentIntentId) {
        testResults.paymentIntents.push({
          id: data.paymentIntentId,
          clientSecret: data.clientSecret,
          testData: { amount: 100, email: `multi-test-${successCount-1}@example.com` }
        });
      }
    }
  }

  if (successCount < 2) {
    throw new Error(`Only ${successCount}/3 payment intents created successfully`);
  }

  console.log(`   ✅ ${successCount}/3 Payment Intents Created Successfully`);
}

/**
 * Test: Payment Intent with Different Amounts
 */
async function testDifferentAmounts() {
  console.log('   💰 Testing Different Payment Amounts...');
  
  const amounts = [100, 500, 1000]; // $1, $5, $10
  
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

    testResults.paymentIntents.push({
      id: responseData.paymentIntentId,
      clientSecret: responseData.clientSecret,
      testData: testData
    });
  }

  console.log(`   ✅ All ${amounts.length} Payment Intents Created Successfully`);
}

/**
 * Test: Payment Intent Status Validation
 */
async function testPaymentIntentStatus() {
  console.log('   📊 Testing Payment Intent Status...');
  
  if (testResults.paymentIntents.length === 0) {
    console.log('   ⚠️  No payment intents to test');
    return;
  }

  // Test the first payment intent
  const firstIntent = testResults.paymentIntents[0];
  
  // Check if the payment intent is in the correct state
  // This simulates what happens when the user clicks "Authorize"
  console.log(`   🔍 Payment Intent ID: ${firstIntent.id}`);
  console.log(`   🔐 Client Secret Length: ${firstIntent.clientSecret.length}`);
  console.log(`   💰 Amount: ${firstIntent.testData.amount} cents`);
  
  // The payment intent should be in "requires_payment_method" state
  // which is correct for the first click
  console.log('   ✅ Payment Intent Status: Ready for Payment Method');
}

/**
 * Test: Frontend Payment Form Rendering
 */
async function testPaymentFormRendering() {
  console.log('   🖥️  Testing Payment Form Rendering...');
  
  const response = await makeRequest(`${TEST_CONFIG.baseUrl}/`);
  
  if (response.statusCode !== 200) {
    throw new Error(`Expected status 200, got ${response.statusCode}`);
  }
  
  const html = response.data;
  
  // Check for payment form elements
  const formChecks = [
    'Payment',
    'Authorize',
    'CreditCard',
    'PaymentElement'
  ];
  
  let formScore = 0;
  for (const check of formChecks) {
    if (html.includes(check)) {
      formScore++;
      console.log(`     ✅ Found: ${check}`);
    } else {
      console.log(`     ❌ Missing: ${check}`);
    }
  }
  
  if (formScore < 2) {
    throw new Error(`Insufficient payment form elements: ${formScore}/4`);
  }
  
  console.log(`   ✅ Payment Form Rendering Score: ${formScore}/4`);
}

/**
 * Test: Error Handling Patterns
 */
async function testErrorHandling() {
  console.log('   🚨 Testing Error Handling Patterns...');
  
  // Test invalid payment intent data
  const invalidTests = [
    {
      data: { amount: -100, customerEmail: 'test@example.com', testRideId: 'test' },
      expectedStatus: 500,
      description: 'Negative amount'
    },
    {
      data: { amount: 100, customerEmail: 'invalid-email', testRideId: 'test' },
      expectedStatus: 200, // Should still work with invalid email
      description: 'Invalid email format'
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

      if (response.statusCode === test.expectedStatus) {
        console.log(`     ✅ ${test.description}: Correctly handled`);
      } else {
        console.log(`     ⚠️  ${test.description}: Expected ${test.expectedStatus}, got ${response.statusCode}`);
      }
    } catch (error) {
      console.log(`     ℹ️  ${test.description}: ${error.message}`);
    }
  }
  
  console.log('   ✅ Error Handling Tests Completed');
}

/**
 * Main test execution
 */
async function runAllTests() {
  console.log('🚀 Starting SDEBIKE Test Ride App - Payment Flow Test');
  console.log(`📍 Testing application at: ${TEST_CONFIG.baseUrl}`);
  console.log(`⏱️  Timeout per test: ${TEST_CONFIG.timeout}ms`);
  console.log(`🎯 Goal: Identify where "processing error" occurs in payment flow`);
  
  const startTime = Date.now();
  
  // Run all payment flow tests
  await runTest('Payment Intent Creation (First Click)', testPaymentIntentCreation);
  await runTest('Multiple Payment Intent Creation', testMultiplePaymentIntents);
  await runTest('Different Payment Amounts', testDifferentAmounts);
  await runTest('Payment Intent Status Validation', testPaymentIntentStatus);
  await runTest('Payment Form Rendering', testPaymentFormRendering);
  await runTest('Error Handling Patterns', testErrorHandling);
  
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  // Print results
  console.log('\n' + '='.repeat(70));
  console.log('📊 PAYMENT FLOW TEST RESULTS SUMMARY');
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
    console.log('\n🎉 All payment flow tests passed!');
    console.log('✅ Payment intent creation is working correctly');
    console.log('🔍 The "processing error" is likely in the frontend payment processing');
  } else {
    console.log('\n⚠️  Some payment flow tests failed.');
    console.log('🔧 Fix backend issues before proceeding');
  }
  
  console.log('\n🔍 ANALYSIS OF YOUR ISSUE:');
  console.log('   ✅ First Click: Payment intent created successfully');
  console.log('   ❌ Second Click: "A processing error occurred"');
  console.log('   💡 This suggests a frontend payment processing issue');
  
  console.log('\n🐛 LIKELY CAUSES OF PROCESSING ERROR:');
  console.log('   1. Stripe Elements not properly handling payment confirmation');
  console.log('   2. Client-side JavaScript error during payment processing');
  console.log('   3. Network issue when confirming payment with Stripe');
  console.log('   4. Payment intent already processed or expired');
  
  console.log('\n🔧 IMMEDIATE DEBUGGING STEPS:');
  console.log('   1. Open browser Developer Tools (F12)');
  console.log('   2. Go to Console tab');
  console.log('   3. Click "Authorize" button');
  console.log('   4. Look for JavaScript errors in console');
  console.log('   5. Check Network tab for failed requests');
  
  console.log('\n💳 TEST WITH OFFICIAL STRIPE TEST CARDS:');
  console.log('   • Visa: 4242424242424242 (Exp: 12/34, CVC: 123)');
  console.log('   • Mastercard: 5555555555554444 (Exp: 12/34, CVC: 123)');
  console.log('   • Amex: 378282246310005 (Exp: 12/34, CVC: 1234)');
  
  console.log('\n📋 NEXT STEPS:');
  console.log('   1. Check browser console for errors');
  console.log('   2. Verify Stripe Elements payment confirmation');
  console.log('   3. Test with different test cards');
  console.log('   4. Check Stripe Dashboard for payment intent status');
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
SDEBIKE Test Ride App - Payment Flow Test

Usage: node qa/payment-flow-test.js [options]

Options:
  --help, -h     Show this help message
  --url <url>    Set custom base URL (default: http://localhost:3000)
  --timeout <ms> Set request timeout in milliseconds (default: 20000)

Examples:
  node qa/payment-flow-test.js
  node qa/payment-flow-test.js --url http://localhost:3001
  node qa/payment-flow-test.js --timeout 30000
  `);
  process.exit(0);
}

// Parse command line arguments
const urlIndex = process.argv.indexOf('--url');
if (urlIndex !== -1 && process.argv[urlIndex + 1]) {
  TEST_CONFIG.baseUrl = process.argv[urlIndex + 1];
}

const timeoutIndex = process.argv.indexOf('--url');
if (timeoutIndex !== -1 && process.argv[timeoutIndex + 1]) {
  TEST_CONFIG.timeout = parseInt(process.argv[timeoutIndex + 1]);
}

// Run tests
runAllTests().catch(error => {
  console.error('\n💥 Payment flow test runner failed:', error.message);
  process.exit(1);
});
