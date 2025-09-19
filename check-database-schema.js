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

async function checkSchema() {
  try {
    console.log('🔍 Checking current database schema...')

    // Check existing tables
    const tables = ['shops', 'bike_inventory', 'customers', 'test_drives']

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)

        if (error) {
          console.log(`❌ Table '${table}' does not exist:`, error.message)
        } else {
          console.log(`✅ Table '${table}' exists`)
          if (data && data.length > 0) {
            console.log(`   - Sample columns:`, Object.keys(data[0]))
          }
        }
      } catch (e) {
        console.log(`❌ Error checking table '${table}':`, e.message)
      }
    }

    // Try to add shop_id column to bike_inventory if it doesn't exist
    console.log('\n🔧 Attempting to add shop_id column to bike_inventory...')

    try {
      const { error } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE bike_inventory ADD COLUMN shop_id UUID REFERENCES shops(id) ON DELETE CASCADE;'
      })

      if (error) {
        if (error.message.includes('already exists')) {
          console.log('✅ shop_id column already exists')
        } else {
          console.log('❌ Could not add shop_id column:', error.message)
        }
      } else {
        console.log('✅ Added shop_id column to bike_inventory')
      }
    } catch (e) {
      console.log('❌ Error adding shop_id column:', e.message)
    }

  } catch (error) {
    console.error('❌ Error checking schema:', error)
  }
}

checkSchema()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Script failed:', error)
    process.exit(1)
  })