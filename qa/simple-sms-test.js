/**
 * Simple SMS Test - Direct TextBelt API Test
 */

const TEST_PHONE = process.env.TEST_PHONE_NUMBER || "+9142168070";
const TEXTBELT_KEY = process.env.TEXTBELT_API_KEY || "textbelt";

async function testSMSDelivery() {
  console.log('📱 Testing SMS Delivery...');
  console.log(`📞 Phone: ${TEST_PHONE}`);
  
  if (!TEST_PHONE.startsWith('+')) {
    console.error('❌ Phone number must include country code (e.g. +1234567890)');
    return;
  }
  
  const message = '🚴 Test message from SD Electric Bike app! Your test ride SMS system is working correctly.';
  
  try {
    console.log('📤 Sending test SMS...');
    
    const response = await fetch('https://textbelt.com/text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: TEST_PHONE,
        message: message,
        key: TEXTBELT_KEY,
      }),
    });
    
    const result = await response.json();
    console.log('📋 SMS API Response:', result);
    
    if (result.success) {
      console.log('✅ SMS sent successfully!');
      console.log(`📱 Check your phone (${TEST_PHONE}) for the test message`);
      console.log(`📊 Message ID: ${result.textId}`);
      console.log(`💰 Quota remaining: ${result.quotaRemaining || 'Unknown'}`);
    } else {
      console.log('❌ SMS failed to send');
      console.log(`🔍 Error: ${result.error}`);
      
      if (result.error && result.error.includes('quota')) {
        console.log('💡 Tip: You may need to add credits to your TextBelt account');
        console.log('💡 Visit: https://textbelt.com to purchase credits');
      }
    }
    
  } catch (error) {
    console.log('❌ SMS test failed with error:');
    console.log(error.message);
  }
}

// Run the test
testSMSDelivery();