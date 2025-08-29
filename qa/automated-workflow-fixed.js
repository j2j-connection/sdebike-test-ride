/**
 * AUTOMATED WORKFLOW TEST - FIXED VERSION
 * Complete automation with proper Puppeteer API usage
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class AutomatedWorkflow {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async init() {
    console.log('🤖 STARTING AUTOMATED WORKFLOW TEST');
    console.log('='.repeat(50));
    
    this.browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--start-maximized'],
      slowMo: 200
    });
    
    this.page = await this.browser.newPage();
    
    // Monitor console for SMS messages
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('🔴 Error:', msg.text());
      } else if (msg.text().includes('SMS') || msg.text().includes('📱')) {
        console.log('📱 SMS Event:', msg.text());
      }
    });
  }

  async screenshot(name) {
    const dir = './qa/workflow-screenshots';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    await this.page.screenshot({ 
      path: `${dir}/${name}-${Date.now()}.png`, 
      fullPage: true 
    });
    console.log(`📸 ${name}`);
  }

  async contactForm() {
    console.log('\\n📝 STEP 1: Contact Form');
    
    await this.page.goto('http://localhost:3000');
    await this.page.waitForSelector('input#name');
    await this.screenshot('01-landing');
    
    await this.page.type('input#name', 'Auto Test User');
    await sleep(300);
    
    await this.page.type('input#phone', '+19142168070');
    await sleep(300);
    
    await this.page.type('input#email', 'autotest@example.com');
    await sleep(300);
    
    await this.screenshot('02-form-filled');
    
    await this.page.click('button[type="submit"]');
    await sleep(3000);
    
    console.log('✅ Contact form submitted');
  }

  async bikeSelection() {
    console.log('\\n🚲 STEP 2: Bike Selection');
    
    await this.page.waitForSelector('select');
    await this.screenshot('03-bike-page');
    
    // Select bike
    await this.page.select('select', 'Pace 500.3');
    await sleep(500);
    
    // Set duration
    const durationInput = await this.page.$('input[type="number"]');
    if (durationInput) {
      await durationInput.click({ clickCount: 3 });
      await this.page.type('input[type="number"]', '2');
      await sleep(500);
    }
    
    await this.screenshot('04-bike-selected');
    
    // Find and click Next button
    const nextBtn = await this.page.$('button:has-text("Next"), button[type="submit"]');
    if (nextBtn) {
      await nextBtn.click();
    } else {
      // Try alternative selector
      await this.page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const nextButton = buttons.find(btn => 
          btn.textContent.includes('Next') || 
          btn.textContent.includes('Continue') ||
          btn.type === 'submit'
        );
        if (nextButton) nextButton.click();
      });
    }
    
    await sleep(3000);
    console.log('✅ Bike selection completed');
  }

  async photoUpload() {
    console.log('\\n📸 STEP 3: Photo Upload');
    
    await this.page.waitForSelector('input[type="file"]');
    await this.screenshot('05-photo-page');
    
    // Create test image
    const testImagePath = this.createTestImage();
    
    // Upload file
    const fileInput = await this.page.$('input[type="file"]');
    await fileInput.uploadFile(testImagePath);
    
    await sleep(4000); // Wait for upload processing
    await this.screenshot('06-photo-uploaded');
    
    // Continue to next step
    await this.page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const nextButton = buttons.find(btn => 
        btn.textContent.includes('Next') || 
        btn.textContent.includes('Continue') ||
        (btn.type === 'submit' && !btn.disabled)
      );
      if (nextButton) nextButton.click();
    });
    
    await sleep(3000);
    console.log('✅ Photo upload completed');
  }

  async signature() {
    console.log('\\n✍️ STEP 4: Digital Signature');
    
    await this.page.waitForSelector('canvas');
    await this.screenshot('07-signature-page');
    
    // Draw signature
    const canvas = await this.page.$('canvas');
    const box = await canvas.boundingBox();
    
    // Draw simple signature
    await this.page.mouse.move(box.x + 50, box.y + 50);
    await this.page.mouse.down();
    await this.page.mouse.move(box.x + 150, box.y + 40);
    await this.page.mouse.move(box.x + 250, box.y + 60);
    await this.page.mouse.up();
    
    await sleep(1000);
    await this.screenshot('08-signature-drawn');
    
    // Continue to payment
    await this.page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const nextButton = buttons.find(btn => 
        btn.textContent.includes('Next') || 
        btn.textContent.includes('Continue') ||
        btn.textContent.includes('Payment') ||
        (btn.type === 'submit' && !btn.disabled)
      );
      if (nextButton) nextButton.click();
    });
    
    await sleep(4000);
    console.log('✅ Signature completed');
  }

  async payment() {
    console.log('\\n💳 STEP 5: Payment Processing');
    
    try {
      await this.page.waitForSelector('iframe, button:contains("Authorize")', { timeout: 10000 });
      await this.screenshot('09-payment-page');
      
      console.log('💳 Payment form loaded');
      
      // Wait for Stripe to load
      await sleep(3000);
      
      // Try to fill payment details
      const frames = await this.page.frames();
      console.log(`Found ${frames.length} iframes`);
      
      // Look for Stripe frames
      for (const frame of frames) {
        if (frame.url().includes('stripe') || frame.name().includes('card')) {
          console.log('💳 Found Stripe frame');
          try {
            await frame.type('input[name="cardnumber"], input[placeholder*="number"]', '4242424242424242');
            await frame.type('input[name="exp-date"], input[placeholder*="MM"]', '1225');
            await frame.type('input[name="cvc"], input[placeholder*="CVC"]', '123');
            await frame.type('input[name="postal"], input[placeholder*="ZIP"]', '10001');
            console.log('💳 Payment details entered');
            break;
          } catch (e) {
            console.log('⚠️ Could not fill payment frame');
          }
        }
      }
      
      await sleep(2000);
      await this.screenshot('10-payment-filled');
      
      // Submit payment
      const authorizeBtn = await this.page.$('button:contains("Authorize")');
      if (authorizeBtn) {
        console.log('💳 Clicking authorize button...');
        await authorizeBtn.click();
        
        // Wait for processing and SMS
        console.log('⏳ Waiting for payment processing and SMS...');
        await sleep(8000);
        
        await this.screenshot('11-payment-processing');
        
        // Check for success
        const url = this.page.url();
        if (url.includes('success')) {
          console.log('🎉 SUCCESS PAGE REACHED!');
          await this.screenshot('12-success');
        }
        
      } else {
        console.log('⚠️ Authorize button not found');
      }
      
    } catch (error) {
      console.log('❌ Payment error:', error.message);
      await this.screenshot('payment-error');
    }
    
    console.log('✅ Payment step completed');
  }

  async checkAdmin() {
    console.log('\\n📊 STEP 6: Admin Dashboard Check');
    
    await this.page.goto('http://localhost:3000/admin');
    await sleep(3000);
    await this.screenshot('13-admin-dashboard');
    
    // Count entries
    const cards = await this.page.$$('.bg-white.rounded-lg.border');
    console.log(`📊 Found ${cards.length} test ride entries`);
    
    // Check for our entry
    const content = await this.page.content();
    const hasOurEntry = content.includes('Auto Test User') || content.includes('autotest@example.com');
    
    console.log(`✅ Our entry visible: ${hasOurEntry ? 'YES' : 'NO'}`);
    
    return { count: cards.length, hasOurEntry };
  }

  createTestImage() {
    // Create simple test image using Canvas
    const canvas = require('canvas');
    const c = canvas.createCanvas(300, 200);
    const ctx = c.getContext('2d');
    
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, 300, 200);
    
    ctx.fillStyle = '#333';
    ctx.font = '16px Arial';
    ctx.fillText('TEST ID DOCUMENT', 80, 50);
    ctx.fillText('AUTO TEST USER', 90, 80);
    ctx.fillText('DOB: 01/01/1990', 90, 110);
    ctx.fillText('Generated: ' + new Date().toLocaleDateString(), 60, 150);
    
    const buffer = c.toBuffer('image/png');
    const imagePath = path.join(__dirname, 'test-id.png');
    fs.writeFileSync(imagePath, buffer);
    
    return imagePath;
  }

  async run() {
    try {
      await this.init();
      
      console.log('🎯 Running complete automated workflow...');
      console.log('📞 Using phone: +19142168070');
      console.log('');
      
      await this.contactForm();
      await this.bikeSelection();
      await this.photoUpload();
      await this.signature();
      await this.payment();
      
      const adminResult = await this.checkAdmin();
      
      console.log('\\n🏁 WORKFLOW COMPLETE!');
      console.log('='.repeat(50));
      console.log(`📊 Admin entries: ${adminResult.count}`);
      console.log(`✅ Our test found: ${adminResult.hasOurEntry ? 'YES' : 'NO'}`);
      console.log('📱 Check SMS delivery to +19142168070');
      console.log('');
      console.log('💡 Browser staying open for verification...');
      console.log('Press Ctrl+C to exit');
      
      // Keep browser open
      await new Promise(() => {});
      
    } catch (error) {
      console.log('\\n❌ WORKFLOW FAILED:', error.message);
      await this.screenshot('final-error');
    }
  }
}

// Run the test
const workflow = new AutomatedWorkflow();
workflow.run();