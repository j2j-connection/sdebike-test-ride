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

async function deploySoleBicyclesToProduction() {
  try {
    console.log('🚀 Deploying Sole Bicycles to production database...')

    // Step 1: Check if Sole Bicycles shop exists
    console.log('🔍 Checking if Sole Bicycles shop exists...')
    const { data: existingShop, error: checkError } = await supabase
      .from('shops')
      .select('id, slug')
      .eq('slug', 'sole-bicycles')
      .single()

    let shopId
    if (checkError && checkError.code === 'PGRST116') {
      // Shop doesn't exist, create it
      console.log('🏪 Creating Sole Bicycles shop...')
      const { data: newShop, error: createError } = await supabase
        .from('shops')
        .insert({
          slug: 'sole-bicycles',
          name: 'Sole Bicycles',
          business_name: 'Sole Bicycles LLC',
          description: 'Premium bicycle sales and test rides featuring Solé Bicycle Co. electric bikes, single speeds, cruisers, and step-through models. Located in Los Angeles, experience our curated selection with our convenient digital test ride system.',
          email: 'info@solebicycles.com',
          phone: '(555) 999-BIKE',
          primary_color: '#7DD3C0', // Teal color
          secondary_color: '#5FB3A1', // Darker teal
          default_test_duration_minutes: 30,
          authorization_amount_cents: 100,
          require_id_photo: true,
          require_waiver: true,
          subscription_tier: 'basic',
          subscription_status: 'active',
          is_active: true,
          onboarded_at: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) {
        console.error('❌ Error creating shop:', createError)
        return
      }

      shopId = newShop.id
      console.log('✅ Created Sole Bicycles shop:', shopId)
    } else if (existingShop) {
      shopId = existingShop.id
      console.log('✅ Found existing Sole Bicycles shop:', shopId)

      // Update branding
      const { error: updateError } = await supabase
        .from('shops')
        .update({
          primary_color: '#7DD3C0',
          secondary_color: '#5FB3A1',
          description: 'Premium bicycle sales and test rides featuring Solé Bicycle Co. electric bikes, single speeds, cruisers, and step-through models. Located in Los Angeles, experience our curated selection with our convenient digital test ride system.'
        })
        .eq('id', shopId)

      if (updateError) {
        console.error('⚠️  Error updating shop branding:', updateError)
      } else {
        console.log('✅ Updated shop branding')
      }
    }

    // Step 2: Update bike inventory (replace all existing with Sole Bicycles lineup)
    console.log('🚲 Updating bike inventory with Sole Bicycles lineup...')

    // Clear existing inventory
    const { error: clearError } = await supabase
      .from('bike_inventory')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (clearError) {
      console.log('⚠️  Note: Could not clear existing inventory:', clearError.message)
    } else {
      console.log('🧹 Cleared existing inventory')
    }

    // Add Sole Bicycles inventory
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

    console.log('✅ Successfully added', bikes.length, 'Sole Bicycles to production inventory')

    console.log('\n🎉 Sole Bicycles deployment to production complete!')
    console.log('🌐 Production URLs:')
    console.log('   Customer: https://testr.j2j.info/shop/sole-bicycles')
    console.log('   Admin:    https://testr.j2j.info/admin/sole-bicycles')
    console.log('')
    console.log('🔄 Note: May take a few minutes for changes to appear due to caching')

  } catch (error) {
    console.error('❌ Error deploying to production:', error)
  }
}

deploySoleBicyclesToProduction()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Production deployment failed:', error)
    process.exit(1)
  })