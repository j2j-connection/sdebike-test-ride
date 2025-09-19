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

async function updateSoleLogo() {
  try {
    console.log('🖼️  Updating Sole Bicycles logo...')

    // Update shop with logo URL
    const { error: updateError } = await supabase
      .from('shops')
      .update({
        logo_url: '/sole-bicycles-logo.svg'
      })
      .eq('slug', 'sole-bicycles')

    if (updateError) {
      console.error('❌ Error updating logo:', updateError)
      return
    }

    console.log('✅ Updated Sole Bicycles logo URL: /sole-bicycles-logo.svg')
    console.log('📱 Test locally: http://localhost:3001/shop/sole-bicycles')

  } catch (error) {
    console.error('❌ Error updating logo:', error)
  }
}

updateSoleLogo()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Script failed:', error)
    process.exit(1)
  })