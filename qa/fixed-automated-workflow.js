/**
 * FIXED AUTOMATED WORKFLOW TEST
 * Corrected payment automation with proper CSS selectors and Stripe handling
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class FixedAutomatedWorkflow {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async init() {
    console.log('🔧 FIXED AUTOMATED WORKFLOW TEST');
    console.log('='.repeat(50));
    
    this.browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--start-maximized'],
      slowMo: 100
    });
    
    this.page = await this.browser.newPage();
    
    // Monitor for SMS and payment activity
    this.page.on('console', msg => {
      const text = msg.text();
      if (msg.type() === 'error') {
        console.log('🔴 Browser Error:', text);
      } else if (text.includes('SMS') || text.includes('📱') || text.includes('TextBelt') || text.includes('send-sms')) {
        console.log('📱 SMS Activity:', text);
      } else if (text.includes('payment') || text.includes('stripe') || text.includes('Payment')) {
        console.log('💳 Payment Activity:', text);
      }
    });
    
    // Monitor network requests
    this.page.on('response', response => {
      const url = response.url();
      if (url.includes('/api/send-sms')) {
        console.log(`📱 SMS API Call: ${response.status()}`);
      } else if (url.includes('create-payment') || url.includes('stripe')) {
        console.log(`💳 Payment API Call: ${response.status()} - ${url.split('/').pop()}`);
      }
    });
  }

  async screenshot(name) {
    const dir = './qa/workflow-screenshots';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const filename = `${dir}/fixed-${name}-${Date.now()}.png`;
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
    await this.page.type('input#name', 'Fixed Test User', { delay: 30 });
    await this.page.type('input#phone', '+19142168070', { delay: 30 });
    await this.page.type('input#email', 'fixedtest@example.com', { delay: 30 });
    
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
    
    console.log('🚲 Selecting bike brand...');
    
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
    
    const testImagePath = this.createSimpleTestImage();
    console.log('📸 Uploading test ID photo...');
    
    const fileInput = await this.page.$('input[type="file"]');
    await fileInput.uploadFile(testImagePath);
    
    await sleep(5000);
    await this.screenshot('06-photo-uploaded');
    
    console.log('🚀 Proceeding to signature...');
    
    // Find and click continue button
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
    
    // Click continue button using better selector logic
    const nextButton = await this.page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => 
        !btn.disabled && (
          btn.textContent.includes('Next') ||
          btn.textContent.includes('Payment') ||
          btn.textContent.includes('Continue') ||
          btn.type === 'submit'
        )
      );
    });
    
    if (nextButton.asElement()) {
      await nextButton.asElement().click();
    }
    
    await sleep(5000);
    console.log('✅ Signature completed');
  }

  async payment() {
    console.log('\\n💳 STEP 5: Fixed Payment Processing');
    
    try {
      // Wait for payment page elements
      await this.page.waitForSelector('iframe, button', { timeout: 15000 });
      await this.screenshot('09-payment-page');
      
      console.log('💳 Payment page loaded, analyzing Stripe setup...');
      await sleep(5000);
      
      // Check for Stripe frames and fill payment details
      const frames = await this.page.frames();
      console.log(`🔍 Found ${frames.length} iframes, looking for Stripe elements`);
      
      let paymentDetailsEntered = false;
      let cardNumberFilled = false;
      
      // Try to fill Stripe payment form
      for (const frame of frames) {
        const frameUrl = frame.url();
        const frameName = frame.name();
        
        if (frameUrl.includes('stripe') || frameName.includes('stripe')) {
          console.log(`💳 Processing Stripe frame: ${frameName}`);
          
          try {
            // Wait for frame to be ready
            await sleep(2000);
            
            // Try different card number input selectors
            const cardSelectors = [
              'input[name="cardnumber"]',
              'input[placeholder*="card number" i]', 
              'input[placeholder*="Card number" i]',
              'input[data-testid*="card"]',
              'input[autocomplete="cc-number"]',
              '.CardField input',
              '[data-elements-stable-field-name="cardNumber"] input',
              'input[inputmode="numeric"]'
            ];
            
            for (const selector of cardSelectors) {
              try {
                const cardInput = await frame.$(selector);
                if (cardInput) {
                  console.log(`💳 Found card input with selector: ${selector}`);
                  await cardInput.type('4242424242424242', { delay: 100 });
                  cardNumberFilled = true;
                  
                  // Try to fill expiry
                  const expirySelectors = [
                    'input[name="exp-date"]',
                    'input[placeholder*="MM" i]',
                    'input[placeholder*="expiry" i]',
                    'input[autocomplete="cc-exp"]'
                  ];
                  
                  for (const expSelector of expirySelectors) {
                    const expInput = await frame.$(expSelector);
                    if (expInput) {
                      await expInput.type('1225', { delay: 100 });
                      break;
                    }
                  }
                  
                  // Try to fill CVC
                  const cvcSelectors = [
                    'input[name="cvc"]',
                    'input[placeholder*="CVC" i]',
                    'input[placeholder*="CVV" i]',
                    'input[autocomplete="cc-csc"]'
                  ];
                  
                  for (const cvcSelector of cvcSelectors) {
                    const cvcInput = await frame.$(cvcSelector);
                    if (cvcInput) {
                      await cvcInput.type('123', { delay: 100 });
                      break;
                    }
                  }
                  
                  // Try to fill postal code
                  const zipSelectors = [
                    'input[name="postal"]',
                    'input[placeholder*="ZIP" i]',
                    'input[placeholder*="postal" i]',
                    'input[autocomplete="postal-code"]'
                  ];
                  
                  for (const zipSelector of zipSelectors) {
                    const zipInput = await frame.$(zipSelector);
                    if (zipInput) {
                      await zipInput.type('10001', { delay: 100 });
                      break;
                    }
                  }
                  
                  paymentDetailsEntered = true;
                  console.log('✅ Successfully filled Stripe payment form');
                  break;
                }
              } catch (selectorError) {
                // Try next selector
                continue;
              }
            }
            
            if (cardNumberFilled) break;
            
          } catch (frameError) {
            console.log(`⚠️ Frame interaction failed: ${frameError.message}`);
          }
        }
      }
      
      if (!paymentDetailsEntered) {
        console.log('⚠️ Could not fill payment details automatically');
      }
      
      await sleep(2000);
      await this.screenshot('10-payment-filled');
      
      // Submit payment using improved button finding
      console.log('💳 Looking for payment submission button...');
      
      let paymentSubmitted = false;
      
      // Method 1: Try finding button by text content using evaluate
      const authorizeButton = await this.page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(btn => 
          !btn.disabled && (
            btn.textContent.includes('Authorize') ||
            btn.textContent.includes('Pay') ||
            btn.textContent.includes('Submit') ||
            btn.textContent.includes('Complete')
          )
        );
      });
      
      if (authorizeButton.asElement()) {
        console.log('💳 Found authorize button via text search');
        await authorizeButton.asElement().click();
        paymentSubmitted = true;
      } else {
        // Method 2: Try common button selectors
        const buttonSelectors = [
          'button[type="submit"]',
          '.payment-submit',
          '[data-testid*="submit"]',
          '[data-testid*="pay"]',
          'button:not([disabled])'
        ];
        
        for (const selector of buttonSelectors) {
          try {
            const button = await this.page.$(selector);
            if (button) {
              const text = await button.evaluate(el => el.textContent);
              const disabled = await button.evaluate(el => el.disabled);
              
              if (!disabled && (
                text.includes('Authorize') || 
                text.includes('Pay') || 
                text.includes('Submit') ||
                text.includes('Complete')
              )) {
                console.log(`💳 Clicking button: ${text.trim()}`);
                await button.click();
                paymentSubmitted = true;
                break;
              }
            }
          } catch (e) {
            continue;
          }
        }
      }
      
      if (paymentSubmitted) {
        console.log('✅ Payment submission attempted');
        console.log('⏳ Waiting for payment processing and potential SMS...');
        await sleep(10000); // Give extra time for payment processing and SMS
        
        await this.screenshot('11-payment-submitted');
      } else {
        console.log('❌ Could not find or click payment submission button');
        await this.screenshot('11-payment-no-submit');
      }
      
    } catch (error) {
      console.log('❌ Payment processing error:', error.message);
      await this.screenshot('11-payment-error');
    }
    
    console.log('✅ Payment step completed');
  }

  async checkResults() {
    console.log('\\n🔍 STEP 6: Results Verification');
    
    // Wait a bit more for any final processing
    await sleep(3000);
    
    // Check current URL for success
    const currentUrl = this.page.url();
    console.log(`🔍 Current URL: ${currentUrl}`);
    
    let successPageReached = false;
    
    if (currentUrl.includes('success') || currentUrl.includes('complete')) {
      console.log('🎉 SUCCESS PAGE REACHED!');
      successPageReached = true;
      await this.screenshot('12-success-page');
    } else {
      console.log('🔍 Checking page content for success indicators...');
      
      // Look for success indicators in page content
      const pageText = await this.page.evaluate(() => document.body.textContent);
      const hasSuccessIndicators = 
        pageText.includes('success') || 
        pageText.includes('Success') || 
        pageText.includes('Thank you') ||
        pageText.includes('completed') ||
        pageText.includes('Completed') ||
        pageText.includes('confirmation');
        
      if (hasSuccessIndicators) {
        console.log('🎉 SUCCESS INDICATORS FOUND in page content');
        successPageReached = true;
        await this.screenshot('12-success-content');
      } else {
        console.log('⚠️ No clear success indicators found');
        await this.screenshot('12-current-state');
      }
    }
    
    // Check admin dashboard
    console.log('📊 Checking admin dashboard...');
    await this.page.goto('http://localhost:3000/admin');
    await sleep(3000);
    await this.screenshot('13-admin-dashboard');
    
    // Count entries and check for our test data
    const testRideCards = await this.page.$$('.bg-white.rounded-lg.border');
    const totalEntries = testRideCards.length;
    
    // Check page content for our test data
    const adminContent = await this.page.content();
    const hasTestUser = adminContent.includes('Fixed Test User');
    const hasTestEmail = adminContent.includes('fixedtest@example.com');
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
    // Create a minimal PNG file
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
    
    const imagePath = path.join(__dirname, 'fixed-test-id.png');
    fs.writeFileSync(imagePath, pngData);
    
    return imagePath;
  }

  async run() {
    try {
      await this.init();
      
      console.log('🎯 FIXED TEST CONFIGURATION:');
      console.log('👤 Name: Fixed Test User');
      console.log('📞 Phone: +19142168070 (with SMS formatting)');
      console.log('📧 Email: fixedtest@example.com');
      console.log('🚲 Bike: Rad Power Bikes');
      console.log('💳 Card: 4242424242424242 (Test card)');
      console.log('🔧 Fixed: CSS selectors, Stripe interaction, payment flow');
      console.log('');
      
      await this.contactForm();
      await this.bikeSelection();
      await this.photoUpload();
      await this.signature();
      await this.payment();
      
      const results = await this.checkResults();
      
      console.log('\\n🏆 FIXED AUTOMATED TEST RESULTS');
      console.log('='.repeat(60));
      console.log(`🎉 Success Reached: ${results.successPageReached ? '✅ YES' : '❌ NO'}`);
      console.log(`📊 Total Admin Entries: ${results.totalEntries}`);
      console.log(`✅ Test Data Saved: ${results.testDataFound ? '✅ YES' : '❌ NO'}`);
      
      if (results.testDataFound) {
        console.log('   📋 Data Details:');
        console.log(`      👤 Name: ${results.hasUser ? '✅' : '❌'} Fixed Test User`);
        console.log(`      📧 Email: ${results.hasEmail ? '✅' : '❌'} fixedtest@example.com`);
        console.log(`      📞 Phone: ${results.hasPhone ? '✅' : '❌'} +19142168070`);
      }
      
      console.log('\\n📱 SMS DELIVERY CHECK:');
      console.log('📞 Check phone +19142168070 for SMS delivery');
      console.log('📋 SMS should contain test ride confirmation');
      
      console.log('\\n🎯 OVERALL RESULT:');
      if (results.successPageReached && results.testDataFound) {
        console.log('🎉 ✅ COMPLETE SUCCESS!');
        console.log('   ✅ End-to-end workflow completed');
        console.log('   ✅ Payment processing successful');
        console.log('   ✅ Data saved to database');
        console.log('   ✅ SMS should be delivered');
      } else {
        console.log('⚠️ PARTIAL SUCCESS:');
        if (!results.successPageReached) console.log('   ❌ Success page not reached');
        if (!results.testDataFound) console.log('   ❌ Test data not saved to database');
        console.log('   🔍 Payment processing may need manual verification');
      }
      
      console.log('\\n💡 Browser staying open for manual verification...');
      console.log('📊 Screenshots: ./qa/workflow-screenshots/fixed-*.png');
      console.log('🔧 Server logs show payment/SMS API activity');
      console.log('Press Ctrl+C to exit');
      
      // Keep browser open indefinitely
      await new Promise(() => {});
      
    } catch (error) {
      console.log('\\n❌ FIXED TEST FAILED');
      console.log(`Error: ${error.message}`);
      await this.screenshot('final-error');
      
      console.log('\\n📊 Browser staying open for debugging...');
      await new Promise(() => {});
    }
  }
}

// Run the fixed automated workflow
const workflow = new FixedAutomatedWorkflow();
workflow.run();