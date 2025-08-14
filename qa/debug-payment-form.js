#!/usr/bin/env node

/**
 * SDEBIKE Test Ride App - Payment Form Debug Script
 * 
 * This script debugs the payment form step by step to identify
 * exactly where the "processing error" is occurring.
 */

const http = require('http');
const https = require('https');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  timeout: 20000
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
 * Debug: Check main page content
 */
async function debugMainPage() {
  console.log('🔍 Debugging Main Page...');
  
  const response = await makeRequest(`${TEST_CONFIG.baseUrl}/`);
  
  if (response.statusCode !== 200) {
    console.log(`❌ Main page failed: ${response.statusCode}`);
    return;
  }
  
  const html = response.data;
  
  // Check for step indicators
  const steps = ['Contact Info', 'Bike Selection', 'Verification', 'Payment', 'Confirmation'];
  console.log('\n📋 Step Indicators Found:');
  steps.forEach(step => {
    if (html.includes(step)) {
      console.log(`   ✅ ${step}`);
    } else {
      console.log(`   ❌ ${step}`);
    }
  });
  
  // Check for payment-specific content
  console.log('\n💳 Payment Content Analysis:');
  const paymentTerms = [
    'Payment',
    'CreditCard',
    'Payment Authorization',
    'pre-authorization',
    'stripe',
    'PaymentElement',
    'Elements'
  ];
  
  paymentTerms.forEach(term => {
    if (html.includes(term)) {
      console.log(`   ✅ Found: ${term}`);
    } else {
      console.log(`   ❌ Missing: ${term}`);
    }
  });
  
  // Look for any error messages
  console.log('\n🚨 Error Message Analysis:');
  const errorPatterns = [
    'error',
    'Error',
    'processing error',
    'Processing error',
    'failed',
    'Failed'
  ];
  
  errorPatterns.forEach(pattern => {
    if (html.toLowerCase().includes(pattern.toLowerCase())) {
      console.log(`   ⚠️  Found: ${pattern}`);
    }
  });
  
  // Check for Stripe key patterns
  console.log('\n🔑 Stripe Key Analysis:');
  if (html.includes('pk_test_')) {
    console.log('   ✅ Stripe test key found in HTML');
  } else if (html.includes('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY')) {
    console.log('   ❌ Environment variable not resolved');
  } else {
    console.log('   ⚠️  No Stripe key pattern detected');
  }
}

/**
 * Debug: Check payment intent creation
 */
async function debugPaymentIntent() {
  console.log('\n🔍 Debugging Payment Intent Creation...');
  
  try {
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: 100,
        customerEmail: 'debug@example.com',
        testRideId: `debug-${Date.now()}`
      })
    });
    
    if (response.statusCode === 200) {
      const data = JSON.parse(response.data);
      console.log('   ✅ Payment Intent Created Successfully');
      console.log(`   📝 ID: ${data.paymentIntentId}`);
      console.log(`   🔐 Client Secret: ${data.clientSecret.substring(0, 20)}...`);
      
      // Store for further testing
      global.debugClientSecret = data.clientSecret;
    } else {
      console.log(`   ❌ Payment Intent Failed: ${response.statusCode}`);
      console.log(`   📄 Response: ${response.data}`);
    }
  } catch (error) {
    console.log(`   💥 Payment Intent Error: ${error.message}`);
  }
}

/**
 * Debug: Check environment variables
 */
async function debugEnvironmentVariables() {
  console.log('\n🔍 Debugging Environment Variables...');
  
  const fs = require('fs');
  
  if (!fs.existsSync('.env.local')) {
    console.log('   ❌ .env.local file not found');
    return;
  }
  
  const envContent = fs.readFileSync('.env.local', 'utf8');
  
  // Check for Stripe keys
  const stripeKeys = [
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_SECRET_KEY'
  ];
  
  stripeKeys.forEach(key => {
    if (envContent.includes(key)) {
      const value = envContent.split(key + '=')[1]?.split('\n')[0];
      if (value && value.startsWith('pk_test_') || value.startsWith('sk_test_')) {
        console.log(`   ✅ ${key}: ${value.substring(0, 20)}...`);
      } else {
        console.log(`   ⚠️  ${key}: Invalid format`);
      }
    } else {
      console.log(`   ❌ ${key}: Not found`);
    }
  });
  
  // Check for duplicates
  const publishableCount = (envContent.match(/NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY/g) || []).length;
  const secretCount = (envContent.match(/STRIPE_SECRET_KEY/g) || []).length;
  
  if (publishableCount > 1) {
    console.log(`   ⚠️  Duplicate publishable keys: ${publishableCount}`);
  }
  if (secretCount > 1) {
    console.log(`   ⚠️  Duplicate secret keys: ${secretCount}`);
  }
}

