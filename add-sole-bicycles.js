const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function addSoleBicycles() {
  try {
    console.log('🏪 Adding Sole Bicycles shop...')

    // First check if the shop already exists
    const { data: existingShop } = await supabase
      .from('shops')
      .select('id, slug')
      .eq('slug', 'sole-bicycles')
      .single()

    if (existingShop) {
      console.log('✅ Sole Bicycles shop already exists:', existingShop.id)
      return existingShop
    }

    // Insert Sole Bicycles shop
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .insert({
        slug: 'sole-bicycles',
        name: 'Sole Bicycles',
        business_name: 'Sole Bicycles LLC',
        description: 'Premium bicycle sales and test rides. Experience our curated selection of high-quality bikes with our convenient digital test ride system.',
        email: 'info@solebicycles.com',
        phone: '(555) 999-BIKE',
        primary_color: '#059669', // Green theme
        secondary_color: '#047857', // Darker green
        default_test_duration_minutes: 30,
        authorization_amount_cents: 100, // $1.00 authorization
        require_id_photo: true,
        require_waiver: true,
        subscription_tier: 'basic',
        subscription_status: 'active',
        is_active: true,
        onboarded_at: new Date().toISOString()
      })
      .select()
      .single()

    if (shopError) {
      console.error('❌ Error creating shop:', shopError)
      return null
    }

    console.log('✅ Successfully created Sole Bicycles shop:', shop.id)

    // Add default bike inventory for Sole Bicycles
    console.log('🚲 Adding bike inventory...')
    const { error: inventoryError } = await supabase
      .from('bike_inventory')
      .insert([
        {
          shop_id: shop.id,
          model: 'Giant Escape 3',
          brand: 'Giant',
          description: 'A versatile hybrid bike perfect for commuting and recreational riding.',
          is_available: true
        },
        {
          shop_id: shop.id,
          model: 'Trek FX 3',
          brand: 'Trek',
          description: 'Light, fast, and capable fitness bike for daily rides.',
          is_available: true
        },
        {
          shop_id: shop.id,
          model: 'Cannondale Quick 4',
          brand: 'Cannondale',
          description: 'Smooth-riding fitness bike built for speed and comfort.',
          is_available: true
        },
        {
          shop_id: shop.id,
          model: 'Specialized Sirrus 3.0',
          brand: 'Specialized',
          description: 'The perfect bike for fitness-minded riders who want to go fast.',
          is_available: true
        }
      ])

    if (inventoryError) {
      console.error('❌ Error adding bike inventory:', inventoryError)
    } else {
      console.log('✅ Successfully added bike inventory')
    }

    // Add shop admin user
    console.log('👤 Adding shop admin...')
    const { error: adminError } = await supabase
      .from('shop_admins')
      .insert({
        shop_id: shop.id,
        email: 'admin@solebicycles.com',
        full_name: 'Sole Bicycles Admin',
        role: 'owner',
        is_active: true
      })

    if (adminError) {
      console.error('❌ Error adding shop admin:', adminError)
    } else {
      console.log('✅ Successfully added shop admin')
    }

    console.log('\n🎉 Sole Bicycles setup complete!')
    console.log('📱 Customer URL: https://your-domain.com/shop/sole-bicycles')
    console.log('🔧 Admin URL: https://your-domain.com/admin/sole-bicycles')

    return shop

  } catch (error) {
    console.error('❌ Error in addSoleBicycles:', error)
    return null
  }
}

// Run the function
addSoleBicycles()
  .then(() => {
    console.log('✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })