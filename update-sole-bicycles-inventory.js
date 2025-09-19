const { createClient } = require('@supabase/supabase-js')
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

async function updateSoleBicyclesInventory() {
  try {
    console.log('🚲 Updating Sole Bicycles inventory with real bikes...')

    // Get Sole Bicycles shop ID
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('id')
      .eq('slug', 'sole-bicycles')
      .single()

    if (shopError || !shop) {
      console.error('❌ Could not find Sole Bicycles shop:', shopError)
      return
    }

    console.log('✅ Found Sole Bicycles shop:', shop.id)

    // Clear existing inventory
    const { error: clearError } = await supabase
      .from('bike_inventory')
      .delete()
      .eq('shop_id', shop.id)

    if (clearError) {
      console.error('❌ Error clearing inventory:', clearError)
      return
    }

    console.log('🧹 Cleared existing inventory')

    // Add real Sole Bicycles inventory
    const bikes = [
      // E-Bikes - Popular models for test rides
      {
        shop_id: shop.id,
        model: 'e-Commuter',
        brand: 'Solé Bicycle Co.',
        description: 'Electric commuter bike - Available in Overthrow, Duke, and Whaler designs. Perfect for daily commuting with electric assist.',
        is_available: true
      },
      {
        shop_id: shop.id,
        model: 'e(24)',
        brand: 'Solé Bicycle Co.',
        description: 'Premium electric bike - Available in Overthrow, el Tigre, Duke, Whaler, and Ballona designs. High-quality electric riding experience.',
        is_available: true
      },

      // Popular Single Speed/Fixed Gear
      {
        shop_id: shop.id,
        model: 'The Single Speed / Fixed Gear',
        brand: 'Solé Bicycle Co.',
        description: 'Classic single speed bike - Available in multiple colorways including Overthrow, OFW, and el Tigre. Perfect for city riding.',
        is_available: true
      },
      {
        shop_id: shop.id,
        model: 'The Almond Blossom',
        brand: 'Solé Bicycle Co.',
        description: 'Stylish single speed bike with unique almond blossom design. Great for casual rides and daily commuting.',
        is_available: true
      },

      // Dutch/Step Through - Comfort bikes
      {
        shop_id: shop.id,
        model: 'The Dutch Step Through',
        brand: 'Solé Bicycle Co.',
        description: 'Comfortable step-through bike - Available in Palisades, Harambe, Kinney, Wavecrest, and Pacific designs. Easy to mount and ride.',
        is_available: true
      },
      {
        shop_id: shop.id,
        model: 'Three Speed Dutch Step Through',
        brand: 'Solé Bicycle Co.',
        description: 'Step-through bike with 3-speed gearing - Available in Harambe, Palisades, Kinney, and Wavecrest designs. Perfect for varied terrain.',
        is_available: true
      },

      // Coastal Cruisers - Relaxed riding
      {
        shop_id: shop.id,
        model: 'The Coastal Cruiser',
        brand: 'Solé Bicycle Co.',
        description: 'Classic beach cruiser - Available in Hoover and Nine-O designs. Perfect for leisurely coastal rides.',
        is_available: true
      },
      {
        shop_id: shop.id,
        model: 'Three Speed City Cruiser',
        brand: 'Solé Bicycle Co.',
        description: 'City cruiser with 3-speed gearing - Available in Windward and Penmar designs. Comfortable for urban exploration.',
        is_available: true
      }
    ]

    const { error: insertError } = await supabase
      .from('bike_inventory')
      .insert(bikes)

    if (insertError) {
      console.error('❌ Error adding bikes:', insertError)
      return
    }

    console.log('✅ Successfully added', bikes.length, 'bikes to inventory')
    console.log('\n🎉 Sole Bicycles inventory updated!')
    console.log('📱 Customer URL: http://localhost:3001/shop/sole-bicycles')
    console.log('🔧 Admin URL: http://localhost:3001/admin/sole-bicycles')

  } catch (error) {
    console.error('❌ Error updating inventory:', error)
  }
}

// Run the function
updateSoleBicyclesInventory()
  .then(() => {
    console.log('✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })