/**
 * COMPREHENSIVE MANUAL QA TEST PLAN
 * SD Electric Bike Test Ride Application
 * 
 * This script provides a complete manual testing framework for validating
 * every screen, feature, and integration in the app.
 */

const { createClient } = require('@supabase/supabase-js');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Configuration
const TEST_CONFIG = {
  baseUrl: process.env.TEST_URL || 'http://localhost:3000',
  adminUrl: process.env.TEST_URL || 'http://localhost:3000/admin',
  testPhoneNumber: process.env.TEST_PHONE_NUMBER || '', // YOUR ACTUAL PHONE NUMBER
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  testTimeout: 30000,
  screenshotDir: './qa/screenshots'
};

// Test Data Sets
const TEST_DATA = {
  customers: [
    {
      name: 'John Test Smith',
      phone: TEST_CONFIG.testPhoneNumber,
      email: 'john.test@example.com',
      bikeModel: 'Pace 500.3',
      duration: 1
    },
    {
      name: 'Jane QA User',
      phone: TEST_CONFIG.testPhoneNumber,
      email: 'jane.qa@example.com',
      bikeModel: 'Turbo Vado 4.0',
      duration: 2
    },
    {
      name: 'Mike Test Rider',
      phone: TEST_CONFIG.testPhoneNumber,
      email: 'mike.test@example.com',
      bikeModel: 'Ultimate C380',
      duration: 0.5
    }
  ],
  
  testImages: [
    { name: 'portrait-id.jpg', type: 'portrait', size: 'large' },
    { name: 'landscape-id.png', type: 'landscape', size: 'medium' },
    { name: 'small-id.jpg', type: 'small', size: 'small' }
  ],
  
  stripeTestCards: {
    success: '4242424242424242',
    declined: '4000000000000002',
    requiresAuth: '4000002760003184',
    insufficientFunds: '4000000000009995'
  }
};

class ComprehensiveQATest {
  constructor() {
    this.browser = null;
    this.page = null;
    this.supabase = null;
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
    
    // Initialize Supabase if configured
    if (TEST_CONFIG.supabaseUrl && TEST_CONFIG.supabaseKey) {
      this.supabase = createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.supabaseKey);
    }
    
