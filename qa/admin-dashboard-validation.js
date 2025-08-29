/**
 * ADMIN DASHBOARD VALIDATION TESTS
 * Test admin dashboard functionality, data display, and customer management features
 */

const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const ADMIN_TEST_CONFIG = {
  baseUrl: process.env.TEST_URL || 'http://localhost:3000',
  adminUrl: process.env.TEST_URL || 'http://localhost:3000/admin',
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  outputDir: './qa/admin-test-results',
  timeout: 30000,
  
  // Test customer data to validate
  testCustomers: [
    {
      name: 'Admin Test Customer 1',
      phone: '+1234567890',
      email: 'admintest1@example.com',
      bikeModel: 'Pace 500.3',
      duration: 1
    },
    {
      name: 'Admin Test Customer 2',
      phone: '+1987654321',
      email: 'admintest2@example.com',
      bikeModel: 'Turbo Vado 4.0',
      duration: 2
    },
    {
      name: 'Search Test Customer',
      phone: '+1555123456',
      email: 'searchtest@example.com',
      bikeModel: 'Ultimate C380',
      duration: 0.5
    }
  ]
};

class AdminDashboardTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.supabase = null;
    this.testResults = [];
    this.createdTestDrives = [];
    
    // Initialize Supabase if configured
    if (ADMIN_TEST_CONFIG.supabaseUrl && ADMIN_TEST_CONFIG.supabaseKey) {
      this.supabase = createClient(ADMIN_TEST_CONFIG.supabaseUrl, ADMIN_TEST_CONFIG.supabaseKey);
    }
    
    // Ensure output directory exists
    if (!fs.existsSync(ADMIN_TEST_CONFIG.outputDir)) {
      fs.mkdirSync(ADMIN_TEST_CONFIG.outputDir, { recursive: true });
    }
  }

  async init() {
    console.log('🔧 Initializing Admin Dashboard Testing...');
    
    this.browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--start-maximized']
    });
    
    this.page = await this.browser.newPage();
    await this.page.setDefaultTimeout(ADMIN_TEST_CONFIG.timeout);
  }

  async createTestData() {
    console.log('📝 Creating test data for admin dashboard...');
    
    if (!this.supabase) {
      console.log('⚠️ Supabase not configured - skipping test data creation');
      return;
    }
    
    for (const customerData of ADMIN_TEST_CONFIG.testCustomers) {
      try {
        console.log(`📊 Creating test customer: ${customerData.name}`);
        
        // Create customer
        const { data: customer, error: customerError } = await this.supabase
          .from('customers')
          .insert({
            name: customerData.name,
            phone: customerData.phone,
            email: customerData.email,
            waiver_signed: true,
            signature_data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
            submission_ip: '127.0.0.1',
            submitted_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (customerError) throw customerError;
        
        // Create test drive
        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + (customerData.duration * 60 * 60 * 1000));
        
        const { data: testDrive, error: driveError } = await this.supabase
          .from('test_drives')
          .insert({
            customer_id: customer.id,
            bike_model: customerData.bikeModel,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            status: 'active'
          })
          .select()
          .single();
        
        if (driveError) throw driveError;
        
        this.createdTestDrives.push({
          customer: customer,
          testDrive: testDrive
        });
        
        console.log(`✅ Created test drive for ${customerData.name}`);
        
      } catch (error) {
        console.log(`❌ Failed to create test data for ${customerData.name}: ${error.message}`);
      }
    }
    
    console.log(`📊 Created ${this.createdTestDrives.length} test drives for admin testing`);
  }

  async testAdminDashboardLoad() {
    console.log('\n🔧 Testing Admin Dashboard Load...');
    
    const startTime = Date.now();
    
    await this.page.goto(ADMIN_TEST_CONFIG.adminUrl);
    
    // Wait for admin dashboard to load
    await this.page.waitForSelector('h1', { timeout: 10000 });
    
    const loadTime = Date.now() - startTime;
    
    // Check if it's the admin dashboard
    const title = await this.page.$eval('h1', el => el.textContent);
    if (!title.includes('SDEBIKE Admin')) {
      throw new Error(`Incorrect admin page title: ${title}`);
    }
    
    // Check for key admin elements
    const searchInput = await this.page.$('input[placeholder*="Search"]');
    const refreshButton = await this.page.$('button:contains("Refresh")');
    
    if (!searchInput) {
      throw new Error('Search input not found');
    }
    
    if (!refreshButton) {
      throw new Error('Refresh button not found');
    }
    
    await this.takeScreenshot('admin-dashboard-loaded');
    
    console.log(`✅ Admin dashboard loaded in ${loadTime}ms`);
    return { loadTime, title };
  }

  async testTestRideDataDisplay() {
    console.log('\n📊 Testing Test Ride Data Display...');
    
    // Wait for data to load
    await this.page.waitForTimeout(3000);
    
    // Look for test ride cards
    const testRideCards = await this.page.$$('.bg-white.rounded-lg.border');
    
    if (testRideCards.length === 0) {
      throw new Error('No test ride cards found - data may not be loading');
    }
    
    console.log(`📋 Found ${testRideCards.length} test ride(s) displayed`);
    
    // Validate each card has required information
    const cardValidations = [];
    
    for (let i = 0; i < Math.min(testRideCards.length, 5); i++) {
      const card = testRideCards[i];
      
      try {
        // Check for customer name
        const nameElement = await card.$('.font-semibold');
        const name = nameElement ? await nameElement.evaluate(el => el.textContent) : null;
        
        // Check for phone number
        const phoneElement = await card.$('a[href^="tel:"]');
        const phone = phoneElement ? await phoneElement.evaluate(el => el.textContent) : null;
        
        // Check for bike model badge
        const bikeElement = await card.$('.badge, [class*="badge"]');
        const bike = bikeElement ? await bikeElement.evaluate(el => el.textContent) : null;
        
        // Check for times
        const timeElements = await card.$$('div:contains("Start:"), div:contains("Return by:")');
        
        cardValidations.push({
          cardIndex: i,
          hasName: !!name,
          hasPhone: !!phone,
          hasBike: !!bike,
          hasTime: timeElements.length > 0,
          customerName: name,
          phoneNumber: phone,
          bikeModel: bike
        });
        
        console.log(`📋 Card ${i + 1}: ${name} - ${phone} - ${bike}`);
        
      } catch (error) {
        console.log(`❌ Error validating card ${i + 1}: ${error.message}`);
        cardValidations.push({
          cardIndex: i,
          error: error.message
        });
      }
    }
    
    await this.takeScreenshot('admin-data-display');
    
    return { cardCount: testRideCards.length, validations: cardValidations };
  }

  async testPhotoAndSignatureDisplay() {
    console.log('\n📸 Testing Photo and Signature Display...');
    
    // Look for ID photos
    const idPhotos = await this.page.$$('img[alt="ID"]');
    console.log(`📷 ID Photos displayed: ${idPhotos.length}`);
    
    // Look for signatures
    const signatures = await this.page.$$('img[alt="Signature"]');
    console.log(`✍️ Signatures displayed: ${signatures.length}`);
    
    // Test image loading
    const imageTests = [];
    
    // Test ID photos
    for (let i = 0; i < Math.min(idPhotos.length, 3); i++) {
      const img = idPhotos[i];
      try {
        const src = await img.getAttribute('src');
        const naturalWidth = await img.evaluate(el => el.naturalWidth);
        const naturalHeight = await img.evaluate(el => el.naturalHeight);
        
        imageTests.push({
          type: 'ID Photo',
          index: i,
          src: src ? src.substring(0, 50) + '...' : 'no src',
          dimensions: `${naturalWidth}x${naturalHeight}`,
          loaded: naturalWidth > 0 && naturalHeight > 0
        });
        
      } catch (error) {
        imageTests.push({
          type: 'ID Photo',
          index: i,
          error: error.message
        });
      }
    }
    
    // Test signatures
    for (let i = 0; i < Math.min(signatures.length, 3); i++) {
      const img = signatures[i];
      try {
        const src = await img.getAttribute('src');
        const naturalWidth = await img.evaluate(el => el.naturalWidth);
        const naturalHeight = await img.evaluate(el => el.naturalHeight);
        
        imageTests.push({
          type: 'Signature',
          index: i,
          src: src ? src.substring(0, 50) + '...' : 'no src',
          dimensions: `${naturalWidth}x${naturalHeight}`,
          loaded: naturalWidth > 0 && naturalHeight > 0
        });
        
      } catch (error) {
        imageTests.push({
          type: 'Signature',
          index: i,
          error: error.message
        });
      }
    }
    
    // Report results
    imageTests.forEach(test => {
      if (test.loaded) {
        console.log(`✅ ${test.type} ${test.index}: ${test.dimensions}`);
      } else if (test.error) {
        console.log(`❌ ${test.type} ${test.index}: ${test.error}`);
      } else {
        console.log(`⚠️ ${test.type} ${test.index}: Not loaded properly`);
      }
    });
    
    await this.takeScreenshot('admin-images-display');
    
    return {
      idPhotoCount: idPhotos.length,
      signatureCount: signatures.length,
      imageTests
    };
  }

  async testSearchFunctionality() {
    console.log('\n🔍 Testing Search Functionality...');
    
    const searchInput = await this.page.$('input[placeholder*="Search"]');
    if (!searchInput) {
      throw new Error('Search input not found');
    }
    
    // Test search by name
    console.log('🔍 Testing search by name...');
    await searchInput.click({ clickCount: 3 }); // Select all
    await searchInput.type('Test');
    await this.page.waitForTimeout(1500);
    
    let visibleCards = await this.page.$$('.bg-white.rounded-lg.border:not([style*="display: none"])');
    const nameSearchResults = visibleCards.length;
    console.log(`📋 Name search results: ${nameSearchResults} cards`);
    
    await this.takeScreenshot('admin-search-by-name');
    
    // Test search by phone
    console.log('🔍 Testing search by phone...');
    await searchInput.click({ clickCount: 3 });
    await searchInput.type('555');
    await this.page.waitForTimeout(1500);
    
    visibleCards = await this.page.$$('.bg-white.rounded-lg.border:not([style*="display: none"])');
    const phoneSearchResults = visibleCards.length;
    console.log(`📋 Phone search results: ${phoneSearchResults} cards`);
    
    // Test search by bike model
    console.log('🔍 Testing search by bike model...');
    await searchInput.click({ clickCount: 3 });
    await searchInput.type('Pace');
    await this.page.waitForTimeout(1500);
    
    visibleCards = await this.page.$$('.bg-white.rounded-lg.border:not([style*="display: none"])');
    const bikeSearchResults = visibleCards.length;
    console.log(`📋 Bike search results: ${bikeSearchResults} cards`);
    
    // Clear search
    await searchInput.click({ clickCount: 3 });
    await searchInput.press('Backspace');
    await this.page.waitForTimeout(1500);
    
    visibleCards = await this.page.$$('.bg-white.rounded-lg.border');
    const allResults = visibleCards.length;
    console.log(`📋 All results (cleared): ${allResults} cards`);
    
    await this.takeScreenshot('admin-search-cleared');
    
    return {
      nameSearchResults,
      phoneSearchResults,
      bikeSearchResults,
      allResults
    };
  }

  async testRefreshFunctionality() {
    console.log('\n🔄 Testing Refresh Functionality...');
    
    const refreshButton = await this.page.$('button:contains("Refresh")');
    if (!refreshButton) {
      throw new Error('Refresh button not found');
    }
    
    // Count cards before refresh
    const beforeRefresh = await this.page.$$('.bg-white.rounded-lg.border');
    console.log(`📊 Cards before refresh: ${beforeRefresh.length}`);
    
    // Click refresh
    const startTime = Date.now();
    await refreshButton.click();
    
    // Wait for refresh to complete
    await this.page.waitForTimeout(2000);
    
    const refreshTime = Date.now() - startTime;
    
    // Count cards after refresh
    const afterRefresh = await this.page.$$('.bg-white.rounded-lg.border');
    console.log(`📊 Cards after refresh: ${afterRefresh.length}`);
    console.log(`⏱️ Refresh completed in ${refreshTime}ms`);
    
    return {
      beforeCount: beforeRefresh.length,
      afterCount: afterRefresh.length,
      refreshTime
    };
  }

  async testDataAccuracy() {
    console.log('\n✅ Testing Data Accuracy...');
    
    if (!this.supabase || this.createdTestDrives.length === 0) {
      console.log('⚠️ No test data available for accuracy testing');
      return { accuracy: 'SKIPPED' };
    }
    
    const accuracyResults = [];
    
    // Compare displayed data with database data
    for (const testData of this.createdTestDrives.slice(0, 3)) {
      try {
        const customer = testData.customer;
        
        // Find the customer card on the page
        const cardFound = await this.page.evaluate((customerName) => {
          const cards = document.querySelectorAll('.bg-white.rounded-lg.border');
          for (const card of cards) {
            const nameElement = card.querySelector('.font-semibold');
            if (nameElement && nameElement.textContent.includes(customerName)) {
              return {
                name: nameElement.textContent,
                phone: card.querySelector('a[href^="tel:"]')?.textContent || '',
                bike: card.querySelector('[class*="badge"]')?.textContent || ''
              };
            }
          }
          return null;
        }, customer.name);
        
        if (cardFound) {
          const phoneMatch = cardFound.phone.includes(customer.phone);
          const nameMatch = cardFound.name === customer.name;
          
          accuracyResults.push({
            customerName: customer.name,
            nameMatch,
            phoneMatch,
            displayed: cardFound
          });
          
          console.log(`${nameMatch && phoneMatch ? '✅' : '❌'} ${customer.name}: Name=${nameMatch}, Phone=${phoneMatch}`);
        } else {
          console.log(`❌ Customer not found in admin display: ${customer.name}`);
          accuracyResults.push({
            customerName: customer.name,
            found: false
          });
        }
        
      } catch (error) {
        console.log(`❌ Error checking ${testData.customer.name}: ${error.message}`);
      }
    }
    
    return { accuracyResults };
  }

  async testResponsiveDesign() {
    console.log('\n📱 Testing Admin Dashboard Responsive Design...');
    
    const viewports = [
      { name: 'Desktop', width: 1920, height: 1080 },
      { name: 'Laptop', width: 1366, height: 768 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Mobile', width: 375, height: 667 }
    ];
    
    const responsiveResults = [];
    
    for (const viewport of viewports) {
      console.log(`📐 Testing ${viewport.name} (${viewport.width}x${viewport.height})`);
      
      await this.page.setViewport({
        width: viewport.width,
        height: viewport.height
      });
      
      await this.page.waitForTimeout(1000);
      
      // Check if key elements are visible
      const title = await this.page.$('h1');
      const searchInput = await this.page.$('input[placeholder*="Search"]');
      const cards = await this.page.$$('.bg-white.rounded-lg.border');
      
      // Check if elements are properly sized
      const titleVisible = title ? await title.isIntersectingViewport() : false;
      const searchVisible = searchInput ? await searchInput.isIntersectingViewport() : false;
      
      responsiveResults.push({
        viewport: viewport.name,
        titleVisible,
        searchVisible,
        cardCount: cards.length
      });
      
      await this.takeScreenshot(`admin-responsive-${viewport.name.toLowerCase()}`);
      
      console.log(`${titleVisible && searchVisible ? '✅' : '❌'} ${viewport.name}: Title=${titleVisible}, Search=${searchVisible}, Cards=${cards.length}`);
    }
    
    // Reset to desktop view
    await this.page.setViewport({ width: 1920, height: 1080 });
    
    return responsiveResults;
  }

  async takeScreenshot(name) {
    try {
      const filename = `${ADMIN_TEST_CONFIG.outputDir}/${Date.now()}-${name}.png`;
      await this.page.screenshot({ path: filename, fullPage: true });
      console.log(`📸 Screenshot saved: ${filename}`);
    } catch (error) {
      console.log(`❌ Failed to take screenshot: ${error.message}`);
    }
  }

  async runTest(testName, testFunction) {
    console.log(`\n🧪 Running: ${testName}`);
    try {
      const result = await testFunction();
      this.testResults.push({ name: testName, status: 'PASSED', result });
      console.log(`✅ PASSED: ${testName}`);
      return result;
    } catch (error) {
      this.testResults.push({ name: testName, status: 'FAILED', error: error.message });
      console.log(`❌ FAILED: ${testName}`);
      console.log(`   Error: ${error.message}`);
      await this.takeScreenshot(`failed-${testName.toLowerCase().replace(/\s+/g, '-')}`);
      throw error;
    }
  }

  async runAllAdminTests() {
    console.log('🚀 Starting Comprehensive Admin Dashboard Testing...\n');
    
    try {
      await this.init();
      
      // Create test data first
      await this.createTestData();
      
      // Run admin dashboard tests
      await this.runTest('Admin Dashboard Load', () => this.testAdminDashboardLoad());
      await this.runTest('Test Ride Data Display', () => this.testTestRideDataDisplay());
      await this.runTest('Photo and Signature Display', () => this.testPhotoAndSignatureDisplay());
      await this.runTest('Search Functionality', () => this.testSearchFunctionality());
      await this.runTest('Refresh Functionality', () => this.testRefreshFunctionality());
      await this.runTest('Data Accuracy', () => this.testDataAccuracy());
      await this.runTest('Responsive Design', () => this.testResponsiveDesign());
      
    } catch (error) {
      console.error('❌ Admin dashboard testing failed:', error.message);
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
      
      // Cleanup test data
      await this.cleanupTestData();
      
      this.printResults();
    }
  }

  async cleanupTestData() {
    console.log('\n🧹 Cleaning up test data...');
    
    if (!this.supabase || this.createdTestDrives.length === 0) {
      return;
    }
    
    for (const testData of this.createdTestDrives) {
      try {
        // Delete test drive
        await this.supabase
          .from('test_drives')
          .delete()
          .eq('id', testData.testDrive.id);
        
        // Delete customer
        await this.supabase
          .from('customers')
          .delete()
          .eq('id', testData.customer.id);
        
        console.log(`🗑️ Cleaned up test data for ${testData.customer.name}`);
      } catch (error) {
        console.log(`❌ Failed to cleanup ${testData.customer.name}: ${error.message}`);
      }
    }
  }

  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('🔧 ADMIN DASHBOARD TEST RESULTS');
    console.log('='.repeat(60));
    
    const successful = this.testResults.filter(r => r.status === 'PASSED').length;
    const failed = this.testResults.filter(r => r.status === 'FAILED').length;
    
    console.log(`✅ Passed: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((successful / (successful + failed)) * 100).toFixed(1)}%`);
    
    console.log('\n📋 Detailed Results:');
    this.testResults.forEach(result => {
      const status = result.status === 'PASSED' ? '✅' : '❌';
      console.log(`${status} ${result.name}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
    
    console.log(`\n📸 Screenshots saved to: ${ADMIN_TEST_CONFIG.outputDir}`);
    
    if (failed === 0) {
      console.log('\n🎉 ALL ADMIN DASHBOARD TESTS PASSED!');
    } else {
      console.log('\n⚠️ Some tests failed. Review results and fix issues.');
    }
  }
}

// Manual admin testing utilities
class ManualAdminTestUtils {
  static getAdminTestingChecklist() {
    return {
      dataValidation: [
        'Customer names display correctly',
        'Phone numbers are clickable tel: links',
        'Email addresses shown (when provided)',
        'Bike models displayed in badges',
        'Start and end times formatted correctly',
        'Submission timestamps accurate',
        'IP addresses recorded (if tracking)'
      ],
      
      mediaDisplay: [
        'ID photos load and display properly',
        'Photos maintain aspect ratio',
        'Signatures render clearly',
        'Images are appropriately sized',
        'Click to enlarge functionality (if implemented)',
        'Broken image handling'
      ],
      
      functionality: [
        'Search by customer name',
        'Search by phone number',
        'Search by bike model',
        'Clear search results',
        'Refresh button updates data',
        'Real-time updates (if implemented)',
        'Pagination (if implemented)'
      ],
      
      responsiveness: [
        'Desktop layout (1920x1080+)',
        'Laptop layout (1366x768)',
        'Tablet portrait (768x1024)',
        'Tablet landscape (1024x768)',
        'Mobile portrait (375x667)',
        'Mobile landscape (667x375)'
      ],
      
      performance: [
        'Initial page load time',
        'Data refresh speed',
        'Search response time',
        'Image loading performance',
        'Memory usage with large datasets'
      ],
      
      accessibility: [
        'Keyboard navigation',
        'Screen reader compatibility',
        'Color contrast ratios',
        'Focus indicators',
        'Alt text for images'
      ]
    };
  }
  
  static createManualTestPlan() {
    console.log('📋 MANUAL ADMIN DASHBOARD TESTING PLAN');
    console.log('='.repeat(60));
    
    const checklist = this.getAdminTestingChecklist();
    
    Object.keys(checklist).forEach(category => {
      console.log(`\n📊 ${category.toUpperCase().replace(/([A-Z])/g, ' $1')}:`);
      checklist[category].forEach((item, i) => {
        console.log(`${i + 1}. ${item}`);
      });
    });
    
    console.log('\n📝 TESTING INSTRUCTIONS:');
    console.log('1. Complete several test ride submissions first');
    console.log('2. Navigate to /admin page');
    console.log('3. Verify all customer data appears correctly');
    console.log('4. Test search and filtering functionality');
    console.log('5. Check images and signatures display properly');
    console.log('6. Test on different screen sizes');
    console.log('7. Verify data accuracy against database');
    console.log('8. Test performance with multiple test rides');
    
    console.log('\n⚠️ IMPORTANT CHECKS:');
    console.log('• All submitted customer data is visible');
    console.log('• Photos uploaded during testing appear');
    console.log('• Signatures drawn during testing display');
    console.log('• Phone numbers are clickable for easy contact');
    console.log('• Search finds customers by name, phone, and bike');
    console.log('• No sensitive data is exposed inappropriately');
  }
}

module.exports = {
  AdminDashboardTester,
  ManualAdminTestUtils,
  ADMIN_TEST_CONFIG
};

// Run if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--manual-plan')) {
    ManualAdminTestUtils.createManualTestPlan();
  } else {
    const tester = new AdminDashboardTester();
    tester.runAllAdminTests();
  }
}