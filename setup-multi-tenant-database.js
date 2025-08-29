#!/usr/bin/env node

/**
 * Multi-Tenant Database Setup Script
 * 
 * This script migrates the existing single-tenant database to multi-tenant architecture.
 * It creates the new tables and migrates existing data to work with shop context.
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupMultiTenantDatabase() {
  console.log('🚀 Setting up multi-tenant database...')
  
  try {
    // Read the multi-tenant schema
    const schemaPath = path.join(__dirname, 'supabase-schema-multi-tenant.sql')
    const schema = fs.readFileSync(schemaPath, 'utf8')
    
    console.log('📖 Reading multi-tenant schema...')
    
    // Check if we already have shops table (migration already run)
    const { data: existingShops, error: shopsCheckError } = await supabase
      .from('shops')
      .select('id')
      .limit(1)
    
    if (!shopsCheckError && existingShops) {
      console.log('✅ Multi-tenant schema already exists!')
      console.log('🎉 Database is ready for multi-tenant operations')
      return
    }
    
    console.log('📝 Executing multi-tenant schema...')
    
    // Execute the schema in chunks (some PostgreSQL environments have limits)
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    console.log(`📊 Executing ${statements.length} SQL statements...`)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        try {
          console.log(`   Executing statement ${i + 1}/${statements.length}...`)
          const { error } = await supabase.rpc('exec_sql', { sql: statement })
          
          if (error) {
            // Some errors might be expected (like table already exists)
            if (error.message.includes('already exists')) {
              console.log(`   ⚠️  Skipped (already exists): ${statement.substring(0, 50)}...`)
            } else {
              throw error
            }
          }
        } catch (execError) {
          console.error(`❌ Error executing statement ${i + 1}:`, execError.message)
          console.error(`Statement: ${statement.substring(0, 100)}...`)
          
          // Continue with other statements for now
          if (!statement.includes('INSERT') && !statement.includes('CREATE POLICY')) {
            throw execError
          }
        }
      }
    }
    
    // Verify the setup
    console.log('🔍 Verifying multi-tenant setup...')
    
    const { data: shops, error: shopsError } = await supabase
      .from('shops')
      .select('id, slug, name')
      .limit(5)
    
    if (shopsError) {
      throw new Error(`Failed to verify shops table: ${shopsError.message}`)
    }
    
    console.log(`✅ Found ${shops.length} shop(s):`)
    shops.forEach(shop => {
      console.log(`   - ${shop.name} (${shop.slug})`)
    })
    
    // Migrate existing data if any
    console.log('🔄 Checking for existing single-tenant data to migrate...')
    
    const { data: existingCustomers, error: customersError } = await supabase
      .from('customers')
      .select('id, name')
      .is('shop_id', null)
      .limit(5)
    
    if (!customersError && existingCustomers && existingCustomers.length > 0) {
      console.log(`📦 Found ${existingCustomers.length} customers without shop_id`)
      console.log('🔄 Migrating to SD Electric Bike shop...')
      
      const sdShop = shops.find(s => s.slug === 'sd-electric-bike')
      if (sdShop) {
        // Update existing customers to belong to SD Electric Bike
        const { error: updateError } = await supabase
          .from('customers')
          .update({ shop_id: sdShop.id })
          .is('shop_id', null)
        
        if (updateError) {
          console.error('⚠️  Error migrating customers:', updateError.message)
        } else {
          console.log('✅ Migrated existing customers to SD Electric Bike')
        }
      }
    }
    
    console.log('✅ Database connection successful!')
    console.log('🎉 Multi-tenant database setup complete!')
    console.log('')
    console.log('📋 Next steps:')
    console.log('1. Test the shop routes: /shop/sd-electric-bike')
    console.log('2. Test the admin routes: /admin/sd-electric-bike')
    console.log('3. Create additional shops via onboarding flow')
    console.log('')
    console.log('🌐 URLs to test:')
    console.log('   Customer: http://localhost:3000/shop/sd-electric-bike')
    console.log('   Admin:    http://localhost:3000/admin/sd-electric-bike')
    
  } catch (error) {
    console.error('❌ Database setup failed:', error)
    process.exit(1)
  }
}

// Alternative method for environments that don't support rpc('exec_sql')
async function setupMultiTenantDatabaseDirect() {
  console.log('🚀 Setting up multi-tenant database (direct mode)...')
  
  try {
    // Create shops table first
    console.log('📊 Creating shops table...')
    
    const createShopsTable = `
      CREATE TABLE IF NOT EXISTS shops (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        slug VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        business_name VARCHAR(255),
        description TEXT,
        email VARCHAR(255),
        phone VARCHAR(20),
        address JSONB,
        website_url TEXT,
        logo_url TEXT,
        primary_color VARCHAR(7) DEFAULT '#3B82F6',
        secondary_color VARCHAR(7) DEFAULT '#1E40AF',
        custom_css TEXT,
        default_test_duration_minutes INTEGER DEFAULT 30,
        authorization_amount_cents INTEGER DEFAULT 100,
        require_id_photo BOOLEAN DEFAULT TRUE,
        require_waiver BOOLEAN DEFAULT TRUE,
        stripe_account_id VARCHAR(255),
        textbelt_api_key VARCHAR(255),
        twilio_account_sid VARCHAR(255),
        twilio_auth_token VARCHAR(255),
        subscription_tier VARCHAR(50) DEFAULT 'basic',
        subscription_status VARCHAR(50) DEFAULT 'active',
        trial_ends_at TIMESTAMP WITH TIME ZONE,
        is_active BOOLEAN DEFAULT TRUE,
        onboarded_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
    
    const { error: createError } = await supabase.rpc('exec_sql', { sql: createShopsTable })
    if (createError) {
      console.log('⚠️  Shops table might already exist, continuing...')
    }
    
    // Insert SD Electric Bike shop
    console.log('🏪 Setting up SD Electric Bike shop...')
    
    const { data: existingShop } = await supabase
      .from('shops')
      .select('id')
      .eq('slug', 'sd-electric-bike')
      .single()
    
    if (!existingShop) {
      const { error: insertError } = await supabase
        .from('shops')
        .insert({
          slug: 'sd-electric-bike',
          name: 'San Diego Electric Bike',
          business_name: 'SD Electric Bike',
          description: 'Premium electric bike test rides and sales in San Diego',
          email: 'info@sdelectricbike.com',
          phone: '(555) 123-4567',
          primary_color: '#3B82F6',
          secondary_color: '#1E40AF',
          is_active: true,
          onboarded_at: new Date().toISOString()
        })
      
      if (insertError) {
        throw new Error(`Failed to create SD Electric Bike shop: ${insertError.message}`)
      }
      
      console.log('✅ Created SD Electric Bike shop')
    } else {
      console.log('✅ SD Electric Bike shop already exists')
    }
    
    console.log('🎉 Basic multi-tenant setup complete!')
    console.log('ℹ️  Run the full schema manually if you need all features')
    
  } catch (error) {
    console.error('❌ Setup failed:', error)
    process.exit(1)
  }
}

// Run the setup
if (require.main === module) {
  setupMultiTenantDatabase().catch(error => {
    console.log('🔄 Trying alternative setup method...')
    setupMultiTenantDatabaseDirect().catch(altError => {
      console.error('❌ All setup methods failed')
      console.error('Original error:', error)
      console.error('Alternative error:', altError)
      process.exit(1)
    })
  })
}

module.exports = { setupMultiTenantDatabase, setupMultiTenantDatabaseDirect }