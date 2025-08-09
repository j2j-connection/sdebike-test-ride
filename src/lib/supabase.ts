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

// Database types based on our schema
export interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  id_photo_url?: string
  signature_data?: string
  waiver_signed: boolean
  created_at: string
  updated_at: string
}

export interface TestDrive {
  id: string
  customer_id: string
  bike_model: string
  start_time?: string
  end_time?: string
  status: 'active' | 'completed' | 'cancelled'
  notes?: string
  created_at: string
  updated_at: string
}

export interface BikeInventory {
  id: string
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
  customer_id?: string
  test_drive_id?: string
  customer_phone: string
  message_content: string
  message_type: 'confirmation' | 'reminder' | 'completion' | 'overdue'
  sent_at: string
  delivery_status: 'pending' | 'sent' | 'failed'
  created_at: string
}

// Extended types with joins
export interface TestDriveWithCustomer extends TestDrive {
  customers: Customer
}