    // Ensure screenshot directory exists
    if (!fs.existsSync(TEST_CONFIG.screenshotDir)) {
      fs.mkdirSync(TEST_CONFIG.screenshotDir, { recursive: true });
    }
  }

  async init() {
    console.log('🚀 Initializing Comprehensive QA Testing...');
    
    this.browser = await puppeteer.launch({
      headless: false, // Set to true for CI/automated testing
      defaultViewport: null,
      args: ['--start-maximized', '--disable-web-security']
    });
    
    this.page = await this.browser.newPage();
    await this.page.setDefaultTimeout(TEST_CONFIG.testTimeout);
    
    console.log('✅ Browser initialized successfully');
  }

  async runTest(testName, testFunction) {
    console.log(`\n🧪 Running: ${testName}`);
    try {
      await testFunction();
      this.results.passed++;
      this.results.tests.push({ name: testName, status: 'PASSED' });
      console.log(`✅ PASSED: ${testName}`);
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({ name: testName, status: 'FAILED', error: error.message });
      console.log(`❌ FAILED: ${testName}`);
      console.log(`   Error: ${error.message}`);
      
      // Take screenshot on failure
      await this.takeScreenshot(`failed-${testName.toLowerCase().replace(/\s+/g, '-')}`);
    }
  }

  async takeScreenshot(name) {
    try {
      const filename = `${TEST_CONFIG.screenshotDir}/${Date.now()}-${name}.png`;
      await this.page.screenshot({ path: filename, fullPage: true });
      console.log(`📸 Screenshot saved: ${filename}`);
    } catch (error) {
      console.log(`❌ Failed to take screenshot: ${error.message}`);
    }
  }

  // =============================================================================
  // PHASE 1: SCREEN-BY-SCREEN TESTING
  // =============================================================================

  async testLandingPage() {
    await this.page.goto(TEST_CONFIG.baseUrl);
    
    // Check if page loads
    await this.page.waitForSelector('h1', { timeout: 10000 });
    
    // Verify title and branding
    const title = await this.page.$eval('h1', el => el.textContent);
    if (!title.includes('San Diego Electric Bike')) {
      throw new Error(`Incorrect title: ${title}`);
    }
    
    // Check if logo loads
    const logo = await this.page.$('img[alt*="Logo"]');
    if (!logo) {
      throw new Error('Logo not found');
    }
    
    // Verify progress bar exists
    const progressBar = await this.page.$('.flex.items-center.justify-center');
    if (!progressBar) {
      throw new Error('Progress bar not found');
    }
    
    await this.takeScreenshot('landing-page');
  }

  async testContactInfoScreen() {
    // Fill out contact information
    await this.page.waitForSelector('input[name="name"]', { timeout: 5000 });
    
    const testCustomer = TEST_DATA.customers[0];
    
    // Test form validation with empty fields
    await this.page.click('button[type="submit"]');
    await this.page.waitForTimeout(1000);
    
    // Check if validation errors appear
    const errors = await this.page.$$('.text-red-500');
    if (errors.length === 0) {
      throw new Error('Form validation not working - no error messages shown');
    }
    
    // Fill out form with valid data
    await this.page.type('input[name="name"]', testCustomer.name);
    await this.page.type('input[name="phone"]', testCustomer.phone);
    await this.page.type('input[name="email"]', testCustomer.email);
    
    await this.takeScreenshot('contact-info-filled');
    
    // Submit and verify we move to next step
    await this.page.click('button[type="submit"]');
    await this.page.waitForTimeout(2000);
    
    // Check if we moved to step 2
    const step2 = await this.page.$('.text-yellow-400');
    if (!step2) {
      throw new Error('Did not advance to step 2');
    }
  }

  async testBikeSelectionScreen() {
    await this.page.waitForSelector('select', { timeout: 5000 });
    
    const testCustomer = TEST_DATA.customers[0];
    
    // Select bike model
    await this.page.select('select', testCustomer.bikeModel);
    
    // Set duration
    const durationInput = await this.page.$('input[type="number"]');
    if (durationInput) {
      await this.page.click('input[type="number"]');
      await this.page.keyboard.press('Backspace');
      await this.page.type('input[type="number"]', testCustomer.duration.toString());
    }
    
    await this.takeScreenshot('bike-selection');
    
    // Submit and move to next step
    await this.page.click('button:contains("Next")');
    await this.page.waitForTimeout(2000);
  }

  // =============================================================================
  // PHASE 2: PHOTO UPLOAD TESTING
  // =============================================================================

  async testPhotoUploadScenarios() {
    console.log('📸 Testing Photo Upload Scenarios...');
    
    await this.page.waitForSelector('input[type="file"]', { timeout: 5000 });
    
    // Test 1: Upload a valid image
    const fileInput = await this.page.$('input[type="file"]');
    if (!fileInput) {
      throw new Error('File input not found');
    }
    
    // Create a test image file (or use existing one)
    const testImagePath = await this.createTestImage();
    
    await fileInput.uploadFile(testImagePath);
    await this.page.waitForTimeout(3000);
    
    // Verify image preview appears
    const imagePreview = await this.page.$('img[alt*="ID"]');
    if (!imagePreview) {
      throw new Error('Image preview not shown after upload');
    }
    
    await this.takeScreenshot('photo-uploaded');
    
    // Test different file formats if you have them
    // await this.testDifferentImageFormats();
  }

  async createTestImage() {
    // Create a simple test image programmatically
    const canvas = require('canvas');
    const canvasInstance = canvas.createCanvas(400, 300);
    const ctx = canvasInstance.getContext('2d');
    
    // Draw a simple test image
    ctx.fillStyle = '#4A90E2';
    ctx.fillRect(0, 0, 400, 300);
    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.fillText('TEST ID PHOTO', 100, 150);
    
    const buffer = canvasInstance.toBuffer('image/png');
    const testImagePath = path.join(TEST_CONFIG.screenshotDir, 'test-id.png');
    fs.writeFileSync(testImagePath, buffer);
    
    return testImagePath;
  }

  // =============================================================================
  // PHASE 3: SIGNATURE TESTING
  // =============================================================================

  async testDigitalSignature() {
    console.log('✍️ Testing Digital Signature...');
    
    await this.page.waitForSelector('canvas', { timeout: 5000 });
    
    // Get canvas element
    const canvas = await this.page.$('canvas');
    if (!canvas) {
      throw new Error('Signature canvas not found');
    }
    
    // Draw a signature on the canvas
    await this.page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      const ctx = canvas.getContext('2d');
      
      // Simulate drawing a signature
      ctx.beginPath();
      ctx.moveTo(50, 50);
      ctx.lineTo(150, 100);
      ctx.lineTo(250, 50);
      ctx.lineTo(350, 100);
      ctx.stroke();
      
      // Trigger any onChange events
      const event = new Event('change');
      canvas.dispatchEvent(event);
    });
    
    await this.page.waitForTimeout(1000);
    await this.takeScreenshot('signature-drawn');
    
    // Test clear signature functionality if available
    const clearButton = await this.page.$('button:contains("Clear")');
    if (clearButton) {
      await clearButton.click();
      await this.page.waitForTimeout(500);
      await this.takeScreenshot('signature-cleared');
    }
    
    // Re-draw signature
    await this.page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      const ctx = canvas.getContext('2d');
      ctx.beginPath();
      ctx.moveTo(100, 75);
      ctx.lineTo(300, 75);
      ctx.stroke();
    });
  }

  // =============================================================================
  // PHASE 4: PAYMENT TESTING
  // =============================================================================

  async testPaymentScreen() {
    console.log('💳 Testing Payment Screen...');
    
    // Navigate to next step (should be payment)
    await this.page.click('button:contains("Next")');
    await this.page.waitForTimeout(3000);
    
    // Wait for Stripe Elements to load
    await this.page.waitForSelector('iframe[name*="__privateStripeFrame"]', { timeout: 10000 });
    
    // Test with successful card
    await this.fillStripePaymentForm(TEST_DATA.stripeTestCards.success);
    
    await this.takeScreenshot('payment-form-filled');
    
    // Submit payment
    const paymentButton = await this.page.$('button[type="submit"]:contains("Authorize")');
    if (paymentButton) {
      await paymentButton.click();
      await this.page.waitForTimeout(5000);
      
      // Check for success or error
      const success = await this.page.$('.text-green-800');
      const error = await this.page.$('.text-red-500');
      
      if (error && !success) {
        const errorText = await this.page.$eval('.text-red-500', el => el.textContent);
        throw new Error(`Payment failed: ${errorText}`);
      }
    }
  }

  async fillStripePaymentForm(cardNumber) {
    // This is tricky with Stripe Elements in iframe
    // You may need to adapt this based on your Stripe setup
    try {
      const cardFrame = await this.page.frames().find(frame => frame.name().includes('__privateStripeFrame'));
      if (cardFrame) {
        await cardFrame.type('input[name="cardnumber"]', cardNumber);
        await cardFrame.type('input[name="exp-date"]', '12/25');
        await cardFrame.type('input[name="cvc"]', '123');
        await cardFrame.type('input[name="postal"]', '12345');
      }
    } catch (error) {
      console.log('⚠️ Stripe iframe interaction may require manual testing');
    }
  }

  // =============================================================================
  // PHASE 5: SMS TESTING
  // =============================================================================

  async testSMSIntegration() {
    console.log('📱 Testing SMS Integration...');
    
    if (!TEST_CONFIG.testPhoneNumber) {
      throw new Error('TEST_PHONE_NUMBER not configured - please set your phone number for SMS testing');
    }
    
    // Complete the flow to trigger SMS
    await this.page.click('button:contains("Next")');
    await this.page.waitForTimeout(2000);
    
    // Final confirmation step
    const confirmButton = await this.page.$('button:contains("Complete")');
    if (confirmButton) {
      await confirmButton.click();
      await this.page.waitForTimeout(5000);
      
      // Check if we reached success screen
      const success = await this.page.$('h2:contains("Success")');
      if (!success) {
        throw new Error('Did not reach success screen - SMS may not have been triggered');
      }
      
      console.log(`📱 SMS should be sent to: ${TEST_CONFIG.testPhoneNumber}`);
      console.log('⏱️  Please check your phone for SMS confirmation message');
      
      // Wait for user confirmation
      await this.page.waitForTimeout(10000);
    }
  }

  // =============================================================================
  // PHASE 6: ADMIN DASHBOARD TESTING
  // =============================================================================

  async testAdminDashboard() {
    console.log('🔧 Testing Admin Dashboard...');
    
    // Navigate to admin page
    await this.page.goto(TEST_CONFIG.adminUrl);
    await this.page.waitForTimeout(3000);
    
    // Check if admin page loads
    const adminTitle = await this.page.$('h1:contains("SDEBIKE Admin")');
    if (!adminTitle) {
      throw new Error('Admin dashboard did not load');
    }
    
    // Wait for data to load
    await this.page.waitForTimeout(3000);
    
    // Check if test ride data appears
    const testRideCards = await this.page.$$('.bg-white.rounded-lg.border');
    if (testRideCards.length === 0) {
      throw new Error('No test ride data found in admin dashboard');
    }
    
    console.log(`✅ Found ${testRideCards.length} test ride(s) in admin dashboard`);
    
    // Check if images are displayed
    const idPhotos = await this.page.$$('img[alt="ID"]');
    const signatures = await this.page.$$('img[alt="Signature"]');
    
    console.log(`📸 ID Photos displayed: ${idPhotos.length}`);
    console.log(`✍️ Signatures displayed: ${signatures.length}`);
    
    // Test search functionality
    const searchInput = await this.page.$('input[placeholder*="Search"]');
    if (searchInput) {
      await searchInput.type('Test');
      await this.page.waitForTimeout(1000);
      
      // Verify search results
      const filteredCards = await this.page.$$('.bg-white.rounded-lg.border');
      console.log(`🔍 Search results: ${filteredCards.length} test rides`);
    }
    
    await this.takeScreenshot('admin-dashboard');
  }

  // =============================================================================
  // PHASE 7: DATABASE VERIFICATION
  // =============================================================================

  async testDatabasePersistence() {
    console.log('🗄️ Testing Database Persistence...');
    
    if (!this.supabase) {
      console.log('⚠️ Supabase not configured - skipping database tests');
      return;
    }
    
    // Query recent test drives
    const { data: testDrives, error } = await this.supabase
      .from('test_drives')
      .select(`
        *,
        customers (*)
      `)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }
    
    console.log(`📊 Found ${testDrives.length} test drives in database`);
    
    // Verify data integrity
    testDrives.forEach((drive, index) => {
      if (!drive.customers) {
        throw new Error(`Test drive ${index} missing customer data`);
      }
      
      if (!drive.customers.name || !drive.customers.phone) {
        throw new Error(`Test drive ${index} missing required customer fields`);
      }
      
      console.log(`✅ Test Drive ${index + 1}:`, {
        customer: drive.customers.name,
        phone: drive.customers.phone,
        bike: drive.bike_model,
        hasPhoto: !!drive.customers.id_photo_url,
        hasSignature: !!drive.customers.signature_data
      });
    });
  }

  // =============================================================================
  // CROSS-DEVICE TESTING
  // =============================================================================

  async testMobileResponsiveness() {
    console.log('📱 Testing Mobile Responsiveness...');
    
    // Test different viewport sizes
    const viewports = [
      { name: 'iPhone SE', width: 375, height: 667 },
      { name: 'iPad', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 }
    ];
    
    for (const viewport of viewports) {
      console.log(`📐 Testing ${viewport.name} (${viewport.width}x${viewport.height})`);
      
      await this.page.setViewport({
        width: viewport.width,
        height: viewport.height
      });
      
      await this.page.goto(TEST_CONFIG.baseUrl);
      await this.page.waitForTimeout(2000);
      
      // Check if elements are visible and properly sized
      const header = await this.page.$('h1');
      const form = await this.page.$('form');
      
      if (!header || !form) {
        throw new Error(`Essential elements not visible on ${viewport.name}`);
      }
      
      await this.takeScreenshot(`responsive-${viewport.name.toLowerCase()}`);
    }
    
    // Reset to default viewport
    await this.page.setViewport({ width: 1920, height: 1080 });
  }

  // =============================================================================
  // MAIN TEST RUNNER
  // =============================================================================

  async runAllTests() {
    console.log('🚀 Starting Comprehensive QA Test Suite...\n');
    
    try {
      await this.init();
      
      // Phase 1: Screen Testing
      console.log('\n📋 PHASE 1: SCREEN-BY-SCREEN TESTING');
      await this.runTest('Landing Page Load', () => this.testLandingPage());
      await this.runTest('Contact Info Screen', () => this.testContactInfoScreen());
      await this.runTest('Bike Selection Screen', () => this.testBikeSelectionScreen());
      
      // Phase 2: Media Testing
      console.log('\n📋 PHASE 2: PHOTO & SIGNATURE TESTING');
      await this.runTest('Photo Upload Scenarios', () => this.testPhotoUploadScenarios());
      await this.runTest('Digital Signature', () => this.testDigitalSignature());
      
      // Phase 3: Payment Testing
      console.log('\n📋 PHASE 3: PAYMENT TESTING');
      await this.runTest('Payment Screen', () => this.testPaymentScreen());
      
      // Phase 4: SMS Testing
      console.log('\n📋 PHASE 4: SMS INTEGRATION TESTING');
      await this.runTest('SMS Integration', () => this.testSMSIntegration());
      
      // Phase 5: Admin Testing
      console.log('\n📋 PHASE 5: ADMIN DASHBOARD TESTING');
      await this.runTest('Admin Dashboard', () => this.testAdminDashboard());
      
      // Phase 6: Database Testing
      console.log('\n📋 PHASE 6: DATABASE TESTING');
      await this.runTest('Database Persistence', () => this.testDatabasePersistence());
      
      // Phase 7: Responsive Testing
      console.log('\n📋 PHASE 7: RESPONSIVE TESTING');
      await this.runTest('Mobile Responsiveness', () => this.testMobileResponsiveness());
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
      
      this.printResults();
    }
  }

  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 COMPREHENSIVE QA TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📈 Success Rate: ${((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1)}%`);
    
    console.log('\n📋 Detailed Results:');
    this.results.tests.forEach(test => {
      const status = test.status === 'PASSED' ? '✅' : '❌';
      console.log(`${status} ${test.name}`);
      if (test.error) {
        console.log(`   Error: ${test.error}`);
      }
    });
    
    console.log('\n📸 Screenshots saved to:', TEST_CONFIG.screenshotDir);
    
    if (this.results.failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! Your app is ready for production!');
    } else {
      console.log('\n⚠️  Some tests failed. Please review and fix issues before production deployment.');
    }
  }
}

// =============================================================================
// EXECUTION
// =============================================================================

if (require.main === module) {
  // Check configuration
  if (!TEST_CONFIG.testPhoneNumber) {
    console.log('⚠️  WARNING: TEST_PHONE_NUMBER not set');
    console.log('   Set your phone number to test SMS functionality:');
    console.log('   export TEST_PHONE_NUMBER="+1234567890"');
  }
  
  const qa = new ComprehensiveQATest();
  qa.runAllTests();
}

module.exports = ComprehensiveQATest;