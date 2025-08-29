/**
 * FULL AUTOMATED WORKFLOW TEST
 * Completely automates the entire user flow from start to payment
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

class FullAutomatedWorkflow {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testData = {
      name: 'Automated Test User',
      phone: '+19142168070',
      email: 'automated-test@example.com',
      bike: 'Pace 500.3',
      duration: 2
    };
  }

  async init() {
    console.log('🤖 INITIALIZING FULL AUTOMATED WORKFLOW');
    console.log('='.repeat(50));
    
    this.browser = await puppeteer.launch({
      headless: false, // Keep visible for monitoring
      defaultViewport: null,
      args: ['--start-maximized'],
      slowMo: 250 // Slow down for visibility
    });
    
    this.page = await this.browser.newPage();
    await this.page.setDefaultTimeout(15000);
    
    // Monitor console messages
    this.page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error') {
        console.log('🔴 Browser Error:', text);
      } else if (type === 'log' && (text.includes('SMS') || text.includes('📱') || text.includes('✅'))) {
        console.log('📱 SMS Log:', text);
      }
    });
    
    this.page.on('pageerror', error => {
      console.log('💥 Page Error:', error.message);
    });
  }

  async takeScreenshot(stepName) {
    const filename = `./qa/workflow-screenshots/auto-${stepName}-${Date.now()}.png`;
    // Ensure directory exists
    const dir = path.dirname(filename);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    await this.page.screenshot({ path: filename, fullPage: true });
    console.log(`📸 Screenshot: ${stepName}`);
  }

  async waitForNavigation() {
    // Wait for any navigation or content changes
    await this.page.waitForTimeout(2000);
  }

  async step1_ContactForm() {
    console.log('\\n📝 STEP 1: Automated Contact Form');
    
    await this.page.goto('http://localhost:3000');
    await this.page.waitForSelector('input#name');
    await this.takeScreenshot('01-landing-page');
    
    // Fill contact form
    console.log(`📝 Filling name: ${this.testData.name}`);
    await this.page.type('input#name', this.testData.name);
    
    console.log(`📞 Filling phone: ${this.testData.phone}`);
    await this.page.type('input#phone', this.testData.phone);
    
    console.log(`📧 Filling email: ${this.testData.email}`);
    await this.page.type('input#email', this.testData.email);
    
    await this.takeScreenshot('02-contact-form-filled');
    
    console.log('🚀 Submitting contact form...');
    await this.page.click('button[type="submit"]');
    await this.waitForNavigation();
    
    console.log('✅ Contact form completed');
  }

  async step2_BikeSelection() {
    console.log('\\n🚲 STEP 2: Automated Bike Selection');
    
    // Wait for bike selection page
    await this.page.waitForSelector('select, [data-testid="bike-select"], .bike-selection');
    await this.takeScreenshot('03-bike-selection-page');
    
    // Try different selectors for bike selection
    const bikeSelectors = ['select', '[data-testid="bike-select"]', 'select[name*="bike"]'];
    let bikeSelected = false;
    
    for (const selector of bikeSelectors) {
      const element = await this.page.$(selector);
      if (element) {
        console.log(`🚲 Selecting bike: ${this.testData.bike} using selector: ${selector}`);
        await this.page.select(selector, this.testData.bike);
        bikeSelected = true;
        break;
      }
    }
    
    if (!bikeSelected) {
      // Try clicking on bike cards if dropdown not found
      const bikeCards = await this.page.$$('.bike-card, [data-bike], button:contains("Pace")');
      if (bikeCards.length > 0) {
        console.log('🚲 Selecting bike by clicking card...');
        await bikeCards[0].click();
        bikeSelected = true;
      }
    }
    
    // Set duration
    const durationInput = await this.page.$('input[type="number"], input[name*="duration"], input[placeholder*="hour"]');
    if (durationInput) {
      await durationInput.click({ clickCount: 3 }); // Select all
      await this.page.type('input[type="number"], input[name*="duration"], input[placeholder*="hour"]', String(this.testData.duration));
      console.log(`⏰ Set duration: ${this.testData.duration} hours`);
    }
    
    await this.takeScreenshot('04-bike-selected');
    
    // Go to next step
    const nextButtons = ['button:contains("Next")', 'button[type="submit"]', '.next-button'];
    for (const selector of nextButtons) {
      const button = await this.page.$(selector);
      if (button) {
        console.log('🚀 Going to next step...');
        await button.click();
        break;
      }
    }
    
    await this.waitForNavigation();
    console.log('✅ Bike selection completed');
  }

  async step3_PhotoUpload() {
    console.log('\\n📸 STEP 3: Automated Photo Upload');
    
    // Wait for photo upload page
    await this.page.waitForSelector('input[type="file"], .photo-upload, [data-testid*="photo"]');
    await this.takeScreenshot('05-photo-upload-page');
    
    // Create test image
    const testImagePath = await this.createTestImage();
    
    // Upload photo
    const fileInput = await this.page.$('input[type="file"]');
    if (fileInput) {
      console.log('📸 Uploading test photo...');
      await fileInput.uploadFile(testImagePath);
      
      // Wait for upload to process
      await this.page.waitForTimeout(3000);
      
      // Check for success indicators
      const successIndicators = [
        'img[src*="blob:"]',
        '.upload-success',
        '.photo-preview',
        'button:contains("Next"):not([disabled])'
      ];
      
      let uploadSuccess = false;
      for (const selector of successIndicators) {
        const element = await this.page.$(selector);
        if (element) {
          console.log(`✅ Photo upload detected: ${selector}`);
          uploadSuccess = true;
          break;
        }
      }
      
      if (!uploadSuccess) {
        console.log('⚠️ Upload status unclear, continuing...');
      }
    }
    
    await this.takeScreenshot('06-photo-uploaded');
    
    // Continue to next step
    const nextButton = await this.page.$('button:contains("Next"), button[type="submit"]');
    if (nextButton) {
      console.log('🚀 Proceeding to signature...');
      await nextButton.click();
      await this.waitForNavigation();
    }
    
    console.log('✅ Photo upload completed');
  }

  async step4_Signature() {
    console.log('\\n✍️ STEP 4: Automated Digital Signature');
    
    // Wait for signature canvas
    await this.page.waitForSelector('canvas, .signature-pad, [data-testid*="signature"]');
    await this.takeScreenshot('07-signature-page');
    
    const canvas = await this.page.$('canvas');
    if (canvas) {
      console.log('✍️ Drawing automated signature...');
      
      const boundingBox = await canvas.boundingBox();
      const centerX = boundingBox.x + boundingBox.width / 2;
      const centerY = boundingBox.y + boundingBox.height / 2;
      
      // Draw signature - spell out "Test"
      await this.page.mouse.move(centerX - 100, centerY - 20);
      await this.page.mouse.down();
      
      // Draw "T"
      await this.page.mouse.move(centerX - 80, centerY - 20);
      await this.page.mouse.move(centerX - 90, centerY - 20);
      await this.page.mouse.move(centerX - 90, centerY + 20);
      
      await this.page.mouse.up();
      await this.page.waitForTimeout(200);
      
      // Draw "e"
      await this.page.mouse.move(centerX - 70, centerY);
      await this.page.mouse.down();
      await this.page.mouse.move(centerX - 60, centerY - 10);
      await this.page.mouse.move(centerX - 50, centerY);
      await this.page.mouse.move(centerX - 60, centerY + 10);
      await this.page.mouse.up();
      await this.page.waitForTimeout(200);
      
      // Draw "s"
      await this.page.mouse.move(centerX - 40, centerY - 5);
      await this.page.mouse.down();
      await this.page.mouse.move(centerX - 30, centerY - 10);
      await this.page.mouse.move(centerX - 20, centerY);
      await this.page.mouse.move(centerX - 30, centerY + 10);
      await this.page.mouse.up();
      await this.page.waitForTimeout(200);
      
      // Draw "t"
      await this.page.mouse.move(centerX - 10, centerY - 15);
      await this.page.mouse.down();
      await this.page.mouse.move(centerX - 10, centerY + 15);
      await this.page.mouse.move(centerX, centerY - 5);
      await this.page.mouse.up();
      
      console.log('✍️ Signature drawn: "Test"');
      
      await this.page.waitForTimeout(1000);
      await this.takeScreenshot('08-signature-drawn');
    }
    
    // Proceed to payment
    const nextButton = await this.page.$('button:contains("Next"), button[type="submit"], button:contains("Payment")');
    if (nextButton) {
      console.log('🚀 Proceeding to payment...');
      await nextButton.click();
      await this.waitForNavigation();
    }
    
    console.log('✅ Signature completed');
  }

  async step5_Payment() {
    console.log('\\n💳 STEP 5: Automated Payment (Test Mode)');
    
    // Wait for payment page
    await this.page.waitForSelector('iframe, .payment-form, button:contains("Authorize"), [data-testid*="payment"]', { timeout: 20000 });
    await this.takeScreenshot('09-payment-page');
    
    console.log('💳 Payment form loaded...');
    
    try {
      // Wait for Stripe elements to load
      await this.page.waitForTimeout(3000);
      
      // Try to find Stripe iframes
      const frames = await this.page.frames();
      console.log(`🔍 Found ${frames.length} frames on page`);
      
      // Look for card number frame
      const cardFrames = frames.filter(frame => 
        frame.name().includes('card') || 
        frame.url().includes('stripe') ||
        frame.name().includes('__privateStripeFrame')
      );
      
      console.log(`💳 Found ${cardFrames.length} potential Stripe frames`);
      
      if (cardFrames.length > 0) {
        // Try to fill card details in Stripe iframe
        for (let i = 0; i < cardFrames.length; i++) {
          const frame = cardFrames[i];
          console.log(`💳 Trying frame ${i + 1}: ${frame.name()}`);
          
          try {
            // Common Stripe input selectors
            const cardSelectors = [
              'input[name="cardnumber"]',
              'input[placeholder*="card number"]', 
              'input[data-testid="card-number"]',
              '.CardField input',
              '[data-elements-stable-field-name="cardNumber"] input'
            ];
            
            let cardFilled = false;
            for (const selector of cardSelectors) {
              const cardInput = await frame.$(selector);
              if (cardInput) {
                console.log(`💳 Found card input: ${selector}`);
                await frame.type(selector, '4242424242424242', { delay: 100 });
                cardFilled = true;
                break;
              }
            }
            
            if (cardFilled) {
              // Try to fill expiry
              const expirySelectors = [
                'input[name="exp-date"]',
                'input[placeholder*="MM"]',
                'input[placeholder*="expiry"]'
              ];
              
              for (const selector of expirySelectors) {
                const input = await frame.$(selector);
                if (input) {
                  await frame.type(selector, '1225', { delay: 100 });
                  break;
                }
              }
              
              // Try to fill CVC
              const cvcSelectors = [
                'input[name="cvc"]',
                'input[placeholder*="CVC"]',
                'input[placeholder*="CVV"]'
              ];
              
              for (const selector of cvcSelectors) {
                const input = await frame.$(selector);
                if (input) {
                  await frame.type(selector, '123', { delay: 100 });
                  break;
                }
              }
              
              // Try to fill postal code
              const zipSelectors = [
                'input[name="postal"]',
                'input[placeholder*="ZIP"]',
                'input[placeholder*="postal"]'
              ];
              
              for (const selector of zipSelectors) {
                const input = await frame.$(selector);
                if (input) {
                  await frame.type(selector, '10001', { delay: 100 });
                  break;
                }
              }
              
              console.log('💳 Card details filled in Stripe iframe');
              break;
            }
          } catch (frameError) {
            console.log(`⚠️ Could not fill frame ${i + 1}:`, frameError.message);
          }
        }
      }
      
      await this.takeScreenshot('10-payment-details-filled');
      
      // Try to submit payment
      await this.page.waitForTimeout(2000);
      
      const submitSelectors = [
        'button:contains("Authorize")',
        'button:contains("Pay")',
        'button[type="submit"]',
        '.payment-submit',
        '[data-testid="payment-submit"]'
      ];
      
      let paymentSubmitted = false;
      for (const selector of submitSelectors) {
        const button = await this.page.$(selector);
        if (button) {
          const isEnabled = await button.evaluate(el => !el.disabled);
          if (isEnabled) {
            console.log('💳 Submitting payment...');
            await button.click();
            paymentSubmitted = true;
            break;
          }
        }
      }
      
      if (paymentSubmitted) {
        console.log('⏳ Waiting for payment processing...');
        await this.page.waitForTimeout(5000);
        
        // Check for success or SMS sending
        await this.waitForSuccessOrSMS();
      } else {
        console.log('⚠️ Could not find enabled payment submit button');
        await this.takeScreenshot('10-payment-submit-issue');
      }
      
    } catch (error) {
      console.log('❌ Payment automation failed:', error.message);
      await this.takeScreenshot('10-payment-error');
    }
    
    console.log('✅ Payment step completed (may need manual verification)');
  }

  async waitForSuccessOrSMS() {
    console.log('🔍 Monitoring for success indicators and SMS...');
    
    const checkInterval = 2000;
    const maxChecks = 15; // 30 seconds total
    
    for (let i = 0; i < maxChecks; i++) {
      const url = this.page.url();
      
      // Check for success page
      if (url.includes('success') || url.includes('complete')) {
        console.log('🎉 SUCCESS PAGE DETECTED!');
        await this.takeScreenshot('11-success-page');
        return 'success';
      }
      
      // Check for success elements
      const successSelectors = [
        'h1:contains("Success")',
        'h1:contains("Thank you")',
        '.success-message',
        '[data-testid="success"]'
      ];
      
      for (const selector of successSelectors) {
        const element = await this.page.$(selector);
        if (element) {
          console.log(`🎉 SUCCESS ELEMENT FOUND: ${selector}`);
          await this.takeScreenshot('11-success-detected');
          return 'success';
        }
      }
      
      console.log(`⏳ Check ${i + 1}/${maxChecks} - waiting for completion...`);
      await this.page.waitForTimeout(checkInterval);
    }
    
    console.log('⚠️ Success detection timeout reached');
    await this.takeScreenshot('11-final-state');
    return 'timeout';
  }

  async checkAdminDashboard() {
    console.log('\\n📊 STEP 6: Checking Admin Dashboard');
    
    await this.page.goto('http://localhost:3000/admin');
    await this.page.waitForTimeout(3000);
    await this.takeScreenshot('12-admin-dashboard');
    
    // Count test ride entries
    const testRideCards = await this.page.$$('.bg-white.rounded-lg.border, .test-ride-card, [data-testid*="test-ride"]');
    console.log(`📊 Found ${testRideCards.length} test ride entries in admin`);
    
    // Look for our specific test entry
    const pageContent = await this.page.content();
    const hasOurTest = pageContent.includes(this.testData.name) || 
                       pageContent.includes(this.testData.phone) ||
                       pageContent.includes(this.testData.email);
    
    if (hasOurTest) {
      console.log('✅ Our test entry found in admin dashboard!');
    } else {
      console.log('⚠️ Our test entry not yet visible in admin dashboard');
    }
    
    return { count: testRideCards.length, hasOurTest };
  }

  async createTestImage() {
    // Create a test ID image
    const canvas = require('canvas');
    const canvasInstance = canvas.createCanvas(400, 300);
    const ctx = canvasInstance.getContext('2d');
    
    // Background
    ctx.fillStyle = '#F5F5F5';
    ctx.fillRect(0, 0, 400, 300);
    
    // Header
    ctx.fillStyle = '#2563EB';
    ctx.fillRect(0, 0, 400, 60);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('CALIFORNIA DRIVER LICENSE', 80, 35);
    
    // Content
    ctx.fillStyle = '#333';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('AUTOMATED TEST USER', 50, 100);
    
    ctx.font = '14px Arial';
    ctx.fillText('DOB: 01/01/1990', 50, 130);
    ctx.fillText('LIC: A12345678', 50, 150);
    ctx.fillText('EXP: 01/01/2030', 50, 170);
    
    ctx.font = '12px Arial';
    ctx.fillStyle = '#666';
    ctx.fillText('Generated for QA Testing', 50, 220);
    ctx.fillText(new Date().toLocaleString(), 50, 240);
    
    // Save image
    const buffer = canvasInstance.toBuffer('image/png');
    const imagePath = path.join(__dirname, 'test-id-automated.png');
    fs.writeFileSync(imagePath, buffer);
    
    return imagePath;
  }

  async runFullWorkflow() {
    try {
      await this.init();
      
      console.log('🎯 TEST DATA:');
      console.log(`👤 Name: ${this.testData.name}`);
      console.log(`📞 Phone: ${this.testData.phone}`);
      console.log(`📧 Email: ${this.testData.email}`);
      console.log(`🚲 Bike: ${this.testData.bike}`);
      console.log(`⏰ Duration: ${this.testData.duration} hours`);
      console.log('');
      
      await this.step1_ContactForm();
      await this.step2_BikeSelection();
      await this.step3_PhotoUpload();
      await this.step4_Signature();
      await this.step5_Payment();
      
      const adminResult = await this.checkAdminDashboard();
      
      console.log('\\n🏁 AUTOMATED WORKFLOW COMPLETE!');
      console.log('='.repeat(50));
      console.log(`📊 Admin entries: ${adminResult.count}`);
      console.log(`✅ Our test found: ${adminResult.hasOurTest ? 'YES' : 'NO'}`);
      console.log('📱 Check your phone for SMS delivery');
      console.log('💡 Browser left open for manual verification');
      
      // Keep browser open
      console.log('\\n⏳ Browser staying open for verification...');
      console.log('💡 Press Ctrl+C when done');
      
      await new Promise(() => {}); // Keep running
      
    } catch (error) {
      console.log('\\n❌ AUTOMATED WORKFLOW FAILED');
      console.log('Error:', error.message);
      await this.takeScreenshot('error-final');
    }
  }
}

// Run the automated workflow
if (require.main === module) {
  const workflow = new FullAutomatedWorkflow();
  workflow.runFullWorkflow();
}

module.exports = FullAutomatedWorkflow;