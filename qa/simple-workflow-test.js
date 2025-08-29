/**
 * SIMPLE WORKFLOW TEST
 * Manual testing guidance with automated setup
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

async function runSimpleWorkflowTest() {
  console.log('🧪 SIMPLE WORKFLOW TEST - MANUAL GUIDANCE');
  console.log('='.repeat(50));
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  // Ensure screenshot directory exists
  const screenshotDir = './qa/workflow-screenshots';
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
  
  try {
    console.log('\n📱 STEP 1: Loading page...');
    await page.goto('http://localhost:3000');
    await page.waitForSelector('h1');
    
    console.log('✅ Page loaded successfully!');
    console.log('👁️ Browser window opened - you can see the app');
    
    // Take initial screenshot
    await page.screenshot({ 
      path: `${screenshotDir}/01-initial-page.png`, 
      fullPage: true 
    });
    
    console.log('\n🎯 MANUAL TESTING INSTRUCTIONS:');
    console.log('='.repeat(50));
    console.log('📋 Complete these steps in the browser window:');
    console.log('');
    console.log('1. 📝 CONTACT FORM:');
    console.log('   - Name: Workflow Test User');
    console.log('   - Phone: +19142168070');
    console.log('   - Email: test@example.com');
    console.log('   - Click "Choose Your Bike"');
    console.log('');
    console.log('2. 🚲 BIKE SELECTION:');
    console.log('   - Select any bike model');
    console.log('   - Set duration (1-2 hours)');
    console.log('   - Click "Next"');
    console.log('');
    console.log('3. 📸 PHOTO UPLOAD:');
    console.log('   - Click "Choose File" and upload any image');
    console.log('   - Or use camera if on mobile');
    console.log('   - Wait for image to process');
    console.log('');
    console.log('4. ✍️ DIGITAL SIGNATURE:');
    console.log('   - Draw your signature on the canvas');
    console.log('   - Make sure you see some lines drawn');
    console.log('   - Click "Next"');
    console.log('');
    console.log('5. 💳 PAYMENT:');
    console.log('   - Use test card: 4242424242424242');
    console.log('   - Expiry: 12/25');
    console.log('   - CVC: 123');
    console.log('   - ZIP: 10001');
    console.log('   - Click "Authorize $1 Hold"');
    console.log('');
    console.log('6. 🎉 SUCCESS:');
    console.log('   - You should see a success page');
    console.log('   - You should receive an SMS');
    console.log('   - Check /admin page for your data');
    console.log('');
    console.log('⚠️ IMPORTANT: Watch console for any errors!');
    console.log('📱 SMS should arrive at: +19142168070');
    console.log('');
    
    // Monitor for potential issues
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('🔴 BROWSER ERROR:', msg.text());
      }
    });
    
    page.on('pageerror', error => {
      console.log('💥 PAGE ERROR:', error.message);
    });
    
    // Wait for manual completion
    console.log('⏳ Complete the workflow in the browser...');
    console.log('💡 Press Ctrl+C in this terminal when done');
    console.log('');
    
    // Check periodically if we've reached success or admin page
    let checkCount = 0;
    const checkProgress = setInterval(async () => {
      try {
        const url = page.url();
        const title = await page.title();
        
        if (url.includes('/admin')) {
          console.log('\n✅ DETECTED: You are on the admin page!');
          console.log('🔍 Checking for your test ride data...');
          
          await page.screenshot({ 
            path: `${screenshotDir}/admin-page-final.png`, 
            fullPage: true 
          });
          
          // Count test ride cards
          const cards = await page.$$('.bg-white.rounded-lg.border');
          console.log(`📊 Found ${cards.length} test ride cards in admin`);
          
          if (cards.length > 0) {
            console.log('🎉 SUCCESS: Data is showing in admin dashboard!');
          }
          
        } else if (url.includes('success') || title.toLowerCase().includes('success')) {
          console.log('\n✅ DETECTED: Success page reached!');
          console.log('🎉 Workflow completed successfully!');
          console.log('👁️ Now check the /admin page to verify data');
          
          await page.screenshot({ 
            path: `${screenshotDir}/success-page.png`, 
            fullPage: true 
          });
        }
        
        checkCount++;
        if (checkCount > 60) { // Stop checking after 5 minutes
          clearInterval(checkProgress);
          console.log('\n⏱️ Stopped monitoring after 5 minutes');
        }
        
      } catch (error) {
        // Page might have navigated, continue checking
      }
    }, 5000);
    
    // Keep browser open indefinitely
    await new Promise(() => {});
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    // Don't close browser - let user complete testing
    console.log('\n📊 Testing completed');
  }
}

runSimpleWorkflowTest();