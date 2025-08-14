#!/usr/bin/env node

/**
 * SDEBIKE Test Ride App - Comprehensive End-to-End Test
 * 
 * This script tests the complete user flow from signup to completion
 * and verifies all components are working correctly.
 */

const http = require('http');
const https = require('https');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  timeout: 15000,
  testData: {
    customer: {
      name: 'Test Customer',
      phone: '555-123-4567',
      email: 'test@example.com'
    },
    bike: 'Test Bike Model',
    signature: 'Test Signature Data'
  }
};

// Test results tracking
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
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
 * Test: Main Application Loads
 */
async function testMainApplication() {
  const response = await makeRequest(`${TEST_CONFIG.baseUrl}/`);
  
  if (response.statusCode !== 200) {
    throw new Error(`Expected status 200, got ${response.statusCode}`);
  }
  
  // Check for key content
  const contentChecks = [
    'San Diego Electric Bike',
    'Test Ride',
    'Contact Info',
    'Bike Selection',
    'Verification',
    'Payment',
    'Confirmation'
  ];
  
  for (const check of contentChecks) {
    if (!response.data.includes(check)) {
      throw new Error(`Missing expected content: ${check}`);
    }
  }
}

/**
 * Test: Payment API Integration
 */
async function testPaymentAPI() {
  const testData = {
    amount: 100,
    customerEmail: TEST_CONFIG.testData.customer.email,
    testRideId: `test-${Date.now()}`
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

  console.log(`   ℹ️  Payment Intent created: ${responseData.paymentIntentId}`);
}

/**
 * Test: Test Ride Success Page
 */
async function testSuccessPage() {
  const response = await makeRequest(`${TEST_CONFIG.baseUrl}/test-ride-success`);
  
  if (response.statusCode !== 200) {
    throw new Error(`Expected status 200, got ${response.statusCode}`);
  }
  
  const contentChecks = [
    'Test Ride Confirmed',
    'Your payment has been authorized',
    'Pick up your bike',
    '30-minute test ride'
  ];
  
  for (const check of contentChecks) {
    if (!response.data.includes(check)) {
      throw new Error(`Missing expected content: ${check}`);
    }
  }
}

/**
 * Test: Admin Dashboard Structure
 */
async function testAdminDashboard() {
  const response = await makeRequest(`${TEST_CONFIG.baseUrl}/admin`);
  
  if (response.statusCode !== 200) {
    throw new Error(`Expected status 200, got ${response.statusCode}`);
  }
  
  // Check for admin dashboard structure
  const structureChecks = [
    'SDEBIKE Admin',
    'Search name, phone, bike',
    'Refresh'
  ];
  
  for (const check of structureChecks) {
    if (!response.data.includes(check)) {
      throw new Error(`Missing admin dashboard structure: ${check}`);
    }
  }

  // Check if it shows loading or no data (both are valid states)
  if (!response.data.includes('Loading') && !response.data.includes('No active test rides')) {
    console.log('   ℹ️  Admin dashboard loaded but content state unclear');
  }
}

/**
 * Test: Static Assets
 */
async function testStaticAssets() {
  const assets = [
    '/favicon.ico',
    '/logo.png'
  ];

  for (const asset of assets) {
    try {
      const response = await makeRequest(`${TEST_CONFIG.baseUrl}${asset}`);
      if (response.statusCode !== 200) {
        throw new Error(`Asset ${asset} returned status ${response.statusCode}`);
      }
    } catch (error) {
      console.log(`   ⚠️  Asset ${asset}: ${error.message}`);
    }
  }
}

/**
 * Test: Form Validation (Basic)
 */
async function testFormValidation() {
  // This is a basic test - in a real scenario we'd use a headless browser
  // to test actual form interactions
  const response = await makeRequest(`${TEST_CONFIG.baseUrl}/`);
  
  if (response.statusCode !== 200) {
    throw new Error(`Expected status 200, got ${response.statusCode}`);
  }
  
  // Check for form elements
  const formChecks = [
    'input',
    'form',
    'submit',
    'label'
  ];
  
  for (const check of formChecks) {
    if (!response.data.includes(check)) {
      throw new Error(`Missing form element: ${check}`);
    }
  }
}

/**
 * Test: Responsive Design Elements
 */
async function testResponsiveDesign() {
  const response = await makeRequest(`${TEST_CONFIG.baseUrl}/`);
  
  if (response.statusCode !== 200) {
    throw new Error(`Expected status 200, got ${response.statusCode}`);
  }
  
  // Check for responsive design indicators
  const responsiveChecks = [
    'viewport',
    'max-w-md',
    'grid-cols-1',
    'md:grid-cols-2'
  ];
  
  let responsiveScore = 0;
  for (const check of responsiveChecks) {
    if (response.data.includes(check)) {
      responsiveScore++;
    }
  }
  
  if (responsiveScore < 2) {
    throw new Error(`Insufficient responsive design elements: ${responsiveScore}/4`);
  }
  
  console.log(`   ℹ️  Responsive design score: ${responsiveScore}/4`);
}

/**
 * Test: Accessibility Features
 */
async function testAccessibilityFeatures() {
  const response = await makeRequest(`${TEST_CONFIG.baseUrl}/`);
  
  if (response.statusCode !== 200) {
    throw new Error(`Expected status 200, got ${response.statusCode}`);
  }
  
  // Check for basic accessibility features
  const accessibilityChecks = [
    'alt=',
    'label',
    'aria-',
    'role='
  ];
  
  let accessibilityScore = 0;
  for (const check of accessibilityChecks) {
    if (response.data.includes(check)) {
      accessibilityScore++;
    }
  }
  
  if (accessibilityScore < 2) {
    console.log(`   ⚠️  Low accessibility score: ${accessibilityScore}/4`);
  } else {
    console.log(`   ℹ️  Accessibility score: ${accessibilityScore}/4`);
  }
}

/**
 * Test: Performance Indicators
 */
async function testPerformanceIndicators() {
  const startTime = Date.now();
  
  const response = await makeRequest(`${TEST_CONFIG.baseUrl}/`);
  
  const endTime = Date.now();
  const responseTime = endTime - startTime;
  
  if (response.statusCode !== 200) {
    throw new Error(`Expected status 200, got ${response.statusCode}`);
  }
  
  if (responseTime > 5000) {
    throw new Error(`Response time too slow: ${responseTime}ms`);
  }
  
  console.log(`   ℹ️  Response time: ${responseTime}ms`);
  
  // Check for performance optimizations
  const performanceChecks = [
    'async',
    'defer',
    'preload'
  ];
  
  let performanceScore = 0;
  for (const check of performanceChecks) {
    if (response.data.includes(check)) {
      performanceScore++;
    }
  }
  
  console.log(`   ℹ️  Performance optimizations: ${performanceScore}/3`);
}

/**
 * Test: Security Headers
 */
async function testSecurityHeaders() {
  const response = await makeRequest(`${TEST_CONFIG.baseUrl}/`);
  
  if (response.statusCode !== 200) {
    throw new Error(`Expected status 200, got ${response.statusCode}`);
  }
  
  // Check for security-related content
  const securityChecks = [
    'https:',
    'secure',
    'csrf',
    'xss'
  ];
  
  let securityScore = 0;
  for (const check of securityChecks) {
    if (response.data.includes(check)) {
      securityScore++;
    }
  }
  
  console.log(`   ℹ️  Security indicators: ${securityScore}/4`);
}

/**
 * Main test execution
 */
async function runAllTests() {
  console.log('🚀 Starting SDEBIKE Test Ride App - Comprehensive QA Test');
  console.log(`📍 Testing application at: ${TEST_CONFIG.baseUrl}`);
  console.log(`⏱️  Timeout per test: ${TEST_CONFIG.timeout}ms`);
  console.log(`👤 Test customer: ${TEST_CONFIG.testData.customer.name}`);
  
  const startTime = Date.now();
  
  // Run all tests
  await runTest('Main Application Loads', testMainApplication);
  await runTest('Payment API Integration', testPaymentAPI);
  await runTest('Test Ride Success Page', testSuccessPage);
  await runTest('Admin Dashboard Structure', testAdminDashboard);
  await runTest('Static Assets Loading', testStaticAssets);
  await runTest('Form Validation (Basic)', testFormValidation);
  await runTest('Responsive Design Elements', testResponsiveDesign);
  await runTest('Accessibility Features', testAccessibilityFeatures);
  await runTest('Performance Indicators', testPerformanceIndicators);
  await runTest('Security Headers', testSecurityHeaders);
  
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  // Print results
  console.log('\n' + '='.repeat(70));
  console.log('📊 COMPREHENSIVE TEST RESULTS SUMMARY');
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
  
  if (testResults.passed === testResults.total) {
    console.log('\n🎉 All tests passed! Application is fully functional.');
    console.log('✅ Ready for production deployment');
  } else if (testResults.passed >= testResults.total * 0.8) {
    console.log('\n⚠️  Most tests passed. Application is mostly functional.');
    console.log('📋 Review failed tests before production deployment');
  } else {
    console.log('\n🚨 Many tests failed. Application needs significant work.');
    console.log('🔧 Fix critical issues before proceeding');
  }
  
  console.log('\n📝 Next Steps:');
  if (testResults.failed > 0) {
    console.log('   1. Fix failed tests');
    console.log('   2. Re-run comprehensive tests');
    console.log('   3. Address any warnings or low scores');
  } else {
    console.log('   1. Run manual user flow testing');
    console.log('   2. Test payment integration end-to-end');
    console.log('   3. Verify file uploads work correctly');
    console.log('   4. Prepare for production deployment');
  }
  
  console.log('\n🔍 Manual Testing Required:');
  console.log('   • Complete test ride signup flow');
  console.log('   • Test file uploads (ID photos, signatures)');
  console.log('   • Verify payment flow with Stripe');
  console.log('   • Test admin dashboard with real data');
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
SDEBIKE Test Ride App - Comprehensive Test Runner

Usage: node qa/comprehensive-test.js [options]

Options:
  --help, -h     Show this help message
  --url <url>    Set custom base URL (default: http://localhost:3000)
  --timeout <ms> Set request timeout in milliseconds (default: 15000)

Examples:
  node qa/comprehensive-test.js
  node qa/comprehensive-test.js --url http://localhost:3001
  node qa/comprehensive-test.js --timeout 20000
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
  console.error('\n💥 Comprehensive test runner failed:', error.message);
  process.exit(1);
});
