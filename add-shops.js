require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const shops = [
  {
    slug: 'sd-electric-bike',
    name: 'San Diego Electric Bike',
    primary_color: '#3B82F6',
    secondary_color: '#1E40AF',
    is_active: true
  },
  {
    slug: 'sole-bicycles',
    name: 'Sole Bicycles',
    primary_color: '#4A9B8E',
    secondary_color: '#3A8B7D',
    is_active: true
  },
  {
    slug: 'flye',
    name: 'Flye',
    primary_color: '#22C55E',
    secondary_color: '#16A34A',
    is_active: true
  }
];

async function addShops() {
  console.log('🏪 Adding shops to database...\n');

  // First, check what columns exist
  const { data: sample } = await supabase
    .from('shops')
    .select('*')
    .limit(1);

  if (sample && sample.length > 0) {
    console.log('📋 Available columns:', Object.keys(sample[0]));
  }

  // Check existing shops
  const { data: existing } = await supabase
    .from('shops')
    .select('slug');

  const existingSlugs = existing ? existing.map(s => s.slug) : [];
  console.log('📋 Existing shops:', existingSlugs);

  // Insert or update each shop
  for (const shop of shops) {
    if (existingSlugs.includes(shop.slug)) {
      console.log(`\n🔄 Updating ${shop.slug}...`);
      const { error } = await supabase
        .from('shops')
        .update(shop)
        .eq('slug', shop.slug);

      if (error) {
        console.error(`❌ Error updating ${shop.slug}:`, error.message);
      } else {
        console.log(`✅ Updated ${shop.slug}`);
      }
    } else {
      console.log(`\n➕ Adding ${shop.slug}...`);
      const { error } = await supabase
        .from('shops')
        .insert(shop);

      if (error) {
        console.error(`❌ Error adding ${shop.slug}:`, error.message);
      } else {
        console.log(`✅ Added ${shop.slug}`);
      }
    }
  }

  // Verify final state
  console.log('\n📊 Final shop list:');
  const { data: final } = await supabase
    .from('shops')
    .select('slug, name, primary_color')
    .order('created_at');

  console.table(final);
}

addShops();
