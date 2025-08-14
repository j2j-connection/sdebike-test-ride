#!/usr/bin/env node

/**
 * SDEBIKE Test Ride App - Frontend Payment Form Test
 * 
 * This script tests the frontend payment form to identify the "processing error"
 * by examining the actual rendered HTML and JavaScript.
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
  findings: []
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
 * Test: Main Page Loads with Payment Form
 */
async function testMainPageLoads() {
  const response = await makeRequest(`${TEST_CONFIG.baseUrl}/`);
  
  if (response.statusCode !== 200) {
    throw new Error(`Expected status 200, got ${response.statusCode}`);
  }
  
  console.log('   ℹ️  Main page loaded successfully');
  
  // Store the response for further analysis
  testResults.mainPageResponse = response.data;
}

/**
 * Test: Payment Form Structure Analysis
 */
async function testPaymentFormStructure() {
  if (!testResults.mainPageResponse) {
    throw new Error('Main page response not available');
  }
  
  const html = testResults.mainPageResponse;
  
  // Check for payment-related content
  const paymentChecks = [
    { term: 'Payment', description: 'Payment step indicator' },
    { term: 'CreditCard', description: 'Credit card icon' },
    { term: 'Payment Authorization', description: 'Payment title' },
    { term: 'pre-authorization', description: 'Pre-authorization text' }
  ];
  
  let paymentScore = 0;
  for (const check of paymentChecks) {
    if (html.includes(check.term)) {
      paymentScore++;
      console.log(`     ✅ Found: ${check.description}`);
    } else {
      console.log(`     ❌ Missing: ${check.description}`);
    }
  }
  
  if (paymentScore < 2) {
    throw new Error(`Insufficient payment form content: ${paymentScore}/4`);
  }
  
  console.log(`   ℹ️  Payment form content score: ${paymentScore}/4`);
}

/**
 * Test: Stripe Integration Analysis
 */
async function testStripeIntegration() {
  if (!testResults.mainPageResponse) {
    throw new Error('Main page response not available');
  }
  
  const html = testResults.mainPageResponse;
  
  // Check for Stripe-related content
  const stripeChecks = [
    { term: 'stripe', description: 'Stripe references' },
    { term: 'PaymentElement', description: 'Stripe PaymentElement' },
    { term: 'Elements', description: 'Stripe Elements wrapper' },
    { term: 'confirmPayment', description: 'Stripe payment confirmation' }
  ];
  
  let stripeScore = 0;
  for (const check of stripeChecks) {
    if (html.toLowerCase().includes(check.term.toLowerCase())) {
      stripeScore++;
      console.log(`     ✅ Found: ${check.description}`);
    } else {
      console.log(`     ❌ Missing: ${check.description}`);
    }
  }
  
  console.log(`   ℹ️  Stripe integration score: ${stripeScore}/4`);
  
  // Check for environment variable usage
  if (html.includes('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY')) {
    console.log('     ⚠️  Environment variable not resolved in HTML');
    testResults.findings.push('Environment variable NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY not resolved');
  } else if (html.includes('pk_test_')) {
    console.log('     ✅ Stripe test key detected in HTML');
  } else {
    console.log('     ⚠️  Stripe key format not detected');
    testResults.findings.push('Stripe key format not detected in HTML');
  }
}

/**
 * Test: JavaScript Error Analysis
 */
async function testJavaScriptErrors() {
  if (!testResults.mainPageResponse) {
    throw new Error('Main page response not available');
  }
  
  const html = testResults.mainPageResponse;
  
  // Check for potential JavaScript issues
  const jsChecks = [
    { term: 'useStripe', description: 'Stripe hook usage' },
    { term: 'useElements', description: 'Elements hook usage' },
    { term: 'stripe.confirmPayment', description: 'Payment confirmation' },
    { term: 'PaymentElement', description: 'Payment element component' }
  ];
  
  let jsScore = 0;
  for (const check of jsChecks) {
    if (html.includes(check.term)) {
      jsScore++;
      console.log(`     ✅ Found: ${check.description}`);
    } else {
      console.log(`     ❌ Missing: ${check.description}`);
    }
  }
  
  console.log(`   ℹ️  JavaScript integration score: ${jsScore}/4`);
  
  // Check for React component structure
  if (html.includes('data-slot="card"')) {
    console.log('     ✅ React component structure detected');
  } else {
    console.log('     ⚠️  React component structure not clear');
    testResults.findings.push('React component structure not clear');
  }
}

/**
 * Test: Payment Step Navigation
 */
