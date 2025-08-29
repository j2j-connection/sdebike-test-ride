/**
 * FINAL AUTOMATED WORKFLOW TEST
 * Correctly handles the actual UI structure with card-based bike selection
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class FinalAutomatedWorkflow {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async init() {
    console.log('🚀 FINAL AUTOMATED WORKFLOW TEST');
    console.log('='.repeat(50));
    
    this.browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--start-maximized'],
      slowMo: 150
    });
    
    this.page = await this.browser.newPage();
    
    // Monitor for SMS and errors
    this.page.on('console', msg => {
      const text = msg.text();
      if (msg.type() === 'error') {
        console.log('🔴 Browser Error:', text);
      } else if (text.includes('SMS') || text.includes('📱') || text.includes('TextBelt')) {
        console.log('📱 SMS Activity:', text);
      }
    });
    
    this.page.on('response', response => {
      if (response.url().includes('/api/send-sms')) {
        console.log(`📱 SMS API Response: ${response.status()}`);
      }
    });
  }

  async screenshot(name) {
    const dir = './qa/workflow-screenshots';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const filename = `${dir}/final-${name}-${Date.now()}.png`;
    await this.page.screenshot({ path: filename, fullPage: true });
    console.log(`📸 ${name}`);
    return filename;
  }

  async contactForm() {
    console.log('\\n📝 STEP 1: Contact Form');
    
    await this.page.goto('http://localhost:3000');
    await this.page.waitForSelector('input#name', { timeout: 10000 });
    await this.screenshot('01-landing');
    
    console.log('📝 Filling contact information...');
    await this.page.type('input#name', 'Final Test User', { delay: 50 });
    await this.page.type('input#phone', '+19142168070', { delay: 50 });
    await this.page.type('input#email', 'finaltest@example.com', { delay: 50 });
    
    await this.screenshot('02-contact-filled');
    
    console.log('🚀 Submitting contact form...');
    await this.page.click('button[type="submit"]');
    
    // Wait for navigation to bike selection
    await sleep(3000);
    console.log('✅ Contact form completed');
  }

  async bikeSelection() {
    console.log('\\n🚲 STEP 2: Bike Selection (Card-based)');
    
    // Wait for bike selection cards
    await this.page.waitForSelector('.cursor-pointer', { timeout: 10000 });
    await this.screenshot('03-bike-selection');
    
    console.log('🚲 Selecting bike brand...');
    
    // Click on the first bike card (Rad Power Bikes)
    const bikeCards = await this.page.$$('.cursor-pointer');
    if (bikeCards.length > 0) {
      await bikeCards[0].click();
      console.log('✅ Selected first bike option');
      await sleep(1000);
    } else {
      throw new Error('No bike cards found');
    }
    
    await this.screenshot('04-bike-selected');
    
    // Click continue button
    console.log('🚀 Clicking Continue...');
    await this.page.click('button[type="submit"]');
    
    await sleep(3000);
    console.log('✅ Bike selection completed');
  }

  async photoUpload() {
    console.log('\\n📸 STEP 3: Photo Upload');
    
    // Wait for file input
    await this.page.waitForSelector('input[type="file"]', { timeout: 10000 });
    await this.screenshot('05-photo-page');
    
    // Create and upload test image
    const testImagePath = this.createTestImage();
    console.log('📸 Uploading test ID photo...');
    
    const fileInput = await this.page.$('input[type="file"]');
    await fileInput.uploadFile(testImagePath);
    
    // Wait for upload processing
    await sleep(4000);
    await this.screenshot('06-photo-uploaded');
    
    // Continue to signature
    console.log('🚀 Proceeding to signature...');
    const continueButton = await this.page.$('button[type="submit"]:not([disabled])');
    if (continueButton) {
      await continueButton.click();
    } else {
      // Try to find any enabled button with continue-like text
      await this.page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const nextBtn = buttons.find(btn => 
          !btn.disabled && (
            btn.textContent.includes('Continue') ||
            btn.textContent.includes('Next') ||
            btn.type === 'submit'
          )
        );
        if (nextBtn) nextBtn.click();
      });
    }
    
    await sleep(3000);
    console.log('✅ Photo upload completed');
  }

  async signature() {
    console.log('\\n✍️ STEP 4: Digital Signature');
    
    // Wait for signature canvas
    await this.page.waitForSelector('canvas', { timeout: 10000 });
    await this.screenshot('07-signature-page');
    
    console.log('✍️ Drawing signature...');
    
    // Get canvas and draw signature
    const canvas = await this.page.$('canvas');
    const box = await canvas.boundingBox();
    
    // Draw signature lines
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;
    
    // Start signature
    await this.page.mouse.move(centerX - 100, centerY - 20);
    await this.page.mouse.down();
    
    // Draw signature strokes
    await this.page.mouse.move(centerX - 50, centerY - 10);
    await this.page.mouse.move(centerX, centerY);
    await this.page.mouse.move(centerX + 50, centerY + 10);
    await this.page.mouse.move(centerX + 100, centerY - 5);
    
    await this.page.mouse.up();
    
    await sleep(1500);
    await this.screenshot('08-signature-drawn');
    
    // Continue to payment
    console.log('🚀 Proceeding to payment...');
    const nextButton = await this.page.$('button[type="submit"]:not([disabled])');
    if (nextButton) {
      await nextButton.click();
    } else {
      // Fallback
      await this.page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const nextBtn = buttons.find(btn => 
          !btn.disabled && (
            btn.textContent.includes('Next') ||
            btn.textContent.includes('Continue') ||
            btn.textContent.includes('Payment') ||
            btn.type === 'submit'
          )
        );
        if (nextBtn) nextBtn.click();
      });
    }
    
    await sleep(5000); // Extra time for payment page to load
    console.log('✅ Signature completed');
  }

  async payment() {
    console.log('\\n💳 STEP 5: Payment Processing');
    
    try {
      // Wait for payment elements
      await this.page.waitForSelector('iframe, button', { timeout: 15000 });
      await this.screenshot('09-payment-page');
      
      console.log('💳 Payment page loaded, waiting for Stripe...');
      await sleep(4000);
      
      // Try to interact with Stripe elements
      const frames = await this.page.frames();
      console.log(`🔍 Found ${frames.length} frames`);
      
      let paymentFilled = false;
      
      // Try to fill Stripe payment form
      for (const frame of frames) {
        if (frame.url().includes('stripe') || frame.name().includes('stripe')) {
          console.log('💳 Found Stripe frame, filling payment details...');
          try {
            // Common Stripe selectors
            await frame.waitForSelector('input', { timeout: 5000 });
            
            const cardInput = await frame.$('input[name="cardnumber"], input[placeholder*="number"]');
            if (cardInput) {
              await cardInput.type('4242424242424242');
              await sleep(500);
              
              const expInput = await frame.$('input[name="exp-date"], input[placeholder*="MM"]');
              if (expInput) {
                await expInput.type('1225');
                await sleep(500);
              }
              
              const cvcInput = await frame.$('input[name="cvc"], input[placeholder*="CVC"]');
              if (cvcInput) {
                await cvcInput.type('123');
                await sleep(500);
              }
              
              const zipInput = await frame.$('input[name="postal"], input[placeholder*="ZIP"]');
              if (zipInput) {
                await zipInput.type('10001');
                await sleep(500);
              }
              
              paymentFilled = true;
              console.log('💳 Payment details filled successfully');
              break;
            }
          } catch (frameError) {
            console.log('⚠️ Could not fill Stripe frame:', frameError.message);
          }
        }
      }
      
      await this.screenshot('10-payment-details');
      
      // Submit payment
      console.log('💳 Looking for authorize button...');
      
      const authorizeSelectors = [
        'button:contains("Authorize")',
        'button:contains("Pay")',
        'button[type="submit"]'
      ];
      
      let paymentSubmitted = false;
      
      // Try different selectors for authorize button
      for (const selector of authorizeSelectors) {
        try {
          const button = await this.page.$(selector);
          if (button) {
            const isEnabled = await button.evaluate(el => !el.disabled);
            if (isEnabled) {
              console.log(`💳 Clicking authorize button: ${selector}`);
              await button.click();
              paymentSubmitted = true;
              break;
            }
          }
        } catch (e) {
          // Try next selector
        }
      }
      
      // Fallback - try to click any submit-like button
      if (!paymentSubmitted) {
        await this.page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const submitBtn = buttons.find(btn => 
            !btn.disabled && (
              btn.textContent.includes('Authorize') ||
              btn.textContent.includes('Pay') ||
              btn.textContent.includes('Submit') ||
              btn.type === 'submit'
            )
          );
          if (submitBtn) {
            submitBtn.click();
            return true;
          }
          return false;
        });
      }
      
      console.log('⏳ Waiting for payment processing and SMS...');
      await sleep(8000);
      
      await this.screenshot('11-payment-processing');
      
    } catch (error) {
      console.log('❌ Payment error:', error.message);
      await this.screenshot('payment-error');
    }
    
    console.log('✅ Payment processing attempted');
  }

  async checkSuccess() {
    console.log('\\n🎉 STEP 6: Success Check');
    
    try {
      const url = this.page.url();
      console.log(`🔍 Current URL: ${url}`);
      
      if (url.includes('success')) {
        console.log('🎉 SUCCESS! Reached success page');
        await this.screenshot('12-success-page');
        return true;
      }
      
      // Look for success indicators
      const successSelectors = [
        'h1:contains("Success")',
        'h1:contains("Thank")',
        '.success-message'
      ];
      
      for (const selector of successSelectors) {
        const element = await this.page.$(selector);
        if (element) {
          console.log(`🎉 SUCCESS! Found: ${selector}`);
          await this.screenshot('12-success-detected');
          return true;
        }
      }
      
      console.log('⚠️ Success not clearly detected, checking admin...');
      return false;
      
    } catch (error) {
      console.log('⚠️ Success check failed:', error.message);
      return false;
    }
  }

  async checkAdmin() {
    console.log('\\n📊 STEP 7: Admin Dashboard Check');
    
    await this.page.goto('http://localhost:3000/admin');
    await sleep(3000);
    await this.screenshot('13-admin-dashboard');
    
    // Count entries
    const cards = await this.page.$$('.bg-white.rounded-lg.border');
    console.log(`📊 Total entries in admin: ${cards.length}`);
    
    // Check for our specific entry
    const content = await this.page.content();
    const hasOurName = content.includes('Final Test User');
    const hasOurEmail = content.includes('finaltest@example.com');
    const hasOurPhone = content.includes('19142168070') || content.includes('+19142168070');
    
    console.log(`👤 Name found: ${hasOurName ? 'YES' : 'NO'}`);
    console.log(`📧 Email found: ${hasOurEmail ? 'YES' : 'NO'}`);
    console.log(`📞 Phone found: ${hasOurPhone ? 'YES' : 'NO'}`);
    
    const ourEntryFound = hasOurName || hasOurEmail || hasOurPhone;
    
    return {
      totalEntries: cards.length,
      ourEntryFound,
      hasName: hasOurName,
      hasEmail: hasOurEmail,
      hasPhone: hasOurPhone
    };
  }

  createTestImage() {
    // Create test ID image
    const canvas = require('canvas');
    const c = canvas.createCanvas(400, 250);
    const ctx = c.getContext('2d');
    
    // Background
    ctx.fillStyle = '#F8F9FA';
    ctx.fillRect(0, 0, 400, 250);
    
    // Header bar
    ctx.fillStyle = '#1E40AF';
    ctx.fillRect(0, 0, 400, 50);
    
    // Title
    ctx.fillStyle = 'white';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('CALIFORNIA DRIVER LICENSE', 70, 30);
    
    // Content
    ctx.fillStyle = '#1F2937';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('FINAL TEST USER', 50, 90);
    
    ctx.font = '14px Arial';
    ctx.fillText('DOB: 01/01/1990', 50, 120);
    ctx.fillText('LIC: FT123456', 50, 145);
    ctx.fillText('CLASS: C', 50, 170);
    
    // Footer
    ctx.font = '10px Arial';
    ctx.fillStyle = '#6B7280';
    ctx.fillText('Generated for Automated QA Testing', 50, 210);
    ctx.fillText(`Created: ${new Date().toLocaleString()}`, 50, 225);
    
    const buffer = c.toBuffer('image/png');
    const imagePath = path.join(__dirname, 'final-test-id.png');
    fs.writeFileSync(imagePath, buffer);
    
    return imagePath;
  }

  async run() {
    try {
      await this.init();
      
      console.log('🎯 FINAL TEST CONFIGURATION:');
      console.log('👤 Name: Final Test User');
      console.log('📞 Phone: +19142168070 (with SMS fix)');
      console.log('📧 Email: finaltest@example.com');
      console.log('💳 Card: 4242424242424242');
      console.log('');
      
      await this.contactForm();
      await this.bikeSelection();
      await this.photoUpload();
      await this.signature();
      await this.payment();
      
      const successReached = await this.checkSuccess();
      const adminResult = await this.checkAdmin();
      
      console.log('\\n🏆 FINAL AUTOMATED TEST RESULTS');
      console.log('='.repeat(50));
      console.log(`🎉 Success page: ${successReached ? 'REACHED' : 'NOT DETECTED'}`);
      console.log(`📊 Total admin entries: ${adminResult.totalEntries}`);
      console.log(`✅ Our test entry: ${adminResult.ourEntryFound ? 'FOUND' : 'NOT FOUND'}`);
      
      if (adminResult.ourEntryFound) {
        console.log('   👤 Name match:', adminResult.hasName ? '✅' : '❌');
        console.log('   📧 Email match:', adminResult.hasEmail ? '✅' : '❌');
        console.log('   📞 Phone match:', adminResult.hasPhone ? '✅' : '❌');
      }
      
      console.log('\\n📱 CHECK YOUR PHONE for SMS delivery!');
      console.log('💡 Browser staying open for manual verification');
      console.log('🔧 Check server logs for SMS API calls');
      console.log('');
      console.log('Press Ctrl+C to exit when done reviewing...');
      
      // Keep browser open indefinitely
      await new Promise(() => {});
      
    } catch (error) {
      console.log('\\n❌ FINAL TEST FAILED');
      console.log('Error:', error.message);
      await this.screenshot('final-error');
      
      console.log('\\n📊 Browser staying open for debugging...');
      await new Promise(() => {});
    }
  }
}

// Run the final automated workflow
const workflow = new FinalAutomatedWorkflow();
workflow.run();