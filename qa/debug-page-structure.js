/**
 * Debug Current Page Structure
 * See what elements are actually present on the landing page
 */

const puppeteer = require('puppeteer');

async function debugPageStructure() {
  console.log('🔍 Debugging current page structure...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  try {
    // Load the page
    await page.goto('http://localhost:3000');
    await page.waitForSelector('h1', { timeout: 10000 });
    
    // Get page title
    const title = await page.title();
    const h1Text = await page.$eval('h1', el => el.textContent);
    
    console.log(`📄 Page title: ${title}`);
    console.log(`📝 H1 text: ${h1Text}\n`);
    
    // Check for form elements
    console.log('🔍 Looking for form elements...');
    
    // Look for inputs
    const inputs = await page.$$eval('input', inputs => 
      inputs.map(input => ({
        type: input.type,
        name: input.name,
        id: input.id,
        placeholder: input.placeholder,
        className: input.className
      }))
    );
    
    console.log(`📝 Found ${inputs.length} input elements:`);
    inputs.forEach((input, i) => {
      console.log(`${i + 1}. Type: ${input.type}, Name: "${input.name}", ID: "${input.id}", Placeholder: "${input.placeholder}"`);
    });
    
    // Look for buttons
    const buttons = await page.$$eval('button', buttons =>
      buttons.map(button => ({
        type: button.type,
        textContent: button.textContent.trim(),
        className: button.className
      }))
    );
    
    console.log(`\n🔘 Found ${buttons.length} button elements:`);
    buttons.forEach((button, i) => {
      console.log(`${i + 1}. Type: ${button.type}, Text: "${button.textContent}", Class: "${button.className}"`);
    });
    
    // Look for forms
    const forms = await page.$$eval('form', forms =>
      forms.map(form => ({
        action: form.action,
        method: form.method,
        className: form.className
      }))
    );
    
    console.log(`\n📋 Found ${forms.length} form elements:`);
    forms.forEach((form, i) => {
      console.log(`${i + 1}. Action: ${form.action}, Method: ${form.method}, Class: "${form.className}"`);
    });
    
    // Get the full HTML structure of the main content
    const mainContent = await page.$eval('body', body => {
      // Get just the main structure, not all the content
      const main = body.querySelector('main');
      if (main) {
        return main.innerHTML.substring(0, 1000) + '...';
      }
      return body.innerHTML.substring(0, 1000) + '...';
    });
    
    console.log('\n📄 Main page content structure:');
    console.log(mainContent);
    
    // Check what step we're currently on
    const stepIndicators = await page.$$eval('[class*="step"], [class*="progress"], .text-yellow-400', elements =>
      elements.map(el => el.textContent.trim())
    );
    
    if (stepIndicators.length > 0) {
      console.log('\n📊 Current step indicators:');
      stepIndicators.forEach((indicator, i) => {
        console.log(`${i + 1}. ${indicator}`);
      });
    }
    
    // Take a screenshot for visual debugging
    await page.screenshot({ 
      path: './qa/workflow-screenshots/page-structure-debug.png',
      fullPage: true 
    });
    console.log('\n📸 Screenshot saved: ./qa/workflow-screenshots/page-structure-debug.png');
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

console.log('🔍 PAGE STRUCTURE DEBUG');
console.log('='.repeat(40));
debugPageStructure();