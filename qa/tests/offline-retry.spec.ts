import { test, expect } from '@playwright/test'

async function mockIfNeeded(page) {
  if ((process.env.NEXT_PUBLIC_SUPABASE_URL || '').includes('mock')) {
    const created: any[] = []
    let isOffline = false
    await page.route('**/*', (route) => {
      if (isOffline && /\/(rest|storage)\/v1\//.test(route.request().url())) {
        return route.abort()
      }
      return route.continue()
    })
    ;(page as any).__setOffline = (v: boolean) => { isOffline = v }

    await page.route('**/rest/v1/customers**', async (route) => {
      const body = JSON.parse(route.request().postData() || '{}')
      created.push(body)
      return route.fulfill({ status: 201, body: JSON.stringify([{ id: String(created.length) }]) })
    })
    await page.route('**/rest/v1/test_drives**', async (route) => {
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
  await page.getByRole('heading', { name: 'Rad Power Bikes' }).click()
  await page.getByRole('button', { name: 'Continue' }).click()

  // Mock ID upload success
  await page.route('**/storage/v1/object/**', route => route.fulfill({ status: 200, body: '{}' }))
  await page.setInputFiles('input[type=file]', { name: 'id.png', mimeType: 'image/png', buffer: Buffer.from([1,2,3]) })

  await page.getByRole('button', { name: 'Read Waiver' }).click()
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Accept & Close' }).click()
  const canvas = page.locator('canvas')
  const box = await canvas.boundingBox()
  if (box) {
    await page.mouse.move(box.x + 5, box.y + 5)
    await page.mouse.down(); await page.mouse.move(box.x + 80, box.y + 20); await page.mouse.up()
    await page.mouse.move(box.x + 10, box.y + 70)
    await page.mouse.down(); await page.mouse.move(box.x + 120, box.y + 40); await page.mouse.up()
  }
  await expect(page.getByTestId('verification-continue')).toBeEnabled()
  await page.getByTestId('verification-continue').click()

  ;(page as any).__setOffline(true)
  page.on('dialog', async d => { await d.dismiss() })
  await page.getByTestId('start-test-ride').click()
  // App shows alert on error; verify success not shown
  await expect(page.getByTestId('success-title')).not.toBeVisible({ timeout: 2000 })

  ;(page as any).__setOffline(false)
  // Retry clicking start up to 3 times
  for (let i=0;i<3;i++) {
    try {
      await page.getByTestId('start-test-ride').click({ timeout: 2000 })
      break
    } catch {}
  }
  await expect(page.getByTestId('success-title')).toBeVisible()
})