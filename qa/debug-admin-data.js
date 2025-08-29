/**
 * Debug Admin Dashboard Data
 * Check what data exists in the database vs what's showing in admin
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function debugAdminData() {
  console.log('🔍 Debugging Admin Dashboard Data...\n');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Supabase credentials not found in .env.local');
    return;
  }
  
  console.log('✅ Supabase credentials found');
  console.log(`📡 URL: ${supabaseUrl}`);
  console.log(`🔑 Key: ${supabaseKey.substring(0, 20)}...`);
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Check customers table
    console.log('\n👥 CUSTOMERS TABLE:');
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (customerError) {
      console.log('❌ Error fetching customers:', customerError.message);
    } else {
      console.log(`📊 Found ${customers.length} customers`);
      customers.forEach((customer, i) => {
        console.log(`${i + 1}. ${customer.name} - ${customer.phone} - ${customer.email || 'No email'}`);
        console.log(`   Created: ${new Date(customer.created_at).toLocaleString()}`);
        console.log(`   Waiver signed: ${customer.waiver_signed ? '✅' : '❌'}`);
        console.log(`   Has photo: ${customer.id_photo_url ? '✅' : '❌'}`);
        console.log(`   Has signature: ${customer.signature_data ? '✅' : '❌'}`);
      });
    }
    
    // Check test drives table
    console.log('\n🚴 TEST DRIVES TABLE:');
    const { data: testDrives, error: driveError } = await supabase
      .from('test_drives')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (driveError) {
      console.log('❌ Error fetching test drives:', driveError.message);
    } else {
      console.log(`📊 Found ${testDrives.length} test drives`);
      testDrives.forEach((drive, i) => {
        console.log(`${i + 1}. Customer ID: ${drive.customer_id}`);
        console.log(`   Bike: ${drive.bike_model}`);
        console.log(`   Status: ${drive.status}`);
        console.log(`   Start: ${drive.start_time ? new Date(drive.start_time).toLocaleString() : 'Not set'}`);
        console.log(`   Created: ${new Date(drive.created_at).toLocaleString()}`);
      });
    }
    
    // Check the combined view that admin dashboard uses
    console.log('\n🔗 COMBINED VIEW (What admin should show):');
    const { data: combined, error: combinedError } = await supabase
      .from('test_drives')
      .select(`
        *,
        customers (*)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    
    if (combinedError) {
      console.log('❌ Error fetching combined view:', combinedError.message);
    } else {
      console.log(`📊 Found ${combined.length} active test drives with customer data`);
      
      if (combined.length === 0) {
        console.log('\n⚠️ NO ACTIVE TEST DRIVES FOUND!');
        console.log('💡 This explains why admin dashboard is empty');
        console.log('💡 Possible reasons:');
        console.log('   - Test rides have status other than "active"');
        console.log('   - Customer data not properly linked');
        console.log('   - Test drive creation failed');
        
        // Let's check all test drives regardless of status
        const { data: allDrives, error: allError } = await supabase
          .from('test_drives')
          .select(`
            *,
            customers (*)
          `)
          .order('created_at', { ascending: false });
        
        if (!allError && allDrives.length > 0) {
          console.log(`\n🔍 Found ${allDrives.length} test drives (all statuses):`);
          allDrives.forEach((drive, i) => {
            console.log(`${i + 1}. Status: ${drive.status}, Customer: ${drive.customers?.name || 'NO CUSTOMER DATA'}`);
          });
        }
        
      } else {
        combined.forEach((drive, i) => {
          console.log(`${i + 1}. ${drive.customers.name} - ${drive.customers.phone}`);
          console.log(`   Bike: ${drive.bike_model}`);
          console.log(`   Status: ${drive.status}`);
        });
      }
    }
    
    console.log('\n🎯 DIAGNOSIS:');
    if (customers.length === 0 && testDrives.length === 0) {
      console.log('❌ No data found - the test ride submission may have failed');
      console.log('💡 Check browser console for errors during submission');
    } else if (customers.length > 0 && testDrives.length === 0) {
      console.log('⚠️ Customers exist but no test drives - submission partially failed');
      console.log('💡 Check test drive creation logic');
    } else if (combined.length === 0) {
      console.log('⚠️ Data exists but not showing as "active" status');
      console.log('💡 Check test drive status field');
    } else {
      console.log('✅ Data looks good - admin dashboard should be showing content');
      console.log('💡 Try refreshing the admin page');
    }
    
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
  }
}

console.log('🔍 ADMIN DASHBOARD DEBUG');
console.log('='.repeat(40));
debugAdminData();