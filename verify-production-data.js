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

async function verifyProductionData() {
  try {
    console.log('🔍 Verifying production data...')

    // Check shops
    console.log('\n🏪 Shops in database:')
    const { data: shops, error: shopsError } = await supabase
      .from('shops')
      .select('slug, name, primary_color, is_active')

    if (shopsError) {
      console.error('❌ Error fetching shops:', shopsError)
    } else {
      shops.forEach(shop => {
        console.log(`   - ${shop.name} (${shop.slug}) - ${shop.primary_color} - Active: ${shop.is_active}`)
      })
    }

    // Check bike inventory
    console.log('\n🚲 Bike inventory:')
    const { data: bikes, error: bikesError } = await supabase
      .from('bike_inventory')
      .select('brand, model, is_available')
      .order('brand, model')

    if (bikesError) {
      console.error('❌ Error fetching bikes:', bikesError)
    } else {
      console.log(`   Found ${bikes.length} bikes:`)
      bikes.forEach(bike => {
        console.log(`   - ${bike.brand} ${bike.model} (Available: ${bike.is_available})`)
      })
    }

    // Specific check for Sole Bicycles
    console.log('\n🎯 Sole Bicycles specific check:')
    const { data: soleShop, error: soleError } = await supabase
      .from('shops')
      .select('*')
      .eq('slug', 'sole-bicycles')
      .single()

    if (soleError) {
      console.error('❌ Sole Bicycles shop not found:', soleError)
    } else {
      console.log('✅ Sole Bicycles shop found:')
      console.log(`   Name: ${soleShop.name}`)
      console.log(`   Primary Color: ${soleShop.primary_color}`)
      console.log(`   Description: ${soleShop.description}`)
      console.log(`   Active: ${soleShop.is_active}`)
    }

  } catch (error) {
    console.error('❌ Error verifying data:', error)
  }
}

verifyProductionData()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Verification failed:', error)
    process.exit(1)
  })