const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const sdElectricBikes = [
  {
    model: 'Pace 500.3 Step-Through Ebike',
    brand: 'Aventon',
    description: 'Powerful, easy-to-use cruiser ebike with 500W motor, top speed 28 mph, up to 60 miles range',
    is_available: true
  },
  {
    model: 'Level.2 Commuter Electric Bike',
    brand: 'Aventon',
    description: 'Commuter ebike with torque sensor featuring integrated battery and front suspension',
    is_available: true
  },
  {
    model: 'Sinch.2 Step-Through Foldable',
    brand: 'Aventon',
    description: 'Urban commuting bike with 500W motor, step-through frame for easy mounting',
    is_available: true
  },
  {
    model: 'Radster Trail',
    brand: 'Rad Power Bikes',
    description: 'Off-road electric bike with 750W motor, 28 mph top speed, up to 65 miles range',
    is_available: true
  },
  {
    model: 'Ultra Urban',
    brand: 'Zooz',
    description: 'Performance ebike with patented Chromoly steel frame and 750W motor',
    is_available: true
  },
  {
    model: '46er 10D Evo 1 Performance CX Easy On Ebike',
    brand: 'Benno',
    description: 'Cargo bike with Bosch motor, front suspension, versatile design for hauling',
    is_available: true
  },
  {
    model: 'Transend E+ LDS',
    brand: 'Momentum',
    description: 'Commuter ebike with SyncDrive motor, integrated battery for daily rides',
    is_available: true
  },
  {
    model: 'RadKick Belt Drive',
    brand: 'Rad Power Bikes',
    description: 'Lightweight electric bike with single-speed design, 350W motor for efficiency',
    is_available: true
  },
  {
    model: 'RadExpand 5',
    brand: 'Rad Power Bikes',
    description: 'Folding ebike with 750W motor, up to 45+ miles range, perfect for storage',
    is_available: true
  },
  {
    model: 'Ultra Ripster Jet Black',
    brand: 'Zooz',
    description: 'Compact ebike with 20" wheels, powerful Thrillmatic motor for urban adventures',
    is_available: true
  }
]

async function addSDElectricInventory() {
  try {
    console.log('🚲 Adding SD Electric Bike inventory to database...')

    // Insert SD Electric Bike models
    const { data, error } = await supabase
      .from('bike_inventory')
      .insert(sdElectricBikes)
      .select()

    if (error) {
      console.error('❌ Error adding SD Electric Bike inventory:', error)
      return
    }

    console.log(`✅ Successfully added ${data.length} SD Electric Bike models:`)
    data.forEach(bike => {
      console.log(`  - ${bike.brand} ${bike.model}`)
    })

    // Show total count
    const { data: allBikes, error: countError } = await supabase
      .from('bike_inventory')
      .select('brand')

    if (!countError) {
      const brandCounts = allBikes.reduce((acc, bike) => {
        acc[bike.brand] = (acc[bike.brand] || 0) + 1
        return acc
      }, {})

      console.log('\n📊 Current bike inventory by brand:')
      Object.entries(brandCounts).forEach(([brand, count]) => {
        console.log(`  ${brand}: ${count} models`)
      })
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

addSDElectricInventory()