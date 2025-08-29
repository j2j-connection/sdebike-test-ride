/**
 * DIGITAL SIGNATURE TESTING SCENARIOS
 * Test signature capture, validation, and storage across different devices and scenarios
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const SIGNATURE_TEST_CONFIG = {
  baseUrl: process.env.TEST_URL || 'http://localhost:3000',
  outputDir: './qa/signature-test-results',
  timeout: 30000,
  
  // Different signature test scenarios
  signatureTests: [
    {
      name: 'simple-signature',
      description: 'Simple cursive signature',
      strokes: [
        { type: 'move', x: 50, y: 100 },
        { type: 'line', x: 150, y: 80 },
        { type: 'line', x: 200, y: 120 },
        { type: 'line', x: 300, y: 90 }
      ]
    },
    {
      name: 'complex-signature',
      description: 'Complex signature with multiple strokes',
      strokes: [
        { type: 'move', x: 30, y: 100 },
        { type: 'line', x: 80, y: 60 },
        { type: 'line', x: 120, y: 120 },
        { type: 'move', x: 140, y: 80 },
        { type: 'line', x: 200, y: 100 },
        { type: 'line', x: 250, y: 70 },
        { type: 'move', x: 270, y: 110 },
        { type: 'line', x: 320, y: 90 }
      ]
    },
    {
      name: 'initials-only',
      description: 'Just initials - minimal signature',
      strokes: [
        { type: 'move', x: 100, y: 80 },
        { type: 'line', x: 100, y: 120 },
        { type: 'line', x: 130, y: 80 },
        { type: 'line', x: 130, y: 120 },
        { type: 'move', x: 150, y: 80 },
        { type: 'line', x: 180, y: 80 },
        { type: 'line', x: 180, y: 120 },
        { type: 'line', x: 210, y: 120 }
      ]
    },
    {
      name: 'single-stroke',
      description: 'Single continuous stroke',
      strokes: [
        { type: 'move', x: 50, y: 100 },
        { type: 'line', x: 100, y: 80 },
        { type: 'line', x: 150, y: 120 },
        { type: 'line', x: 200, y: 70 },
        { type: 'line', x: 250, y: 110 },
        { type: 'line', x: 300, y: 90 }
      ]
    },
    {
      name: 'very-small-signature',
      description: 'Very small signature (edge case)',
      strokes: [
        { type: 'move', x: 150, y: 95 },
        { type: 'line', x: 170, y: 105 },
        { type: 'line', x: 190, y: 95 }
      ]
    },
    {
      name: 'large-signature',
      description: 'Large signature filling most of canvas',
      strokes: [
        { type: 'move', x: 10, y: 60 },
        { type: 'line', x: 100, y: 30 },
        { type: 'line', x: 200, y: 80 },
        { type: 'line', x: 300, y: 40 },
        { type: 'line', x: 390, y: 90 },
        { type: 'move', x: 20, y: 120 },
        { type: 'line', x: 150, y: 140 },
        { type: 'line', x: 280, y: 110 },
        { type: 'line', x: 380, y: 130 }
      ]
    }
  ]
};

class SignatureTestRunner {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = [];
    
    // Ensure output directory exists
    if (!fs.existsSync(SIGNATURE_TEST_CONFIG.outputDir)) {
      fs.mkdirSync(SIGNATURE_TEST_CONFIG.outputDir, { recursive: true });
    }
  }

  async init() {
    console.log('✍️ Initializing Signature Testing...');
    
    this.browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--start-maximized']
    });
    
    this.page = await this.browser.newPage();
    await this.page.setDefaultTimeout(SIGNATURE_TEST_CONFIG.timeout);
    
    // Enable touch events for signature testing
    await this.page.setUserAgent('Mozilla/5.0 (iPad; CPU OS 11_0 like Mac OS X) AppleWebKit/604.1.34');
  }

  async navigateToSignatureStep() {
    console.log('🧭 Navigating to signature step...');
    
    // Navigate to app
    await this.page.goto(SIGNATURE_TEST_CONFIG.baseUrl);
    await this.page.waitForSelector('input[name="name"]', { timeout: 10000 });
    
    // Fill contact info
    await this.page.type('input[name="name"]', 'Signature Test User');
    await this.page.type('input[name="phone"]', '+1234567890');
    await this.page.type('input[name="email"]', 'signaturetest@example.com');
    await this.page.click('button[type="submit"]');
    
    // Wait for and fill bike selection
    await this.page.waitForSelector('select', { timeout: 5000 });
    await this.page.select('select', 'Pace 500.3');
    await this.page.click('button:contains("Next")');
    
    // Should now be on verification step with signature canvas
    await this.page.waitForSelector('canvas', { timeout: 10000 });
    console.log('✅ Reached signature step');
    
    // Skip photo upload if required
    const fileInput = await this.page.$('input[type="file"]');
    if (fileInput) {
      // Create a simple test image for photo requirement
      await this.uploadTestPhoto();
    }
  }

  async uploadTestPhoto() {
    console.log('📸 Uploading test photo for signature step...');
    
    // Create a simple test image
    const canvas = require('canvas');
    const canvasInstance = canvas.createCanvas(400, 300);
    const ctx = canvasInstance.getContext('2d');
    
    ctx.fillStyle = '#E0E0E0';
    ctx.fillRect(0, 0, 400, 300);
    ctx.fillStyle = '#333';
    ctx.font = '20px Arial';
    ctx.fillText('TEST ID PHOTO', 140, 150);
    
    const buffer = canvasInstance.toBuffer('image/png');
    const testPhotoPath = path.join(SIGNATURE_TEST_CONFIG.outputDir, 'test-photo.png');
    fs.writeFileSync(testPhotoPath, buffer);
    
    const fileInput = await this.page.$('input[type="file"]');
    await fileInput.uploadFile(testPhotoPath);
    await this.page.waitForTimeout(2000);
  }

  async drawSignature(signatureData) {
    console.log(`✍️ Drawing signature: ${signatureData.description}`);
    
    // Get canvas element and its bounding box
    const canvas = await this.page.$('canvas');
    if (!canvas) {
      throw new Error('Signature canvas not found');
    }
    
    const boundingBox = await canvas.boundingBox();
    if (!boundingBox) {
      throw new Error('Could not get canvas bounding box');
    }
    
    // Clear canvas first
    await this.clearSignature();
    
    // Draw the signature strokes
    let isDrawing = false;
    
    for (const stroke of signatureData.strokes) {
      const canvasX = boundingBox.x + stroke.x;
      const canvasY = boundingBox.y + stroke.y;
      
      if (stroke.type === 'move') {
        // Start a new stroke
        await this.page.mouse.move(canvasX, canvasY);
        isDrawing = false;
      } else if (stroke.type === 'line') {
        if (!isDrawing) {
          // Start drawing
          await this.page.mouse.down();
          isDrawing = true;
        }
        // Draw line to this point
        await this.page.mouse.move(canvasX, canvasY);
      }
    }
    
    // End drawing
    if (isDrawing) {
      await this.page.mouse.up();
    }
    
    // Wait for signature to be processed
    await this.page.waitForTimeout(1000);
  }

  async clearSignature() {
    console.log('🧹 Clearing signature canvas...');
    
    // Look for clear button
    const clearButton = await this.page.$('button:contains("Clear"), button[title*="clear"], .clear-button');
    if (clearButton) {
      await clearButton.click();
      await this.page.waitForTimeout(500);
    } else {
      // Try to clear programmatically
      await this.page.evaluate(() => {
        const canvas = document.querySelector('canvas');
        if (canvas) {
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Trigger change event if needed
          const event = new Event('change');
          canvas.dispatchEvent(event);
        }
      });
    }
  }

  async validateSignature() {
    console.log('✅ Validating signature...');
    
    // Check if signature appears to be captured
    const signatureData = await this.page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return null;
      
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Check if there's any non-transparent pixels (signature drawn)
      let hasContent = false;
      for (let i = 3; i < imageData.data.length; i += 4) {
        if (imageData.data[i] > 0) { // Alpha channel
          hasContent = true;
          break;
        }
      }
      
      return {
        hasContent,
        dataUrl: hasContent ? canvas.toDataURL() : null,
        width: canvas.width,
        height: canvas.height
      };
    });
    
    return signatureData;
  }

  async testSignatureScenario(signatureTest) {
    const testName = `Signature: ${signatureTest.description}`;
    console.log(`\n✍️ Testing: ${testName}`);
    
    try {
      const startTime = Date.now();
      
      // Draw the signature
      await this.drawSignature(signatureTest);
      
      // Validate the signature
      const signatureData = await this.validateSignature();
      
      if (!signatureData || !signatureData.hasContent) {
        throw new Error('Signature was not captured or is empty');
      }
      
      // Take screenshot of signature
      const screenshotPath = path.join(
        SIGNATURE_TEST_CONFIG.outputDir,
        `signature-${signatureTest.name}.png`
      );
      
      // Screenshot just the signature area
      const canvas = await this.page.$('canvas');
      const boundingBox = await canvas.boundingBox();
      
      await this.page.screenshot({
        path: screenshotPath,
        clip: {
          x: boundingBox.x - 20,
          y: boundingBox.y - 20,
          width: boundingBox.width + 40,
          height: boundingBox.height + 40
        }
      });
      
      // Save signature data URL if available
      if (signatureData.dataUrl) {
        const dataUrlPath = path.join(
          SIGNATURE_TEST_CONFIG.outputDir,
          `signature-data-${signatureTest.name}.txt`
        );
        fs.writeFileSync(dataUrlPath, signatureData.dataUrl);
      }
      
      const testTime = Date.now() - startTime;
      
      const result = {
        status: 'SUCCESS',
        testTime: testTime,
        canvasSize: `${signatureData.width}x${signatureData.height}`,
        hasDataUrl: !!signatureData.dataUrl,
        screenshot: screenshotPath,
        strokeCount: signatureTest.strokes.length
      };
      
      console.log(`✅ SUCCESS - Signature captured in ${testTime}ms`);
      console.log(`📐 Canvas: ${result.canvasSize}`);
      console.log(`✏️ Strokes: ${result.strokeCount}`);
      
      return result;
      
    } catch (error) {
      console.log(`❌ FAILED - ${error.message}`);
      
      // Take screenshot of failure
      const screenshotPath = path.join(
        SIGNATURE_TEST_CONFIG.outputDir,
        `failed-${signatureTest.name}.png`
      );
      await this.page.screenshot({ path: screenshotPath, fullPage: true });
      
      return {
        status: 'FAILED',
        error: error.message,
        screenshot: screenshotPath
      };
    }
  }

  async testSignatureValidation() {
    console.log('\n🔍 Testing Signature Validation...');
    
    const validationTests = [
      {
        name: 'empty-signature',
        description: 'Empty signature - should show validation error',
        action: async () => {
          await this.clearSignature();
          
          // Try to proceed without signature
          const nextButton = await this.page.$('button:contains("Next")');
          if (nextButton) {
            await nextButton.click();
            await this.page.waitForTimeout(1000);
            
            // Check for validation error
            const error = await this.page.$('.text-red-500, .error-message');
            return error ? 'VALIDATION_ERROR_SHOWN' : 'NO_VALIDATION';
          }
          return 'NO_BUTTON';
        }
      },
      {
        name: 'signature-after-clear',
        description: 'Clear signature and draw new one',
        action: async () => {
          // Draw initial signature
          await this.drawSignature(SIGNATURE_TEST_CONFIG.signatureTests[0]);
          await this.page.waitForTimeout(500);
          
          // Clear it
          await this.clearSignature();
          
          // Draw new signature
          await this.drawSignature(SIGNATURE_TEST_CONFIG.signatureTests[1]);
          
          // Validate new signature
          const signatureData = await this.validateSignature();
          return signatureData.hasContent ? 'NEW_SIGNATURE_CAPTURED' : 'CLEAR_FAILED';
        }
      }
    ];
    
    for (const test of validationTests) {
      console.log(`🧪 Testing: ${test.description}`);
      try {
        const result = await test.action();
        console.log(`✅ Result: ${result}`);
      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
      }
    }
  }

  async testTouchDeviceSignature() {
    console.log('\n📱 Testing Touch Device Signature...');
    
    // Simulate touch events for mobile testing
    await this.page.evaluate(() => {
      // Add touch event simulation if needed
      if (!window.TouchEvent) {
        console.log('Touch events not available in this environment');
        return;
      }
      
      const canvas = document.querySelector('canvas');
      if (canvas) {
        // Simulate touch signature
        const rect = canvas.getBoundingClientRect();
        const startX = rect.left + 50;
        const startY = rect.top + 100;
        const endX = rect.left + 250;
        const endY = rect.top + 120;
        
        // Create touch events
        const touchStart = new TouchEvent('touchstart', {
          touches: [new Touch({
            identifier: 0,
            target: canvas,
            clientX: startX,
            clientY: startY
          })]
        });
        
        const touchMove = new TouchEvent('touchmove', {
          touches: [new Touch({
            identifier: 0,
            target: canvas,
            clientX: endX,
            clientY: endY
          })]
        });
        
        const touchEnd = new TouchEvent('touchend', {
          touches: []
        });
        
        canvas.dispatchEvent(touchStart);
        canvas.dispatchEvent(touchMove);
        canvas.dispatchEvent(touchEnd);
        
        return 'TOUCH_EVENTS_SIMULATED';
      }
      
      return 'NO_CANVAS';
    });
    
    await this.page.waitForTimeout(1000);
    const signatureData = await this.validateSignature();
    
    console.log(`📱 Touch signature result: ${signatureData.hasContent ? 'SUCCESS' : 'FAILED'}`);
  }

  async testSignaturePersistence() {
    console.log('\n💾 Testing Signature Persistence...');
    
    // Draw a signature
    await this.drawSignature(SIGNATURE_TEST_CONFIG.signatureTests[0]);
    const initialSignature = await this.validateSignature();
    
    // Navigate away and back (simulate page refresh behavior)
    await this.page.goBack();
    await this.page.waitForTimeout(1000);
    await this.page.goForward();
    await this.page.waitForTimeout(2000);
    
    // Check if signature persisted
    const canvas = await this.page.$('canvas');
    if (canvas) {
      const persistedSignature = await this.validateSignature();
      
      if (persistedSignature.hasContent) {
        console.log('✅ Signature persisted after navigation');
      } else {
        console.log('❌ Signature lost after navigation');
      }
      
      return persistedSignature.hasContent;
    }
    
    return false;
  }

  async runAllSignatureTests() {
    console.log('🚀 Starting Comprehensive Signature Testing...\n');
    
    try {
      await this.init();
      await this.navigateToSignatureStep();
      
      // Test each signature scenario
      for (const signatureTest of SIGNATURE_TEST_CONFIG.signatureTests) {
        const result = await this.testSignatureScenario(signatureTest);
        this.testResults.push({
          scenario: signatureTest.name,
          description: signatureTest.description,
          ...result
        });
        
        // Clear for next test
        await this.clearSignature();
        await this.page.waitForTimeout(500);
      }
      
      // Test validation scenarios
      await this.testSignatureValidation();
      
      // Test touch device scenarios
      await this.testTouchDeviceSignature();
      
      // Test persistence
      // await this.testSignaturePersistence();
      
    } catch (error) {
      console.error('❌ Signature testing failed:', error.message);
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
      this.printResults();
    }
  }

  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('✍️ SIGNATURE TESTING RESULTS');
    console.log('='.repeat(60));
    
    const successful = this.testResults.filter(r => r.status === 'SUCCESS').length;
    const failed = this.testResults.filter(r => r.status === 'FAILED').length;
    
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((successful / (successful + failed)) * 100).toFixed(1)}%`);
    
    console.log('\n📋 Detailed Results:');
    this.testResults.forEach(result => {
      const statusIcon = result.status === 'SUCCESS' ? '✅' : '❌';
      
      console.log(`${statusIcon} ${result.scenario}: ${result.description}`);
      
      if (result.status === 'SUCCESS') {
        console.log(`   Test Time: ${result.testTime}ms`);
        console.log(`   Canvas: ${result.canvasSize}`);
        console.log(`   Strokes: ${result.strokeCount}`);
        console.log(`   Data URL: ${result.hasDataUrl ? 'Available' : 'Not captured'}`);
      } else {
        console.log(`   Error: ${result.error}`);
      }
    });
    
    console.log(`\n📸 Screenshots saved to: ${SIGNATURE_TEST_CONFIG.outputDir}`);
    
    if (failed === 0) {
      console.log('\n🎉 ALL SIGNATURE TESTS PASSED!');
    } else {
      console.log('\n⚠️ Some tests failed. Review results and fix issues.');
    }
  }
}

// Manual signature testing utilities
class ManualSignatureTestUtils {
  static getSignatureTestingChecklist() {
    return {
      devices: [
        'Desktop - Mouse',
        'Desktop - Trackpad',
        'Tablet - Touch',
        'Phone - Touch',
        'Stylus/Apple Pencil'
      ],
      
      browsers: [
        'Chrome Desktop',
        'Safari Desktop',
        'Chrome Mobile',
        'Safari Mobile (iOS)',
        'Firefox Desktop'
      ],
      
      signatureTypes: [
        'Simple cursive signature',
        'Block letter signature',
        'Initials only',
        'Very complex signature',
        'Single stroke signature',
        'Multi-stroke signature'
      ],
      
      scenarios: [
        'Normal signature drawing',
        'Very fast drawing',
        'Very slow/careful drawing',
        'Drawing with interruptions',
        'Clear and re-draw',
        'Multiple attempts',
        'Leave signature empty (validation)',
        'Draw outside canvas bounds'
      ],
      
      validation: [
        'Empty signature shows error',
        'Valid signature accepts',
        'Signature persists during session',
        'Signature clears properly',
        'Signature data saves correctly'
      ]
    };
  }
  
  static createSignatureTestPlan() {
    console.log('📋 MANUAL SIGNATURE TESTING PLAN');
    console.log('='.repeat(50));
    
    const checklist = this.getSignatureTestingChecklist();
    
    console.log('\n📱 DEVICE TESTING:');
    checklist.devices.forEach((device, i) => {
      console.log(`${i + 1}. ${device}`);
    });
    
    console.log('\n🌐 BROWSER TESTING:');
    checklist.browsers.forEach((browser, i) => {
      console.log(`${i + 1}. ${browser}`);
    });
    
    console.log('\n✍️ SIGNATURE TYPES TO TEST:');
    checklist.signatureTypes.forEach((type, i) => {
      console.log(`${i + 1}. ${type}`);
    });
    
    console.log('\n🧪 SCENARIOS TO TEST:');
    checklist.scenarios.forEach((scenario, i) => {
      console.log(`${i + 1}. ${scenario}`);
    });
    
    console.log('\n✅ VALIDATION CHECKS:');
    checklist.validation.forEach((check, i) => {
      console.log(`${i + 1}. ${check}`);
    });
    
    console.log('\n📝 TESTING TIPS:');
    console.log('• Test on actual devices, not just browser dev tools');
    console.log('• Try different signature styles and speeds');
    console.log('• Test touch pressure sensitivity if available');
    console.log('• Verify signature quality and readability');
    console.log('• Check that signatures save properly in admin dashboard');
    console.log('• Test accessibility (keyboard navigation, screen readers)');
  }
}

module.exports = {
  SignatureTestRunner,
  ManualSignatureTestUtils,
  SIGNATURE_TEST_CONFIG
};

// Run if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--manual-plan')) {
    ManualSignatureTestUtils.createSignatureTestPlan();
  } else {
    const tester = new SignatureTestRunner();
    tester.runAllSignatureTests();
  }
}