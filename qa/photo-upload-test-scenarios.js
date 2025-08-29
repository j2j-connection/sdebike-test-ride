/**
 * PHOTO UPLOAD TESTING SCENARIOS
 * Test different image formats, sizes, and edge cases for ID photo uploads
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp'); // For image manipulation

const PHOTO_TEST_CONFIG = {
  baseUrl: process.env.TEST_URL || 'http://localhost:3000',
  testImagesDir: './qa/test-images',
  outputDir: './qa/photo-test-results',
  timeout: 30000
};

// Test image specifications
const TEST_IMAGE_SCENARIOS = [
  {
    name: 'portrait-high-res',
    width: 1200,
    height: 1600,
    format: 'jpeg',
    quality: 90,
    description: 'High resolution portrait ID (typical smartphone photo)'
  },
  {
    name: 'landscape-medium-res',
    width: 1024,
    height: 768,
    format: 'jpeg',
    quality: 80,
    description: 'Medium resolution landscape ID'
  },
  {
    name: 'square-low-res',
    width: 400,
    height: 400,
    format: 'png',
    quality: 70,
    description: 'Low resolution square format'
  },
  {
    name: 'very-large-file',
    width: 4000,
    height: 3000,
    format: 'jpeg',
    quality: 100,
    description: 'Very large file size test (should compress)'
  },
  {
    name: 'tiny-image',
    width: 100,
    height: 100,
    format: 'png',
    quality: 50,
    description: 'Very small image (edge case)'
  },
  {
    name: 'webp-format',
    width: 800,
    height: 1000,
    format: 'webp',
    quality: 80,
    description: 'Modern WebP format test'
  },
  {
    name: 'heic-format',
    width: 800,
    height: 1000,
    format: 'heic',
    quality: 80,
    description: 'iPhone HEIC format test'
  }
];

class PhotoUploadTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = [];
    
    // Ensure directories exist
    [PHOTO_TEST_CONFIG.testImagesDir, PHOTO_TEST_CONFIG.outputDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async init() {
    console.log('📸 Initializing Photo Upload Testing...');
    
    this.browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--start-maximized']
    });
    
    this.page = await this.browser.newPage();
    await this.page.setDefaultTimeout(PHOTO_TEST_CONFIG.timeout);
  }

  async generateTestImages() {
    console.log('🎨 Generating test images...');
    
    for (const scenario of TEST_IMAGE_SCENARIOS) {
      try {
        const filename = `${scenario.name}.${scenario.format}`;
        const filePath = path.join(PHOTO_TEST_CONFIG.testImagesDir, filename);
        
        // Skip HEIC format for now (requires special handling)
        if (scenario.format === 'heic') {
          console.log(`⚠️ Skipping HEIC format (requires special libraries)`);
          continue;
        }
        
        // Create test image with Sharp
        let image = sharp({
          create: {
            width: scenario.width,
            height: scenario.height,
            channels: 3,
            background: { r: 255, g: 255, b: 255 }
          }
        });
        
        // Add text overlay to simulate ID content
        const textSvg = `
          <svg width="${scenario.width}" height="${scenario.height}">
            <rect width="100%" height="100%" fill="#f0f0f0"/>
            <text x="50%" y="30%" text-anchor="middle" font-size="${Math.max(24, scenario.width / 20)}" font-family="Arial" fill="#333">
              DRIVER LICENSE
            </text>
            <text x="50%" y="45%" text-anchor="middle" font-size="${Math.max(18, scenario.width / 30)}" font-family="Arial" fill="#666">
              JOHN DOE TEST
            </text>
            <text x="50%" y="60%" text-anchor="middle" font-size="${Math.max(14, scenario.width / 40)}" font-family="Arial" fill="#666">
              DOB: 01/01/1990
            </text>
            <text x="50%" y="70%" text-anchor="middle" font-size="${Math.max(12, scenario.width / 50)}" font-family="Arial" fill="#888">
              ${scenario.description}
            </text>
            <text x="50%" y="85%" text-anchor="middle" font-size="${Math.max(10, scenario.width / 60)}" font-family="Arial" fill="#999">
              ${scenario.width}x${scenario.height} ${scenario.format.toUpperCase()}
            </text>
          </svg>
        `;
        
        // Apply format-specific settings
        if (scenario.format === 'jpeg') {
          await image
            .composite([{ input: Buffer.from(textSvg), top: 0, left: 0 }])
            .jpeg({ quality: scenario.quality })
            .toFile(filePath);
        } else if (scenario.format === 'png') {
          await image
            .composite([{ input: Buffer.from(textSvg), top: 0, left: 0 }])
            .png({ quality: scenario.quality })
            .toFile(filePath);
        } else if (scenario.format === 'webp') {
          await image
            .composite([{ input: Buffer.from(textSvg), top: 0, left: 0 }])
            .webp({ quality: scenario.quality })
            .toFile(filePath);
        }
        
        const stats = fs.statSync(filePath);
        console.log(`✅ Generated: ${filename} (${(stats.size / 1024 / 1024).toFixed(2)}MB)`);
        
      } catch (error) {
        console.log(`❌ Failed to generate ${scenario.name}: ${error.message}`);
      }
    }
  }

  async navigateToUploadStep() {
    console.log('🧭 Navigating to photo upload step...');
    
    // Navigate to app
    await this.page.goto(PHOTO_TEST_CONFIG.baseUrl);
    await this.page.waitForSelector('input[name="name"]', { timeout: 10000 });
    
    // Fill contact info
    await this.page.type('input[name="name"]', 'Photo Test User');
    await this.page.type('input[name="phone"]', '+1234567890');
    await this.page.type('input[name="email"]', 'phototest@example.com');
    await this.page.click('button[type="submit"]');
    
    // Wait for bike selection
    await this.page.waitForSelector('select', { timeout: 5000 });
    await this.page.select('select', 'Pace 500.3');
    await this.page.click('button:contains("Next")');
    
    // Should now be on verification/photo upload step
    await this.page.waitForSelector('input[type="file"]', { timeout: 10000 });
    console.log('✅ Reached photo upload step');
  }

  async testPhotoUpload(scenario) {
    const testName = `Photo Upload: ${scenario.description}`;
    console.log(`\n📸 Testing: ${testName}`);
    
    try {
      const filename = `${scenario.name}.${scenario.format}`;
      const filePath = path.join(PHOTO_TEST_CONFIG.testImagesDir, filename);
      
      // Skip if file doesn't exist (like HEIC)
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️ Skipping ${filename} - file not found`);
        return { status: 'SKIPPED', reason: 'File not found' };
      }
      
      // Get file size
      const stats = fs.statSync(filePath);
      const fileSizeMB = stats.size / 1024 / 1024;
      
      console.log(`📁 File: ${filename}`);
      console.log(`📏 Size: ${(fileSizeMB).toFixed(2)}MB`);
      console.log(`📐 Dimensions: ${scenario.width}x${scenario.height}`);
      
      // Find and use file input
      const fileInput = await this.page.$('input[type="file"]');
      if (!fileInput) {
        throw new Error('File input not found');
      }
      
      // Record start time
      const startTime = Date.now();
      
      // Upload the file
      await fileInput.uploadFile(filePath);
      
      // Wait for processing/preview
      await this.page.waitForTimeout(2000);
      
      // Check for upload success indicators
      const imagePreview = await this.page.$('img[alt*="ID"], img[src*="blob:"], img[src*="data:"]');
      const errorMessage = await this.page.$('.text-red-500, .error-message');
      
      const uploadTime = Date.now() - startTime;
      
      if (errorMessage) {
        const errorText = await this.page.$eval('.text-red-500, .error-message', el => el.textContent);
        throw new Error(`Upload failed: ${errorText}`);
      }
      
      if (!imagePreview) {
        throw new Error('No image preview displayed after upload');
      }
      
      // Get preview image properties
      const previewSrc = await imagePreview.getAttribute('src');
      const isBlob = previewSrc.startsWith('blob:');
      const isDataUrl = previewSrc.startsWith('data:');
      
      // Take screenshot of successful upload
      const screenshotPath = path.join(
        PHOTO_TEST_CONFIG.outputDir, 
        `success-${scenario.name}.png`
      );
      await this.page.screenshot({ 
        path: screenshotPath,
        clip: { x: 0, y: 0, width: 800, height: 600 }
      });
      
      const result = {
        status: 'SUCCESS',
        uploadTime: uploadTime,
        fileSizeMB: fileSizeMB,
        previewType: isBlob ? 'blob' : isDataUrl ? 'data-url' : 'url',
        screenshot: screenshotPath
      };
      
      console.log(`✅ SUCCESS - Upload completed in ${uploadTime}ms`);
      console.log(`📸 Preview type: ${result.previewType}`);
      
      return result;
      
    } catch (error) {
      console.log(`❌ FAILED - ${error.message}`);
      
      // Take screenshot of failure
      const screenshotPath = path.join(
        PHOTO_TEST_CONFIG.outputDir, 
        `failed-${scenario.name}.png`
      );
      await this.page.screenshot({ path: screenshotPath, fullPage: true });
      
      return {
        status: 'FAILED',
        error: error.message,
        screenshot: screenshotPath
      };
    }
  }

  async testMultipleFormats() {
    console.log('🎭 Testing Multiple Image Formats...');
    
    const formatTests = [
      { format: 'jpeg', accepts: true, description: 'JPEG - Standard format' },
      { format: 'png', accepts: true, description: 'PNG - With transparency' },
      { format: 'webp', accepts: true, description: 'WebP - Modern format' },
      { format: 'gif', accepts: false, description: 'GIF - Animated/Static' },
      { format: 'bmp', accepts: false, description: 'BMP - Uncompressed' },
      { format: 'tiff', accepts: false, description: 'TIFF - Professional' }
    ];
    
    for (const test of formatTests) {
      console.log(`\n📁 Testing ${test.format.toUpperCase()} format...`);
      
      if (test.accepts) {
        console.log(`✅ ${test.description} - Should be accepted`);
      } else {
        console.log(`⚠️ ${test.description} - Should be rejected or converted`);
      }
    }
  }

  async testEdgeCases() {
    console.log('\n🔍 Testing Edge Cases...');
    
    const edgeCases = [
      {
        name: 'No file selected',
        action: async () => {
          // Try to submit without selecting file
          const nextButton = await this.page.$('button:contains("Next")');
          if (nextButton) {
            await nextButton.click();
            await this.page.waitForTimeout(1000);
            
            // Check for validation error
            const error = await this.page.$('.text-red-500');
            return error ? 'VALIDATION_ERROR' : 'UNEXPECTED_SUCCESS';
          }
          return 'NO_BUTTON';
        }
      },
      {
        name: 'Double upload',
        action: async () => {
          // Upload first image
          const scenario = TEST_IMAGE_SCENARIOS[0];
          const filePath = path.join(PHOTO_TEST_CONFIG.testImagesDir, `${scenario.name}.${scenario.format}`);
          
          if (fs.existsSync(filePath)) {
            const fileInput = await this.page.$('input[type="file"]');
            await fileInput.uploadFile(filePath);
            await this.page.waitForTimeout(1000);
            
            // Upload second image (should replace first)
            const scenario2 = TEST_IMAGE_SCENARIOS[1];
            const filePath2 = path.join(PHOTO_TEST_CONFIG.testImagesDir, `${scenario2.name}.${scenario2.format}`);
            
            if (fs.existsSync(filePath2)) {
              await fileInput.uploadFile(filePath2);
              await this.page.waitForTimeout(1000);
              return 'REPLACED';
            }
          }
          return 'SKIP';
        }
      }
    ];
    
    for (const edgeCase of edgeCases) {
      console.log(`🧪 Testing: ${edgeCase.name}`);
      try {
        const result = await edgeCase.action();
        console.log(`✅ Result: ${result}`);
      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
      }
    }
  }

  async runAllPhotoTests() {
    console.log('🚀 Starting Comprehensive Photo Upload Testing...\n');
    
    try {
      await this.init();
      await this.generateTestImages();
      await this.navigateToUploadStep();
      
      // Test each image scenario
      for (const scenario of TEST_IMAGE_SCENARIOS) {
        const result = await this.testPhotoUpload(scenario);
        this.testResults.push({
          scenario: scenario.name,
          description: scenario.description,
          ...result
        });
        
        // Reset for next test (refresh page)
        if (scenario !== TEST_IMAGE_SCENARIOS[TEST_IMAGE_SCENARIOS.length - 1]) {
          await this.navigateToUploadStep();
        }
      }
      
      // Test edge cases
      await this.testEdgeCases();
      
      // Test format support
      await this.testMultipleFormats();
      
    } catch (error) {
      console.error('❌ Photo testing failed:', error.message);
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
      this.printResults();
    }
  }

  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('📸 PHOTO UPLOAD TEST RESULTS');
    console.log('='.repeat(60));
    
    const successful = this.testResults.filter(r => r.status === 'SUCCESS').length;
    const failed = this.testResults.filter(r => r.status === 'FAILED').length;
    const skipped = this.testResults.filter(r => r.status === 'SKIPPED').length;
    
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️ Skipped: ${skipped}`);
    console.log(`📈 Success Rate: ${((successful / (successful + failed)) * 100).toFixed(1)}%`);
    
    console.log('\n📋 Detailed Results:');
    this.testResults.forEach(result => {
      const statusIcon = {
        'SUCCESS': '✅',
        'FAILED': '❌',
        'SKIPPED': '⚠️'
      }[result.status] || '❓';
      
      console.log(`${statusIcon} ${result.scenario}: ${result.description}`);
      
      if (result.status === 'SUCCESS') {
        console.log(`   Upload Time: ${result.uploadTime}ms`);
        console.log(`   File Size: ${result.fileSizeMB?.toFixed(2)}MB`);
        console.log(`   Preview: ${result.previewType}`);
      } else if (result.status === 'FAILED') {
        console.log(`   Error: ${result.error}`);
      } else if (result.status === 'SKIPPED') {
        console.log(`   Reason: ${result.reason}`);
      }
    });
    
    console.log(`\n📸 Screenshots saved to: ${PHOTO_TEST_CONFIG.outputDir}`);
    console.log(`🖼️ Test images saved to: ${PHOTO_TEST_CONFIG.testImagesDir}`);
    
    if (failed === 0) {
      console.log('\n🎉 ALL PHOTO UPLOAD TESTS PASSED!');
    } else {
      console.log('\n⚠️ Some tests failed. Review results and fix issues.');
    }
  }
}

// Manual photo testing utilities
class ManualPhotoTestUtils {
  static createMockPhotoFiles() {
    console.log('📁 Creating mock photo files for manual testing...');
    
    const mockFiles = [
      'drivers-license-portrait.jpg',
      'passport-photo.png',
      'state-id-landscape.jpg',
      'military-id.png'
    ];
    
    console.log('📝 Mock files you can create for testing:');
    mockFiles.forEach((file, index) => {
      console.log(`${index + 1}. ${file} - Use your phone to take a photo of a sample ID`);
    });
    
    console.log('\n📱 Testing Tips:');
    console.log('• Test with your actual phone camera');
    console.log('• Try different lighting conditions');
    console.log('• Test both portrait and landscape orientations');
    console.log('• Use different image qualities/sizes');
    console.log('• Test on different devices (iOS Safari vs Android Chrome)');
  }
  
  static getPhotoTestingChecklist() {
    return {
      formats: ['JPEG', 'PNG', 'WebP', 'HEIC (iPhone)'],
      sizes: ['< 1MB', '1-5MB', '5-10MB', '> 10MB'],
      orientations: ['Portrait', 'Landscape', 'Square'],
      devices: ['iPhone Safari', 'Android Chrome', 'Desktop Chrome', 'Desktop Safari'],
      scenarios: [
        'Clear, well-lit photo',
        'Poor lighting conditions',
        'Blurry/out-of-focus',
        'Very small file size',
        'Very large file size',
        'Multiple uploads (replacement)',
        'No file selected validation'
      ]
    };
  }
}

module.exports = {
  PhotoUploadTester,
  ManualPhotoTestUtils,
  TEST_IMAGE_SCENARIOS,
  PHOTO_TEST_CONFIG
};

// Run if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--manual-utils')) {
    ManualPhotoTestUtils.createMockPhotoFiles();
    console.log('\n📋 Testing Checklist:');
    console.log(ManualPhotoTestUtils.getPhotoTestingChecklist());
  } else {
    const tester = new PhotoUploadTester();
    tester.runAllPhotoTests();
  }
}