/**
 * Check for the very latest submission
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function checkLatestSubmission() {
  console.log('🔍 Checking for latest submissions...\n');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  try {
    // Check customers created in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    console.log(`📅 Looking for submissions after: ${new Date(oneHourAgo).toLocaleString()}`);
    console.log(`🕒 Current time: ${new Date().toLocaleString()}\n`);
    
    const { data: recentCustomers, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .gte('created_at', oneHourAgo)
      .order('created_at', { ascending: false });
    
    if (customerError) {
      console.log('❌ Error fetching recent customers:', customerError.message);
      return;
    }
    
    console.log(`👥 Found ${recentCustomers.length} customers in the last hour:`);
    recentCustomers.forEach((customer, i) => {
      console.log(`${i + 1}. ${customer.name} - ${customer.phone}`);
      console.log(`   Created: ${new Date(customer.created_at).toLocaleString()}`);
      console.log(`   Email: ${customer.email || 'No email'}`);
      console.log(`   SMS would go to: +1${customer.phone} (if US format)`);
    });
    
    // Check test drives for these customers
    console.log(`\n🚴 Test drives for recent customers:`);
    for (const customer of recentCustomers) {
      const { data: drives, error: driveError } = await supabase
        .from('test_drives')
        .select('*')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false });
      
      if (!driveError && drives.length > 0) {
        drives.forEach((drive, i) => {
          console.log(`   Drive ${i + 1}: ${drive.bike_model} - Status: ${drive.status}`);
          console.log(`   Created: ${new Date(drive.created_at).toLocaleString()}`);
        });
      } else {
        console.log(`   ❌ No test drives found for ${customer.name}`);
      }
    }
    
    // Check if SMS was sent (look at recent customer phone numbers)
    console.log(`\n📱 SMS Analysis:`);
    const yourPhoneNumber = '+19142168070';
    const recentWithYourNumber = recentCustomers.filter(c => 
      c.phone.includes('9142168070') || c.phone === '9142168070'
    );
    
    if (recentWithYourNumber.length > 0) {
      console.log(`✅ Found ${recentWithYourNumber.length} recent submission(s) with your phone number`);
      console.log(`📱 SMS should have been sent to: ${yourPhoneNumber}`);
    } else {
      console.log(`❌ No recent submissions found with your phone number (${yourPhoneNumber})`);
      console.log(`💡 The SMS you received might be from our direct API test, not from app submission`);
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

console.log('🔍 LATEST SUBMISSION CHECK');
console.log('='.repeat(40));
checkLatestSubmission();