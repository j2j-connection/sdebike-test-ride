/**
 * COMPLETE WORKFLOW TEST
 * Test the entire user flow from start to finish
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  testPhone: '+19142168070',
  testEmail: 'workflowtest@example.com',
  testName: 'Workflow Test User',
  timeout: 30000,
  screenshotDir: './qa/workflow-screenshots'
};

class CompleteWorkflowTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.currentStep = 0;
    
    // Ensure screenshot directory exists
    if (!fs.existsSync(TEST_CONFIG.screenshotDir)) {
      fs.mkdirSync(TEST_CONFIG.screenshotDir, { recursive: true });
    }
  }

  async init() {
    console.log('🚀 Initializing Complete Workflow Test...');
    
    this.browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--start-maximized'],
      slowMo: 100 // Slow down for observation
    });
    
    this.page = await this.browser.newPage();
    await this.page.setDefaultTimeout(TEST_CONFIG.timeout);
    
    // Listen for console messages and errors
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('🔴 Browser Console Error:', msg.text());
      } else if (msg.type() === 'warn') {
        console.log('🟡 Browser Console Warning:', msg.text());
      }
    });
    
    this.page.on('pageerror', error => {
      console.log('💥 Page Error:', error.message);
    });
  }

  async takeScreenshot(stepName) {
    const filename = `${TEST_CONFIG.screenshotDir}/step-${String(this.currentStep).padStart(2, '0')}-${stepName}.png`;
    await this.page.screenshot({ path: filename, fullPage: true });
    console.log(`📸 Screenshot: ${filename}`);
  }

  async waitAndClick(selector, description) {
    console.log(`🖱️ Clicking: ${description}`);
    await this.page.waitForSelector(selector, { timeout: 10000 });
    await this.page.click(selector);
    await this.page.waitForTimeout(1000);
  }

  async testStep1_LoadPage() {
    console.log('\n📱 STEP 1: Load Landing Page');
    this.currentStep = 1;
    
    const startTime = Date.now();
    await this.page.goto(TEST_CONFIG.baseUrl);
    const loadTime = Date.now() - startTime;
    
    // Check if page loaded correctly
    await this.page.waitForSelector('h1', { timeout: 10000 });
    const title = await this.page.$eval('h1', el => el.textContent);
    
    console.log(`✅ Page loaded in ${loadTime}ms`);
    console.log(`📝 Title: ${title}`);
    
    await this.takeScreenshot('landing-page');
    
    // Check for form elements (using IDs since they don't have name attributes)
    const nameInput = await this.page.$('input#name');
    const phoneInput = await this.page.$('input#phone');
    const submitButton = await this.page.$('button[type="submit"]');
    
    if (!nameInput || !phoneInput || !submitButton) {
      throw new Error('Required form elements not found on landing page');
    }
    
    console.log('✅ All form elements present');
  }

  async testStep2_ContactForm() {
    console.log('\n📝 STEP 2: Fill Contact Form');
    this.currentStep = 2;
    
    // Fill out contact information (using IDs)
    await this.page.type('input#name', TEST_CONFIG.testName);
    console.log(`📝 Entered name: ${TEST_CONFIG.testName}`);
    
    await this.page.type('input#phone', TEST_CONFIG.testPhone);
    console.log(`📞 Entered phone: ${TEST_CONFIG.testPhone}`);
    
    await this.page.type('input#email', TEST_CONFIG.testEmail);
    console.log(`📧 Entered email: ${TEST_CONFIG.testEmail}`);
    
    await this.takeScreenshot('contact-form-filled');
    
    // Submit form
    await this.waitAndClick('button[type="submit"]', 'Submit contact form');
    
    // Wait for next step to load
    await this.page.waitForTimeout(3000);
    
    // Check if we advanced to bike selection
    const bikeSelect = await this.page.$('select');
    if (!bikeSelect) {
      throw new Error('Did not advance to bike selection step');
    }
    
    console.log('✅ Contact form submitted successfully');
  }

  async testStep3_BikeSelection() {
    console.log('\n🚲 STEP 3: Bike Selection');
    this.currentStep = 3;
    
    // Wait for bike selection elements
    await this.page.waitForSelector('select', { timeout: 10000 });
    
    // Select a bike
    await this.page.select('select', 'Pace 500.3');
    console.log('🚲 Selected bike: Pace 500.3');
    
    // Set duration if available
    const durationInput = await this.page.$('input[type="number"]');
    if (durationInput) {
      await durationInput.click({ clickCount: 3 }); // Select all
      await this.page.type('input[type="number"]', '2');
      console.log('⏰ Set duration: 2 hours');
    }
    
    await this.takeScreenshot('bike-selection');
    
    // Go to next step
    await this.waitAndClick('button:contains("Next")', 'Go to next step');
    await this.page.waitForTimeout(3000);
    
    // Check if we advanced to verification
    const fileInput = await this.page.$('input[type="file"]');
    if (!fileInput) {
      throw new Error('Did not advance to verification step');
    }
    
    console.log('✅ Bike selection completed');
  }

  async testStep4_PhotoUpload() {
    console.log('\n📸 STEP 4: Photo Upload');
    this.currentStep = 4;
    
    // Create a test image
    const testImagePath = await this.createTestImage();
    
    // Upload photo
    const fileInput = await this.page.$('input[type="file"]');
    await fileInput.uploadFile(testImagePath);
    console.log('📸 Uploaded test photo');
    
    // Wait for photo to process
    await this.page.waitForTimeout(3000);
    
    // Check if image preview appears
    const imagePreview = await this.page.$('img[alt*="ID"], img[src*="blob:"]');
    if (!imagePreview) {
      console.log('⚠️ No image preview found - might be normal');
    } else {
      console.log('✅ Image preview displayed');
    }
    
    await this.takeScreenshot('photo-uploaded');
  }

  async testStep5_Signature() {
    console.log('\n✍️ STEP 5: Digital Signature');
    this.currentStep = 5;
    
    // Find signature canvas
    const canvas = await this.page.$('canvas');
    if (!canvas) {
      throw new Error('Signature canvas not found');
    }
    
    // Draw a simple signature
    const boundingBox = await canvas.boundingBox();
    
    // Draw signature strokes
    await this.page.mouse.move(boundingBox.x + 50, boundingBox.y + 100);
    await this.page.mouse.down();
    await this.page.mouse.move(boundingBox.x + 150, boundingBox.y + 80);
    await this.page.mouse.move(boundingBox.x + 250, boundingBox.y + 120);
    await this.page.mouse.move(boundingBox.x + 350, boundingBox.y + 90);
    await this.page.mouse.up();
    
    console.log('✍️ Drew signature on canvas');
    
    await this.page.waitForTimeout(2000);
    await this.takeScreenshot('signature-drawn');
    
    // Proceed to next step
    await this.waitAndClick('button:contains("Next")', 'Go to payment step');
    await this.page.waitForTimeout(5000);
  }

  async testStep6_Payment() {
    console.log('\n💳 STEP 6: Payment Authorization');
    this.currentStep = 6;
    
    try {
      // Wait for Stripe elements to load
      await this.page.waitForSelector('iframe[name*="__privateStripeFrame"], .payment-form, button:contains("Authorize")', 
        { timeout: 15000 }
      );
      
      console.log('✅ Payment form loaded');
      await this.takeScreenshot('payment-form');
      
      // Try to find and fill Stripe payment form
      const frames = await this.page.frames();
      const stripeFrame = frames.find(frame => frame.name().includes('__privateStripeFrame'));
      
      if (stripeFrame) {
        console.log('💳 Found Stripe iframe, attempting to fill card details...');
        try {
          // This is tricky with Stripe Elements - might need manual testing
          await stripeFrame.type('input[name="cardnumber"]', '4242424242424242', { delay: 100 });
          await stripeFrame.type('input[name="exp-date"]', '1225', { delay: 100 });
          await stripeFrame.type('input[name="cvc"]', '123', { delay: 100 });
          await stripeFrame.type('input[name="postal"]', '10001', { delay: 100 });
          console.log('💳 Filled card details');
        } catch (cardError) {
          console.log('⚠️ Could not fill card details automatically:', cardError.message);
          console.log('💡 This requires manual testing');
        }
      }
      
      // Look for submit button
      const authorizeButton = await this.page.$('button:contains("Authorize"), button[type="submit"]');
      if (authorizeButton) {
        console.log('💳 Found authorization button');
        console.log('⚠️ Stopping here - payment requires manual testing');
        console.log('💡 Use test card: 4242424242424242');
        
        await this.takeScreenshot('payment-ready');
        
        return { status: 'MANUAL_TESTING_REQUIRED', step: 'payment' };
      }
      
    } catch (error) {
      console.log('❌ Payment step failed:', error.message);
      await this.takeScreenshot('payment-error');
      throw error;
    }
  }

  async testStep7_CheckCompletion() {
    console.log('\n🎉 STEP 7: Check Completion');
    this.currentStep = 7;
    
    // This would run after manual payment completion
    // Check for success page or confirmation
    
    const successElements = [
      'h1:contains("Success")',
      'h2:contains("Thank you")',
      '.success-message',
      'button:contains("Start New")'
    ];
    
    for (const selector of successElements) {
      const element = await this.page.$(selector);
      if (element) {
        console.log(`✅ Found success indicator: ${selector}`);
        await this.takeScreenshot('success-page');
        return { status: 'SUCCESS' };
      }
    }
    
    console.log('⚠️ No clear success page found - may need manual completion');
    await this.takeScreenshot('final-state');
    
    return { status: 'INCOMPLETE' };
  }

  async createTestImage() {
    // Create a simple test image
    const canvas = require('canvas');
    const canvasInstance = canvas.createCanvas(400, 300);
    const ctx = canvasInstance.getContext('2d');
    
    // Draw a simple test ID
    ctx.fillStyle = '#F0F0F0';
    ctx.fillRect(0, 0, 400, 300);
    ctx.fillStyle = '#333';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('DRIVER LICENSE', 120, 60);
    ctx.font = '18px Arial';
    ctx.fillText('WORKFLOW TEST USER', 100, 120);
    ctx.fillText('DOB: 01/01/1990', 130, 160);
    ctx.font = '12px Arial';
    ctx.fillStyle = '#666';
    ctx.fillText('TEST ID FOR QA PURPOSES', 120, 200);
    ctx.fillText(new Date().toLocaleString(), 120, 230);
    
    const buffer = canvasInstance.toBuffer('image/png');
    const testImagePath = path.join(TEST_CONFIG.screenshotDir, 'test-id-photo.png');
    fs.writeFileSync(testImagePath, buffer);
    
    return testImagePath;
  }

  async runCompleteWorkflow() {
    console.log('🧪 STARTING COMPLETE WORKFLOW TEST');
    console.log('='.repeat(50));
    
    try {
      await this.init();
      
      console.log(`📱 Testing with phone: ${TEST_CONFIG.testPhone}`);
      console.log(`📧 Testing with email: ${TEST_CONFIG.testEmail}`);
      console.log(`👤 Testing with name: ${TEST_CONFIG.testName}\n`);
      
      // Run each step
      await this.testStep1_LoadPage();
      await this.testStep2_ContactForm();
      await this.testStep3_BikeSelection();
      await this.testStep4_PhotoUpload();
      await this.testStep5_Signature();
      
      const paymentResult = await this.testStep6_Payment();
      
      if (paymentResult.status === 'MANUAL_TESTING_REQUIRED') {
        console.log('\n⏸️ PAUSING FOR MANUAL TESTING');
        console.log('='.repeat(50));
        console.log('🎯 NEXT STEPS:');
        console.log('1. Complete the payment form manually with: 4242424242424242');
        console.log('2. Expiry: 12/25, CVC: 123, ZIP: 10001');
        console.log('3. Click "Authorize $1 Hold"');
        console.log('4. Complete the flow and check if data appears in admin');
        console.log('\n📊 Screenshots saved to:', TEST_CONFIG.screenshotDir);
        
        // Keep browser open for manual testing
        console.log('\n⏳ Browser will stay open for manual testing...');
        console.log('💡 Close this terminal when done testing');
        
        // Wait indefinitely for manual testing
        await new Promise(() => {});
      }
      
    } catch (error) {
      console.log('\n❌ WORKFLOW TEST FAILED');
      console.log('Error:', error.message);
      await this.takeScreenshot('error-state');
    } finally {
      // Don't close browser automatically - let user complete manual testing
      console.log('\n📊 Test completed. Browser left open for manual completion.');
    }
  }
}

// Run the test
if (require.main === module) {
  const tester = new CompleteWorkflowTester();
  tester.runCompleteWorkflow();
}

module.exports = CompleteWorkflowTester;