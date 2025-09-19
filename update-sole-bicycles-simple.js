const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function updateInventoryForSole() {
  try {
    console.log('🚲 Updating bike inventory with Sole Bicycles lineup...')

    // Clear existing inventory completely
    const { error: clearError } = await supabase
      .from('bike_inventory')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (clearError) {
      console.error('❌ Error clearing inventory:', clearError)
    } else {
      console.log('🧹 Cleared existing inventory')
    }

    // Add Sole Bicycles inventory (using existing schema without shop_id)
    const bikes = [
      // E-Bikes - Most popular for test rides
      {
        model: 'e-Commuter',
        brand: 'Solé Bicycle Co.',
        description: 'Electric commuter bike - Available in Overthrow, Duke, and Whaler designs. Perfect for daily commuting with electric assist. $1,299',
        is_available: true
      },
      {
        model: 'e(24)',
        brand: 'Solé Bicycle Co.',
        description: 'Premium electric bike - Available in Overthrow, el Tigre, Duke, Whaler, and Ballona designs. High-quality electric riding experience. $1,799',
        is_available: true
      },

      // Single Speed/Fixed Gear - Core Sole lineup
      {
        model: 'The Single Speed / Fixed Gear',
        brand: 'Solé Bicycle Co.',
        description: 'Classic single speed bike - Available in multiple colorways including Overthrow, OFW, and el Tigre. Perfect for city riding. $199-$299',
        is_available: true
      },
      {
        model: 'The Almond Blossom',
        brand: 'Solé Bicycle Co.',
        description: 'Stylish single speed bike with unique almond blossom design. Great for casual rides and daily commuting. $299',
        is_available: true
      },

      // Dutch/Step Through - Comfort focused
      {
        model: 'The Dutch Step Through',
        brand: 'Solé Bicycle Co.',
        description: 'Comfortable step-through bike - Available in Palisades, Harambe, Kinney, Wavecrest, and Pacific designs. Easy to mount and ride. $349',
        is_available: true
      },
      {
        model: 'Three Speed Dutch Step Through',
        brand: 'Solé Bicycle Co.',
        description: 'Step-through bike with 3-speed gearing - Available in Harambe, Palisades, Kinney, and Wavecrest designs. Perfect for varied terrain. $399',
        is_available: true
      },

      // Coastal Cruisers - Beach vibes
      {
        model: 'The Coastal Cruiser',
        brand: 'Solé Bicycle Co.',
        description: 'Classic beach cruiser - Available in Hoover and Nine-O designs. Perfect for leisurely coastal rides. $229.99',
        is_available: true
      },
      {
        model: 'Three Speed City Cruiser',
        brand: 'Solé Bicycle Co.',
        description: 'City cruiser with 3-speed gearing - Available in Windward and Penmar designs. Comfortable for urban exploration. $379',
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

    console.log('✅ Successfully added', bikes.length, 'Sole Bicycles to inventory')

    // Also update the shop in shops table with better description
    const { error: updateShopError } = await supabase
      .from('shops')
      .update({
        description: 'Premium bicycle sales and test rides featuring Solé Bicycle Co. electric bikes, single speeds, cruisers, and step-through models. Experience our curated selection with our convenient digital test ride system.',
        website_url: 'https://www.solebicycles.com'
      })
      .eq('slug', 'sole-bicycles')

    if (updateShopError) {
      console.error('❌ Error updating shop info:', updateShopError)
    } else {
      console.log('✅ Updated shop information')
    }

    console.log('\n🎉 Sole Bicycles is ready!')
    console.log('📱 Test the customer page: http://localhost:3001/shop/sole-bicycles')
    console.log('🔧 Test the admin page: http://localhost:3001/admin/sole-bicycles')

  } catch (error) {
    console.error('❌ Error updating inventory:', error)
  }
}

updateInventoryForSole()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Script failed:', error)
    process.exit(1)
  })