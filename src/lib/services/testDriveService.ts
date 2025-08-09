import { supabase } from "@/lib/supabase"
import type { Database } from "@/lib/supabase"

type Customer = Database['public']['Tables']['customers']['Row']
type CustomerInsert = Database['public']['Tables']['customers']['Insert']
type TestDrive = Database['public']['Tables']['test_drives']['Row']
type TestDriveInsert = Database['public']['Tables']['test_drives']['Insert']

export interface CreateTestDriveData {
  customer: {
    name: string
    phone: string
    email?: string
    id_photo_url: string
    signature_data: string
    waiver_url?: string
    waiver_signed: boolean
    submission_ip?: string
    submitted_at?: string
  }
  testDrive: {
    bike_model: string
    start_time: Date
    end_time: Date
  }
}

export interface TestDriveResult {
  customer: Customer
  testDrive: TestDrive
}

export const testDriveService = {
  async createTestDrive(data: CreateTestDriveData): Promise<TestDriveResult> {
    try {
      // First create the customer
      const customerData: CustomerInsert = {
        name: data.customer.name,
        phone: data.customer.phone,
        email: data.customer.email || null,
        id_photo_url: data.customer.id_photo_url,
        signature_data: data.customer.signature_data,
        // include waiver_url at insert time so it passes the INSERT policy
        ...(data.customer.waiver_url ? { waiver_url: data.customer.waiver_url as any } : {}),
        waiver_signed: data.customer.waiver_signed
      }
      if (data.customer.submission_ip) (customerData as any).submission_ip = data.customer.submission_ip
      if (data.customer.submitted_at) (customerData as any).submitted_at = data.customer.submitted_at

      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .insert(customerData)
        .select()
        .single()

      if (customerError) {
        console.error('Customer creation error:', customerError)
        console.error('Customer data attempted:', customerData)
        throw new Error(`Failed to create customer record: ${customerError.message || JSON.stringify(customerError)}`)
      }

      // If we have a waiver_url and the column exists, update it (best-effort, ignore if column not present)
      if ((data.customer as any).waiver_url) {
        try {
          await supabase
            .from('customers')
            .update({ waiver_url: (data.customer as any).waiver_url } as any)
            .eq('id', customer.id)
        } catch (e) {
          console.warn('waiver_url update skipped (column may not exist yet):', e)
        }
      }

      // Then create the test drive
      const testDriveData: TestDriveInsert = {
        customer_id: customer.id,
        bike_model: data.testDrive.bike_model,
        start_time: data.testDrive.start_time.toISOString(),
        end_time: data.testDrive.end_time.toISOString(),
        status: 'active'
      }

      const { data: testDrive, error: testDriveError } = await supabase
        .from('test_drives')
        .insert(testDriveData)
        .select()
        .single()

      if (testDriveError) {
        console.error('Test drive creation error:', testDriveError)
        console.error('Test drive data attempted:', testDriveData)
        // Clean up customer record if test drive creation fails
        await supabase.from('customers').delete().eq('id', customer.id)
        throw new Error(`Failed to create test drive record: ${testDriveError.message || JSON.stringify(testDriveError)}`)
      }

      return {
        customer,
        testDrive
      }
    } catch (error) {
      console.error('Error creating test drive:', error)
      throw error
    }
  },

  async getActiveTestDrives(): Promise<(TestDrive & { customer: Customer })[]> {
    const { data, error } = await supabase
      .from('test_drives')
      .select(`
        *,
        customer:customers(id,name,phone,email,id_photo_url,signature_data,waiver_url,waiver_signed,submission_ip,submitted_at,created_at,updated_at)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching active test drives:', error)
      throw new Error('Failed to fetch active test drives')
    }

    return data as (TestDrive & { customer: Customer })[]
  },

  async completeTestDrive(testDriveId: string): Promise<void> {
    const { error } = await supabase
      .from('test_drives')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', testDriveId)

    if (error) {
      console.error('Error completing test drive:', error)
      throw new Error('Failed to complete test drive')
    }
  },

  async sendNotification(customerId: string, phone: string, message: string, messageType: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .insert({
        customer_id: customerId,
        customer_phone: phone,
        message_content: message,
        message_type: messageType,
        sent_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error logging notification:', error)
      throw new Error('Failed to log notification')
    }
  }
}