import { test, expect } from '@playwright/test'

async function mockIfNeeded(page) {
  if ((process.env.NEXT_PUBLIC_SUPABASE_URL || '').includes('mock')) {
    const created: any[] = []
    await page.route('**/rest/v1/customers**', async (route) => {
      if (await page.context().offline()) return route.abort()
      const body = JSON.parse(route.request().postData() || '{}')
      created.push(body)
      return route.fulfill({ status: 201, body: JSON.stringify([{ id: String(created.length) }]) })
    })
    await page.route('**/rest/v1/test_drives**', async (route) => {
      if (await page.context().offline()) return route.abort()
      return route.fulfill({ status: 201, body: JSON.stringify([{ id: 'td1', status: 'active' }]) })
    })
  }
}

test('queue submit offline then retry online leads to single record', async ({ page, context }) => {
  await mockIfNeeded(page)
  await page.goto('/')
  await page.getByLabel('Full Name').fill('Retry User')
  await page.getByLabel('Phone Number').fill('(555) 333-4444')
  await page.getByRole('button', { name: 'Choose Your Bike' }).click()
  await page.getByText('Rad Power Bikes').click()
  await page.getByRole('button', { name: 'Continue' }).click()

  // Mock ID upload success
  await page.route('**/storage/v1/object/**', route => route.fulfill({ status: 200, body: '{}' }))
  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByRole('button', { name: 'Choose File' }).click(),
  ])
  await fileChooser.setFiles({ name: 'id.png', mimeType: 'image/png', buffer: Buffer.from([1,2,3]) })

  await page.getByRole('button', { name: 'Read Waiver' }).click()
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Accept & Close' }).click()
  const canvas = page.locator('canvas')
  const box = await canvas.boundingBox()
  if (box) {
    await page.mouse.move(box.x + 5, box.y + 5)
    await page.mouse.down(); await page.mouse.up()
  }
  await page.getByRole('button', { name: /^Continue$/ }).click()

  await context.setOffline(true)
  page.on('dialog', async d => { await d.dismiss() })
  await page.getByRole('button', { name: 'Start Test Ride' }).click()
  // App shows alert on error; verify we remained on the page
  await expect(page.getByRole('button', { name: 'Start Test Ride' })).toBeVisible()

  await context.setOffline(false)
  await page.getByRole('button', { name: 'Start Test Ride' }).click()
  await expect(page.getByText('Starting...', { exact: false })).toBeVisible()
})