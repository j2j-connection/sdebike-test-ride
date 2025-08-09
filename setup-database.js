#!/usr/bin/env node

// Database setup script for Supabase
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupDatabase() {
  console.log('🚀 Setting up San Diego Electric Bike database...')
  
  try {
    // Test connection
    const { data, error } = await supabase.from('customers').select('count').limit(1)
    
    if (error && error.code === '42P01') {
      console.log('📋 Tables not found. You need to run the SQL schema in your Supabase dashboard.')
      console.log('\n📝 Please run this SQL in your Supabase SQL Editor:')
      console.log('---')
      
      const schemaPath = path.join(process.cwd(), 'supabase-schema.sql')
      if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf8')
        console.log(schema)
      } else {
        console.log('Schema file not found at supabase-schema.sql')
      }
      
      console.log('---')
      console.log('\n🔗 Go to: ' + supabaseUrl.replace('https://', 'https://supabase.com/dashboard/project/') + '/sql')
      
      return
    } else if (error) {
      throw error
    }
    
    // Test storage bucket
    const { data: buckets } = await supabase.storage.listBuckets()
    const customerFilesBucket = buckets?.find(b => b.name === 'customer-files')
    
    if (!customerFilesBucket) {
      console.log('📁 Creating customer-files storage bucket...')
      const { error: bucketError } = await supabase.storage.createBucket('customer-files', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        fileSizeLimit: 10485760 // 10MB
      })
      
      if (bucketError) {
        console.error('❌ Error creating bucket:', bucketError)
      } else {
        console.log('✅ Created customer-files bucket')
      }
    }
    
    console.log('✅ Database connection successful!')
    console.log('🎉 Your San Diego Electric Bike app is ready!')
    console.log('\n🌐 Open http://localhost:3000 to test the app')
    
  } catch (error) {
    console.error('❌ Error setting up database:', error)
    process.exit(1)
  }
}

setupDatabase()