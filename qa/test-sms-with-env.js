/**
 * SMS Test with Environment Variables
 */

require('dotenv').config({ path: '.env.local' });

const TEST_PHONE = "+19142168070";

async function testSMSWithEnv() {
  console.log('📱 Testing SMS with your configured API key...');
  console.log(`📞 Phone: ${TEST_PHONE}`);
  
  const apiKey = process.env.NEXT_PUBLIC_TEXTBELT_API_KEY || process.env.TEXTBELT_API_KEY;
  
  if (!apiKey) {
    console.log('❌ No TextBelt API key found in environment');
    console.log('🔍 Checked: NEXT_PUBLIC_TEXTBELT_API_KEY and TEXTBELT_API_KEY');
    return;
  }
  
  console.log(`🔑 API Key found: ${apiKey.substring(0, 8)}...`);
  
  const message = '🚴 Hello from SD Electric Bike! Your SMS integration is working perfectly. This is a test message from your QA testing. 📱✅';
  
  try {
    console.log('📤 Sending SMS...');
    console.log(`💬 Message: ${message}`);
    
    const response = await fetch('https://textbelt.com/text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: TEST_PHONE,
        message: message,
        key: apiKey,
      }),
    });
    
    const result = await response.json();
    console.log('\n📋 SMS API Response:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n🎉 SMS SENT SUCCESSFULLY!');
      console.log(`📱 Check your phone (${TEST_PHONE}) RIGHT NOW for the message!`);
      console.log(`📊 Message ID: ${result.textId}`);
      if (result.quotaRemaining !== undefined) {
        console.log(`💰 Credits remaining: ${result.quotaRemaining}`);
      }
      
      // Test a second message (test ride confirmation style)
      console.log('\n📤 Sending test ride confirmation message...');
      
      const confirmationMessage = `🚴 Your SDEBIKE test ride has started! Please return by 4:30 PM. Location: 1234 Electric Ave, San Diego, CA 92101. Questions? Reply to this message. Enjoy your ride! ⚡`;
      
      const response2 = await fetch('https://textbelt.com/text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: TEST_PHONE,
          message: confirmationMessage,
          key: apiKey,
        }),
      });
      
      const result2 = await response2.json();
      
      if (result2.success) {
        console.log('✅ Test ride confirmation SMS also sent!');
        console.log(`📊 Second message ID: ${result2.textId}`);
        console.log(`💰 Credits remaining: ${result2.quotaRemaining || 'Unknown'}`);
      } else {
        console.log(`⚠️ Second SMS failed: ${result2.error}`);
      }
      
    } else {
      console.log('\n❌ SMS FAILED TO SEND');
      console.log(`🔍 Error: ${result.error}`);
      
      if (result.error && result.error.includes('Invalid API key')) {
        console.log('💡 Tip: Check your TextBelt API key is correct');
      } else if (result.error && result.error.includes('quota')) {
        console.log('💡 Tip: You may need to add more credits to your TextBelt account');
      }
    }
    
  } catch (error) {
    console.log('\n❌ SMS TEST FAILED');
    console.log(`🔍 Error: ${error.message}`);
  }
}

console.log('🧪 TEXTBELT SMS INTEGRATION TEST');
console.log('='.repeat(40));
testSMSWithEnv();