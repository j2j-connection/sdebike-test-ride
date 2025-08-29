import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}
if (!supabaseAnonKey) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Database types based on our multi-tenant schema
export interface Shop {
  id: string
  slug: string
  name: string
  business_name?: string
  description?: string
  email?: string
  phone?: string
  address?: any
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

export interface Customer {
  id: string
  shop_id: string
  name: string
  phone: string
  email?: string
  id_photo_url?: string
  signature_data?: string
  waiver_signed: boolean
  submission_ip?: string
  submitted_at?: string
  created_at: string
  updated_at: string
}

export interface TestDrive {
  id: string
  shop_id: string
  customer_id: string
  bike_model: string
  start_time?: string
  end_time?: string
  duration_minutes?: number
  status: 'active' | 'completed' | 'cancelled'
  notes?: string
  stripe_payment_intent_id?: string
  authorization_amount_cents?: number
  payment_status?: 'pending' | 'authorized' | 'captured' | 'failed' | 'cancelled'
  created_at: string
  updated_at: string
}

export interface BikeInventory {
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

export interface Notification {
  id: string
  shop_id: string
  customer_id?: string
  test_drive_id?: string
  customer_phone: string
  message_content: string
  message_type: 'confirmation' | 'reminder' | 'completion' | 'overdue'
  sent_at: string
  delivery_status: 'pending' | 'sent' | 'failed'
  created_at: string
}

export interface ShopAdmin {
  id: string
  shop_id: string
  email: string
  full_name: string
  role: 'owner' | 'admin' | 'staff'
  permissions?: any
  is_active: boolean
  invited_at?: string
  last_login_at?: string
  created_at: string
  updated_at: string
}

// Extended types with joins
export interface TestDriveWithCustomer extends TestDrive {
  customers: Customer
}