/**
 * SMS TESTING CONFIGURATION
 * Configure TextBelt SMS testing with your real phone number
 */

const { smsService } = require('../src/lib/services/smsService');

// SMS Test Configuration
const SMS_TEST_CONFIG = {
  // REPLACE WITH YOUR ACTUAL PHONE NUMBER FOR TESTING
  testPhoneNumber: process.env.TEST_PHONE_NUMBER || '+1234567890',
  
  // TextBelt API Key (get from textbelt.com)
  textbeltApiKey: process.env.TEXTBELT_API_KEY || '',
  
  // Test messages
  testMessages: {
    confirmation: {
      template: '🚴 Your SDEBIKE test ride has started! Please return by {returnTime}. Location: 1234 Electric Ave, San Diego, CA. Questions? Reply to this message.',
      returnTime: '3:30 PM'
    },
    reminder: {
      template: '⏰ Reminder: Your SDEBIKE test ride ends at {returnTime}. Please return the bike on time.',
      returnTime: '3:30 PM'
    },
    completion: {
      template: '✅ Thank you for your SDEBIKE test ride! We hope you enjoyed it. Come back soon for another ride!'
    }
  }
};

class SMSTestRunner {
  constructor() {
    this.results = [];
  }

  async testSMSConfiguration() {
    console.log('📱 Testing SMS Service Configuration...');
    
    // Check if TextBelt is configured
    const configStatus = smsService.getConfigStatus();
    console.log('Configuration Status:', configStatus);
    
    if (!configStatus.configured) {
      throw new Error(`SMS service not configured. Missing: ${configStatus.missing.join(', ')}`);
    }
    
    console.log('✅ SMS service is properly configured');
    return true;
  }

  async testSMSDelivery(phoneNumber, message, testName) {
    console.log(`\n📤 Sending test SMS: ${testName}`);
    console.log(`📞 To: ${phoneNumber}`);
    console.log(`💬 Message: ${message}`);
    
    try {
      const response = await smsService.sendSMS({
        to: phoneNumber,
        body: message
      });
      
      if (response.success) {
        console.log('✅ SMS sent successfully!');
        console.log(`📋 Message ID: ${response.messageId}`);
        console.log(`🏷️ Provider: ${response.provider}`);
        
        this.results.push({
          test: testName,
          status: 'SUCCESS',
          messageId: response.messageId,
          provider: response.provider
        });
        
        return response;
      } else {
        throw new Error(response.error || 'SMS delivery failed');
      }
    } catch (error) {
      console.log(`❌ SMS failed: ${error.message}`);
      this.results.push({
        test: testName,
        status: 'FAILED',
        error: error.message
      });
      throw error;
    }
  }

