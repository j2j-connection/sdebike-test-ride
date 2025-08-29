#!/usr/bin/env node

/**
 * Simple Shop Table Setup
 * Creates just the shops table and SD Electric Bike entry to get the multi-tenant routing working
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

async function setupShopsTable() {
  console.log('🚀 Setting up shops table...')
  
  try {
    // First, check if shops table exists
    const { data: existingShops, error: checkError } = await supabase
      .from('shops')
      .select('id')
      .limit(1)
    
    if (!checkError && existingShops) {
      console.log('✅ Shops table already exists!')
      
      // Check if SD Electric Bike shop exists
      const { data: sdShop } = await supabase
        .from('shops')
        .select('*')
        .eq('slug', 'sd-electric-bike')
        .single()
      
      if (sdShop) {
        console.log('✅ SD Electric Bike shop found:', sdShop.name)
        console.log('🎉 Ready to test multi-tenant routes!')
        return
      }
    }
    
    // Table doesn't exist, let's create it step by step using direct inserts/updates
    console.log('📋 Creating shops table via Supabase client...')
    
    // Try to create a shop directly - this will fail if table doesn't exist
    // but will give us a clearer error message
    const shopData = {
      slug: 'sd-electric-bike',
      name: 'San Diego Electric Bike',
      business_name: 'SD Electric Bike',
      description: 'Premium electric bike test rides and sales in San Diego',
      email: 'info@sdelectricbike.com',
      phone: '(555) 123-4567',
      primary_color: '#3B82F6',
      secondary_color: '#1E40AF',
      default_test_duration_minutes: 30,
      authorization_amount_cents: 100,
      require_id_photo: true,
      require_waiver: true,
      subscription_tier: 'basic',
      subscription_status: 'active',
      is_active: true,
      onboarded_at: new Date().toISOString()
    }
    
    const { data: newShop, error: createError } = await supabase
      .from('shops')
      .insert(shopData)
      .select()
      .single()
    
    if (createError) {
      console.error('❌ Failed to create shop:', createError)
      console.log('')
      console.log('💡 The shops table probably doesn\'t exist yet.')
      console.log('You need to manually create it in your Supabase dashboard:')
      console.log('')
      console.log('1. Go to your Supabase dashboard > SQL Editor')
      console.log('2. Run this SQL:')
      console.log('')
      console.log(`
CREATE TABLE shops (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  business_name VARCHAR(255),
  description TEXT,
  email VARCHAR(255),
  phone VARCHAR(20),
  primary_color VARCHAR(7) DEFAULT '#3B82F6',
  secondary_color VARCHAR(7) DEFAULT '#1E40AF',
  default_test_duration_minutes INTEGER DEFAULT 30,
  authorization_amount_cents INTEGER DEFAULT 100,
  require_id_photo BOOLEAN DEFAULT TRUE,
  require_waiver BOOLEAN DEFAULT TRUE,
  subscription_tier VARCHAR(50) DEFAULT 'basic',
  subscription_status VARCHAR(50) DEFAULT 'active',
  is_active BOOLEAN DEFAULT TRUE,
  onboarded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO shops (slug, name, business_name, description, email, phone, primary_color, secondary_color, is_active, onboarded_at) VALUES
('sd-electric-bike', 'San Diego Electric Bike', 'SD Electric Bike', 'Premium electric bike test rides and sales in San Diego', 'info@sdelectricbike.com', '(555) 123-4567', '#3B82F6', '#1E40AF', TRUE, NOW());
`)
      console.log('')
      console.log('3. Then run this script again')
      process.exit(1)
    }
    
    console.log('✅ Created SD Electric Bike shop:', newShop.name)
    console.log('🎉 Multi-tenant setup complete!')
    
  } catch (error) {
    console.error('❌ Setup failed:', error)
    process.exit(1)
  }
}

// Run the setup
if (require.main === module) {
  setupShopsTable()
}

module.exports = { setupShopsTable }