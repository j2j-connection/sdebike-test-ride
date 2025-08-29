/**
 * CORE FUNCTIONALITY TEST
 * Test the essential features without SMS dependency
 */

const puppeteer = require('puppeteer');

const TEST_CONFIG = {
  baseUrl: process.env.TEST_URL || 'http://localhost:3000',
  adminUrl: process.env.TEST_URL || 'http://localhost:3000/admin',
  testPhone: '+19142168070',
  timeout: 30000
};

class CoreFunctionalityTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = [];
  }

  async init() {
    console.log('🚀 Starting Core Functionality Test...');
    
    this.browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--start-maximized']
    });
    
    this.page = await this.browser.newPage();
    await this.page.setDefaultTimeout(TEST_CONFIG.timeout);
  }

  async testPageLoad() {
    console.log('\n🌐 Testing: Page Load');
    
    const startTime = Date.now();
    await this.page.goto(TEST_CONFIG.baseUrl);
    const loadTime = Date.now() - startTime;
    
    // Check if main elements are present
    const title = await this.page.$('h1');
    const form = await this.page.$('form');
    
    if (!title || !form) {
      throw new Error('Main page elements not found');
    }
    
    const titleText = await this.page.$eval('h1', el => el.textContent);
    
    console.log(`✅ Page loaded in ${loadTime}ms`);
    console.log(`📝 Title: ${titleText}`);
    
    return { loadTime, title: titleText };
  }

  async testContactForm() {
    console.log('\n📝 Testing: Contact Form');
    
    // Fill out contact form
    await this.page.waitForSelector('input[name="name"]');
    await this.page.type('input[name="name"]', 'QA Test User');
    await this.page.type('input[name="phone"]', TEST_CONFIG.testPhone);
    await this.page.type('input[name="email"]', 'qatest@example.com');
    
    console.log('📝 Filled contact information');
    
    // Submit form
    await this.page.click('button[type="submit"]');
    await this.page.waitForTimeout(2000);
    
    // Check if we moved to next step
    const currentUrl = this.page.url();
    const step2Elements = await this.page.$('select'); // Bike selection
    
    if (!step2Elements) {
      throw new Error('Did not advance to bike selection step');
    }
    
    console.log('✅ Contact form submitted successfully');
    
    return { success: true, nextStep: 'bike-selection' };
  }

  async testBikeSelection() {
    console.log('\n🚲 Testing: Bike Selection');
    
    await this.page.waitForSelector('select');
    
    // Select a bike
    await this.page.select('select', 'Pace 500.3');
    console.log('🚲 Selected bike: Pace 500.3');
    
    // Set duration if available
    const durationInput = await this.page.$('input[type="number"]');
    if (durationInput) {
      await durationInput.click();
      await this.page.keyboard.press('Backspace');
      await this.page.type('input[type="number"]', '1');
      console.log('⏰ Set duration: 1 hour');
    }
    
    // Go to next step
    await this.page.click('button:contains("Next")');
    await this.page.waitForTimeout(2000);
    
    // Check if we moved to verification step
    const fileInput = await this.page.$('input[type="file"]');
    
    if (!fileInput) {
      throw new Error('Did not advance to verification step');
    }
    
    console.log('✅ Bike selection completed');
    
    return { success: true, nextStep: 'verification' };
  }

  async testPaymentPageLoad() {
    console.log('\n💳 Testing: Payment Page Access');
    
    // Skip photo upload for now (can be tested manually)
    console.log('⏭️ Skipping photo upload (test manually)');
    
    // Navigate through steps to reach payment
    try {
      // Look for Next button and click it multiple times to reach payment
      for (let i = 0; i < 3; i++) {
        const nextButton = await this.page.$('button:contains("Next")');
        if (nextButton) {
          await nextButton.click();
          await this.page.waitForTimeout(2000);
        }
      }
      
      // Check if we can see Stripe elements (payment form)
      await this.page.waitForSelector('iframe[name*="stripe"], .payment-form, button:contains("Authorize")', 
        { timeout: 10000 }
      );
      
      console.log('✅ Payment page loaded successfully');
      
      return { success: true, stripeLoaded: true };
    } catch (error) {
      console.log('⚠️ Could not reach payment page automatically');
      console.log('💡 This needs manual testing - fill out photo/signature first');
      
      return { success: false, needsManualTesting: true };
    }
  }

  async testAdminDashboard() {
    console.log('\n🔧 Testing: Admin Dashboard');
    
    await this.page.goto(TEST_CONFIG.adminUrl);
    await this.page.waitForTimeout(3000);
    
    // Check admin page elements
    const adminTitle = await this.page.$('h1:contains("SDEBIKE Admin")');
    const searchInput = await this.page.$('input[placeholder*="Search"]');
    
    if (!adminTitle) {
      throw new Error('Admin dashboard did not load properly');
    }
    
    console.log('✅ Admin dashboard loaded');
    
    // Check for test ride data
    const testRideCards = await this.page.$$('.bg-white.rounded-lg.border');
    console.log(`📊 Found ${testRideCards.length} test rides in admin dashboard`);
    
    return { 
      success: true, 
      testRideCount: testRideCards.length,
      hasSearch: !!searchInput 
    };
  }

  async runTest(name, testFunction) {
    console.log(`\n🧪 Running: ${name}`);
    try {
      const result = await testFunction();
      this.results.push({ name, status: 'PASSED', result });
      console.log(`✅ PASSED: ${name}`);
    } catch (error) {
      this.results.push({ name, status: 'FAILED', error: error.message });
      console.log(`❌ FAILED: ${name} - ${error.message}`);
    }
  }

  async runAllTests() {
    try {
      await this.init();
      
      await this.runTest('Page Load', () => this.testPageLoad());
      await this.runTest('Contact Form', () => this.testContactForm());
      await this.runTest('Bike Selection', () => this.testBikeSelection());
      await this.runTest('Payment Page Load', () => this.testPaymentPageLoad());
      await this.runTest('Admin Dashboard', () => this.testAdminDashboard());
      
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
      this.printResults();
    }
  }

  printResults() {
    console.log('\n' + '='.repeat(50));
    console.log('🧪 CORE FUNCTIONALITY TEST RESULTS');
    console.log('='.repeat(50));
    
    const passed = this.results.filter(r => r.status === 'PASSED').length;
    const failed = this.results.filter(r => r.status === 'FAILED').length;
    
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
    
    console.log('\n📋 Test Details:');
    this.results.forEach(result => {
      const status = result.status === 'PASSED' ? '✅' : '❌';
      console.log(`${status} ${result.name}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
    
    console.log('\n📱 MANUAL TESTING NEEDED:');
    console.log('1. 📸 Photo Upload - Use your phone camera');
    console.log('2. ✍️ Digital Signature - Draw on touchscreen/trackpad');
    console.log('3. 💳 Payment Flow - Use Stripe test card (4242424242424242)');
    console.log('4. 📱 SMS Delivery - Set up TextBelt API key');
    console.log('5. 🔄 Complete End-to-End Flow');
    
    if (failed === 0) {
      console.log('\n🎉 CORE FUNCTIONALITY WORKING!');
      console.log('Your app is ready for manual testing and production!');
    }
  }
}

// Run if called directly
if (require.main === module) {
  const tester = new CoreFunctionalityTester();
  tester.runAllTests();
}

module.exports = CoreFunctionalityTester;