async function testPaymentStepNavigation() {
  // Check if we can access the payment step directly
  try {
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/`);
    
    if (response.statusCode !== 200) {
      throw new Error(`Expected status 200, got ${response.statusCode}`);
    }
    
    // Look for step indicators
    const stepChecks = [
      'Contact Info',
      'Bike Selection', 
      'Verification',
      'Payment',
      'Confirmation'
    ];
    
    let stepScore = 0;
    for (const step of stepChecks) {
      if (response.data.includes(step)) {
        stepScore++;
        console.log(`     ✅ Found step: ${step}`);
      } else {
        console.log(`     ❌ Missing step: ${step}`);
      }
    }
    
    if (stepScore < 4) {
      throw new Error(`Insufficient step indicators: ${stepScore}/5`);
    }
    
    console.log(`   ℹ️  Step navigation score: ${stepScore}/5`);
    
  } catch (error) {
    throw new Error(`Payment step navigation failed: ${error.message}`);
  }
}

/**
 * Test: Environment Variable Resolution
 */
async function testEnvironmentVariables() {
  // Check if environment variables are properly loaded
  const fs = require('fs');
  
  if (!fs.existsSync('.env.local')) {
    throw new Error('.env.local file not found');
  }
  
  const envContent = fs.readFileSync('.env.local', 'utf8');
  
  // Check for Stripe keys
  const stripeKeyChecks = [
    { term: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', description: 'Stripe publishable key' },
    { term: 'STRIPE_SECRET_KEY', description: 'Stripe secret key' }
  ];
  
  let keyScore = 0;
  for (const check of stripeKeyChecks) {
    if (envContent.includes(check.term)) {
      keyScore++;
      console.log(`     ✅ Found: ${check.description}`);
    } else {
      console.log(`     ❌ Missing: ${check.description}`);
    }
  }
  
  if (keyScore < 2) {
    throw new Error(`Missing Stripe environment variables: ${keyScore}/2`);
  }
  
  // Check for key format
  if (envContent.includes('pk_test_')) {
    console.log('     ✅ Test publishable key format detected');
  } else {
    console.log('     ⚠️  Test publishable key format not detected');
    testResults.findings.push('Test publishable key format not detected');
  }
  
  if (envContent.includes('sk_test_')) {
    console.log('     ✅ Test secret key format detected');
  } else {
    console.log('     ⚠️  Test secret key format not detected');
    testResults.findings.push('Test secret key format not detected');
  }
  
  console.log(`   ℹ️  Environment variables score: ${keyScore}/2`);
}

/**
 * Test: Payment Form Rendering Issues
 */
async function testPaymentFormRendering() {
  if (!testResults.mainPageResponse) {
    throw new Error('Main page response not available');
  }
  
  const html = testResults.mainPageResponse;
  
  // Look for potential rendering issues
  const renderingChecks = [
    { term: 'opacity:0', description: 'Hidden payment form' },
    { term: 'transform:translateX', description: 'Form positioning' },
    { term: 'PaymentElement', description: 'Stripe payment element' },
    { term: 'stripe.confirmPayment', description: 'Payment confirmation function' }
  ];
  
  let renderingScore = 0;
  for (const check of renderingChecks) {
    if (html.includes(check.term)) {
      renderingScore++;
      console.log(`     ✅ Found: ${check.description}`);
    } else {
      console.log(`     ❌ Missing: ${check.description}`);
    }
  }
  
  console.log(`   ℹ️  Payment form rendering score: ${renderingScore}/4`);
  
  // Check for specific error patterns
  if (html.includes('processing error') || html.includes('Processing error')) {
    console.log('     ⚠️  Processing error text found in HTML');
    testResults.findings.push('Processing error text found in HTML');
  }
  
  if (html.includes('error') || html.includes('Error')) {
    console.log('     ⚠️  Error text found in HTML');
    testResults.findings.push('Error text found in HTML');
  }
}

/**
 * Test: Component Import Analysis
 */
async function testComponentImports() {
  // Check if PaymentForm component exists
  const fs = require('fs');
  
  if (!fs.existsSync('src/components/PaymentForm.tsx')) {
    throw new Error('PaymentForm.tsx component not found');
  }
  
  if (!fs.existsSync('src/components/PaymentStep.tsx')) {
    throw new Error('PaymentStep.tsx component not found');
  }
  
  console.log('     ✅ Payment components found');
  
  // Check component content for potential issues
  const paymentFormContent = fs.readFileSync('src/components/PaymentForm.tsx', 'utf8');
  const paymentStepContent = fs.readFileSync('src/components/PaymentStep.tsx', 'utf8');
  
  // Check for critical imports
  const importChecks = [
    { term: 'loadStripe', description: 'Stripe loading function' },
    { term: 'Elements', description: 'Stripe Elements wrapper' },
    { term: 'PaymentElement', description: 'Payment element component' },
    { term: 'useStripe', description: 'Stripe hook' },
    { term: 'useElements', description: 'Elements hook' }
  ];
  
  let importScore = 0;
  for (const check of importChecks) {
    if (paymentFormContent.includes(check.term)) {
      importScore++;
      console.log(`     ✅ Found import: ${check.description}`);
    } else {
      console.log(`     ❌ Missing import: ${check.description}`);
    }
  }
  
  if (importScore < 4) {
    throw new Error(`Missing critical imports: ${importScore}/5`);
  }
  
  console.log(`   ℹ️  Component imports score: ${importScore}/5`);
  
  // Check for environment variable usage
  if (paymentFormContent.includes('process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY')) {
    console.log('     ✅ Environment variable usage detected');
  } else {
    console.log('     ⚠️  Environment variable usage not detected');
    testResults.findings.push('Environment variable usage not detected in PaymentForm');
  }
}

/**
 * Main test execution
 */
async function runAllTests() {
  console.log('🚀 Starting SDEBIKE Test Ride App - Frontend Payment Form Test');
  console.log(`📍 Testing application at: ${TEST_CONFIG.baseUrl}`);
  console.log(`⏱️  Timeout per test: ${TEST_CONFIG.timeout}ms`);
  console.log(`🎯 Goal: Identify the "processing error" in payment form`);
  
  const startTime = Date.now();
  
  // Run all frontend payment tests
  await runTest('Main Page Loads with Payment Form', testMainPageLoads);
  await runTest('Payment Form Structure Analysis', testPaymentFormStructure);
  await runTest('Stripe Integration Analysis', testStripeIntegration);
  await runTest('JavaScript Error Analysis', testJavaScriptErrors);
  await runTest('Payment Step Navigation', testPaymentStepNavigation);
  await runTest('Environment Variable Resolution', testEnvironmentVariables);
  await runTest('Payment Form Rendering Issues', testPaymentFormRendering);
  await runTest('Component Import Analysis', testComponentImports);
  
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  // Print results
  console.log('\n' + '='.repeat(70));
  console.log('📊 FRONTEND PAYMENT FORM TEST RESULTS SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`⏱️  Duration: ${duration.toFixed(2)}s`);
  console.log(`📈 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.errors.forEach(error => {
      console.log(`   • ${error.test}: ${error.error}`);
    });
  }
  
  if (testResults.findings.length > 0) {
    console.log('\n🔍 KEY FINDINGS:');
    testResults.findings.forEach(finding => {
      console.log(`   • ${finding}`);
    });
  }
  
  if (testResults.passed === testResults.total) {
    console.log('\n🎉 All frontend payment tests passed!');
    console.log('✅ Payment form structure is correct');
    console.log('🔍 Check browser console for runtime errors');
  } else {
    console.log('\n⚠️  Some frontend payment tests failed.');
    console.log('🔧 Fix component issues before proceeding');
  }
  
  console.log('\n🔍 NEXT STEPS TO DEBUG PROCESSING ERROR:');
  console.log('   1. Check browser console for JavaScript errors');
  console.log('   2. Verify Stripe Elements are loading');
  console.log('   3. Test with official Stripe test cards');
  console.log('   4. Check network tab for failed requests');
  console.log('   5. Verify environment variables are loaded');
  
  console.log('\n💳 RECOMMENDED TEST CARDS:');
  console.log('   • Visa: 4242424242424242 (Exp: 12/34, CVC: 123)');
  console.log('   • Mastercard: 5555555555554444 (Exp: 12/34, CVC: 123)');
  console.log('   • Amex: 378282246310005 (Exp: 12/34, CVC: 1234)');
  
  console.log('\n🐛 COMMON PROCESSING ERROR CAUSES:');
  console.log('   • Stripe Elements not initialized');
  console.log('   • Environment variables not loaded');
  console.log('   • JavaScript runtime errors');
  console.log('   • Network connectivity issues');
  console.log('   • Invalid test card data');
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
SDEBIKE Test Ride App - Frontend Payment Form Test

Usage: node qa/frontend-payment-test.js [options]

Options:
  --help, -h     Show this help message
  --url <url>    Set custom base URL (default: http://localhost:3000)
  --timeout <ms> Set request timeout in milliseconds (default: 20000)

Examples:
  node qa/frontend-payment-test.js
  node qa/frontend-payment-test.js --url http://localhost:3001
  node qa/frontend-payment-test.js --timeout 30000
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
  console.error('\n💥 Frontend payment test runner failed:', error.message);
  process.exit(1);
});
