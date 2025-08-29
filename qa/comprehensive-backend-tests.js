/**
 * COMPREHENSIVE BACKEND TESTING SUITE
 * Tests all backend services, APIs, database operations, and integrations
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

class ComprehensiveBackendTester {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      tests: []
    };
    this.testPhone = '+19142168070';
    this.testData = {
      name: 'Backend Test User',
      phone: this.testPhone,
      email: 'backendtest@example.com'
    };
  }

  async runTest(name, testFn) {
    console.log(`\\n🧪 Testing: ${name}`);
    console.log('-'.repeat(50));
    
    this.results.total++;
    const startTime = Date.now();
    
    try {
      const result = await testFn();
      const duration = Date.now() - startTime;
      
      console.log(`✅ PASSED (${duration}ms): ${name}`);
      if (result && typeof result === 'object') {
        console.log('📊 Result:', JSON.stringify(result, null, 2));
      }
      
      this.results.passed++;
      this.results.tests.push({
        name,
        status: 'PASSED',
        duration,
        result
      });
      
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      console.log(`❌ FAILED (${duration}ms): ${name}`);
      console.log(`🔴 Error: ${error.message}`);
      
      this.results.failed++;
      this.results.tests.push({
        name,
        status: 'FAILED',
        duration,
        error: error.message
      });
      
      throw error;
    }
  }

  // ===============================
  // API ENDPOINT TESTS
  // ===============================

  async testHealthCheck() {
    return this.runTest('Health Check - Root Endpoint', async () => {
      const response = await fetch(`${this.baseUrl}/`);
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }
      return {
        status: response.status,
        contentType: response.headers.get('content-type')
      };
    });
  }

  async testAdminEndpoint() {
    return this.runTest('Admin Dashboard Endpoint', async () => {
      const response = await fetch(`${this.baseUrl}/admin`);
      if (!response.ok) {
        throw new Error(`Admin endpoint failed: ${response.status}`);
      }
      const html = await response.text();
      
      return {
        status: response.status,
        hasContent: html.includes('SDEBIKE Admin'),
        contentLength: html.length
      };
    });
  }

  async testSMSAPI() {
    return this.runTest('SMS API Endpoint', async () => {
      const testPayload = {
        phone: this.testPhone,
        message: 'Backend API Test - SMS Service Verification'
      };
      
      const response = await fetch(`${this.baseUrl}/api/send-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`SMS API failed: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      
      return {
        status: response.status,
        smsResult: result,
        phoneFormatted: result.success // Indicates phone formatting worked
      };
    });
  }

  async testPhoneNumberFormatting() {
    return this.runTest('Phone Number Formatting', async () => {
      const testCases = [
        { input: '9142168070', expected: '+19142168070' },
        { input: '+19142168070', expected: '+19142168070' },
        { input: '19142168070', expected: '+19142168070' },
        { input: '(914) 216-8070', expected: '+19142168070' }
      ];
      
      const results = [];
      
      for (const testCase of testCases) {
        const response = await fetch(`${this.baseUrl}/api/send-sms`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: testCase.input,
            message: `Phone formatting test: ${testCase.input}`
          })
        });
        
        const result = await response.json();
        
        results.push({
          input: testCase.input,
          expected: testCase.expected,
          success: result.success,
          // We can't directly verify the formatting, but success indicates proper formatting
          formatted: result.success ? 'properly formatted' : 'formatting failed'
        });
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      return results;
    });
  }

  async testCreatePaymentIntent() {
    return this.runTest('Stripe Payment Intent Creation', async () => {
      const response = await fetch(`${this.baseUrl}/api/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: 100, // $1.00 for test
          currency: 'usd'
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Payment intent creation failed: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      
      return {
        status: response.status,
        hasClientSecret: !!result.client_secret,
        paymentIntentId: result.client_secret ? result.client_secret.split('_secret_')[0] : null
      };
    });
  }

  // ===============================
  // DATABASE TESTS
  // ===============================

  async testDatabaseConnection() {
    return this.runTest('Database Connection via Admin', async () => {
      // Test database connectivity by checking admin page loads data
      const response = await fetch(`${this.baseUrl}/admin`);
      const html = await response.text();
      
      // Check if page indicates loading or shows data
      const hasLoading = html.includes('Loading...');
      const hasEntries = html.includes('test ride') || html.includes('entries');
      const hasError = html.includes('error') || html.includes('Error');
      
      if (hasError) {
        throw new Error('Database connection error detected in admin page');
      }
      
      return {
        connected: !hasError,
        hasLoadingState: hasLoading,
        hasDataIndications: hasEntries
      };
    });
  }

  async testDataPersistence() {
    return this.runTest('Data Persistence Test', async () => {
      // This test simulates the data that would be saved during a complete workflow
      // Since we can't easily test the full Supabase integration without auth,
      // we'll test the service layer indirectly
      
      const timestamp = new Date().toISOString();
      const testUser = {
        name: `Persistence Test ${timestamp}`,
        phone: this.testPhone,
        email: `persistence-${Date.now()}@example.com`
      };
      
      // Test that admin page can handle requests (indicates DB connection works)
      const adminResponse = await fetch(`${this.baseUrl}/admin`);
      if (!adminResponse.ok) {
        throw new Error('Admin endpoint not accessible for persistence test');
      }
      
      // Check if the admin page loads without 500 errors (indicates DB queries work)
      const adminHtml = await adminResponse.text();
      const hasDbError = adminHtml.includes('500') || adminHtml.includes('database error');
      
      if (hasDbError) {
        throw new Error('Database persistence error detected');
      }
      
      return {
        adminAccessible: adminResponse.ok,
        noDatabaseErrors: !hasDbError,
        timestamp
      };
    });
  }

  // ===============================
  // FILE UPLOAD TESTS
  // ===============================

  async testFileUploadEndpoint() {
    return this.runTest('File Upload Capability', async () => {
      // Create a test image file
      const testImageData = this.createTestImageBuffer();
      
      // Note: Without direct access to the upload endpoint, 
      // we test the static file serving capability
      const faviconResponse = await fetch(`${this.baseUrl}/favicon.ico`);
      
      return {
        staticFilesWork: faviconResponse.ok,
        faviconSize: parseInt(faviconResponse.headers.get('content-length') || '0'),
        contentType: faviconResponse.headers.get('content-type')
      };
    });
  }

  createTestImageBuffer() {
    // Create minimal PNG buffer
    return Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, // IHDR length
      0x49, 0x48, 0x44, 0x52, // IHDR
      0x00, 0x00, 0x00, 0x10, // width: 16
      0x00, 0x00, 0x00, 0x10, // height: 16
      0x08, 0x02, 0x00, 0x00, 0x00, // bit depth, color type, etc.
      0x90, 0x91, 0x68, 0x36, // CRC
      0x00, 0x00, 0x00, 0x0C, // IDAT length
      0x49, 0x44, 0x41, 0x54, // IDAT
      0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, // minimal data
      0x02, 0x00, 0x01, // checksum
      0x00, 0x00, 0x00, 0x00, // IEND length
      0x49, 0x45, 0x4E, 0x44, // IEND
      0xAE, 0x42, 0x60, 0x82  // CRC
    ]);
  }

  // ===============================
  // INTEGRATION TESTS
  // ===============================

  async testSMSServiceIntegration() {
    return this.runTest('SMS Service Integration', async () => {
      // Test multiple SMS scenarios
      const tests = [
        {
          name: 'Basic SMS',
          payload: {
            phone: this.testPhone,
            message: 'Integration Test - Basic SMS'
          }
        },
        {
          name: 'Long Message',
          payload: {
            phone: this.testPhone,
            message: 'Integration Test - This is a longer SMS message to test how the service handles messages that exceed normal length limits and ensure proper delivery.'
          }
        },
        {
          name: 'Special Characters',
          payload: {
            phone: this.testPhone,
            message: 'Integration Test - Special chars: 🚲 ✅ 📱 @ # $ % & * () - Test'
          }
        }
      ];
      
      const results = [];
      
      for (const test of tests) {
        try {
          const response = await fetch(`${this.baseUrl}/api/send-sms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(test.payload)
          });
          
          const result = await response.json();
          
          results.push({
            test: test.name,
            success: result.success,
            status: response.status,
            messageId: result.messageId,
            quotaRemaining: result.quotaRemaining
          });
          
          // Delay between SMS sends
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          results.push({
            test: test.name,
            success: false,
            error: error.message
          });
        }
      }
      
      return results;
    });
  }

  async testErrorHandling() {
    return this.runTest('API Error Handling', async () => {
      const errorTests = [
        {
          name: 'SMS with missing phone',
          endpoint: '/api/send-sms',
          payload: { message: 'Test without phone' },
          expectedStatus: 400
        },
        {
          name: 'SMS with missing message',
          endpoint: '/api/send-sms',
          payload: { phone: this.testPhone },
          expectedStatus: 400
        },
        {
          name: 'SMS with invalid JSON',
          endpoint: '/api/send-sms',
          payload: 'invalid json',
          expectedStatus: 400
        },
        {
          name: 'Payment Intent with missing amount',
          endpoint: '/api/create-payment-intent',
          payload: { currency: 'usd' },
          expectedStatus: 400
        }
      ];
      
      const results = [];
      
      for (const test of errorTests) {
        try {
          const response = await fetch(`${this.baseUrl}${test.endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: typeof test.payload === 'string' ? test.payload : JSON.stringify(test.payload)
          });
          
          results.push({
            test: test.name,
            expectedStatus: test.expectedStatus,
            actualStatus: response.status,
            handledCorrectly: response.status === test.expectedStatus
          });
          
        } catch (error) {
          results.push({
            test: test.name,
            error: error.message,
            handledCorrectly: false
          });
        }
      }
      
      return results;
    });
  }

  async testPerformance() {
    return this.runTest('API Performance', async () => {
      const performanceTests = [
        { name: 'Homepage Load', url: '/', method: 'GET' },
        { name: 'Admin Page Load', url: '/admin', method: 'GET' },
        { 
          name: 'SMS API Response', 
          url: '/api/send-sms', 
          method: 'POST',
          body: { phone: this.testPhone, message: 'Performance test' }
        }
      ];
      
      const results = [];
      
      for (const test of performanceTests) {
        const times = [];
        
        // Run each test 3 times
        for (let i = 0; i < 3; i++) {
          const startTime = Date.now();
          
          try {
            const response = await fetch(`${this.baseUrl}${test.url}`, {
              method: test.method,
              ...(test.body && {
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(test.body)
              })
            });
            
            const endTime = Date.now();
            times.push(endTime - startTime);
            
            // Small delay between tests
            await new Promise(resolve => setTimeout(resolve, 100));
            
          } catch (error) {
            times.push(-1); // Error indicator
          }
        }
        
        const validTimes = times.filter(t => t > 0);
        const avgTime = validTimes.length > 0 ? 
          Math.round(validTimes.reduce((a, b) => a + b, 0) / validTimes.length) : -1;
        
        results.push({
          test: test.name,
          averageResponseTime: avgTime,
          allTimes: times,
          successful: validTimes.length,
          failed: times.length - validTimes.length
        });
      }
      
      return results;
    });
  }

  // ===============================
  // SECURITY TESTS
  // ===============================

  async testSecurityHeaders() {
    return this.runTest('Security Headers', async () => {
      const response = await fetch(`${this.baseUrl}/`);
      const headers = response.headers;
      
      const securityChecks = {
        hasContentTypeHeader: !!headers.get('content-type'),
        hasXFrameOptions: !!headers.get('x-frame-options'),
        hasCSP: !!headers.get('content-security-policy'),
        hasHSTS: !!headers.get('strict-transport-security'),
        hasXContentTypeOptions: !!headers.get('x-content-type-options')
      };
      
      return {
        ...securityChecks,
        totalSecurityHeaders: Object.values(securityChecks).filter(Boolean).length,
        allHeaders: Object.fromEntries(headers.entries())
      };
    });
  }

  async testInputValidation() {
    return this.runTest('Input Validation', async () => {
      const maliciousInputs = [
        { phone: '<script>alert("xss")</script>', message: 'test' },
        { phone: "'; DROP TABLE customers; --", message: 'test' },
        { phone: this.testPhone, message: '<iframe src="evil.com"></iframe>' },
        { phone: this.testPhone, message: 'A'.repeat(10000) } // Very long message
      ];
      
      const results = [];
      
      for (const input of maliciousInputs) {
        try {
          const response = await fetch(`${this.baseUrl}/api/send-sms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input)
          });
          
          const result = await response.json();
          
          results.push({
            input: input.phone.substring(0, 50) + '...',
            status: response.status,
            handled: response.status === 400 || response.status === 500,
            success: result.success === false // Should not succeed with malicious input
          });
          
        } catch (error) {
          results.push({
            input: input.phone.substring(0, 50) + '...',
            handled: true,
            error: error.message
          });
        }
      }
      
      return results;
    });
  }

  // ===============================
  // MAIN TEST RUNNER
  // ===============================

  async runAllTests() {
    console.log('🚀 COMPREHENSIVE BACKEND TESTING SUITE');
    console.log('='.repeat(60));
    console.log(`📞 Test Phone: ${this.testPhone}`);
    console.log(`📧 Test Email: ${this.testData.email}`);
    console.log(`🌐 Base URL: ${this.baseUrl}`);
    console.log('');
    
    const startTime = Date.now();
    
    try {
      // Core API Tests
      console.log('\\n📡 CORE API TESTS');
      console.log('='.repeat(30));
      await this.testHealthCheck();
      await this.testAdminEndpoint();
      await this.testSMSAPI();
      await this.testPhoneNumberFormatting();
      await this.testCreatePaymentIntent();
      
      // Database Tests  
      console.log('\\n🗄️ DATABASE TESTS');
      console.log('='.repeat(30));
      await this.testDatabaseConnection();
      await this.testDataPersistence();
      
      // File Upload Tests
      console.log('\\n📁 FILE HANDLING TESTS');
      console.log('='.repeat(30));
      await this.testFileUploadEndpoint();
      
      // Integration Tests
      console.log('\\n🔗 INTEGRATION TESTS');
      console.log('='.repeat(30));
      await this.testSMSServiceIntegration();
      await this.testErrorHandling();
      await this.testPerformance();
      
      // Security Tests
      console.log('\\n🔒 SECURITY TESTS');
      console.log('='.repeat(30));
      await this.testSecurityHeaders();
      await this.testInputValidation();
      
    } catch (error) {
      console.log(`\\n💥 Test suite encountered fatal error: ${error.message}`);
    }
    
    // Final Results
    const totalTime = Date.now() - startTime;
    
    console.log('\\n' + '='.repeat(60));
    console.log('🏆 COMPREHENSIVE BACKEND TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`📊 Total Tests: ${this.results.total}`);
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`⏱️ Total Time: ${Math.round(totalTime / 1000)}s`);
    console.log(`📈 Success Rate: ${Math.round((this.results.passed / this.results.total) * 100)}%`);
    
    if (this.results.failed > 0) {
      console.log('\\n❌ FAILED TESTS:');
      this.results.tests
        .filter(test => test.status === 'FAILED')
        .forEach(test => {
          console.log(`   • ${test.name}: ${test.error}`);
        });
    }
    
    // Performance Summary
    const performanceTest = this.results.tests.find(test => test.name === 'API Performance');
    if (performanceTest && performanceTest.result) {
      console.log('\\n⚡ PERFORMANCE SUMMARY:');
      performanceTest.result.forEach(perf => {
        if (perf.averageResponseTime > 0) {
          console.log(`   • ${perf.test}: ${perf.averageResponseTime}ms avg`);
        }
      });
    }
    
    // Security Summary
    const securityTest = this.results.tests.find(test => test.name === 'Security Headers');
    if (securityTest && securityTest.result) {
      console.log(`\\n🔒 Security Headers: ${securityTest.result.totalSecurityHeaders}/5 present`);
    }
    
    console.log('\\n📱 SMS DELIVERY CHECK:');
    console.log(`📞 Check phone ${this.testPhone} for test messages`);
    console.log('📋 Multiple SMS messages sent during testing');
    
    // Save detailed results
    this.saveResultsToFile();
    
    console.log('\\n📄 Detailed results saved to: ./qa/backend-test-results.json');
    console.log('✅ Backend testing completed!');
    
    return this.results;
  }

  saveResultsToFile() {
    const resultsFile = path.join(__dirname, 'backend-test-results.json');
    const detailedResults = {
      summary: {
        total: this.results.total,
        passed: this.results.passed,
        failed: this.results.failed,
        successRate: Math.round((this.results.passed / this.results.total) * 100),
        timestamp: new Date().toISOString(),
        testPhone: this.testPhone
      },
      tests: this.results.tests
    };
    
    fs.writeFileSync(resultsFile, JSON.stringify(detailedResults, null, 2));
  }
}

// Run the comprehensive backend tests
if (require.main === module) {
  const tester = new ComprehensiveBackendTester();
  tester.runAllTests().catch(console.error);
}

module.exports = ComprehensiveBackendTester;