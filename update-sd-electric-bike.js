#!/usr/bin/env node

/**
 * Update SD Electric Bike with real business information
 */

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function updateSDElectricBike() {
  console.log('🔄 Updating SD Electric Bike with real business information...')
  
  try {
    const updates = {
      email: 'sdebike@gmail.com',
      phone: '(858) 345-1030',
      description: 'Premium electric bike sales and test rides in Solana Beach. Located at 101 S. Hwy 101, Solana Beach, CA 92075. Experience the latest e-bikes with our convenient digital test ride system.',
      updated_at: new Date().toISOString()
    }
    
    const { data, error } = await supabase
      .from('shops')
      .update(updates)
      .eq('slug', 'sd-electric-bike')
      .select()
      .single()
    
    if (error) {
      console.error('❌ Failed to update SD Electric Bike:', error)
      process.exit(1)
    }
    
    console.log('✅ Successfully updated SD Electric Bike!')
    console.log('📍 Address: 101 S. Hwy 101, Solana Beach, CA 92075')
    console.log('📞 Phone:', updates.phone)
    console.log('📧 Email:', updates.email)
    console.log('')
    console.log('🌐 Test the updated shop:')
    console.log('   Customer: http://localhost:3000/shop/sd-electric-bike')
    console.log('   Admin:    http://localhost:3000/admin/sd-electric-bike')
    
  } catch (error) {
    console.error('❌ Update failed:', error)
    process.exit(1)
  }
}

// Run the update
if (require.main === module) {
  updateSDElectricBike()
}

module.exports = { updateSDElectricBike }