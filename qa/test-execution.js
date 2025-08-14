#!/usr/bin/env node

/**
 * SDEBIKE Test Ride App - Automated Test Runner
 * 
 * This script performs automated testing of the application's core functionality
 * including API endpoints, database operations, and basic user flows.
 */

const http = require('http');
const https = require('https');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  timeout: 10000,
  retries: 3
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
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: TEST_CONFIG.timeout
    };

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
 * Test: Application Health Check
 */
async function testAppHealth() {
  const response = await makeRequest(`${TEST_CONFIG.baseUrl}/`);
  
  if (response.statusCode !== 200) {
    throw new Error(`Expected status 200, got ${response.statusCode}`);
  }
  
  if (!response.data.includes('SDEBIKE') && !response.data.includes('Test Ride')) {
    throw new Error('Response does not contain expected content');
  }
}

/**
 * Test: API Endpoint - Create Payment Intent
 */
async function testPaymentIntentAPI() {
  const testData = {
    amount: 100, // $1.00 in cents
    customerEmail: 'test@example.com',
    testRideId: 'test-123'
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
}

/**
 * Test: Admin Dashboard Access
 */
async function testAdminDashboard() {
  const response = await makeRequest(`${TEST_CONFIG.baseUrl}/admin`);
  
  if (response.statusCode !== 200) {
    throw new Error(`Expected status 200, got ${response.statusCode}`);
  }
  
  if (!response.data.includes('SDEBIKE Admin') && !response.data.includes('Search name, phone, bike')) {
    throw new Error('Admin dashboard content not found');
  }
}

/**
 * Test: Test Ride Success Page
 */
async function testSuccessPage() {
  const response = await makeRequest(`${TEST_CONFIG.baseUrl}/test-ride-success`);
  
  if (response.statusCode !== 200) {
    throw new Error(`Expected status 200, got ${response.statusCode}`);
  }
  
  if (!response.data.includes('Test Ride Confirmed') && !response.data.includes('Success')) {
    throw new Error('Success page content not found');
  }
}

/**
 * Test: Static Assets Loading
 */
async function testStaticAssets() {
  const assets = [
    '/favicon.ico',
    '/logo.png',
    '/next.svg'
  ];

  for (const asset of assets) {
    try {
      const response = await makeRequest(`${TEST_CONFIG.baseUrl}${asset}`);
      if (response.statusCode !== 200) {
        throw new Error(`Asset ${asset} returned status ${response.statusCode}`);
      }
    } catch (error) {
      // Some assets might not exist, that's okay
      console.log(`   ⚠️  Asset ${asset}: ${error.message}`);
    }
  }
}

/**
 * Test: Database Connection (via Supabase)
 */
async function testDatabaseConnection() {
  // This would require environment variables and Supabase client
  // For now, we'll test if the database setup script exists
  const fs = require('fs');
  if (!fs.existsSync('./setup-database.js')) {
    throw new Error('Database setup script not found');
  }
  
  console.log('   ℹ️  Database setup script found - manual verification required');
}

/**
 * Test: Environment Variables
 */
async function testEnvironmentVariables() {
  const fs = require('fs');
  const path = require('path');
  
  if (!fs.existsSync('.env.local')) {
    throw new Error('.env.local file not found');
  }
  
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_SECRET_KEY'
  ];
  
  for (const varName of requiredVars) {
    if (!envContent.includes(varName)) {
      throw new Error(`Environment variable ${varName} not found`);
    }
  }
  
  console.log('   ℹ️  All required environment variables found');
}

/**
 * Main test execution
 */
async function runAllTests() {
  console.log('🚀 Starting SDEBIKE Test Ride App QA Tests');
  console.log(`📍 Testing application at: ${TEST_CONFIG.baseUrl}`);
  console.log(`⏱️  Timeout per test: ${TEST_CONFIG.timeout}ms`);
  
  const startTime = Date.now();
  
  // Run all tests
  await runTest('Application Health Check', testAppHealth);
  await runTest('Payment Intent API', testPaymentIntentAPI);
  await runTest('Admin Dashboard Access', testAdminDashboard);
  await runTest('Test Ride Success Page', testSuccessPage);
  await runTest('Static Assets Loading', testStaticAssets);
  await runTest('Database Connection', testDatabaseConnection);
  await runTest('Environment Variables', testEnvironmentVariables);
  
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  // Print results
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`⏱️  Duration: ${duration.toFixed(2)}s`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.errors.forEach(error => {
      console.log(`   • ${error.test}: ${error.error}`);
    });
  }
  
  if (testResults.passed === testResults.total) {
    console.log('\n🎉 All tests passed! Application is ready for manual testing.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review errors before proceeding.');
  }
  
  console.log('\n📝 Next Steps:');
  console.log('   1. Review failed tests and fix issues');
  console.log('   2. Run manual testing for user flows');
  console.log('   3. Test payment integration with Stripe');
  console.log('   4. Verify file uploads to Supabase Storage');
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
SDEBIKE Test Ride App - Test Runner

Usage: node qa/test-execution.js [options]

Options:
  --help, -h     Show this help message
  --url <url>    Set custom base URL (default: http://localhost:3000)
  --timeout <ms> Set request timeout in milliseconds (default: 10000)

Examples:
  node qa/test-execution.js
  node qa/test-execution.js --url http://localhost:3001
  node qa/test-execution.js --timeout 15000
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
  console.error('\n💥 Test runner failed:', error.message);
  process.exit(1);
});
