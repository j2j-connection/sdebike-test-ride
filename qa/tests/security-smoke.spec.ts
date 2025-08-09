import { test, expect } from '@playwright/test'

async function mockIfNeeded(page) {
  if ((process.env.NEXT_PUBLIC_SUPABASE_URL || '').includes('mock')) {
    await page.route('**/*', (route) => route.continue())
  }
}

test('XSS strings are escaped in Admin card', async ({ page }) => {
  await mockIfNeeded(page)
  await page.goto('/')
  await page.getByLabel('Full Name').fill('Alex <img src=x onerror=alert(1)>')
  await page.getByLabel('Phone Number').fill('(555) 000-0000')
  await page.getByRole('button', { name: 'Choose Your Bike' }).click()
  await page.getByRole('heading', { name: 'Other' }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  // Upload ID to enable continue later
  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByRole('button', { name: 'Choose File' }).click(),
  ])
  await fileChooser.setFiles({ name: 'id.png', mimeType: 'image/png', buffer: Buffer.from([1,2,3]) })

  await page.getByRole('button', { name: 'Read Waiver' }).click()
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Accept & Close' }).click()
  // Minimal signature to enable Continue
  const canvas = page.locator('canvas')
  const box = await canvas.boundingBox()
  if (box) {
    await page.mouse.move(box.x + 5, box.y + 5)
    await page.mouse.down(); await page.mouse.up()
  }
  await page.getByRole('button', { name: /^Continue$/ }).click()
  await page.getByRole('button', { name: 'Start Test Ride' }).click()

  const admin = await page.context().newPage()
  await admin.goto('/admin')
  await expect(admin.locator('text=Alex <img src=x onerror=alert(1)>')).toBeVisible()
})

// Note: current implementation uses public waiver URLs; this test captures visibility
// and will recommend signed URLs in summary if public.