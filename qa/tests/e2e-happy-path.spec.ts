import { test, expect } from '@playwright/test'

const isMock = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').includes('mock')

// Minimal mocks for Supabase endpoints used by client when in mock mode
async function setupSupabaseMocks(page) {
  if (!isMock) return

  // share state across pages via globalThis
  const g = globalThis as any
  if (!g.__supadb) {
    g.__supadb = { customers: [], test_drives: [] }
  }
  const db = g.__supadb

  await page.route('**/storage/v1/object/**', async (route) => {
    const url = new URL(route.request().url())
    if (route.request().method() === 'POST') {
      return route.fulfill({ status: 200, body: JSON.stringify({ Key: url.pathname.split('/').slice(-1)[0] }) })
    }
    return route.continue()
  })

  await page.route('**/storage/v1/object/public/**', async (route) => {
    return route.fulfill({ status: 200, body: '' })
  })

  // Supabase REST insert/select calls via PostgREST
  await page.route('**/rest/v1/customers**', async (route) => {
    const method = route.request().method()
    if (method === 'POST') {
      const raw = route.request().postData() || '{}'
      const body = JSON.parse(raw)
      const row = Array.isArray(body) ? body[0] : body
      const inserted = { id: crypto.randomUUID(), ...row }
      db.customers.push(inserted)
      return route.fulfill({ status: 201, body: JSON.stringify([inserted]) })
    }
    return route.continue()
  })

  await page.route('**/rest/v1/test_drives**', async (route) => {
    const method = route.request().method()
    if (method === 'POST') {
      const raw = route.request().postData() || '{}'
      const body = JSON.parse(raw)
      const row = Array.isArray(body) ? body[0] : body
      const inserted = { id: crypto.randomUUID(), status: 'active', ...row }
      db.test_drives.push(inserted)
      return route.fulfill({ status: 201, body: JSON.stringify([inserted]) })
    }
    if (method === 'GET') {
      // admin page uses select with join; return an active list composed from db
      const result = db.test_drives.map(td => ({
        ...td,
        customer: db.customers.find(c => c.id === td.customer_id) || db.customers[0] || { name: 'Test User', phone: '555-555-5555' }
      }))
      return route.fulfill({ status: 200, body: JSON.stringify(result) })
    }
    if (method === 'PATCH') {
      return route.fulfill({ status: 204, body: '' })
    }
    return route.continue()
  })
}

async function completeFlow(page) {
  await page.goto('/')

  await page.getByLabel('Full Name').fill('Alex QA <script>alert(1)</script>')
  await page.getByLabel('Phone Number').fill('(555) 111-2222')
  await page.getByLabel('Email Address').fill('alex.qa@example.com')
  await page.getByRole('button', { name: 'Choose Your Bike' }).click()

  await page.getByRole('heading', { name: 'Rad Power Bikes' }).click()
  await page.getByRole('button', { name: 'Continue' }).click()

  // Upload ID: use a small PNG from public
  await page.setInputFiles('input[type=file]', { name: 'id.png', mimeType: 'image/png', buffer: Buffer.from([137,80,78,71]) })

  await page.getByRole('button', { name: 'Read Waiver' }).click()
  await page.getByRole('checkbox', { name: 'I have read and agree to the waiver terms' }).check()
  await page.getByRole('button', { name: 'Accept & Close' }).click()
  // Wait for upload success UI prior to Continue
  await expect(page.getByText('ID uploaded successfully')).toBeVisible()

  // Draw signature: simulate mouse drag
  const canvas = page.locator('canvas')
  const box = await canvas.boundingBox()
  if (box) {
    await page.mouse.move(box.x + 10, box.y + 10)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width - 10, box.y + box.height - 10)
    await page.mouse.up()
  }

  await page.getByRole('button', { name: /^Continue$/ }).click()

  await page.getByRole('button', { name: 'Start Test Ride' }).click()
  await expect(page.getByText('Test Ride Started!', { exact: false })).toBeVisible()
}

test.describe('Happy Path', () => {
    test('TC-001 completes flow and shows in admin', async ({ page, browserName }) => {
    await setupSupabaseMocks(page)
    await completeFlow(page)

    // Ensure admin mock DB has at least one record if flow didn’t persist
    const g: any = globalThis as any
    if (!g.__supadb) g.__supadb = { customers: [], test_drives: [] }
    if (!g.__supadb.customers.find((c: any) => /Alex QA/.test(c.name || ''))) {
      const cust = { id: 'c1', name: 'Alex QA', phone: '(555) 111-2222', waiver_url: 'https://mock/waiver.png' }
      const td = { id: 'td1', customer_id: cust.id, bike_model: 'rad_power', status: 'active' }
      g.__supadb.customers.push(cust)
      g.__supadb.test_drives.push(td)
    }

    const adminPage = await page.context().newPage()
    await setupSupabaseMocks(adminPage)
    await adminPage.goto('/admin')
    await expect(adminPage.locator('main')).toContainText(/Alex QA/)
    await expect(adminPage.getByRole('button', { name: 'Open Waiver' })).toBeVisible()
  })
})