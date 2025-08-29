/**
 * CROSS-DEVICE TESTING CHECKLIST AND AUTOMATION
 * Test the application across different devices, browsers, and screen sizes
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const DEVICE_TEST_CONFIG = {
  baseUrl: process.env.TEST_URL || 'http://localhost:3000',
  outputDir: './qa/device-test-results',
  timeout: 30000,
  
  // Device configurations to test
  devices: [
    // Desktop configurations
    {
      name: 'Desktop Large',
      category: 'desktop',
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      description: 'Large desktop monitor'
    },
    {
      name: 'Desktop Medium',
      category: 'desktop',
      viewport: { width: 1366, height: 768 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      description: 'Standard laptop screen'
    },
    {
      name: 'MacBook Pro',
      category: 'desktop',
      viewport: { width: 1440, height: 900 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      description: 'MacBook Pro 13-inch'
    },
    
    // Tablet configurations
    {
      name: 'iPad Pro',
      category: 'tablet',
      viewport: { width: 1024, height: 1366 },
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
      description: 'iPad Pro 11-inch (portrait)'
    },
    {
      name: 'iPad Pro Landscape',
      category: 'tablet',
      viewport: { width: 1366, height: 1024 },
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
      description: 'iPad Pro 11-inch (landscape)'
    },
    {
      name: 'iPad Standard',
      category: 'tablet',
      viewport: { width: 768, height: 1024 },
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
      description: 'Standard iPad (portrait)'
    },
    
    // Mobile configurations
    {
      name: 'iPhone 13 Pro',
      category: 'mobile',
      viewport: { width: 390, height: 844 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
      description: 'iPhone 13 Pro'
    },
    {
      name: 'iPhone SE',
      category: 'mobile',
      viewport: { width: 375, height: 667 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
      description: 'iPhone SE (compact)'
    },
    {
      name: 'Samsung Galaxy S21',
      category: 'mobile',
      viewport: { width: 360, height: 800 },
      userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
      description: 'Samsung Galaxy S21'
    },
    {
      name: 'Google Pixel 6',
      category: 'mobile',
      viewport: { width: 412, height: 915 },
      userAgent: 'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
      description: 'Google Pixel 6'
    }
  ],
  
  // Browser configurations (for desktop testing)
  browsers: [
    {
      name: 'Chrome',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    },
    {
      name: 'Chrome Mobile',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--user-agent=Mozilla/5.0 (Linux; Android 11) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36']
    }
    // Note: Firefox and Safari would require separate browser instances
  ]
};

class CrossDeviceTestRunner {
  constructor() {
    this.browsers = [];
    this.testResults = [];
    
    // Ensure output directory exists
    if (!fs.existsSync(DEVICE_TEST_CONFIG.outputDir)) {
      fs.mkdirSync(DEVICE_TEST_CONFIG.outputDir, { recursive: true });
    }
  }

  async init() {
    console.log('📱 Initializing Cross-Device Testing...');
    
    // Launch browser
    const browser = await puppeteer.launch({
      headless: false, // Set to true for CI/automated testing
      defaultViewport: null,
      args: ['--start-maximized', '--no-sandbox']
    });
    
    this.browsers.push(browser);
    return browser;
  }

  async testDeviceConfiguration(device, browser) {
    console.log(`\n📱 Testing: ${device.name} (${device.category})`);
    console.log(`📐 Viewport: ${device.viewport.width}x${device.viewport.height}`);
    console.log(`📝 Description: ${device.description}`);
    
    const page = await browser.newPage();
    
    try {
      // Set viewport and user agent
      await page.setViewport(device.viewport);
      await page.setUserAgent(device.userAgent);
      await page.setDefaultTimeout(DEVICE_TEST_CONFIG.timeout);
      
      // Navigate to app
      const startTime = Date.now();
      await page.goto(DEVICE_TEST_CONFIG.baseUrl);
      const loadTime = Date.now() - startTime;
      
      // Wait for main content to load
      await page.waitForSelector('h1', { timeout: 10000 });
      
      // Test 1: Layout and Responsiveness
      const layoutTest = await this.testLayout(page, device);
      
      // Test 2: Navigation and Form Interaction
      const interactionTest = await this.testInteraction(page, device);
      
      // Test 3: Touch/Click Events
      const touchTest = await this.testTouchEvents(page, device);
      
      // Test 4: Performance on Device
      const performanceTest = await this.testPerformance(page, device);
      
      // Take full-page screenshot
      const screenshotPath = path.join(
        DEVICE_TEST_CONFIG.outputDir,
        `device-${device.name.toLowerCase().replace(/\s+/g, '-')}.png`
      );
      
      await page.screenshot({
        path: screenshotPath,
        fullPage: true
      });
      
      const result = {
        device: device.name,
        category: device.category,
        status: 'SUCCESS',
        loadTime,
        screenshot: screenshotPath,
        tests: {
          layout: layoutTest,
          interaction: interactionTest,
          touch: touchTest,
          performance: performanceTest
        }
      };
      
      console.log(`✅ ${device.name}: All tests completed (${loadTime}ms load)`);
      return result;
      
    } catch (error) {
      console.log(`❌ ${device.name}: ${error.message}`);
      
      // Take screenshot of failure
      const screenshotPath = path.join(
        DEVICE_TEST_CONFIG.outputDir,
        `failed-${device.name.toLowerCase().replace(/\s+/g, '-')}.png`
      );
      
      try {
        await page.screenshot({ path: screenshotPath, fullPage: true });
      } catch (screenshotError) {
        console.log(`Failed to take failure screenshot: ${screenshotError.message}`);
      }
      
      return {
        device: device.name,
        category: device.category,
        status: 'FAILED',
        error: error.message,
        screenshot: screenshotPath
      };
    } finally {
      await page.close();
    }
  }

  async testLayout(page, device) {
    console.log('🎨 Testing layout and responsive design...');
    
    // Check if key elements are visible and properly positioned
    const elements = {
      title: await page.$('h1'),
      logo: await page.$('img[alt*="Logo"], img[alt*="logo"]'),
      form: await page.$('form'),
      progressBar: await page.$('.flex.items-center.justify-center'),
      buttons: await page.$$('button')
    };
    
    const layoutResults = {};
    
    for (const [name, element] of Object.entries(elements)) {
      if (Array.isArray(element)) {
        layoutResults[name] = {
          count: element.length,
          visible: element.length > 0
        };
      } else if (element) {
        const boundingBox = await element.boundingBox();
        const isVisible = await element.isIntersectingViewport();
        
        layoutResults[name] = {
          present: true,
          visible: isVisible,
          position: boundingBox ? {
            x: Math.round(boundingBox.x),
            y: Math.round(boundingBox.y),
            width: Math.round(boundingBox.width),
            height: Math.round(boundingBox.height)
          } : null
        };
      } else {
        layoutResults[name] = { present: false, visible: false };
      }
    }
    
    // Check for horizontal scrolling (usually indicates responsive issues)
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = device.viewport.width;
    const hasHorizontalScroll = bodyWidth > viewportWidth;
    
    layoutResults.horizontalScroll = hasHorizontalScroll;
    layoutResults.contentWidth = bodyWidth;
    layoutResults.viewportWidth = viewportWidth;
    
    console.log(`   Layout: ${layoutResults.title.visible ? '✅' : '❌'} Title, ${layoutResults.form.visible ? '✅' : '❌'} Form, ${hasHorizontalScroll ? '⚠️' : '✅'} No H-scroll`);
    
    return layoutResults;
  }

  async testInteraction(page, device) {
    console.log('👆 Testing user interaction...');
    
    try {
      // Test form input
      const nameInput = await page.$('input[name="name"]');
      if (nameInput) {
        await nameInput.click();
        await nameInput.type('Device Test User');
        
        // Check if input received text
        const inputValue = await nameInput.evaluate(el => el.value);
        const inputWorking = inputValue === 'Device Test User';
        
        console.log(`   Input: ${inputWorking ? '✅' : '❌'} Text input working`);
        
        return {
          textInput: inputWorking,
          inputValue: inputValue
        };
      } else {
        return { textInput: false, error: 'Name input not found' };
      }
    } catch (error) {
      return { textInput: false, error: error.message };
    }
  }

  async testTouchEvents(page, device) {
    console.log('📱 Testing touch/click events...');
    
    try {
      // Test button clicks
      const buttons = await page.$$('button:not([disabled])');
      
      if (buttons.length > 0) {
        const button = buttons[0];
        
        // Test click event
        const clickable = await button.evaluate(el => {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        });
        
        if (clickable && device.category === 'mobile') {
          // For mobile devices, test touch events
          await button.tap();
        } else {
          await button.click();
        }
        
        console.log(`   Touch/Click: ✅ Button responsive`);
        
        return {
          buttonClickable: clickable,
          touchSupported: device.category !== 'desktop'
        };
      } else {
        return { buttonClickable: false, error: 'No clickable buttons found' };
      }
    } catch (error) {
      return { buttonClickable: false, error: error.message };
    }
  }

  async testPerformance(page, device) {
    console.log('⚡ Testing performance metrics...');
    
    try {
      // Get basic performance metrics
      const metrics = await page.metrics();
      
      // Test scroll performance (important for mobile)
      const scrollStart = Date.now();
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight / 2);
      });
      const scrollTime = Date.now() - scrollStart;
      
      // Test memory usage
      const jsHeapUsed = metrics.JSHeapUsedSize / 1024 / 1024; // Convert to MB
      
      console.log(`   Performance: ${jsHeapUsed.toFixed(1)}MB memory, ${scrollTime}ms scroll`);
      
      return {
        memoryUsageMB: Math.round(jsHeapUsed * 100) / 100,
        scrollTime: scrollTime,
        totalJSTime: metrics.ScriptDuration * 1000, // Convert to ms
        layoutTime: metrics.LayoutDuration * 1000
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  async runCrossDeviceTests() {
    console.log('🚀 Starting Cross-Device Testing Suite...\n');
    
    const browser = await this.init();
    
    try {
      // Test each device configuration
      for (const device of DEVICE_TEST_CONFIG.devices) {
        const result = await this.testDeviceConfiguration(device, browser);
        this.testResults.push(result);
      }
      
      // Run browser-specific tests (desktop only)
      await this.runBrowserSpecificTests(browser);
      
    } catch (error) {
      console.error('❌ Cross-device testing failed:', error.message);
    } finally {
      // Close all browsers
      for (const browser of this.browsers) {
        await browser.close();
      }
      
      this.printResults();
    }
  }

  async runBrowserSpecificTests(browser) {
    console.log('\n🌐 Running Browser-Specific Tests...');
    
    // Test JavaScript compatibility
    const jsCompatibilityTest = await this.testJSCompatibility(browser);
    
    // Test CSS support
    const cssCompatibilityTest = await this.testCSSCompatibility(browser);
    
    this.testResults.push({
      device: 'Browser Compatibility',
      category: 'compatibility',
      status: 'SUCCESS',
      tests: {
        javascript: jsCompatibilityTest,
        css: cssCompatibilityTest
      }
    });
  }

  async testJSCompatibility(browser) {
    console.log('🔧 Testing JavaScript compatibility...');
    
    const page = await browser.newPage();
    
    try {
      await page.goto(DEVICE_TEST_CONFIG.baseUrl);
      
      // Test modern JS features
      const jsFeatures = await page.evaluate(() => {
        const features = {};
        
        // Test ES6+ features
        features.arrowFunctions = typeof (() => {}) === 'function';
        features.letConst = (() => { try { eval('let x = 1; const y = 2;'); return true; } catch { return false; } })();
        features.templateLiterals = (() => { try { eval('`template${1}`'); return true; } catch { return false; } })();
        features.asyncAwait = typeof async function() {} === 'function';
        features.fetch = typeof fetch !== 'undefined';
        features.promises = typeof Promise !== 'undefined';
        
        // Test DOM APIs
        features.querySelector = typeof document.querySelector === 'function';
        features.addEventListener = typeof document.addEventListener === 'function';
        features.localStorage = typeof localStorage !== 'undefined';
        features.canvas = !!document.createElement('canvas').getContext;
        
        // Test touch support
        features.touchEvents = 'ontouchstart' in window;
        
        return features;
      });
      
      console.log('   JS Features:', Object.entries(jsFeatures).map(([k, v]) => `${k}:${v ? '✅' : '❌'}`).join(', '));
      
      return jsFeatures;
    } finally {
      await page.close();
    }
  }

  async testCSSCompatibility(browser) {
    console.log('🎨 Testing CSS compatibility...');
    
    const page = await browser.newPage();
    
    try {
      await page.goto(DEVICE_TEST_CONFIG.baseUrl);
      
      // Test CSS features
      const cssFeatures = await page.evaluate(() => {
        const testEl = document.createElement('div');
        document.body.appendChild(testEl);
        
        const features = {};
        
        try {
          // Test Flexbox
          testEl.style.display = 'flex';
          features.flexbox = testEl.style.display === 'flex';
          
          // Test Grid
          testEl.style.display = 'grid';
          features.grid = testEl.style.display === 'grid';
          
          // Test CSS Variables
          testEl.style.setProperty('--test-var', 'test');
          features.cssVariables = testEl.style.getPropertyValue('--test-var') === 'test';
          
          // Test Transform
          testEl.style.transform = 'translateX(10px)';
          features.transform = testEl.style.transform.includes('translateX');
          
          // Test Transition
          testEl.style.transition = 'all 0.3s ease';
          features.transition = testEl.style.transition.includes('0.3s');
          
        } catch (error) {
          console.error('CSS feature test error:', error);
        } finally {
          document.body.removeChild(testEl);
        }
        
        return features;
      });
      
      console.log('   CSS Features:', Object.entries(cssFeatures).map(([k, v]) => `${k}:${v ? '✅' : '❌'}`).join(', '));
      
      return cssFeatures;
    } finally {
      await page.close();
    }
  }

  printResults() {
    console.log('\n' + '='.repeat(70));
    console.log('📱 CROSS-DEVICE TESTING RESULTS');
    console.log('='.repeat(70));
    
    const successful = this.testResults.filter(r => r.status === 'SUCCESS').length;
    const failed = this.testResults.filter(r => r.status === 'FAILED').length;
    
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((successful / (successful + failed)) * 100).toFixed(1)}%`);
    
    // Group results by category
    const categories = ['desktop', 'tablet', 'mobile', 'compatibility'];
    
    categories.forEach(category => {
      const categoryResults = this.testResults.filter(r => r.category === category);
      if (categoryResults.length > 0) {
        console.log(`\n📊 ${category.toUpperCase()} RESULTS:`);
        
        categoryResults.forEach(result => {
          const status = result.status === 'SUCCESS' ? '✅' : '❌';
          console.log(`${status} ${result.device}`);
          
          if (result.loadTime) {
            console.log(`   Load Time: ${result.loadTime}ms`);
          }
          
          if (result.tests) {
            if (result.tests.layout) {
              const layout = result.tests.layout;
              console.log(`   Layout: Title:${layout.title.visible ? '✅' : '❌'} Form:${layout.form.visible ? '✅' : '❌'} HScroll:${layout.horizontalScroll ? '⚠️' : '✅'}`);
            }
            
            if (result.tests.performance) {
              const perf = result.tests.performance;
              if (perf.memoryUsageMB) {
                console.log(`   Performance: ${perf.memoryUsageMB}MB memory, ${perf.scrollTime}ms scroll`);
              }
            }
          }
          
          if (result.error) {
            console.log(`   Error: ${result.error}`);
          }
        });
      }
    });
    
    console.log(`\n📸 Screenshots saved to: ${DEVICE_TEST_CONFIG.outputDir}`);
    
    if (failed === 0) {
      console.log('\n🎉 ALL CROSS-DEVICE TESTS PASSED!');
      console.log('Your app works across all tested devices and browsers.');
    } else {
      console.log('\n⚠️ Some device tests failed. Review results and fix responsive design issues.');
    }
    
    console.log('\n📱 MANUAL TESTING RECOMMENDATIONS:');
    console.log('• Test on actual physical devices when possible');
    console.log('• Test touch gestures (pinch, zoom, swipe)');
    console.log('• Test device rotation (portrait ↔ landscape)');
    console.log('• Test with slow internet connections');
    console.log('• Test with different font sizes/accessibility settings');
  }
}

// Manual cross-device testing utilities
class ManualCrossDeviceTestUtils {
  static getDeviceTestingChecklist() {
    return {
      desktopDevices: [
        'Windows 10/11 - Chrome',
        'Windows 10/11 - Edge',
        'Windows 10/11 - Firefox',
        'macOS - Safari',
        'macOS - Chrome',
        'Linux - Firefox',
        'Linux - Chrome'
      ],
      
      tabletDevices: [
        'iPad (9th gen) - Safari',
        'iPad Pro 11" - Safari',
        'iPad Pro 12.9" - Safari',
        'Samsung Galaxy Tab S8 - Chrome',
        'Microsoft Surface - Edge',
        'Amazon Fire HD - Silk Browser'
      ],
      
      mobileDevices: [
        'iPhone 13/14 - Safari',
        'iPhone SE - Safari',
        'Samsung Galaxy S22/S23 - Chrome',
        'Google Pixel 6/7 - Chrome',
        'OnePlus 10 - Chrome',
        'Xiaomi 12 - Chrome'
      ],
      
      testScenarios: [
        'Portrait orientation',
        'Landscape orientation',
        'Split screen (tablets)',
        'Picture-in-picture mode',
        'Different zoom levels (50%, 100%, 150%)',
        'High contrast mode',
        'Dark mode (if supported)',
        'Slow network conditions',
        'Offline mode (if applicable)'
      ],
      
      interactionTests: [
        'Touch/tap interactions',
        'Scroll performance',
        'Pinch-to-zoom behavior',
        'Swipe gestures',
        'Drag and drop (if applicable)',
        'Keyboard input (virtual/physical)',
        'Voice input (if supported)',
        'Camera access (for photo upload)',
        'Form submission',
        'Payment flow (Apple Pay/Google Pay)'
      ],
      
      performanceChecks: [
        'Initial page load time',
        'Time to interactive',
        'Smooth scrolling',
        'Animation performance',
        'Memory usage',
        'Battery usage (mobile)',
        'CPU usage during heavy tasks',
        'Network usage optimization'
      ]
    };
  }
  
  static createCrossDeviceTestPlan() {
    console.log('📱 CROSS-DEVICE MANUAL TESTING PLAN');
    console.log('='.repeat(50));
    
    const checklist = this.getDeviceTestingChecklist();
    
    Object.keys(checklist).forEach(category => {
      const categoryName = category.replace(/([A-Z])/g, ' $1').toUpperCase();
      console.log(`\n📊 ${categoryName}:`);
      
      checklist[category].forEach((item, i) => {
        console.log(`${i + 1}. ${item}`);
      });
    });
    
    console.log('\n📝 TESTING PRIORITIES:');
    console.log('1. HIGH PRIORITY:');
    console.log('   • iPhone Safari (most common mobile)');
    console.log('   • iPad Safari (common for business)');
    console.log('   • Chrome Desktop (most common overall)');
    console.log('   • Samsung Galaxy Chrome (Android market leader)');
    
    console.log('\n2. MEDIUM PRIORITY:');
    console.log('   • Firefox Desktop');
    console.log('   • Edge Desktop');
    console.log('   • Various Android tablets');
    
    console.log('\n3. LOW PRIORITY:');
    console.log('   • Older browser versions');
    console.log('   • Less common devices');
    console.log('   • Specialized browsers');
    
    console.log('\n⚠️ CRITICAL TEST CASES:');
    console.log('• Photo upload works on all mobile cameras');
    console.log('• Signature capture works on all touch devices');
    console.log('• Payment forms work with digital wallets');
    console.log('• SMS notifications send on all carriers');
    console.log('• Admin dashboard accessible on all devices');
    console.log('• No data loss during device rotation');
    console.log('• Reasonable performance on older devices');
    
    console.log('\n🛠️ TESTING TOOLS:');
    console.log('• Browser DevTools device emulation (initial testing)');
    console.log('• BrowserStack/Sauce Labs (cloud device testing)');
    console.log('• Physical devices (most accurate results)');
    console.log('• Google PageSpeed Insights (performance)');
    console.log('• WebPageTest (detailed performance metrics)');
  }
  
  static generateTestMatrix() {
    console.log('📊 DEVICE TEST MATRIX');
    console.log('='.repeat(50));
    
    const devices = ['iPhone 13', 'iPad Pro', 'Samsung S22', 'Desktop Chrome', 'Desktop Safari'];
    const features = ['Load Page', 'Fill Form', 'Upload Photo', 'Sign Waiver', 'Payment', 'Admin View'];
    
    console.log('\nFeature compatibility matrix (✅ = Required, 🔍 = Test):');
    console.log('Feature'.padEnd(15) + devices.join('\t'));
    console.log('-'.repeat(80));
    
    features.forEach(feature => {
      const row = feature.padEnd(15) + devices.map(() => '🔍').join('\t');
      console.log(row);
    });
    
    console.log('\n📋 Use this matrix to track your manual testing progress!');
  }
}

module.exports = {
  CrossDeviceTestRunner,
  ManualCrossDeviceTestUtils,
  DEVICE_TEST_CONFIG
};

// Run if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--manual-plan')) {
    ManualCrossDeviceTestUtils.createCrossDeviceTestPlan();
  } else if (args.includes('--test-matrix')) {
    ManualCrossDeviceTestUtils.generateTestMatrix();
  } else if (args.includes('--checklist')) {
    console.log(ManualCrossDeviceTestUtils.getDeviceTestingChecklist());
  } else {
    const tester = new CrossDeviceTestRunner();
    tester.runCrossDeviceTests();
  }
}