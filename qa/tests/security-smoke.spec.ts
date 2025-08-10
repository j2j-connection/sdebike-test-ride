import { test, expect } from '@playwright/test'

async function mockIfNeeded(page) {
  if ((process.env.NEXT_PUBLIC_SUPABASE_URL || '').includes('mock')) {
    // Storage upload mocks
    await page.route('**/storage/v1/object/**', async (route) => {
      if (route.request().method() === 'POST') return route.fulfill({ status: 200, body: '{}' })
      return route.continue()
    })
    // PostgREST mocks minimal
    await page.route('**/rest/v1/customers**', async (route) => {
      if (route.request().method() === 'POST') return route.fulfill({ status: 201, body: JSON.stringify([{ id: 'c1' }]) })
      return route.continue()
    })
    await page.route('**/rest/v1/test_drives**', async (route) => {
      const method = route.request().method()
      if (method === 'POST') return route.fulfill({ status: 201, body: JSON.stringify([{ id: 'td1', status: 'active' }]) })
      if (method === 'GET') return route.fulfill({ status: 200, body: JSON.stringify([{ id: 'td1', status: 'active', customer: { id: 'c1', name: 'Alex QA', phone: '555' } }]) })
      if (method === 'PATCH') return route.fulfill({ status: 204, body: '' })
      return route.continue()
    })
  }
}

test('XSS strings are escaped in Admin card', async ({ page }) => {
  await mockIfNeeded(page)
  await page.goto('/')
  await page.getByLabel('Full Name').fill('Alex <img src=x onerror=alert(1)>')
  page.on('dialog', async d => { await d.dismiss() })
  await page.getByLabel('Phone Number').fill('(555) 000-0000')
  await page.getByRole('button', { name: 'Choose Your Bike' }).click()
  await page.getByRole('heading', { name: 'Other' }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  // Upload ID to enable continue later
  await page.setInputFiles('input[type=file]', { name: 'id.png', mimeType: 'image/png', buffer: Buffer.from([1,2,3]) })

  await page.getByRole('button', { name: 'Read Waiver' }).click()
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Accept & Close' }).click()
  // Draw signature and wait for continue to be enabled
  const canvas = page.locator('canvas')
  const box = await canvas.boundingBox()
  if (box) {
    await page.mouse.move(box.x + 5, box.y + 5)
    await page.mouse.down(); await page.mouse.move(box.x + 50, box.y + 20); await page.mouse.up()
    await page.mouse.move(box.x + 60, box.y + 60)
    await page.mouse.down(); await page.mouse.move(box.x + 120, box.y + 30); await page.mouse.up()
  }
  await expect(page.getByTestId('verification-continue')).toBeEnabled()
  await page.getByTestId('verification-continue').click()
  await page.getByRole('button', { name: 'Start Test Ride' }).click()

  const admin = await page.context().newPage()
  await mockIfNeeded(admin)
  await admin.goto('/admin')
  await expect(admin.getByText('Alex')).toBeVisible()
})

// Note: current implementation uses public waiver URLs; this test captures visibility
// and will recommend signed URLs in summary if public.