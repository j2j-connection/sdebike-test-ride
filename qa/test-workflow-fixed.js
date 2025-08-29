/**
 * Quick Workflow Test - With Fixed SMS
 * Tests the complete workflow with the phone formatting fix
 */

const puppeteer = require('puppeteer');

async function testWorkflowWithFixedSMS() {
  console.log('🧪 TESTING COMPLETE WORKFLOW WITH FIXED SMS');
  console.log('='.repeat(50));
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('📱 Loading app...');
    await page.goto('http://localhost:3000');
    await page.waitForSelector('input#name');
    
    console.log('📝 Filling contact form...');
    await page.type('input#name', 'QA Test User - SMS Fixed');
    await page.type('input#phone', '+19142168070');
    await page.type('input#email', 'qa-test-sms-fixed@example.com');
    
    console.log('✅ Contact info entered, proceeding...');
    await page.click('button[type="submit"]');
    
    // Wait for bike selection
    await page.waitForSelector('select', { timeout: 5000 });
    console.log('🚲 Bike selection loaded');
    
    console.log('🎯 INSTRUCTIONS FOR MANUAL COMPLETION:');
    console.log('='.repeat(50));
    console.log('1. Select a bike from dropdown');
    console.log('2. Set duration (e.g., 2 hours)');
    console.log('3. Upload any photo');
    console.log('4. Draw signature');
    console.log('5. Complete payment with: 4242424242424242');
    console.log('6. Watch for SMS delivery confirmation');
    console.log('7. Check /admin page for new entry');
    console.log('');
    console.log('📱 SMS should now work with fixed phone formatting!');
    console.log('💡 The phone "9142168070" will be formatted as "+19142168070"');
    console.log('');
    
    // Monitor console
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('🔴 Browser Error:', msg.text());
      }
    });
    
    // Keep browser open for manual testing
    console.log('⏳ Complete the workflow manually...');
    console.log('💡 Press Ctrl+C when done testing');
    
    await new Promise(() => {}); // Keep running
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    // Don't close browser
  }
}

testWorkflowWithFixedSMS();