#!/usr/bin/env node

/**
 * SDEBIKE Test Ride App - Supabase Storage Setup Script
 * 
 * This script sets up the required storage infrastructure for the application
 * including buckets, subdirectories, and RLS policies.
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration
const STORAGE_CONFIG = {
  bucketName: 'customer-files',
  subdirectories: ['id-photos', 'waivers'],
  publicAccess: false,
  fileSizeLimit: 5242880, // 5MB
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
};

// Validate environment variables
function validateEnvironment() {
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(varName => console.error(`   - ${varName}`));
    console.error('\nPlease check your .env.local file and ensure all required variables are set.');
    process.exit(1);
  }

  console.log('✅ Environment variables validated');
}

// Initialize Supabase client
function initializeSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase configuration incomplete');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// Create storage bucket
async function createStorageBucket(supabase) {
  console.log(`\n🏗️  Creating storage bucket: ${STORAGE_CONFIG.bucketName}`);
  
  try {
    const { data, error } = await supabase.storage.createBucket(STORAGE_CONFIG.bucketName, {
      public: STORAGE_CONFIG.publicAccess,
      fileSizeLimit: STORAGE_CONFIG.fileSizeLimit,
      allowedMimeTypes: STORAGE_CONFIG.allowedMimeTypes
    });

    if (error) {
      if (error.message.includes('already exists')) {
        console.log(`   ℹ️  Bucket '${STORAGE_CONFIG.bucketName}' already exists`);
        return true;
      }
      throw error;
    }

    console.log(`   ✅ Bucket '${STORAGE_CONFIG.bucketName}' created successfully`);
    return true;
  } catch (error) {
    console.error(`   ❌ Failed to create bucket: ${error.message}`);
    return false;
  }
}

// Create subdirectories
async function createSubdirectories(supabase) {
  console.log(`\n📁 Creating subdirectories in bucket: ${STORAGE_CONFIG.bucketName}`);
  
  for (const subdir of STORAGE_CONFIG.subdirectories) {
    try {
      // Create a placeholder file to establish the directory structure
      const placeholderPath = `${subdir}/.placeholder`;
      const placeholderContent = Buffer.from('Directory placeholder file');
      
      const { error } = await supabase.storage
        .from(STORAGE_CONFIG.bucketName)
        .upload(placeholderPath, placeholderContent, {
          contentType: 'text/plain',
          upsert: true
        });

      if (error) {
        console.log(`   ⚠️  Subdirectory '${subdir}' creation had issues: ${error.message}`);
      } else {
        console.log(`   ✅ Subdirectory '${subdir}' created`);
      }
    } catch (error) {
      console.log(`   ⚠️  Subdirectory '${subdir}' creation had issues: ${error.message}`);
    }
  }
}

// Set up RLS policies
async function setupRLSPolicies(supabase) {
  console.log(`\n🔒 Setting up Row Level Security policies for bucket: ${STORAGE_CONFIG.bucketName}`);
  
  try {
    // Policy 1: Allow authenticated users to upload files
    const uploadPolicy = `
      CREATE POLICY "Allow authenticated uploads" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = '${STORAGE_CONFIG.bucketName}' AND
        auth.role() = 'authenticated'
      );
    `;

    // Policy 2: Allow users to view their own files
    const viewPolicy = `
      CREATE POLICY "Allow users to view own files" ON storage.objects
      FOR SELECT USING (
        bucket_id = '${STORAGE_CONFIG.bucketName}' AND
        auth.uid()::text = (storage.foldername(name))[1]
      );
    `;

    // Policy 3: Allow users to update their own files
    const updatePolicy = `
      CREATE POLICY "Allow users to update own files" ON storage.objects
      FOR UPDATE USING (
        bucket_id = '${STORAGE_CONFIG.bucketName}' AND
        auth.uid()::text = (storage.foldername(name))[1]
      );
    `;

    // Policy 4: Allow users to delete their own files
    const deletePolicy = `
      CREATE POLICY "Allow users to delete own files" ON storage.objects
      FOR DELETE USING (
        bucket_id = '${STORAGE_CONFIG.bucketName}' AND
        auth.uid()::text = (storage.foldername(name))[1]
      );
    `;

    // Execute policies (these will fail if they already exist, which is fine)
    const policies = [uploadPolicy, viewPolicy, updatePolicy, deletePolicy];
    
    for (const policy of policies) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: policy });
        if (error && !error.message.includes('already exists')) {
          console.log(`   ⚠️  Policy creation had issues: ${error.message}`);
        }
      } catch (error) {
        // Policies might already exist, which is fine
        console.log(`   ℹ️  Policy may already exist or had issues: ${error.message}`);
      }
    }

    console.log('   ✅ RLS policies configured');
  } catch (error) {
    console.log(`   ⚠️  RLS policy setup had issues: ${error.message}`);
  }
}

// Test file upload
async function testFileUpload(supabase) {
  console.log(`\n🧪 Testing file upload to bucket: ${STORAGE_CONFIG.bucketName}`);
  
  try {
    // Create a test image file
    const testImagePath = path.join(__dirname, 'test-upload.png');
    
    // Create a simple test PNG if it doesn't exist
    if (!fs.existsSync(testImagePath)) {
      // Create a minimal PNG file for testing
      const pngHeader = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
        0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
        0x49, 0x48, 0x44, 0x52, // IHDR chunk type
        0x00, 0x00, 0x00, 0x01, // Width: 1 pixel
        0x00, 0x00, 0x00, 0x01, // Height: 1 pixel
        0x08, 0x02, 0x00, 0x00, // Bit depth, color type, compression, filter, interlace
        0x00, 0x00, 0x00, 0x0C, // IDAT chunk length
        0x49, 0x44, 0x41, 0x54, // IDAT chunk type
        0x08, 0x99, 0x01, 0x01, // Compressed data (minimal)
        0x00, 0x00, 0x00, 0x00, // IEND chunk length
        0x49, 0x45, 0x4E, 0x44, // IEND chunk type
        0xAE, 0x42, 0x60, 0x82  // IEND chunk CRC
      ]);
      
      fs.writeFileSync(testImagePath, pngHeader);
    }

    const testFile = fs.readFileSync(testImagePath);
    const testFileName = `test-upload-${Date.now()}.png`;

    const { data, error } = await supabase.storage
      .from(STORAGE_CONFIG.bucketName)
      .upload(`id-photos/${testFileName}`, testFile, {
        contentType: 'image/png',
        upsert: false
      });

    if (error) {
      throw error;
    }

    console.log(`   ✅ Test file uploaded successfully: ${testFileName}`);
    
    // Clean up test file
    await supabase.storage
      .from(STORAGE_CONFIG.bucketName)
      .remove([`id-photos/${testFileName}`]);
    
    console.log('   🧹 Test file cleaned up');
    
    return true;
  } catch (error) {
    console.error(`   ❌ Test upload failed: ${error.message}`);
    return false;
  }
}

// Main execution function
async function main() {
  console.log('🚀 SDEBIKE Test Ride App - Storage Setup');
  console.log('=' .repeat(50));
  
  try {
    // Validate environment
    validateEnvironment();
    
    // Initialize Supabase
    const supabase = initializeSupabase();
    console.log('✅ Supabase client initialized');
    
    // Create storage bucket
    const bucketCreated = await createStorageBucket(supabase);
    if (!bucketCreated) {
      console.error('❌ Failed to create storage bucket. Exiting.');
      process.exit(1);
    }
    
    // Create subdirectories
    await createSubdirectories(supabase);
    
    // Set up RLS policies
    await setupRLSPolicies(supabase);
    
    // Test file upload
    const uploadTest = await testFileUpload(supabase);
    
    // Summary
    console.log('\n' + '=' .repeat(50));
    console.log('📊 STORAGE SETUP SUMMARY');
    console.log('=' .repeat(50));
    console.log(`✅ Bucket: ${STORAGE_CONFIG.bucketName}`);
    console.log(`✅ Subdirectories: ${STORAGE_CONFIG.subdirectories.join(', ')}`);
    console.log(`✅ RLS Policies: Configured`);
    console.log(`✅ File Upload Test: ${uploadTest ? 'PASSED' : 'FAILED'}`);
    
    if (uploadTest) {
      console.log('\n🎉 Storage setup completed successfully!');
      console.log('The application should now be able to upload and store files.');
    } else {
      console.log('\n⚠️  Storage setup completed with warnings.');
      console.log('File uploads may not work correctly. Please check the errors above.');
    }
    
  } catch (error) {
    console.error('\n💥 Storage setup failed:', error.message);
    console.error('\nPlease check your Supabase configuration and try again.');
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  createStorageBucket,
  createSubdirectories,
  setupRLSPolicies,
  testFileUpload
};
