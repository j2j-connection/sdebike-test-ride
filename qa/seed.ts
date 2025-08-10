import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!url || !key) {
  console.error('Missing Supabase env vars');
  process.exit(1)
}

if (url.includes('mock')) {
  console.log('Mock environment detected; skipping seed.')
  process.exit(0)
}

const supabase = createClient(url, key)

async function main() {
  // Ensure bucket exists
  const { data: buckets } = await supabase.storage.listBuckets()
  const exists = buckets?.some(b => b.name === 'customer-files')
  if (!exists) {
    await supabase.storage.createBucket('customer-files', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/heic', 'image/webp'],
      fileSizeLimit: 15 * 1024 * 1024,
    })
  }

  // Insert sample customers and drives
  const { data: customer } = await supabase.from('customers').insert({
    name: 'Seed User', phone: '+15551112222', waiver_signed: true, submitted_at: new Date().toISOString(),
  }).select('*').single()

  if (customer) {
    await supabase.from('test_drives').insert({
      customer_id: customer.id, bike_model: 'aventon', start_time: new Date().toISOString(), end_time: new Date(Date.now()+10*60*1000).toISOString(), status: 'active'
    })
  }

  console.log('Seed complete')
}

main().catch((e) => { console.error(e); process.exit(1) })