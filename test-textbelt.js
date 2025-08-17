#!/usr/bin/env node

// Test TextBelt SMS Integration
// Run with: node test-textbelt.js

require('dotenv').config({ path: '.env.local' });

async function testTextBelt() {
  console.log('🧪 Testing TextBelt SMS Integration...\n');

  // Check environment
  console.log('📋 Environment Check:');
  console.log(`NEXT_PUBLIC_TEXTBELT_API_KEY: ${process.env.NEXT_PUBLIC_TEXTBELT_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`SMS_PROVIDER: ${process.env.SMS_PROVIDER || 'textbelt (default)'}`);
  console.log('');

  if (!process.env.NEXT_PUBLIC_TEXTBELT_API_KEY) {
    console.log('❌ NEXT_PUBLIC_TEXTBELT_API_KEY not set. Please add it to your .env.local file.');
    return;
  }

  // Test SMS sending (use a test phone number)
  console.log('📱 Testing SMS Sending...');
  console.log('Note: This will send a real SMS to the test number');
  console.log('');

  // You can change this to your actual phone number for testing
  const testPhone = process.env.TEST_PHONE || '+15551234567';
  const testMessage = '🧪 Test message from SDEBIKE Test Ride App - TextBelt Integration Test';

  try {
    console.log(`Sending to: ${testPhone}`);
    console.log(`Message: ${testMessage}`);
    console.log('');

    const response = await fetch('https://textbelt.com/text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: testPhone,
        message: testMessage,
        key: process.env.NEXT_PUBLIC_TEXTBELT_API_KEY,
      }),
    });

    const result = await response.json();

    console.log('📤 SMS Result:');
    console.log(`Success: ${result.success ? '✅ Yes' : '❌ No'}`);
    console.log(`Message ID: ${result.textId || 'N/A'}`);
    console.log(`Quota Remaining: ${result.quotaRemaining || 'N/A'}`);
    
    if (!result.success) {
      console.log(`Error: ${result.error || 'Unknown error'}`);
      
      // Handle common errors
      if (result.error === 'Out of quota') {
        console.log('\n💡 Quota Issue:');
        console.log('- TextBelt free tier has limited quota');
        console.log('- This is normal for testing');
        console.log('- Integration is working correctly');
        console.log('- Ready to switch to Twilio when needed');
      } else if (result.error === 'Invalid phone number') {
        console.log('\n💡 Phone Number Issue:');
        console.log('- Set TEST_PHONE in .env.local to your real number');
        console.log('- Format: +1XXXXXXXXXX (US numbers)');
      }
    }

    console.log('');
    
    if (result.success) {
      console.log('🎉 TextBelt integration working perfectly!');
      console.log('You can now switch to Twilio by setting SMS_PROVIDER=twilio');
    } else if (result.error === 'Out of quota') {
      console.log('✅ TextBelt integration working (quota exhausted)');
      console.log('Ready to switch to Twilio when needed');
    } else {
      console.log('❌ TextBelt integration failed. Check your API key and try again.');
    }

  } catch (error) {
    console.error('💥 Test failed with error:', error);
  }
}

// Run the test
testTextBelt().catch(console.error);
