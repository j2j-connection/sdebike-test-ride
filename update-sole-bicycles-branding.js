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

async function updateSoleBicyclesBranding() {
  try {
    console.log('🎨 Updating Sole Bicycles branding...')

    // Update shop with correct teal color (from the image)
    const { error: updateError } = await supabase
      .from('shops')
      .update({
        primary_color: '#7DD3C0', // Teal color from the image
        secondary_color: '#5FB3A1', // Darker teal
        description: 'Premium bicycle sales and test rides featuring Solé Bicycle Co. electric bikes, single speeds, cruisers, and step-through models. Located in Los Angeles, experience our curated selection with our convenient digital test ride system.'
      })
      .eq('slug', 'sole-bicycles')

    if (updateError) {
      console.error('❌ Error updating shop branding:', updateError)
      return
    }

    console.log('✅ Updated Sole Bicycles branding:')
    console.log('   - Primary color: #7DD3C0 (teal)')
    console.log('   - Secondary color: #5FB3A1 (darker teal)')
    console.log('   - Updated description')

    console.log('\n🎉 Branding update complete!')
    console.log('📱 Test locally: http://localhost:3001/shop/sole-bicycles')

  } catch (error) {
    console.error('❌ Error updating branding:', error)
  }
}

updateSoleBicyclesBranding()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Script failed:', error)
    process.exit(1)
  })