  async runCompleteSMSTest() {
    console.log('🚀 Starting Complete SMS Testing...');
    console.log(`📞 Test Phone Number: ${SMS_TEST_CONFIG.testPhoneNumber}`);
    
    if (SMS_TEST_CONFIG.testPhoneNumber === '+1234567890') {
      throw new Error('Please set your actual phone number in TEST_PHONE_NUMBER environment variable');
    }

    try {
      // Test 1: Configuration check
      await this.testSMSConfiguration();
      
      // Test 2: Test ride confirmation SMS
      const confirmationMessage = SMS_TEST_CONFIG.testMessages.confirmation.template
        .replace('{returnTime}', SMS_TEST_CONFIG.testMessages.confirmation.returnTime);
      
      await this.testSMSDelivery(
        SMS_TEST_CONFIG.testPhoneNumber,
        confirmationMessage,
        'Test Ride Confirmation'
      );
      
      // Wait for delivery
      console.log('⏱️  Waiting 5 seconds for delivery...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Test 3: Test ride reminder SMS
      const reminderMessage = SMS_TEST_CONFIG.testMessages.reminder.template
        .replace('{returnTime}', SMS_TEST_CONFIG.testMessages.reminder.returnTime);
      
      await this.testSMSDelivery(
        SMS_TEST_CONFIG.testPhoneNumber,
        reminderMessage,
        'Test Ride Reminder'
      );
      
      // Wait for delivery
      console.log('⏱️  Waiting 5 seconds for delivery...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Test 4: Test ride completion SMS
      const completionMessage = SMS_TEST_CONFIG.testMessages.completion.template;
      
      await this.testSMSDelivery(
        SMS_TEST_CONFIG.testPhoneNumber,
        completionMessage,
        'Test Ride Completion'
      );
      
      this.printResults();
      
    } catch (error) {
      console.error('❌ SMS testing failed:', error.message);
      this.printResults();
      throw error;
    }
  }

  async testSMSServiceMethods() {
    console.log('\n🧪 Testing SMS Service Methods...');
    
    const phoneNumber = SMS_TEST_CONFIG.testPhoneNumber;
    const returnTime = '4:00 PM';
    const location = '1234 Electric Ave, San Diego, CA';
    
    try {
      // Test confirmation method
      console.log('\n📤 Testing sendTestRideConfirmation...');
      const confirmationResult = await smsService.sendTestRideConfirmation(
        phoneNumber, 
        returnTime, 
        location
      );
      
      if (!confirmationResult.success) {
        throw new Error(`Confirmation SMS failed: ${confirmationResult.error}`);
      }
      
      console.log('✅ Confirmation SMS sent successfully');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Test reminder method
      console.log('\n📤 Testing sendTestRideReminder...');
      const reminderResult = await smsService.sendTestRideReminder(phoneNumber, returnTime);
      
      if (!reminderResult.success) {
        throw new Error(`Reminder SMS failed: ${reminderResult.error}`);
      }
      
      console.log('✅ Reminder SMS sent successfully');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Test completion method
      console.log('\n📤 Testing sendTestRideCompletion...');
      const completionResult = await smsService.sendTestRideCompletion(phoneNumber);
      
      if (!completionResult.success) {
        throw new Error(`Completion SMS failed: ${completionResult.error}`);
      }
      
      console.log('✅ Completion SMS sent successfully');
      
    } catch (error) {
      console.error('❌ SMS service method testing failed:', error.message);
      throw error;
    }
  }

  printResults() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 SMS TESTING RESULTS');
    console.log('='.repeat(50));
    
    const successful = this.results.filter(r => r.status === 'SUCCESS').length;
    const failed = this.results.filter(r => r.status === 'FAILED').length;
    
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((successful / this.results.length) * 100).toFixed(1)}%`);
    
    console.log('\n📋 Detailed Results:');
    this.results.forEach(result => {
      const status = result.status === 'SUCCESS' ? '✅' : '❌';
      console.log(`${status} ${result.test}`);
      
      if (result.status === 'SUCCESS') {
        console.log(`   Message ID: ${result.messageId}`);
        console.log(`   Provider: ${result.provider}`);
      } else {
        console.log(`   Error: ${result.error}`);
      }
    });
    
    if (failed === 0) {
      console.log('\n🎉 ALL SMS TESTS PASSED!');
      console.log('📱 Check your phone for the test messages.');
    } else {
      console.log('\n⚠️  Some SMS tests failed. Check configuration and API keys.');
    }
  }
}

// Helper function to validate phone number format
function validatePhoneNumber(phoneNumber) {
  // Basic validation for US phone numbers
  const phoneRegex = /^\+1[0-9]{10}$/;
  return phoneRegex.test(phoneNumber);
}

// Manual SMS testing interface
class ManualSMSTest {
  constructor() {
    this.smsTestRunner = new SMSTestRunner();
  }

  async promptForPhoneNumber() {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question('📞 Enter your phone number for SMS testing (format: +1234567890): ', (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    });
  }

  async runInteractiveSMSTest() {
    console.log('🚀 Interactive SMS Testing');
    console.log('This will send real SMS messages to your phone for testing.');
    
    let phoneNumber = SMS_TEST_CONFIG.testPhoneNumber;
    
    if (phoneNumber === '+1234567890' || !phoneNumber) {
      phoneNumber = await this.promptForPhoneNumber();
    }
    
    if (!validatePhoneNumber(phoneNumber)) {
      throw new Error('Invalid phone number format. Use +1234567890 format.');
    }
    
    console.log(`📱 Using phone number: ${phoneNumber}`);
    
    // Update the test config
    SMS_TEST_CONFIG.testPhoneNumber = phoneNumber;
    
    // Run the tests
    await this.smsTestRunner.runCompleteSMSTest();
  }
}

// Export for use in other test files
module.exports = {
  SMSTestRunner,
  ManualSMSTest,
  SMS_TEST_CONFIG,
  validatePhoneNumber
};

// Run if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--interactive')) {
    const manualTest = new ManualSMSTest();
    manualTest.runInteractiveSMSTest().catch(console.error);
  } else if (args.includes('--methods')) {
    const testRunner = new SMSTestRunner();
    testRunner.testSMSServiceMethods().catch(console.error);
  } else {
    const testRunner = new SMSTestRunner();
    testRunner.runCompleteSMSTest().catch(console.error);
  }
}