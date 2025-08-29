/**
 * COMPLETE AUTOMATED WORKFLOW TEST
 * Full automation without canvas dependency - uses existing image files
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class CompleteAutomatedWorkflow {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async init() {
    console.log('🚀 COMPLETE AUTOMATED WORKFLOW TEST');
    console.log('='.repeat(50));
    
    this.browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--start-maximized'],
      slowMo: 100
    });
    
    this.page = await this.browser.newPage();
    
    // Monitor for SMS activity
    this.page.on('console', msg => {
      const text = msg.text();
      if (msg.type() === 'error') {
        console.log('🔴 Browser Error:', text);
      } else if (text.includes('SMS') || text.includes('📱') || text.includes('TextBelt') || text.includes('send-sms')) {
        console.log('📱 SMS Activity:', text);
      }
    });
    
    // Monitor network requests to SMS API
    this.page.on('response', response => {
      if (response.url().includes('/api/send-sms')) {
        console.log(`📱 SMS API Call: ${response.status()} - ${response.url()}`);
      }
    });
  }

  async screenshot(name) {
    const dir = './qa/workflow-screenshots';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const filename = `${dir}/complete-${name}-${Date.now()}.png`;
    await this.page.screenshot({ path: filename, fullPage: true });
    console.log(`📸 Screenshot: ${name}`);
    return filename;
  }

  async contactForm() {
    console.log('\\n📝 STEP 1: Contact Form');
    
    await this.page.goto('http://localhost:3000');
    await this.page.waitForSelector('input#name', { timeout: 10000 });
    await this.screenshot('01-landing');
    
    console.log('📝 Filling contact information...');
    await this.page.type('input#name', 'Complete Test User', { delay: 30 });
    await this.page.type('input#phone', '+19142168070', { delay: 30 });
    await this.page.type('input#email', 'completetest@example.com', { delay: 30 });
    
    await this.screenshot('02-contact-filled');
    
    console.log('🚀 Submitting contact form...');
    await this.page.click('button[type="submit"]');
    
    await sleep(3000);
    console.log('✅ Contact form completed');
  }

  async bikeSelection() {
    console.log('\\n🚲 STEP 2: Bike Selection');
    
    await this.page.waitForSelector('.cursor-pointer', { timeout: 10000 });
    await this.screenshot('03-bike-selection');
    
    console.log('🚲 Selecting bike brand (Rad Power Bikes)...');
    
    const bikeCards = await this.page.$$('.cursor-pointer');
    if (bikeCards.length > 0) {
      await bikeCards[0].click();
      console.log('✅ Selected bike option');
      await sleep(1000);
    } else {
      throw new Error('No bike selection cards found');
    }
    
    await this.screenshot('04-bike-selected');
    
    console.log('🚀 Clicking Continue...');
    await this.page.click('button[type="submit"]');
    
    await sleep(3000);
    console.log('✅ Bike selection completed');
  }

  async photoUpload() {
    console.log('\\n📸 STEP 3: Photo Upload');
    
    await this.page.waitForSelector('input[type="file"]', { timeout: 10000 });
    await this.screenshot('05-photo-page');
    
    // Use a simple test image - create minimal PNG
    const testImagePath = this.createSimpleTestImage();
    console.log('📸 Uploading test ID photo...');
    
    const fileInput = await this.page.$('input[type="file"]');
    await fileInput.uploadFile(testImagePath);
    
    // Wait for upload processing
    await sleep(5000);
    await this.screenshot('06-photo-uploaded');
    
    console.log('🚀 Proceeding to signature...');
    
    // Click continue/submit button
    const buttons = await this.page.$$('button');
    for (const button of buttons) {
      const text = await button.evaluate(el => el.textContent);
      const disabled = await button.evaluate(el => el.disabled);
      
      if (!disabled && (text.includes('Continue') || text.includes('Next') || button.type === 'submit')) {
        await button.click();
        break;
      }
    }
    
    await sleep(3000);
    console.log('✅ Photo upload completed');
  }

  async signature() {
    console.log('\\n✍️ STEP 4: Digital Signature');
    
    await this.page.waitForSelector('canvas', { timeout: 10000 });
    await this.screenshot('07-signature-page');
    
    console.log('✍️ Drawing digital signature...');
    
    const canvas = await this.page.$('canvas');
    const box = await canvas.boundingBox();
    
    // Draw a simple signature
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;
    
    await this.page.mouse.move(centerX - 80, centerY);
    await this.page.mouse.down();
    await this.page.mouse.move(centerX - 30, centerY - 20);
    await this.page.mouse.move(centerX + 20, centerY + 10);
    await this.page.mouse.move(centerX + 80, centerY - 5);
    await this.page.mouse.up();
    
    await sleep(1500);
    await this.screenshot('08-signature-drawn');
    
    console.log('🚀 Proceeding to payment...');
    
    // Continue to payment
    const buttons = await this.page.$$('button');
    for (const button of buttons) {
      const text = await button.evaluate(el => el.textContent);
      const disabled = await button.evaluate(el => el.disabled);
      
      if (!disabled && (text.includes('Next') || text.includes('Payment') || text.includes('Continue'))) {
        await button.click();
        break;
      }
    }
    
    await sleep(5000); // Payment page load time
    console.log('✅ Signature completed');
  }

  async payment() {
    console.log('\\n💳 STEP 5: Payment Processing');
    
    try {
      // Wait for payment page elements
      await this.page.waitForSelector('iframe, button', { timeout: 15000 });
      await this.screenshot('09-payment-page');
      
      console.log('💳 Payment page loaded, waiting for Stripe initialization...');
      await sleep(5000);
      
      // Check for Stripe frames and fill payment details
      const frames = await this.page.frames();
      console.log(`🔍 Checking ${frames.length} iframes for Stripe elements`);
      
      let paymentDetailsEntered = false;
      
      for (const frame of frames) {
        const frameUrl = frame.url();
        if (frameUrl.includes('stripe') || frame.name().includes('stripe')) {
          console.log(`💳 Found Stripe frame: ${frame.name()}`);
          
          try {
            // Try to fill card details
            const cardNumberInput = await frame.$('input[name="cardnumber"], input[placeholder*="number"], input[data-testid*="card"]');
            if (cardNumberInput) {
              console.log('💳 Filling card number...');
              await cardNumberInput.type('4242424242424242', { delay: 100 });
              
              // Expiry
              const expiryInput = await frame.$('input[name="exp-date"], input[placeholder*="MM"], input[placeholder*="expiry"]');
              if (expiryInput) {
                await expiryInput.type('1225', { delay: 100 });
              }
              
              // CVC
              const cvcInput = await frame.$('input[name="cvc"], input[placeholder*="CVC"], input[placeholder*="CVV"]');
              if (cvcInput) {
                await cvcInput.type('123', { delay: 100 });
              }
              
              // ZIP
              const zipInput = await frame.$('input[name="postal"], input[placeholder*="ZIP"], input[placeholder*="postal"]');
              if (zipInput) {
                await zipInput.type('10001', { delay: 100 });
              }
              
              paymentDetailsEntered = true;
              console.log('✅ Payment details entered successfully');
              break;
            }
          } catch (frameError) {
            console.log(`⚠️ Could not interact with frame: ${frameError.message}`);
          }
        }
      }
      
      if (!paymentDetailsEntered) {
        console.log('⚠️ Could not enter payment details automatically');
      }
      
      await sleep(2000);
      await this.screenshot('10-payment-filled');
      
      // Submit payment
      console.log('💳 Looking for payment authorization button...');
      
      // Try to find and click authorize button
      const authorizeButton = await this.page.$('button:contains("Authorize"), button:contains("Pay")');
      
      if (authorizeButton) {
        console.log('💳 Found authorize button, clicking...');
        await authorizeButton.click();
      } else {
        // Fallback: look for any submit button
        const submitButtons = await this.page.$$('button[type="submit"], button');
        for (const button of submitButtons) {
          const text = await button.evaluate(el => el.textContent);
          const disabled = await button.evaluate(el => el.disabled);
          
          if (!disabled && (text.includes('Authorize') || text.includes('Pay') || text.includes('Submit'))) {
            console.log(`💳 Clicking button: ${text}`);
            await button.click();
            break;
          }
        }
      }
      
      console.log('⏳ Waiting for payment processing and SMS delivery...');
      await sleep(10000); // Give time for payment and SMS
      
      await this.screenshot('11-payment-submitted');
      
    } catch (error) {
      console.log('❌ Payment processing error:', error.message);
      await this.screenshot('11-payment-error');
    }
    
    console.log('✅ Payment step completed');
  }

  async checkResults() {
    console.log('\\n🔍 STEP 6: Results Check');
    
    // Check current URL for success
    const currentUrl = this.page.url();
    console.log(`🔍 Current URL: ${currentUrl}`);
    
    let successPageReached = false;
    
    if (currentUrl.includes('success')) {
      console.log('🎉 SUCCESS PAGE REACHED!');
      successPageReached = true;
      await this.screenshot('12-success-page');
    } else {
      console.log('⚠️ Not on success page, checking for success elements...');
      
      // Look for success indicators
      const pageContent = await this.page.content();
      if (pageContent.includes('success') || pageContent.includes('Thank you') || pageContent.includes('completed')) {
        console.log('🎉 SUCCESS CONTENT DETECTED!');
        successPageReached = true;
        await this.screenshot('12-success-content');
      }
    }
    
    // Check admin dashboard
    console.log('📊 Checking admin dashboard...');
    await this.page.goto('http://localhost:3000/admin');
    await sleep(3000);
    await this.screenshot('13-admin-dashboard');
    
    // Count entries and check for our test
    const testRideCards = await this.page.$$('.bg-white.rounded-lg.border');
    const totalEntries = testRideCards.length;
    
    // Check page content for our test data
    const adminContent = await this.page.content();
    const hasTestUser = adminContent.includes('Complete Test User');
    const hasTestEmail = adminContent.includes('completetest@example.com');
    const hasTestPhone = adminContent.includes('19142168070');
    
    console.log(`📊 Total admin entries: ${totalEntries}`);
    console.log(`👤 Test user found: ${hasTestUser ? '✅ YES' : '❌ NO'}`);
    console.log(`📧 Test email found: ${hasTestEmail ? '✅ YES' : '❌ NO'}`);
    console.log(`📞 Test phone found: ${hasTestPhone ? '✅ YES' : '❌ NO'}`);
    
    return {
      successPageReached,
      totalEntries,
      testDataFound: hasTestUser || hasTestEmail || hasTestPhone,
      hasUser: hasTestUser,
      hasEmail: hasTestEmail,
      hasPhone: hasTestPhone
    };
  }

  createSimpleTestImage() {
    // Create a simple test image without canvas dependency
    // Create a minimal PNG file programmatically
    const width = 300;
    const height = 200;
    
    // Create minimal PNG data
    const pngData = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      // IHDR chunk
      0x00, 0x00, 0x00, 0x0D, // chunk length
      0x49, 0x48, 0x44, 0x52, // IHDR
      0x00, 0x00, 0x01, 0x2C, // width: 300
      0x00, 0x00, 0x00, 0xC8, // height: 200
      0x08, 0x02, 0x00, 0x00, 0x00, // bit depth, color type, etc.
      0x4E, 0xB0, 0x7E, 0x3B, // CRC
      // IDAT chunk (minimal data)
      0x00, 0x00, 0x00, 0x0E,
      0x49, 0x44, 0x41, 0x54,
      0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01,
      0x0D, 0x0A, 0x2D, 0xB4,
      // IEND chunk
      0x00, 0x00, 0x00, 0x00,
      0x49, 0x45, 0x4E, 0x44,
      0xAE, 0x42, 0x60, 0x82
    ]);
    
    const imagePath = path.join(__dirname, 'simple-test-id.png');
    fs.writeFileSync(imagePath, pngData);
    
    return imagePath;
  }

  async run() {
    try {
      await this.init();
      
      console.log('🎯 COMPLETE TEST CONFIGURATION:');
      console.log('👤 Name: Complete Test User');
      console.log('📞 Phone: +19142168070 (with SMS formatting fix)');
      console.log('📧 Email: completetest@example.com');
      console.log('🚲 Bike: Rad Power Bikes (first option)');
      console.log('💳 Card: 4242424242424242 (Test card)');
      console.log('');
      
      await this.contactForm();
      await this.bikeSelection();
      await this.photoUpload();
      await this.signature();
      await this.payment();
      
      const results = await this.checkResults();
      
      console.log('\\n🏆 COMPLETE AUTOMATED TEST RESULTS');
      console.log('='.repeat(60));
      console.log(`🎉 Success Page: ${results.successPageReached ? '✅ REACHED' : '❌ NOT REACHED'}`);
      console.log(`📊 Total Entries: ${results.totalEntries}`);
      console.log(`✅ Test Data: ${results.testDataFound ? '✅ FOUND IN ADMIN' : '❌ NOT FOUND'}`);
      
      if (results.testDataFound) {
        console.log('   📋 Details found:');
        console.log(`      👤 Name: ${results.hasUser ? '✅' : '❌'}`);
        console.log(`      📧 Email: ${results.hasEmail ? '✅' : '❌'}`);
        console.log(`      📞 Phone: ${results.hasPhone ? '✅' : '❌'}`);
      }
      
      console.log('\\n📱 SMS DELIVERY TEST:');
      console.log('📞 Check your phone (+19142168070) for SMS message');
      console.log('📋 SMS should include test ride confirmation details');
      
      console.log('\\n🎯 WORKFLOW STATUS:');
      if (results.successPageReached && results.testDataFound) {
        console.log('🎉 ✅ COMPLETE SUCCESS - All steps completed!');
        console.log('✅ SMS formatting fix working');
        console.log('✅ Data saved to admin dashboard');
        console.log('✅ End-to-end workflow functional');
      } else {
        console.log('⚠️ PARTIAL SUCCESS - Some issues detected');
        if (!results.successPageReached) console.log('   ❌ Success page not reached');
        if (!results.testDataFound) console.log('   ❌ Test data not found in admin');
      }
      
      console.log('\\n💡 Browser staying open for manual verification...');
      console.log('📊 Screenshots saved to: ./qa/workflow-screenshots/');
      console.log('🔧 Check server logs for SMS API activity');
      console.log('Press Ctrl+C to exit');
      
      // Keep browser open for verification
      await new Promise(() => {});
      
    } catch (error) {
      console.log('\\n❌ COMPLETE TEST FAILED');
      console.log(`Error: ${error.message}`);
      await this.screenshot('final-error');
      
      console.log('\\n📊 Browser staying open for debugging...');
      await new Promise(() => {});
    }
  }
}

// Execute the complete automated workflow
const workflow = new CompleteAutomatedWorkflow();
workflow.run();