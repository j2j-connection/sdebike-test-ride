#!/usr/bin/env node

/**
 * SDEBIKE Test Ride App - Stripe Elements Debug Test
 * 
 * This script specifically tests why Stripe Elements are not rendering
 * and provides detailed debugging information.
 */

const http = require('http');
const https = require('https');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  timeout: 30000
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
 * Main debugging function
 */
async function debugStripeElements() {
  console.log('🔍 SDEBIKE Test Ride App - Stripe Elements Debug');
  console.log(`📍 Testing application at: ${TEST_CONFIG.baseUrl}`);
  console.log('🎯 Goal: Identify why Stripe Elements are not rendering\n');

  try {
    // Test 1: Check if main page loads
    console.log('🧪 Test 1: Main Page Loading');
    const mainPageResponse = await makeRequest(`${TEST_CONFIG.baseUrl}/`);
    
    if (mainPageResponse.statusCode !== 200) {
      console.log(`❌ Main page failed to load: ${mainPageResponse.statusCode}`);
      return;
    }
    
    console.log('✅ Main page loaded successfully');
    
    // Test 2: Check for Stripe-related content
    console.log('\n🧪 Test 2: Stripe Content Analysis');
    const html = mainPageResponse.data;
    
    // Check for basic payment-related text
    const basicChecks = [
      'Payment',
      'Authorize',
      'CreditCard',
      'Stripe',
      'Elements'
    ];
    
    console.log('   Basic content checks:');
    basicChecks.forEach(check => {
      if (html.includes(check)) {
        console.log(`     ✅ Found: ${check}`);
      } else {
        console.log(`     ❌ Missing: ${check}`);
      }
    });
    
    // Test 3: Check for Stripe JavaScript
    console.log('\n🧪 Test 3: Stripe JavaScript Detection');
    
    const stripeScriptChecks = [
      'stripe.js',
      'stripe-js',
      'react-stripe',
      'loadStripe',
      'Elements',
      'PaymentElement'
    ];
    
    console.log('   Stripe JavaScript checks:');
    stripeScriptChecks.forEach(check => {
      if (html.includes(check)) {
        console.log(`     ✅ Found: ${check}`);
      } else {
        console.log(`     ❌ Missing: ${check}`);
      }
    });
    
    // Test 4: Check for specific Stripe Elements
    console.log('\n🧪 Test 4: Stripe Elements Component Detection');
    
    // Look for the actual PaymentElement component
    if (html.includes('PaymentElement')) {
      console.log('   ✅ PaymentElement component found in HTML');
    } else {
      console.log('   ❌ PaymentElement component NOT found in HTML');
    }
    
    // Look for Stripe Elements wrapper
    if (html.includes('Elements')) {
      console.log('   ✅ Elements wrapper found in HTML');
    } else {
      console.log('   ❌ Elements wrapper NOT found in HTML');
    }
    
    // Test 5: Check for Stripe publishable key
    console.log('\n🧪 Test 5: Stripe Publishable Key Detection');
    
    const stripeKeyPattern = /pk_test_[a-zA-Z0-9]+/;
    const keyMatch = html.match(stripeKeyPattern);
    
    if (keyMatch) {
      console.log(`   ✅ Stripe publishable key found: ${keyMatch[0].substring(0, 20)}...`);
    } else {
      console.log('   ❌ Stripe publishable key NOT found in HTML');
    }
    
    // Test 6: Check for client secret
    console.log('\n🧪 Test 6: Client Secret Detection');
    
    if (html.includes('clientSecret')) {
      console.log('   ✅ Client secret reference found in HTML');
    } else {
      console.log('   ❌ Client secret reference NOT found in HTML');
    }
    
    // Test 7: Check for payment form structure
    console.log('\n🧪 Test 7: Payment Form Structure Analysis');
    
    // Look for form elements
    const formChecks = [
      '<form',
      'input',
      'button',
      'submit'
    ];
    
    console.log('   Form structure checks:');
    formChecks.forEach(check => {
      if (html.includes(check)) {
        console.log(`     ✅ Found: ${check}`);
      } else {
        console.log(`     ❌ Missing: ${check}`);
      }
    });
    
    // Test 8: Check for React component structure
    console.log('\n🧪 Test 8: React Component Structure');
    
    // Look for React-related attributes
    const reactChecks = [
      'data-reactroot',
      'data-reactid',
      'jsx',
      'useStripe',
      'useElements'
    ];
    
    console.log('   React component checks:');
    reactChecks.forEach(check => {
      if (html.includes(check)) {
        console.log(`     ✅ Found: ${check}`);
      } else {
        console.log(`     ❌ Missing: ${check}`);
      }
    });
    
    // Test 9: Check for CSS classes that might indicate Stripe Elements
    console.log('\n🧪 Test 9: CSS Class Analysis');
    
    const cssChecks = [
      'StripeElement',
      'StripeElement--',
      'ElementsApp',
      'payment-element'
    ];
    
    console.log('   CSS class checks:');
    cssChecks.forEach(check => {
      if (html.includes(check)) {
        console.log(`     ✅ Found: ${check}`);
      } else {
        console.log(`     ❌ Missing: ${check}`);
      }
    });
    
    // Test 10: Check for iframe content (Stripe Elements often render in iframes)
    console.log('\n🧪 Test 10: Iframe Content Detection');
    
    if (html.includes('<iframe')) {
      console.log('   ✅ Iframe elements found (Stripe Elements might be here)');
      
      // Count iframes
      const iframeCount = (html.match(/<iframe/g) || []).length;
      console.log(`   📊 Total iframes found: ${iframeCount}`);
    } else {
      console.log('   ❌ No iframe elements found');
    }
    
    // Summary and recommendations
    console.log('\n' + '='.repeat(70));
    console.log('📊 STRIPE ELEMENTS DEBUG SUMMARY');
    console.log('='.repeat(70));
    
    const totalChecks = basicChecks.length + stripeScriptChecks.length + formChecks.length + reactChecks.length + cssChecks.length;
    const passedChecks = basicChecks.filter(check => html.includes(check)).length +
                        stripeScriptChecks.filter(check => html.includes(check)).length +
                        formChecks.filter(check => html.includes(check)).length +
                        reactChecks.filter(check => html.includes(check)).length +
                        cssChecks.filter(check => html.includes(check)).length;
    
    console.log(`Total Content Checks: ${totalChecks}`);
    console.log(`Passed Checks: ${passedChecks}`);
    console.log(`Failed Checks: ${totalChecks - passedChecks}`);
    console.log(`Success Rate: ${((passedChecks / totalChecks) * 100).toFixed(1)}%`);
    
    console.log('\n🔍 DIAGNOSIS:');
    
    if (passedChecks < totalChecks * 0.3) {
      console.log('❌ CRITICAL: Stripe Elements are not rendering at all');
      console.log('   This suggests a fundamental issue with the Stripe integration');
    } else if (passedChecks < totalChecks * 0.6) {
      console.log('⚠️  MODERATE: Stripe Elements partially working');
      console.log('   Some components are rendering but not the full payment form');
    } else {
      console.log('✅ GOOD: Stripe Elements mostly working');
      console.log('   Minor issues that can be resolved');
    }
    
    console.log('\n🐛 LIKELY ISSUES:');
    
    if (!html.includes('PaymentElement')) {
      console.log('   1. PaymentElement component not being rendered');
    }
    
    if (!html.includes('Elements')) {
      console.log('   2. Elements wrapper missing');
    }
    
    if (!keyMatch) {
      console.log('   3. Stripe publishable key not injected');
    }
    
    if (!html.includes('clientSecret')) {
      console.log('   4. Client secret not being passed to frontend');
    }
    
    console.log('\n🔧 IMMEDIATE ACTIONS:');
    console.log('   1. Check browser console for JavaScript errors');
    console.log('   2. Verify PaymentStep component is rendering');
    console.log('   3. Check if client secret is being generated');
    console.log('   4. Verify Stripe Elements provider is wrapping PaymentForm');
    
    console.log('\n💡 NEXT STEPS:');
    console.log('   1. Open browser Developer Tools (F12)');
    console.log('   2. Navigate to payment step manually');
    console.log('   3. Check console for runtime errors');
    console.log('   4. Verify PaymentElement is visible in DOM');
    
  } catch (error) {
    console.error('\n💥 Debug test failed:', error.message);
    console.error('   This suggests the application is not accessible');
  }
}

// Run the debug test
debugStripeElements().catch(error => {
  console.error('\n💥 Stripe Elements debug failed:', error.message);
  process.exit(1);
});