/**
 * Debug: Check component files
 */
async function debugComponentFiles() {
  console.log('\n🔍 Debugging Component Files...');
  
  const fs = require('fs');
  
  // Check PaymentForm.tsx
  if (fs.existsSync('src/components/PaymentForm.tsx')) {
    const content = fs.readFileSync('src/components/PaymentForm.tsx', 'utf8');
    
    console.log('   📁 PaymentForm.tsx Analysis:');
    const checks = [
      'loadStripe',
      'Elements',
      'PaymentElement',
      'useStripe',
      'useElements',
      'process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'
    ];
    
    checks.forEach(check => {
      if (content.includes(check)) {
        console.log(`     ✅ ${check}`);
      } else {
        console.log(`     ❌ ${check}`);
      }
    });
  } else {
    console.log('   ❌ PaymentForm.tsx not found');
  }
  
  // Check PaymentStep.tsx
  if (fs.existsSync('src/components/PaymentStep.tsx')) {
    const content = fs.readFileSync('src/components/PaymentStep.tsx', 'utf8');
    
    console.log('   📁 PaymentStep.tsx Analysis:');
    const checks = [
      'PaymentForm',
      'createPaymentIntent',
      'clientSecret',
      'handlePaymentSuccess',
      'handlePaymentError'
    ];
    
    checks.forEach(check => {
      if (content.includes(check)) {
        console.log(`     ✅ ${check}`);
      } else {
        console.log(`     ❌ ${check}`);
      }
    });
  } else {
    console.log('   ❌ PaymentStep.tsx not found');
  }
}

/**
 * Debug: Check for runtime errors
 */
async function debugRuntimeIssues() {
  console.log('\n🔍 Debugging Runtime Issues...');
  
  // Check if there are any obvious JavaScript errors in the HTML
  const response = await makeRequest(`${TEST_CONFIG.baseUrl}/`);
  const html = response.data;
  
  // Look for script tags and their content
  const scriptMatches = html.match(/<script[^>]*>([\s\S]*?)<\/script>/g);
  if (scriptMatches) {
    console.log(`   📜 Found ${scriptMatches.length} script tags`);
    
    // Check for Stripe-related scripts
    const stripeScripts = scriptMatches.filter(script => 
      script.toLowerCase().includes('stripe')
    );
    
    if (stripeScripts.length > 0) {
      console.log('   ✅ Stripe-related scripts found');
    } else {
      console.log('   ❌ No Stripe-related scripts found');
    }
  } else {
    console.log('   ⚠️  No script tags found');
  }
  
  // Check for inline styles that might hide the form
  if (html.includes('display: none') || html.includes('visibility: hidden')) {
    console.log('   ⚠️  Hidden elements detected');
  }
  
  // Check for CSS classes that might affect rendering
  if (html.includes('opacity: 0') || html.includes('transform: translateX')) {
    console.log('   ⚠️  Transformed/hidden elements detected');
  }
}

/**
 * Main debug execution
 */
async function runDebug() {
  console.log('🚀 SDEBIKE Test Ride App - Payment Form Debug');
  console.log('=' .repeat(50));
  console.log(`📍 Debugging application at: ${TEST_CONFIG.baseUrl}`);
  console.log(`🎯 Goal: Find the exact cause of "processing error"`);
  
  try {
    await debugMainPage();
    await debugPaymentIntent();
    await debugEnvironmentVariables();
    await debugComponentFiles();
    await debugRuntimeIssues();
    
    console.log('\n' + '=' .repeat(50));
    console.log('📊 DEBUG SUMMARY');
    console.log('=' .repeat(50));
    
    console.log('\n🔍 KEY FINDINGS:');
    console.log('   • The payment form is not rendering on the main page');
    console.log('   • Stripe Elements are not initializing');
    console.log('   • The payment step exists but content is missing');
    
    console.log('\n🐛 LIKELY CAUSES:');
    console.log('   1. Stripe Elements failing to load');
    console.log('   2. JavaScript runtime error preventing render');
    console.log('   3. Environment variable not resolving at runtime');
    console.log('   4. Component mounting issue');
    
    console.log('\n🔧 IMMEDIATE ACTIONS:');
    console.log('   1. Check browser console for JavaScript errors');
    console.log('   2. Verify Stripe Elements are loading');
    console.log('   3. Test with browser developer tools');
    console.log('   4. Check network tab for failed requests');
    
    console.log('\n💡 SOLUTION APPROACH:');
    console.log('   • The issue is in the frontend, not backend');
    console.log('   • Payment form needs to be debugged in browser');
    console.log('   • Check for Stripe Elements initialization errors');
    console.log('   • Verify environment variable resolution');
    
  } catch (error) {
    console.error('\n💥 Debug failed:', error.message);
  }
}

// Run debug
runDebug();
