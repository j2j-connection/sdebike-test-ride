import { supabase } from '@/lib/supabase'

export interface Shop {
  id: string
  slug: string
  name: string
  business_name?: string
  description?: string
  email?: string
  phone?: string
  address?: any // JSON object
  website_url?: string
  logo_url?: string
  primary_color: string
  secondary_color: string
  custom_css?: string
  default_test_duration_minutes: number
  authorization_amount_cents: number
  require_id_photo: boolean
  require_waiver: boolean
  stripe_account_id?: string
  textbelt_api_key?: string
  twilio_account_sid?: string
  twilio_auth_token?: string
  subscription_tier: string
  subscription_status: string
  trial_ends_at?: string
  is_active: boolean
  onboarded_at?: string
  created_at: string
  updated_at: string
}

export interface BikeInventoryItem {
  id: string
  shop_id: string
  model: string
  brand: string
  description?: string
  image_url?: string
  is_available: boolean
  maintenance_notes?: string
  created_at: string
  updated_at: string
}

/**
 * Get a shop by its URL slug
 */
export async function getShopBySlug(slug: string): Promise<Shop | null> {
  try {
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()
    
    if (error) {
      console.log(`📋 Shop table not found, using fallback for slug: ${slug}`)
      
      // Temporary fallback for SD Electric Bike while database is being set up
      if (slug === 'sd-electric-bike') {
        console.log('✅ Using temporary fallback data for SD Electric Bike')
        return {
          id: 'temp-sd-electric-bike',
          slug: 'sd-electric-bike',
          name: 'San Diego Electric Bike',
          business_name: 'SD Electric Bike',
          description: 'Premium electric bike sales and test rides in Solana Beach. Located at 101 S. Hwy 101, Solana Beach, CA 92075. Experience the latest e-bikes with our convenient digital test ride system.',
          email: 'sdebike@gmail.com',
          phone: '(858) 345-1030',
          address: null,
          website_url: '',
          logo_url: '/logo.png',
          primary_color: '#3B82F6',
          secondary_color: '#1E40AF',
          custom_css: '',
          default_test_duration_minutes: 30,
          authorization_amount_cents: 100,
          require_id_photo: true,
          require_waiver: true,
          stripe_account_id: '',
          textbelt_api_key: '',
          twilio_account_sid: '',
          twilio_auth_token: '',
          subscription_tier: 'basic',
          subscription_status: 'active',
          trial_ends_at: '',
          is_active: true,
          onboarded_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }

      // Temporary fallback for Sole Bicycles while database is being set up
      if (slug === 'sole-bicycles') {
        console.log('✅ Using temporary fallback data for Sole Bicycles with logo: /sole-bicycles-logo.svg')
        return {
          id: 'temp-sole-bicycles',
          slug: 'sole-bicycles',
          name: 'Sole Bicycles',
          business_name: 'Sole Bicycles LLC',
          description: 'Premium bicycle sales and test rides featuring Solé Bicycle Co. electric bikes, single speeds, cruisers, and step-through models. Located in Los Angeles, experience our curated selection with our convenient digital test ride system.',
          email: 'info@solebicycles.com',
          phone: '(555) 999-BIKE',
          address: null,
          website_url: 'https://www.solebicycles.com',
          logo_url: '/sole-bicycles-logo.svg',
          primary_color: '#4A9B8E',
          secondary_color: '#3A8B7D',
          custom_css: '',
          default_test_duration_minutes: 30,
          authorization_amount_cents: 100,
          require_id_photo: true,
          require_waiver: true,
          stripe_account_id: '',
          textbelt_api_key: '',
          twilio_account_sid: '',
          twilio_auth_token: '',
          subscription_tier: 'basic',
          subscription_status: 'active',
          trial_ends_at: '',
          is_active: true,
          onboarded_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }
      
      return null
    }
    
    return data
  } catch (error) {
    console.log(`📋 Exception in getShopBySlug for slug: ${slug}`, error.message)
    
    // Temporary fallback for SD Electric Bike while database is being set up
    if (slug === 'sd-electric-bike') {
      console.log('✅ Using temporary fallback data for SD Electric Bike (catch)')
      return {
        id: 'temp-sd-electric-bike',
        slug: 'sd-electric-bike',
        name: 'San Diego Electric Bike',
        business_name: 'SD Electric Bike',
        description: 'Premium electric bike sales and test rides in Solana Beach. Located at 101 S. Hwy 101, Solana Beach, CA 92075. Experience the latest e-bikes with our convenient digital test ride system.',
        email: 'sdebike@gmail.com',
        phone: '(858) 345-1030',
        address: null,
        website_url: '',
        logo_url: '/logo.png',
        primary_color: '#3B82F6',
        secondary_color: '#1E40AF',
        custom_css: '',
        default_test_duration_minutes: 30,
        authorization_amount_cents: 100,
        require_id_photo: true,
        require_waiver: true,
        stripe_account_id: '',
        textbelt_api_key: '',
        twilio_account_sid: '',
        twilio_auth_token: '',
        subscription_tier: 'basic',
        subscription_status: 'active',
        trial_ends_at: '',
        is_active: true,
        onboarded_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
    
    return null
  }
}

/**
 * Get all active shops (for platform admin or shop selector)
 */
export async function getAllShops(): Promise<Shop[]> {
  try {
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .eq('is_active', true)
      .order('name')
    
    if (error) {
      console.error('Error fetching shops:', error)
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('Error in getAllShops:', error)
    return []
  }
}

/**
 * Get bike inventory for a specific shop
 */
export async function getShopBikeInventory(shopId: string, shopSlug?: string): Promise<BikeInventoryItem[]> {
  try {
    // For current single-tenant schema, just get all available bikes
    // TODO: Add shop_id filtering when multi-tenant schema is fully deployed
    const { data, error } = await supabase
      .from('bike_inventory')
      .select('*')
      .eq('is_available', true)
      .order('brand, model')

    if (error) {
      console.log('📋 bike_inventory table not found, using fallback inventory for shop:', shopId)
    } else if (data && data.length > 0) {
      // Check if this is the right inventory for the shop
      const firstBike = data[0]
      console.log('📊 Database returned', data.length, 'bikes, first bike brand:', firstBike.brand)

      // If SD Electric Bike is getting Sole Bicycles inventory, use fallback instead
      if ((shopSlug === 'sd-electric-bike' || shopId.includes('sd-electric-bike')) && firstBike.brand === 'Solé Bicycle Co.') {
        console.log('⚠️ SD Electric Bike got Sole Bicycles inventory, using fallback')
        // Fall through to fallback logic
      } else {
        console.log('✅ Using database inventory')
        return data || []
      }
    }

    // Fallback inventory logic
    console.log('🔄 Using fallback inventory for shop:', shopId)

    // Return shop-specific fallback inventory
    if (shopId.includes('sole-bicycles') || shopId === 'temp-sole-bicycles') {
        return [
          {
            id: 'fallback-sole-1',
            shop_id: shopId,
            model: 'e-Commuter',
            brand: 'Solé Bicycle Co.',
            description: 'Electric commuter bike - Available in Overthrow, Duke, and Whaler designs. Perfect for daily commuting. $1,299',
            is_available: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'fallback-sole-2',
            shop_id: shopId,
            model: 'e(24)',
            brand: 'Solé Bicycle Co.',
            description: 'Premium electric bike - Available in Overthrow, el Tigre, Duke, Whaler, and Ballona designs. $1,799',
            is_available: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'fallback-sole-3',
            shop_id: shopId,
            model: 'The Single Speed / Fixed Gear',
            brand: 'Solé Bicycle Co.',
            description: 'Classic single speed bike - Available in multiple colorways including Overthrow, OFW, and el Tigre. $199-$299',
            is_available: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'fallback-sole-4',
            shop_id: shopId,
            model: 'The Coastal Cruiser',
            brand: 'Solé Bicycle Co.',
            description: 'Classic beach cruiser - Available in Hoover and Nine-O designs. Perfect for leisurely coastal rides. $229.99',
            is_available: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]
      }

      // SD Electric Bike fallback inventory
      if (shopId.includes('sd-electric-bike') || shopId === 'temp-sd-electric-bike') {
        return [
          {
            id: 'fallback-sd-1',
            shop_id: shopId,
            model: 'Pace 500.3 Step-Through',
            brand: 'Aventon',
            description: 'Powerful cruiser ebike with 500W motor, top speed 28 mph, up to 60 miles range. Perfect for commuting.',
            is_available: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'fallback-sd-2',
            shop_id: shopId,
            model: 'RadRover 6 Plus',
            brand: 'Rad Power Bikes',
            description: 'Flagship model for adventures, 750W motor, up to 45+ miles per charge. Built for exploration.',
            is_available: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'fallback-sd-3',
            shop_id: shopId,
            model: 'Ultra Urban',
            brand: 'Zooz',
            description: 'Patented Chromoly steel frame, 750W motor with 1800W peak, 20 Ah battery. Urban commuter.',
            is_available: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'fallback-sd-4',
            shop_id: shopId,
            model: 'eScout 10D',
            brand: 'Benno',
            description: 'Commuter e-utility bike with Bosch Performance motor, up to 28 mph. Great for cargo.',
            is_available: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'fallback-sd-5',
            shop_id: shopId,
            model: 'Ramblas eMTB',
            brand: 'Aventon',
            description: 'First Aventon mid-drive mountain e-bike, top speed 20 mph, up to 80 miles range. Trail ready.',
            is_available: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]
      }

      // Default fallback for other shops
      return []
  } catch (error) {
    console.error('Error in getShopBikeInventory:', error)
    return []
  }
}

/**
 * Create a new shop (for onboarding)
 */
export async function createShop(shopData: Partial<Shop>): Promise<Shop | null> {
  try {
    const { data, error } = await supabase
      .from('shops')
      .insert(shopData)
      .select()
      .single()
    
    if (error) {
      console.error('Error creating shop:', error)
      return null
    }
    
    return data
  } catch (error) {
    console.error('Error in createShop:', error)
    return null
  }
}

/**
 * Update shop settings
 */
export async function updateShop(shopId: string, updates: Partial<Shop>): Promise<Shop | null> {
  try {
    const { data, error } = await supabase
      .from('shops')
      .update(updates)
      .eq('id', shopId)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating shop:', error)
      return null
    }
    
    return data
  } catch (error) {
    console.error('Error in updateShop:', error)
    return null
  }
}

/**
 * Check if a slug is available for a new shop
 */
export async function isSlugAvailable(slug: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('shops')
      .select('id')
      .eq('slug', slug)
      .single()
    
    // If no error and data exists, slug is taken
    if (!error && data) {
      return false
    }
    
    // If error is 'PGRST116' (no rows found), slug is available
    if (error?.code === 'PGRST116') {
      return true
    }
    
    // Other errors - assume not available for safety
    console.error('Error checking slug availability:', error)
    return false
  } catch (error) {
    console.error('Error in isSlugAvailable:', error)
    return false
  }
}

/**
 * Generate a unique slug from a shop name
 */
export function generateSlugFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim()
}