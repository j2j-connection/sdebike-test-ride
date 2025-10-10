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
// Map slugs to logo URLs (since logo_url is not in database)
const LOGO_URLS: Record<string, string> = {
  'sd-electric-bike': '/logo.png',
  'sole-bicycles': '/sole-bicycles-logo.svg',
  'flye': '/flye.png.avif'
}

export async function getShopBySlug(slug: string): Promise<Shop | null> {
  try {
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (error) {
      console.error(`❌ Error fetching shop ${slug}:`, error.message)
      return null
    }

    // Add logo_url based on slug (not in database)
    return {
      ...data,
      logo_url: LOGO_URLS[slug] || '/logo.png'
    }
  } catch (error: any) {
    console.error(`❌ Exception in getShopBySlug for slug: ${slug}:`, error?.message)
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

      // Flye fallback inventory
      if (shopId.includes('flye') || shopId === 'temp-flye') {
        return [
          {
            id: 'fallback-flye-1',
            shop_id: shopId,
            model: 'City Cruiser',
            brand: 'Flye',
            description: 'Premium urban e-bike with sleek design, 750W motor, 50+ mile range. Perfect for city commuting.',
            is_available: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'fallback-flye-2',
            shop_id: shopId,
            model: 'Mountain Explorer',
            brand: 'Flye',
            description: 'All-terrain electric mountain bike, 1000W motor, dual suspension. Conquer any trail.',
            is_available: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'fallback-flye-3',
            shop_id: shopId,
            model: 'Folding Commuter',
            brand: 'Flye',
            description: 'Compact folding e-bike, 500W motor, lightweight aluminum frame. Take it anywhere.',
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